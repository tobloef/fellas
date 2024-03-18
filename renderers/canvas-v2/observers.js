class CanvasRendererObservers {
  unobserveScreenSize = null;
  unobserveCameraOffset = null;
  unobserveOptions = null;

  constructor(state, callbacks) {
    this.setupScreenSizeObserver(state, callbacks.onScreenSizeUpdate);
    this.setupCameraObserver(state, callbacks.onCameraUpdate);
    this.setupOptionsObserver(state, callbacks.onOptionsUpdate);
  }

  setupScreenSizeObserver(state, onScreenSizeUpdate) {
    this.unobserveScreenSize?.();
    this.unobserveScreenSize = state.observe(
      "screenSize",
      onScreenSizeUpdate,
    );
  }

  setupCameraObserver(state, onCameraUpdate) {
    this.unobserveCameraOffset?.();
    this.unobserveCameraOffset = state.observe(
      "camera.offset",
      onCameraUpdate
    );
  }

  setupOptionsObserver(state, onOptionsUpdate) {
    this.unobserveOptions?.();
    this.unobserveOptions = state.observe(
      [
        "options.count",
        "options.spriteSet",
        "options.isAnimatedByDefault",
        "options.canvas.maxCanvasSize",
        "options.canvas.offsetStrategy",
        "options.canvas.frameType",
        "options.canvas.useWorker",
        "options.canvas.onlyDrawChanges",
      ],
      onOptionsUpdate
    );
  }

  destroy() {
    this.unobserveScreenSize?.();
    this.unobserveScreenSize = null;

    this.unobserveCameraOffset?.();
    this.unobserveCameraOffset = null;

    this.unobserveOptions?.();
    this.unobserveOptions = null;
  }
}