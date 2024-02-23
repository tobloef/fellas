import './utils/options.js';
import * as debugGui from './utils/debug-gui.js';
import {
	options,
	RendererOptions,
} from './utils/options.js';
import * as inputHandlers from './utils/input-handlers.js';
import { ImageRendererModule } from './renderer-modules/image-renderer-module.js';
import { camera } from './utils/camera.js';
import {observeSize} from "./utils/observe-size.js";
import {size} from "./utils/size.js";

const rendererModules = {
	[RendererOptions.IMAGE]: ImageRendererModule,
};

let rendererModule = null;

const containerElement = document.querySelector('#container');

observeSize(containerElement, (width, height) => {
	size.x = width;
	size.y = height;
	rendererModule?.updateSize();
});

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

	const RendererModuleClass = rendererModules[options.renderer];
	rendererModule = new RendererModuleClass();

	if (!rendererModule) {
		alert(`Renderer "${options.renderer}" not implemented yet.`);
		return;
	}

	rendererModule?.initialize(containerElement);
}
