import {
	removeNullAndUndefined,
} from './remove-null-and-undefined.js';

export const RendererOptions = {
	IMAGE: 'Image',
	CANVAS: 'Canvas',
	WEBGL: 'WebGL',
	WEBGPU: 'WebGPU',
};

export const SpriteSetOptions = {
	FROG: 'Frog (64x64)',
};

export const ImgOffsetStrategy = {
	POSITION: 'Position',
	TRANSLATE: 'Translate',
};

export const ImgElementType = {
	IMG: 'Image',
	DIV: 'Div',
}

const DEFAULT_OPTIONS = {
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
	canvas: {},
	webgl: {},
	webgpu: {},
};

export const options = optionsFromSearchParams(
	new URLSearchParams(window.location.search),
);
updateOptionsSearchParams();

function optionsFromSearchParams(searchParams) {
	const searchParamsOptions = {
		renderer: searchParams.get('renderer'),
		spriteSet: searchParams.get('spriteSet'),
		isAnimatedByDefault: searchParams.get('isAnimatedByDefault')
			? searchParams.get('isAnimatedByDefault') === 'true'
			: undefined,
		count: searchParams.get('count')
			? parseInt(searchParams.get('count'))
			: undefined,
		variationChangesPerFrame: searchParams.get('variationChangesPerFrame')
			? parseInt(searchParams.get('variationChangesPerFrame'))
			: undefined,
		animationChangesPerFrame: searchParams.get('animationChangesPerFrame')
			? parseInt(searchParams.get('animationChangesPerFrame'))
			: undefined,
		img: {
			offsetStrategy: searchParams.get('img.offsetStrategy'),
			useUniqueImages: searchParams.get('img.useUniqueImages')
				? searchParams.get('img.useUniqueImages') === 'true'
				: undefined,
			elementType: searchParams.get('img.elementType'),
		},
	};

	return {
		...DEFAULT_OPTIONS,
		...removeNullAndUndefined(searchParamsOptions),
		img: {
			...DEFAULT_OPTIONS.img,
			...removeNullAndUndefined(searchParamsOptions.img),
		},
	};
}

function optionsToSearchParams(options) {
	const searchParams = new URLSearchParams();


	searchParams.set('renderer', options.renderer);
	searchParams.set('spriteSet', options.spriteSet);
	searchParams.set('isAnimatedByDefault', options.isAnimatedByDefault);
	searchParams.set('count', options.count);
	searchParams.set('variationChangesPerFrame', options.variationChangesPerFrame);
	searchParams.set('animationChangesPerFrame', options.animationChangesPerFrame);
	searchParams.set('img.offsetStrategy', options.img.offsetStrategy);
	searchParams.set('img.useUniqueImages', options.img.useUniqueImages);
	searchParams.set('img.element', options.img.elementType);

	return searchParams;
}


export function updateOptionsSearchParams() {
	const optionsSearchParams = optionsToSearchParams(options);

	const otherSearchParams = new URLSearchParams(window.location.search);
	optionsSearchParams.forEach((value, key) => {
		otherSearchParams.delete(key);
	});

	let newUrl = `${window.location.pathname}?${optionsSearchParams}`;
	if (otherSearchParams.toString().length > 0) {
		newUrl += `&${otherSearchParams}`;
	}
	window.history.replaceState({}, '', newUrl);
}
