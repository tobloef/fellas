let countX = 200;
let countY = 200;

const count =  countX * countY;

const container = document.querySelector("#container");
const fellas = document.querySelector("#fellas");

const countXInput = document.querySelector("#countX");
const countYInput = document.querySelector("#countY");
const totalCountElement = document.querySelector("#totalCount");

const spriteWidth = 64;
const spriteHeight = 64;

const colors = [
  "green",
  "red",
  "purple",
  "yellow",
]

const urls = colors.map(color => `assets/froggy/froggy_${color}/tile000.png`);

const images = [];

const minScale = 0.01;
const maxScale = 20;
const scrollSensitivity = 0.005;

let scale = 4;

// This is before scaling
const offset = {
  x: ((container.clientWidth / 2) / scale) - (countX * spriteWidth / 2),
  y: ((container.clientHeight / 2) / scale) - (countY * spriteHeight / 2),
};

updateCount();
updateScale();
updateOffset();

for (let i = 0; i < count; i++) {
  const url = urls[randomInt(0, urls.length - 1)]; // + `?${i}`;
  const img = document.createElement("img");
  img.src = url;
  img.draggable = false;
  images.push(img);
  fellas.appendChild(img);
}

let dragging = false;

container.addEventListener("mousedown", () => {
  dragging = true;
});

container.addEventListener("mouseup", () => {
  dragging = false;
});

container.addEventListener("mouseleave", () => {
  dragging = false;
});

container.addEventListener("mousemove", (e) => {
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

  offset.x += deltaWorldPos.x;
  offset.y += deltaWorldPos.y;

  updateOffset();
});

container.addEventListener("wheel", (e) => {
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

  offset.x += deltaWorldPos.x;
  offset.y += deltaWorldPos.y;

  scale = newScale;

  updateOffset();
  updateScale();
});

countXInput.addEventListener("change", () => {
  countX = parseInt(countXInput.value);
  updateCount();
});

countYInput.addEventListener("change", () => {
  countY = parseInt(countYInput.value);
  updateCount();
});

function updateScale() {
  fellas.style.transform = `scale(${scale})`;
}

function updateOffset() {
  fellas.style.top = `${offset.y * scale}px`;
  fellas.style.left = `${offset.x * scale}px`;
}

function updateCount() {
  fellas.style.width = `${countX * spriteWidth}px`;
  fellas.style.height = `${countY * spriteHeight}px`;

  countXInput.value = countX;
  countYInput.value = countY;
  totalCountElement.innerText = count.toLocaleString();
}

function mousePosToWorldPos(mousePos, scale, offset) {
  return {
    x: (mousePos.x / scale) - offset.x,
    y: (mousePos.y / scale) - offset.y,
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}