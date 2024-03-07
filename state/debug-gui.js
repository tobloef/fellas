import {
	CanvasOffsetStrategy,
	ImgElementType,
	ImgOffsetStrategy,
	RendererOptions,
	SpriteSetOptions,
} from './options.js';
import { copyStateAsUrl } from './search-params.js';

export function setupDebugGui(state) {
	const options = state.options;

	const gui = new dat.GUI();

	gui.width = 300;

	let folders = {};

	const copyButtonName = 'Copy settings as URL';
	gui.add(
		{
			copyStateAsUrl: () => {
				const controller = gui.__controllers.find(
					(controller) => controller.property === 'copyStateAsUrl',
				);
				controller.name(`${copyButtonName} (Copied!)`);
				setTimeout(() => {
					controller.name(copyButtonName);
				}, 1000);
				copyStateAsUrl(state);
			},
		},
		'copyStateAsUrl',
	).name(copyButtonName);

	gui.add(options, 'renderer', Object.values(RendererOptions))
		.name('Renderer')
		.onChange(() => {
			Object.values(RendererOptions).forEach((renderer) => {
				folders[renderer].hide();
			});

			folders[options.renderer].show();
		});

	gui.add(options, 'spriteSet', Object.values(SpriteSetOptions))
		.name('Sprites');

	gui.add(options, 'isAnimatedByDefault')
		.name('Animated by default');

	gui.add(options, 'count')
		.name('Count')
		.step(1);

	gui.add(options, 'animationChangesPerFrame')
		.name('Animation Changes Per Frame')
		.step(1);

	gui.add(options, 'variationChangesPerFrame')
		.name('Variation Changes Per Frame')
		.step(1);

	folders[RendererOptions.IMAGE] = gui.addFolder('Image');
	folders[RendererOptions.IMAGE].open();
	folders[RendererOptions.IMAGE].hide();
	folders[RendererOptions.IMAGE]
		.add(options.img, 'offsetStrategy', Object.values(ImgOffsetStrategy))
		.name('Panning');
	folders[RendererOptions.IMAGE]
		.add(options.img, 'useUniqueImages')
		.name('Unique Images');
	folders[RendererOptions.IMAGE]
		.add(options.img, 'elementType', Object.values(ImgElementType))
		.name('Element Type');

	folders[RendererOptions.CANVAS] = gui.addFolder('Canvas');
	folders[RendererOptions.CANVAS].open();
	folders[RendererOptions.CANVAS].hide();
	folders[RendererOptions.CANVAS]
		.add(options.canvas, 'offsetStrategy', Object.values(CanvasOffsetStrategy))
		.name('Panning');
	folders[RendererOptions.CANVAS]
		.add(options.canvas, 'onlyDrawChanges')
		.name('Only draw changes');
	folders[RendererOptions.CANVAS]
		.add(options.canvas, 'useWorker')
		.name('Use Web Worker');
	folders[RendererOptions.CANVAS]
		.add(options.canvas, 'useMultipleWorkers')
		.name('Multiple workers');

	folders[RendererOptions.WEBGL] = gui.addFolder('WebGL');
	folders[RendererOptions.WEBGL].open();
	folders[RendererOptions.WEBGL].hide();

	folders[RendererOptions.WEBGPU] = gui.addFolder('WebGPU');
	folders[RendererOptions.WEBGPU].open();
	folders[RendererOptions.WEBGPU].hide();

	folders[options.renderer].show();
}
