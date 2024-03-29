import {MAX_CANVAS_SIZE, MIN_CANVAS_SIZE} from "../utils/max-canvas-size.js";

export const RendererOptions = {
  IMAGE: "Image",
  CANVAS: "Canvas",
  WEBGL: "WebGL",
  WEBGPU: "WebGPU",
};

export const SpriteSetOptions = {
  FROG: "Frog (64x64)",
  TEST: "Test (250x250)",
};

export const ImgOffsetStrategy = {
  POSITION: "Position",
  TRANSLATE: "Translate",
};

export const ImgAnimationStrategy = {
  GIF: "GIF",
  FRAMES: "Individual Frames",
  SPRITE_SHEET: "Sprite Sheet",
}

export const ImgElementType = {
  IMG: "Image",
  DIV: "Div",
};

export const CanvasOffsetStrategy = {
  DIRECT_CANVAS: "Direct to canvas",
  CSS_TRANSFORM: "CSS transform",
  BUFFER_CANVAS: "Buffer canvas",
};

export const CanvasFrameType = {
  INDIVIDUAL_IMAGES: "Individual Images",
  SPRITE_SHEET: "Sprite Sheet",
};

export const MaxCanvasSize = {};
for (let size = MAX_CANVAS_SIZE; size >= MIN_CANVAS_SIZE; size /= 2) {
  MaxCanvasSize[size] = size;
}

export const DEFAULT_OPTIONS = {
  renderer: RendererOptions.WEBGL,
  count: 1000,
  spriteSet: SpriteSetOptions.FROG,
  isAnimatedByDefault: false,
  variationChangesPerFrame: 0,
  animationChangesPerFrame: 0,
  img: {
    offsetStrategy: ImgOffsetStrategy.POSITION,
    useUniqueImages: false,
    elementType: ImgElementType.IMG,
    animationStrategy: ImgAnimationStrategy.GIF,
  },
  canvas: {
    maxCanvasSize: MAX_CANVAS_SIZE,
    offsetStrategy: CanvasOffsetStrategy.DIRECT_CANVAS,
    onlyDrawChanges: false,
    frameType: CanvasFrameType.INDIVIDUAL_IMAGES,
    useWorker: false,
    useMultipleWorkers: false,
  },
  webgl: {},
  webgpu: {},
};
