import {RendererOptions} from '../state/options.js';
import {ImageRenderer} from './image/image-renderer.js';
import {CanvasRenderer} from './canvas/canvas-renderer.js';
import {WebglRenderer} from './webgl/webgl-renderer.js';
import {WebgpuRenderer} from './webgpu/webgpu-renderer.js';

const Renderers = {
  [RendererOptions.IMAGE]: ImageRenderer,
  [RendererOptions.CANVAS]: CanvasRenderer,
  [RendererOptions.WEBGL]: WebglRenderer,
  [RendererOptions.WEBGPU]: WebgpuRenderer,
};

let currentRenderer = null;

export function setupRenderers(state, containerElement) {
  function reinitialize() {
    currentRenderer?.destroy();
    const Renderer = Renderers[state.options.renderer];
    currentRenderer = new Renderer(state, containerElement);
  }

  reinitialize();
  state.observe('options.renderer', reinitialize);
}
