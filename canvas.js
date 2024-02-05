// Elements

const canvasElement = document.querySelector("#canvas");
const countXInputElement = document.querySelector("#countX");
const countYInputElement = document.querySelector("#countY");
const totalCountElement = document.querySelector("#totalCount");

// Parameters

const spriteWidth = 64;
const spriteHeight = 64;

let countX = 200;
let countY = 200;
let count = countX * countY;

const minScale = 0.01;
const maxScale = 20;
const scrollSensitivity = 0.005;

let scale = 0.05;
let offset = { x: 0, y: 0 };

let dragging = false;

// Fella factory

const fellas = [];

const images = {};

const colors = [
  "green",
  "red",
  "purple",
  "yellow",
];

const still_urls = colors.map(color => `assets/froggy/froggy_${color}/tile000.png`);
const animated_urls = colors.map(color => `assets/froggy/froggy_${color}.gif`);

const randomUrl = (urls, unique = false) => urls[randomInt(0, urls.length - 1)] + (unique ? `?${Math.random()}` : "");

const createFella = async () => {
  const url = randomUrl(still_urls);

  if (!images[url]) {
    images[url] = new Image();
    images[url].src = url;
  }

  const fella = images[url];

  return fella;
}

const ensureFellas = async (count) => {
  if (fellas.length > count) {
    const fellasToRemove = fellas.length - count;
    const removedFellas = fellas.splice(0, fellasToRemove);
  }

  if (fellas.length < count) {
    const fellasToAdd = count - fellas.length;
    for (let i = 0; i < fellasToAdd; i++) {
      const fella = await createFella();
      fellas.push(fella);
    }
  }
};

// Setup

observeSize(canvasElement, (width, height) => {
  console.debug(width, height)
  canvasElement.width = width;
  canvasElement.height = height;
  ctx.imageSmoothingEnabled = false;
});

await updateCount(countX, countY);
updateOffset(getCenteredOffset());

const ctx = canvasElement.getContext("2d", { alpha: false, antialias: false  });
ctx.imageSmoothingEnabled = false;

// Update functions

async function updateCount(newCountX, newCountY) {
  countX = newCountX;
  countY = newCountY;

  count = countX * countY;

  await ensureFellas(count);

  countXInputElement.value = countX;
  countYInputElement.value = countY;
  totalCountElement.innerText = count.toLocaleString();
}

function updateOffset(newOffset) {
  const integerOffset = {
    x: Math.round(newOffset.x),
    y: Math.round(newOffset.y),
  };

  offset = newOffset;
}

// Event listeners

canvasElement.addEventListener("mousedown", () => {
  dragging = true;
});

canvasElement.addEventListener("mouseup", () => {
  dragging = false;
});

canvasElement.addEventListener("mouseleave", () => {
  dragging = false;
});

canvasElement.addEventListener("mousemove", (e) => {
  if (!dragging) return;

  const newMousePos = {
    x: e.clientX,
    y: e.clientY,
  };

  const oldMousePos = {
    x: newMousePos.x - e.movementX,
    y: newMousePos.y - e.movementY,
  };

  const oldWorldPos = mousePosToWorldPos(oldMousePos, scale, offset);
  const newWorldPos = mousePosToWorldPos(newMousePos, scale, offset);

  const deltaWorldPos = {
    x: newWorldPos.x - oldWorldPos.x,
    y: newWorldPos.y - oldWorldPos.y,
  };

  const newOffset = {
    x: offset.x + deltaWorldPos.x,
    y: offset.y + deltaWorldPos.y,
  };

  updateOffset(newOffset);
});

canvasElement.addEventListener("wheel", (e) => {
  e.preventDefault();

  const delta = e.deltaY * scrollSensitivity;

  const oldScale = scale;

  const newScale = clamp(
    oldScale - (delta * oldScale),
    minScale,
    maxScale
  );

  const mousePos = {
    x: e.clientX,
    y: e.clientY,
  };

  const oldWorldPos = mousePosToWorldPos(mousePos, oldScale, offset);
  const newWorldPos = mousePosToWorldPos(mousePos, newScale, offset);

  const deltaWorldPos = {
    x: newWorldPos.x - oldWorldPos.x,
    y: newWorldPos.y - oldWorldPos.y,
  };

  const newOffset = {
    x: offset.x + deltaWorldPos.x,
    y: offset.y + deltaWorldPos.y,
  };

  scale = newScale;
  updateOffset(newOffset);
});

countXInputElement.addEventListener("change", async () => {
  const newCountX = countXInputElement.value;
  await updateCount(newCountX, countY);
});

countYInputElement.addEventListener("change", async () => {
  const newCountY = countYInputElement.value;
  await updateCount(countX, newCountY);
});

// Rendering

const draw = () => {
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  for (let i = 0; i < fellas.length; i++) {
    const fella = fellas[i];
    const x = (i % countX) * spriteWidth * scale + offset.x * scale;
    const y = Math.floor(i / countX) * spriteHeight * scale + offset.y * scale;

    ctx.drawImage(
      fella,
      x,
      y,
      spriteWidth * scale,
      spriteHeight * scale
    );
  }
}

const renderLoop = () => {
  draw();
  requestAnimationFrame(renderLoop);
}

renderLoop();

// Helper functions

function observeSize(
  element,
  callback,
) {
  let previousWidth = 0;
  let previousHeight = 0;

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const size = entry.devicePixelContentBoxSize?.[0];

      const width = size.inlineSize;
      const height = size.blockSize;

      if (
        width === previousWidth &&
        height === previousHeight
      ) {
        return;
      }

      previousWidth = width;
      previousHeight = height;

      callback(width, height);
    }
  });

  resizeObserver.observe(element, { box: "device-pixel-content-box" });

  const cleanup = () => {
    resizeObserver.disconnect();
  };

  return cleanup;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mousePosToWorldPos(mousePos, scale, offset) {
  return {
    x: (mousePos.x / scale) - offset.x,
    y: (mousePos.y / scale) - offset.y,
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getCenteredOffset() {
  return {
    x: canvasElement.width / 2 + countX * spriteWidth / 2,
    y: canvasElement.height / 2 + countY * spriteHeight / 2,
  }
}