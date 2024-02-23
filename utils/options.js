import {
	removeNullAndUndefined,
} from './remove-null-and-undefined.js';

export const RendererOptions = {
	IMAGE: 'Image',
	CANVAS: 'Canvas',
	WEBGL: 'WebGL',
	WEBGPU: 'WebGPU',
};

export const SpriteOptions = {
	FROG: 'Frog (64x64)',
};

export const ImgOffsetStrategy = {
	POSITION: 'Position',
	TRANSLATE: 'Translate',
};

const DEFAULT_OPTIONS = {
	renderer: RendererOptions.IMAGE,
	count: 100,
	sprites: SpriteOptions.FROG,
	animate: true,
	variationChangesPerFrame: 100,
	animationChangesPerFrame: 100,
	img: {
		offsetStrategy: ImgOffsetStrategy.POSITION,
		uniqueImages: false,
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
		sprites: searchParams.get('sprites'),
		variationChangesPerFrame: searchParams.get('variationChangesPerFrame')
			? parseInt(searchParams.get('variationChangesPerFrame'))
			: undefined,
		animationChangesPerFrame: searchParams.get('animationChangesPerFrame')
			? parseInt(searchParams.get('animationChangesPerFrame'))
			: undefined,
		img: {
			offsetStrategy: searchParams.get('img.offsetStrategy'),
			uniqueImages: searchParams.get('img.uniqueImages')
				? searchParams.get('img.uniqueImages') === 'true'
				: undefined,
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
	searchParams.set('sprites', options.sprites);
	searchParams.set('variationChangesPerFrame', options.variationChangesPerFrame);
	searchParams.set('animationChangesPerFrame', options.animationChangesPerFrame);
	searchParams.set('img.offsetStrategy', options.img.offsetStrategy);
	searchParams.set('img.uniqueImages', options.img.uniqueImages);

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
