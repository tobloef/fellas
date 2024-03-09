// See this library for a more complete solution
// https://github.com/jhildenbiddle/canvas-size/

export const MAX_CANVAS_SIZE = 100; // findMaxCanvasSize();

const FILL_COLOR = [255, 0, 0, 255];

export function findMaxCanvasSize() {
  const offscreenCanvas = new OffscreenCanvas(1, 1);
  const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

  let size = 1;
  let lowerBound = 1;
  let upperBound = null;

  ({ size, lowerBound, upperBound } = powerOfTwoSearch(ctx, size, lowerBound, upperBound));
  ({ size } = binarySearch(ctx, size, lowerBound, upperBound));

  return size;
}

function powerOfTwoSearch(ctx, size, lowerBound, upperBound) {
  while (true) {
    let newSize = size * 2;
    const supportsSize = checkSize(ctx, newSize);
    if (supportsSize) {
      size = newSize;
      lowerBound = newSize;
    } else {
      upperBound = newSize;
      newSize = lowerBound + 1;
      const supportsNewSize = checkSize(ctx, newSize);
      if (supportsNewSize) {
        size = newSize;
        lowerBound = newSize;
      } else {
        upperBound = newSize;
      }
      break;
    }
  }

  return { size, lowerBound, upperBound };
}

function binarySearch(ctx, size, lowerBound, upperBound) {
  while (true) {
    if (size === lowerBound) {
      break;
    }

    const supportsSize = checkSize(ctx, size);

    if (supportsSize) {
      lowerBound = size;
    } else {
      upperBound = size;
    }

    if (upperBound === null) {
      size *= 2;
    } else {
      size = Math.floor((upperBound - lowerBound) / 2) + lowerBound;
    }
  }

  return { size, lowerBound, upperBound };
}

function checkSize(ctx, size) {
  ctx.canvas.width = size;
  ctx.canvas.height = size;

  ctx.fillStyle = `rgba(${FILL_COLOR.join(',')})`;
  ctx.fillRect(0, 0, size, size);

  const data = ctx.getImageData(size - 1, size - 1, 1, 1).data;

  return (
    data[0] === FILL_COLOR[0] &&
    data[1] === FILL_COLOR[1] &&
    data[2] === FILL_COLOR[2] &&
    data[3] === FILL_COLOR[3]
  );
}
