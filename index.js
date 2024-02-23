import './utils/options.js';
import * as debugGui from './utils/debug-gui.js';
import {
	options,
	RendererOptions,
} from './utils/options.js';
import * as inputHandlers from './utils/input-handlers.js';
import { ImageRenderModule } from './renderer-modules/image-render-module.js';
import { camera } from './utils/camera.js';
import {observeSize} from "./utils/observe-size.js";
import {SpriteSets} from "./utils/sprite-sets.js";

const dimensions = { x: 0, y: 0 };

const containerElement = document.querySelector('#container');

const renderModuleFactories = {
	[RendererOptions.IMAGE]: () => {
		const module = new ImageRenderModule();
		module.useUniqueImages = options.img.useUniqueImages;
		module.offsetStrategy = options.img.offsetStrategy;
		module.elementType = options.img.elementType;
		return module;
	},
};
let renderModule = null;

initializeRenderModule();

observeSize(containerElement, (width, height) => {
	dimensions.x = width;
	dimensions.y = height;
	if (renderModule) {
		renderModule.dimensions = dimensions;
		renderModule.onDimensionsUpdated();
	}
});

debugGui.initialize(options, initializeRenderModule, renderModule);

inputHandlers.initialize(containerElement, camera, {
	onOffsetUpdated: () => {
		renderModule?.onCameraUpdated();
	},
	onScaleUpdated: () => {
		renderModule?.onCameraUpdated();
	},
});

function initializeRenderModule() {
	renderModule?.destroy();

	renderModule = renderModuleFactories[options.renderer]();

	if (!renderModule) {
		alert(`Renderer "${options.renderer}" not implemented yet.`);
		return;
	}

	renderModule?.initialize({
		containerElement,
		dimensions,
		camera,
		count: options.count,
		spriteSet: SpriteSets[options.spriteSet],
		isAnimatedByDefault: options.isAnimatedByDefault,
		animationChangesPerFrame: options.animationChangesPerFrame,
		variationChangesPerFrame: options.variationChangesPerFrame,
	});
}
