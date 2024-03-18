export class CanvasRenderer {
  containerElement = null;
  state = null;
  observers = null;

  constructor(state, containerElement) {
    this.state = state;
    this.containerElement = containerElement;

    this.observers = new CanvasRendererObservers(state, {
      onScreenSizeUpdate: ,
      onCameraUpdate: ,
      onOptionsUpdate: ,
      onToggleManualRedraw: ,
      onManualRedraw: ,
    });
  }

  destroy() {
    this.observers.destroy();
    this.observers = null;
  }
}
