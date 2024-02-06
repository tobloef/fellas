// Elements

const canvasElement = document.querySelector("#canvas");
const containerElement = document.querySelector("#container");
const countXInputElement = document.querySelector("#countX");
const countYInputElement = document.querySelector("#countY");
const totalCountElement = document.querySelector("#totalCount");

// Parameters

const USE_CSS_TRANSFORM = true;

const spriteWidth = 64;
const spriteHeight = 64;

let countX = 250;
let countY = 250;
let count = countX * countY;

const minScale = 0.01;
const maxScale = 20;
const scrollSensitivity = 0.005;

let scale = 0.05;
let offset = { x: 0, y: 0 };

let dragging = false;
let needsRedraw = true;

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

  needsRedraw = true;
};

// Setup

observeSize(canvasElement, (width, height) => {
  canvasElement.width = width;
  canvasElement.height = height;
  ctx.imageSmoothingEnabled = false;
  needsRedraw = true;
});

await updateCount(countX, countY);
updateOffset(getCenteredOffset());
updateScale(scale);

const ctx = canvasElement.getContext("2d", { alpha: false, antialias: false });
ctx.imageSmoothingEnabled = false;

// Update functions

async function updateCount(newCountX, newCountY) {
  countX = newCountX;
  countY = newCountY;

  count = countX * countY;

  await ensureFellas(count);

  if (USE_CSS_TRANSFORM) {
    canvasElement.style.width = `${countX * spriteWidth}px`;
    canvasElement.style.height = `${countY * spriteHeight}px`;
  }

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

  if (USE_CSS_TRANSFORM) {
    canvasElement.style.top = `${offset.y * scale}px`;
    canvasElement.style.left = `${offset.x * scale}px`;
  }
}

function updateScale(newScale) {
  scale = newScale;

  if (USE_CSS_TRANSFORM) {
    canvasElement.style.transform = `scale(${scale})`;
  }
}

// Event listeners

const mouseDraggerElement = USE_CSS_TRANSFORM ? containerElement : canvasElement;

mouseDraggerElement.addEventListener("mousedown", () => {
  dragging = true;
});

mouseDraggerElement.addEventListener("mouseup", () => {
  dragging = false;
});

mouseDraggerElement.addEventListener("mouseleave", () => {
  dragging = false;
});

mouseDraggerElement.addEventListener("mousemove", (e) => {
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

mouseDraggerElement.addEventListener("wheel", (e) => {
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

  updateScale(newScale);
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

    let width = spriteWidth;
    let height = spriteHeight;

    if (!USE_CSS_TRANSFORM) {
      width *= scale;
      height *= scale;
    }

    let x = (i % countX) * width;
    let y = Math.floor(i / countX) * height;

    if (!USE_CSS_TRANSFORM) {
      x += offset.x * scale;
      y += offset.y * scale;
    }

    ctx.drawImage(
      fella,
      x,
      y,
      width,
      height
    );
  }

  console.debug("Finished drawing", count, "fellas");

  needsRedraw = false;
}

const renderLoop = () => {
  if (needsRedraw) {
    draw();
  }
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
  if (USE_CSS_TRANSFORM) {
    return {
      x: ((containerElement.clientWidth / 2) / scale) - (countX * spriteWidth / 2),
      y: ((containerElement.clientHeight / 2) / scale) - (countY * spriteHeight / 2),
    }
  } else {
    return {
      x: canvasElement.width / 2 + countX * spriteWidth / 2,
      y: canvasElement.height / 2 + countY * spriteHeight / 2,
    }
  }
}