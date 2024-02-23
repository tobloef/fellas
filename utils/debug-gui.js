import {
	ImgElementType,
	ImgOffsetStrategy,
	RendererOptions,
	SpriteSetOptions,
	updateOptionsSearchParams,
} from './options.js';
import { SpriteSets } from './sprite-sets.js';
import {ImageRenderModule} from "../renderer-modules/image-render-module.js";

export function initialize(options, initializeRenderModule, renderModule) {
	const gui = new dat.GUI();

	gui.width = 300;

	let folders = {};

	gui.add(options, 'renderer', Object.values(RendererOptions))
		.name('Renderer')
		.onChange(() => {
			Object.values(RendererOptions).forEach((renderer) => {
				folders[renderer].hide();
			});

			folders[options.renderer].show();

			initializeRenderModule();
			updateOptionsSearchParams();
		});

	gui.add(options, 'spriteSet', Object.values(SpriteSetOptions))
		.name('Sprites')
		.onChange(() => {
			renderModule.spriteSet = SpriteSets[options.spriteSet];
			renderModule.onSpriteSetUpdated();
			updateOptionsSearchParams();
		});

	gui.add(options, 'isAnimatedByDefault')
		.name('Animated by default')
		.onChange(() => {
			renderModule.isAnimatedByDefault = options.isAnimatedByDefault;
			renderModule.onSpriteSetUpdated();
			updateOptionsSearchParams();
		});

	gui.add(options, 'count')
		.name('Count')
		.step(1)
		.onChange(() => {
			renderModule.count = options.count;
			renderModule.onCountUpdated();
			updateOptionsSearchParams();
		});

	gui.add(options, 'animationChangesPerFrame')
		.name('Animation Changes Per Frame')
		.step(1)
		.onChange(() => {
			renderModule.animationChangesPerFrame = options.animationChangesPerFrame;
			updateOptionsSearchParams();
		});

	gui.add(options, 'variationChangesPerFrame')
		.name('Variation Changes Per Frame')
		.step(1)
		.onChange(() => {
			renderModule.variationChangesPerFrame = options.variationChangesPerFrame;
			updateOptionsSearchParams();
		});

	folders[RendererOptions.IMAGE] = gui.addFolder('Image');
	folders[RendererOptions.IMAGE].open();
	folders[RendererOptions.IMAGE].hide();
	folders[RendererOptions.IMAGE]
		.add(options.img, 'offsetStrategy', Object.values(ImgOffsetStrategy))
		.name('Panning')
		.onChange(() => {
			if (renderModule instanceof ImageRenderModule) {
				renderModule.offsetStrategy = options.img.offsetStrategy;
				renderModule.onCameraUpdated();
			}
			updateOptionsSearchParams();
		});
	folders[RendererOptions.IMAGE]
		.add(options.img, 'useUniqueImages')
		.name('Unique Images')
		.onChange(() => {
			if (renderModule instanceof ImageRenderModule) {
				renderModule.useUniqueImages = options.img.useUniqueImages;
				renderModule.onSpriteSetUpdated();
			}
			updateOptionsSearchParams();
		});
	folders[RendererOptions.IMAGE]
		.add(options.img, 'elementType', Object.values(ImgElementType))
		.name('Element Type')
		.onChange(() => {
			if (renderModule instanceof ImageRenderModule) {
				renderModule.elementType = options.img.elementType;
				renderModule.onSpriteSetUpdated();
			}
			updateOptionsSearchParams();
		});

	folders[RendererOptions.CANVAS] = gui.addFolder('Canvas');
	folders[RendererOptions.CANVAS].open();
	folders[RendererOptions.CANVAS].hide();

	folders[RendererOptions.WEBGL] = gui.addFolder('WebGL');
	folders[RendererOptions.WEBGL].open();
	folders[RendererOptions.WEBGL].hide();

	folders[RendererOptions.WEBGPU] = gui.addFolder('WebGPU');
	folders[RendererOptions.WEBGPU].open();
	folders[RendererOptions.WEBGPU].hide();

	folders[options.renderer].show();
}
