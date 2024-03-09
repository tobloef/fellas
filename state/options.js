export const RendererOptions = {
	IMAGE: 'Image',
	CANVAS: 'Canvas',
	WEBGL: 'WebGL',
	WEBGPU: 'WebGPU',
};

export const SpriteSetOptions = {
	FROG: 'Frog (64x64)',
	TEST: 'Test (250x250)',
};

export const ImgOffsetStrategy = {
	POSITION: 'Position',
	TRANSLATE: 'Translate',
};

export const CanvasOffsetStrategy = {
	DIRECT_CANVAS: 'Direct to canvas',
	CSS_TRANSFORM: 'CSS transform',
	BUFFER_CANVAS: 'Buffer canvas',
};

export const ImgElementType = {
	IMG: 'Image',
	DIV: 'Div',
};

export const DEFAULT_OPTIONS = {
	renderer: RendererOptions.IMAGE,
	count: 1000,
	spriteSet: SpriteSetOptions.FROG,
	isAnimatedByDefault: false,
	variationChangesPerFrame: 0,
	animationChangesPerFrame: 0,
	img: {
		offsetStrategy: ImgOffsetStrategy.POSITION,
		useUniqueImages: false,
		elementType: ImgElementType.IMG,
	},
	canvas: {
		onlyDrawChanges: false,
		offsetStrategy: CanvasOffsetStrategy.DIRECT_CANVAS,
		useWorker: false,
		useMultipleWorkers: false,
	},
	webgl: {},
	webgpu: {},
};
