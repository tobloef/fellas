import { RendererOptions } from '../state/options.js';
import { ImageRenderer } from './image-renderer.js';
import { CanvasRenderer } from './canvas-renderer.js';
import { WebglRenderer } from './webgl-renderer.js';
import { WebgpuRenderer } from './webgpu-renderer.js';

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
		const renderer = Renderers[state.options.renderer];
		currentRenderer = renderer.create(state, containerElement);
	}

	reinitialize();
	state.observe('options.renderer', reinitialize);
}
