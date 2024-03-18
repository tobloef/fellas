import { SpriteSets } from '../../state/sprite-sets.js';

export class CanvasRenderer {
  containerElement = null;
  state = null;
  observers = null;
  canvasThing = null;
  manualRedraw = false;
  animationFrame = null;

  constructor(state, containerElement) {
    this.state = state;
    this.containerElement = containerElement;

    this.observers = new CanvasRendererObservers(state, {
      onScreenSizeUpdate: this.updateScreenSize.bind(this),
      onCameraUpdate: this.updateCamera.bind(this),
      onOptionsUpdate: this.setup.bind(this),
      onToggleManualRedraw: () => this.manualRedraw = !this.manualRedraw,
      onManualRedraw: this.draw.bind(this),
    });
  }

  setup() {
    const spriteSet = SpriteSets[this.state.options.spriteSet];
    const useCamera = true;
    const onlyDrawChanges = this.state.options.canvas.onlyDrawChanges;
    const useSpriteSheet = this.state.options.canvas.frameType === CanvasFrameType.SPRITE_SHEET;

    this.canvasThing?.destroy();
    this.canvasThing = new CanvasThing(
      ctx,
      spriteSet,
      useCamera,
      onlyDrawChanges,
      useSpriteSheet,
    );

    this.loop();
  }

  updateScreenSize() {

  }

  updateCamera() {

  }

  loop() {
    if (!this.manualRedraw) {
      this.draw();
    }

    this.animationFrame = requestAnimationFrame(this.loop.bind(this));
  }

  draw() {

  }

  destroy() {
    this.observers.destroy();
    this.observers = null;
  }
}
