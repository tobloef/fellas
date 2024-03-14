export function setupSizeObserver(state, containerElement) {
  observeSize(containerElement, (width, height) => {
    state.screenSize = { width, height };
  });
}

function observeSize(
  element,
  callback,
) {
  let previousWidth = 0;
  let previousHeight = 0;

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const size = entry.devicePixelContentBoxSize?.[0];

      const width = size.inlineSize / window.devicePixelRatio;
      const height = size.blockSize / window.devicePixelRatio;

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

  resizeObserver.observe(element, { box: 'device-pixel-content-box' });

  const cleanup = () => {
    resizeObserver.disconnect();
  };

  return cleanup;
}
