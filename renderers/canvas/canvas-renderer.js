import {CanvasFrameType, CanvasOffsetStrategy} from "../../state/options.js";
import {DirectCanvasSubRenderer} from "./sub-renderers/direct/direct-canvas-renderer.js";
import {BufferedCanvasSubRenderer} from "./sub-renderers/buffered/buffered-canvas-renderer.js";
import {TiledCanvasSubRenderer} from "./sub-renderers/tiled/tiled-canvas-renderer.js";
import {SpriteSets} from "../../state/sprite-sets.js";
import {randomChoice} from "../../utils/random.js";

export class CanvasRenderer {
  subRenderer = null;
  containerElement = null;
  state = null;
  animationFrame = null;
  manualRedraw = false;
  lastUpdateTime = performance.now();

  constructor(state, containerElement) {
    this.state = state;
    this.containerElement = containerElement;

    this.setupEventListeners();
    this.setup();
    this.loop();
  }

  setupEventListeners() {
    this.state.observe("screenSize", this.updateDisplaySize.bind(this));
    this.state.observe("camera.offset", this.updateCamera.bind(this));
    this.state.observe([
      "options.count",
      "options.spriteSet",
      "options.isAnimatedByDefault",
      "options.canvas.maxCanvasSize",
      "options.canvas.offsetStrategy",
      "options.canvas.frameType",
      "options.canvas.useWorker",
      "options.canvas.onlyDrawChanges",
    ], this.setup.bind(this));

    document.addEventListener("keydown", (event) => {
      if (event.key === "r") {
        this.subRenderer.draw();
      }
      if (event.key === "R") {
        this.manualRedraw = !this.manualRedraw;
      }
    });
  }

  setup() {
    this.subRenderer?.destroy();

    switch (this.state.options.canvas.offsetStrategy) {
      case CanvasOffsetStrategy.DIRECT_CANVAS:
        this.subRenderer = new DirectCanvasSubRenderer(this.state, this.containerElement);
        break;
      case CanvasOffsetStrategy.CSS_TRANSFORM:
        this.subRenderer = new TiledCanvasSubRenderer(this.state, this.containerElement);
        break;
      case CanvasOffsetStrategy.BUFFER_CANVAS:
        this.subRenderer = new BufferedCanvasSubRenderer(this.state, this.containerElement);
        break;
      default:
        throw new Error(`Unknown canvas offset strategy: ${this.state.options.canvas.offsetStrategy}`);
    }

    this.setupImages();
    this.subRenderer.setup();
    this.setupFellas();
    this.updateAnimations()
    this.updateDisplaySize();
    this.updateCamera();

    this.subRenderer.needsGlobalRedraw = true;
  }

  setupImages() {
    const spriteSet = SpriteSets[this.state.options.spriteSet];

    const loadImageInto = (src, imageType, variation, frame) => {
      const image = new Image();
      image.src = src;
      image.onload = async () => {
        const bitmap = await createImageBitmap(image);
        this.subRenderer.setImage(bitmap, imageType, variation, frame);
      };
    }

    for (const variation of spriteSet.variations) {
      const src = spriteSet.assets.stills[variation];
      loadImageInto(src, "still", variation);
    }

    if (this.state.options.canvas.frameType === CanvasFrameType.INDIVIDUAL_IMAGES) {
      for (const variation of spriteSet.variations) {
        for (let frame = 0; frame < spriteSet.frames; frame++) {
          const src = spriteSet.assets.frames[variation][frame];
          loadImageInto(src, "frame", variation, frame);
        }
      }
    }

    if (this.state.options.canvas.frameType === CanvasFrameType.SPRITE_SHEET) {
      for (const variation of spriteSet.variations) {
        const src = spriteSet.assets.spriteSheets[variation];
        loadImageInto(src, "spriteSheet", variation);
      }
    }

    const frameType = this.state.options.canvas.frameType;

    if (frameType === CanvasFrameType.SPRITE_SHEET) {
      this.subRenderer.spriteSheetCoordinates = [];
      for (let frame = 0; frame < spriteSet.frames; frame++) {
        const x = (frame % spriteSet.spriteSheetDimensions.columns) * spriteSet.width;
        const y = Math.floor(frame / spriteSet.spriteSheetDimensions.columns) * spriteSet.height;
        this.subRenderer.spriteSheetCoordinates[frame] = { x, y };
      }
    }
  }

  setupFellas() {
    const updatedFellas = {};

    const { spriteSet, count, isAnimatedByDefault } = this.state.options;

    for (let i = 0; i < count; i++) {
      const fella = {
        isAnimated: isAnimatedByDefault,
        variation: randomChoice(SpriteSets[spriteSet].variations),
        needsRedraw: true,
        frame: 0,
        timeOnFrame: 0,
      };

      updatedFellas[i] = fella;
    }

    this.subRenderer.updateFellas(updatedFellas);
  }

  updateDisplaySize() {
    this.subRenderer.updateDisplaySize();
  }

  updateCamera() {
    this.subRenderer.updateCamera();
  }

  updateAnimations() {
    const updateTime = performance.now();
    const deltaTime = updateTime - this.lastUpdateTime;
    this.lastUpdateTime = updateTime;

    const spriteSet = SpriteSets[this.state.options.spriteSet];

    for (const fella of this.subRenderer.fellas) {
      if (!fella.isAnimated) {
        continue;
      }

      fella.timeOnFrame += deltaTime;
      if (fella.timeOnFrame > spriteSet.frameDuration) {
        const addedFrames = Math.floor(fella.timeOnFrame / spriteSet.frameDuration);
        fella.timeOnFrame = fella.timeOnFrame % spriteSet.frameDuration;
        fella.frame = (fella.frame + addedFrames) % spriteSet.frames;
        fella.needsRedraw = true;
      }
    }
  }

  loop() {
    this.swapFellaVariations();
    this.swapFellaAnimations();
    this.updateAnimations();

    if (!this.manualRedraw) {
      this.subRenderer.draw();
    }

    this.animationFrame = requestAnimationFrame(this.loop.bind(this));
  }

  swapFellaVariations() {
    const { spriteSet, variationChangesPerFrame } = this.state.options;

    let updatedFellas = {};

    for (let i = 0; i < variationChangesPerFrame; i++) {
      const fellaIndex = randomInt(0, this.subRenderer.fellas.length - 1);
      updatedFellas[fellaIndex] = {
        variation: randomChoice(SpriteSets[spriteSet].variations),
        frame: 0,
        timeOnFrame: 0,
        needsRedraw: true,
      };
    }

    if (variationChangesPerFrame > 0) {
      this.subRenderer.updateFellas(updatedFellas);
    }
  }

  swapFellaAnimations() {
    const { animationChangesPerFrame } = this.state.options;

    let updatedFellas = {};

    for (let i = 0; i < animationChangesPerFrame; i++) {
      const fellaIndex = randomInt(0, this.subRenderer.fellas.length - 1);
      const fella = this.subRenderer.fellas[fellaIndex];
      updatedFellas[fellaIndex] = {
        isAnimated: !fella.isAnimated,
        frame: 0,
        timeOnFrame: 0,
        needsRedraw: true,
      };
    }

    if (animationChangesPerFrame > 0) {
      this.subRenderer.updateFellas(updatedFellas);
    }
  }

  destroy() {
    this.subRenderer.destroy();
    cancelAnimationFrame(this.animationFrame);
    this.containerElement.replaceChildren();
  }
}
