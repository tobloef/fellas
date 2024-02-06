let USE_DIFF_DRAW;
let USE_CSS_TRANSFORM;

let needsGlobalRedraw = false;
let fellas = [];
let spriteWidth;
let spriteHeight;
let countX;
let countY;
let scale;
let offset;

let canvas;
let ctx;

onmessage = (e) => {
  if (e.data.type === "setup") {
   canvas = e.data.canvas;
    USE_DIFF_DRAW = e.data.USE_DIFF_DRAW;
    USE_CSS_TRANSFORM = e.data.USE_CSS_TRANSFORM;
    ctx = canvas.getContext("2d", { alpha: false, antialias: false });
    ctx.imageSmoothingEnabled = false;
    spriteWidth = e.data.spriteWidth;
    spriteHeight = e.data.spriteHeight;
    countX = e.data.countX;
    countY = e.data.countY;
    scale = e.data.scale;
    offset = e.data.offset;
    renderLoop();
  } else if (e.data.type === "fellas") {
    fellas = e.data.fellas;
    needsGlobalRedraw = true;
  } else if (e.data.type === "needsGlobalRedraw") {
    needsGlobalRedraw = true;
  } else if (e.data.type === "count") {
    countX = e.data.countX;
    countY = e.data.countY;
    needsGlobalRedraw = true;
  } else if (e.data.type === "scale") {
    scale = e.data.scale;
    needsGlobalRedraw = true;
  } else if (e.data.type === "offset") {
    offset = e.data.offset;
    needsGlobalRedraw = true;
  } else if (e.data.type === "size") {
    if (canvas == null) {
      return;
    }
    canvas.width = e.data.width;
    canvas.height = e.data.height;
    needsGlobalRedraw = true;
  } else if (e.data.type === "swap") {
    const { index, fella } = e.data;
    fellas[index] = fella;
  } else if (e.data.type === "swapBulk") {
    for (const { fella, index } of e.data.fellas) {
      fellas[index] = fella;
    }
  }
}

function renderLoop() {
  draw();
  requestAnimationFrame(renderLoop);
}

function draw() {
  if (!USE_DIFF_DRAW || needsGlobalRedraw) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  for (let i = 0; i < fellas.length; i++) {
    const fella = fellas[i];

    if (!fella.needsRedraw && !needsGlobalRedraw && USE_DIFF_DRAW) {
      continue;
    }

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

    if (USE_DIFF_DRAW) {
      ctx.clearRect(x, y, width, height);
    }

    ctx.drawImage(
      fella.image,
      x,
      y,
      width,
      height
    );

    fella.needsRedraw = false;
  }

  needsGlobalRedraw = false;
}