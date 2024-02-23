import './utils/options.js';
import * as debugGui from './utils/debug-gui.js';
import {
	options,
	RendererOptions,
} from './utils/options.js';
import * as inputHandlers from './utils/input-handlers.js';
import { ImageRendererModule } from './renderer-modules/image-renderer-module.js';
import { camera } from './utils/camera.js';

const rendererModules = {
	[RendererOptions.IMAGE]: new ImageRendererModule(),
};

let rendererModule = null;

const containerElement = document.querySelector('#container');

reinitialize();

debugGui.initialize(options, reinitialize, rendererModule);

inputHandlers.initialize(containerElement, camera, {
	onOffsetUpdated: () => {
		rendererModule?.updateCamera();
	},
	onScaleUpdated: () => {
		rendererModule?.updateCamera();
	},
});

function reinitialize() {
	rendererModule?.destroy();

	rendererModule = rendererModules[options.renderer];

	if (!rendererModule) {
		alert(`Renderer "${options.renderer}" not implemented yet.`);
		return;
	}

	rendererModule?.initialize(containerElement);
}
