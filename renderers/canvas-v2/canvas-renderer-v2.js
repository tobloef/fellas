import { SpriteSets } from '../../state/sprite-sets.js';
import {CanvasOffsetStrategy} from "../../state/options.js";
import {randomChoice} from "../../utils/random.js";
import {WorkerMessageType} from "./worker-message-type.js";

export class CanvasRenderer {
  containerElement = null;
  state = null;
  observers = null;

  constructor(state, containerElement) {
    this.state = state;
    this.containerElement = containerElement;

    this.observers = new CanvasRendererObservers(state, {
      onScreenSizeUpdate: this.updateScreenSize.bind(this),
      onCameraUpdate: this.updateCamera.bind(this),
      onOptionsUpdate: this.setup.bind(this),
    });
  }

  setup() {
    const {
      canvas: {
        offsetStrategy,
        useWorker,
      }
    } = this.state.options;

    const isDirect = offsetStrategy === CanvasOffsetStrategy.DIRECT_CANVAS;
    const isTiled = offsetStrategy === CanvasOffsetStrategy.CSS_TRANSFORM;
    const isBuffered = offsetStrategy === CanvasOffsetStrategy.BUFFER_CANVAS;

    if (isDirect && !useWorker) {
      this.setupDirectCanvas();
    } else if (isDirect && useWorker) {
      this.setupDirectCanvasWorker();
    } else if (isTiled && !useWorker) {
      this.setupTiledCanvas();
    } else if (isTiled && useWorker) {
      this.setupTiledCanvasWorker();
    } else if (isBuffered && !useWorker) {
      this.setupBufferedCanvas();
    } else if (isBuffered && useWorker) {
      this.setupBufferedCanvasWorker();
    }
  }

  setupDirectCanvas() {
    const {
      screenSize,
      camera: initialCamera,
      options: {
        count,
        isAnimatedByDefault,
        canvas: {
          spriteSet: spriteSetKey,
          onlyDrawChanges,
          frameType,
        }
      }
    } = this.state;

    const canvas = document.createElement("canvas");
    canvas.width = screenSize.width;
    canvas.height = screenSize.height;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.imageRendering = "pixelated";

    const ctx = canvas.getContext("2d", {
      alpha: false,
      antialias: false
    });
    ctx.imageSmoothingEnabled = false;

    const spriteSet = SpriteSets[spriteSetKey];

    const useSpriteSheet = frameType === CanvasFrameType.SPRITE_SHEET;

    const camera = {
      offset: {
        x: initialCamera.offset.x,
        y: initialCamera.offset.y,
      },
      scale: initialCamera.scale,
    }

    let fellas = [];
    for (let i = 0; i < count; i++) {
      fellas[i] = {
        isAnimated: isAnimatedByDefault,
        variation: randomChoice(spriteSet.variations),
        needsRedraw: true,
        frame: 0,
        timeOnFrame: 0,
      };
    }

    this.canvasThing = new CanvasThing({
      ctx,
      spriteSet,
      useCamera: true,
      onlyDrawChanges,
      useSpriteSheet,
      camera,
      fellas,
    });
  }

  setupDirectCanvasWorker() {

  }

  setupTiledCanvas() {

  }

  setupTiledCanvasWorker() {

  }

  setupBufferedCanvas() {

  }

  setupBufferedCanvasWorker() {

  }

  updateScreenSize() {
    const {
      screenSize: {
        width,
        height,
      },
      options: {
        canvas: {
          offsetStrategy,
          useWorker,
        }
      }
    } = this.state;

    const isDirect = offsetStrategy === CanvasOffsetStrategy.DIRECT_CANVAS;
    const isBuffered = offsetStrategy === CanvasOffsetStrategy.BUFFER_CANVAS;

    if (isDirect && !useWorker) {
      this.canvasThing.updateDisplaySize(width, height);
    } else if (isDirect && useWorker) {
      this.worker.postMessage({
        type: WorkerMessageType.UPDATE_DISPLAY_SIZE,
        width,
        height,
      })
    } else if (isBuffered) {
      this.bufferedCanvasThing.updateDisplaySize(width, height);
    }
  }

  updateCamera() {
    const {
      camera: {
        offset: { x, y },
        scale,
      },
      options: {
        canvas: {
          offsetStrategy,
          useWorker,
        },
      }
    } = this.state;

    const isDirect = offsetStrategy === CanvasOffsetStrategy.DIRECT_CANVAS;
    const isTiled = offsetStrategy === CanvasOffsetStrategy.CSS_TRANSFORM;
    const isBuffered = offsetStrategy === CanvasOffsetStrategy.BUFFER_CANVAS;

    const camera = {
      offset: { x, y },
      scale,
    }

    if (isDirect && !useWorker) {
      this.canvasThing.updateCamera(camera);
    } else if (isDirect && useWorker) {
      this.worker.postMessage({
        type: WorkerMessageType.UPDATE_CAMERA,
        camera,
      });
    } else if (isTiled) {
      const transform = `scale(${scale}) translate(${x}px, ${y}px)`;
      this.canvasesElement.style.transform = transform;
    } else if (isBuffered) {
      this.bufferedCanvasThing.updateCamera(camera);
    }
  }

  destroy() {
    this.observers.destroy();
    this.observers = null;
  }
}
