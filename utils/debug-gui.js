import {
	ImgOffsetStrategy,
	RendererOptions,
	SpriteOptions,
	updateOptionsSearchParams,
} from './options.js';
import { sprites } from './sprites.js';

export function initialize(options, reinitialize, rendererModule) {
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

			reinitialize();
			updateOptionsSearchParams();
		});

	gui.add(options, 'sprites', Object.values(SpriteOptions))
		.name('Sprites')
		.onChange(() => {
			rendererModule.updateSprites();
			updateOptionsSearchParams();
		});

	gui.add(options, 'count')
		.name('Count')
		.step(1)
		.onChange(() => {
			rendererModule.updateCount();
			updateOptionsSearchParams();
		});

	gui.add(options, 'animationChangesPerFrame')
		.name('Animation Changes Per Frame')
		.step(1)
		.onChange(() => {
			updateOptionsSearchParams();
		});

	gui.add(options, 'variationChangesPerFrame')
		.name('Variation Changes Per Frame')
		.step(1)
		.onChange(() => {
			updateOptionsSearchParams();
		});

	folders[RendererOptions.IMAGE] = gui.addFolder('Image');
	folders[RendererOptions.IMAGE].open();
	folders[RendererOptions.IMAGE].hide();
	folders[RendererOptions.IMAGE]
		.add(options.img, 'offsetStrategy', Object.values(ImgOffsetStrategy))
		.name('Panning')
		.onChange(() => {
			rendererModule.updateCamera();
			updateOptionsSearchParams();
		});
	folders[RendererOptions.IMAGE]
		.add(options.img, 'uniqueImages')
		.name('Unique Images')
		.onChange(() => {
			rendererModule.updateCount();
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
