import { RendererModule } from './renderer-module.js';
import {
	ImgElementType,
	ImgOffsetStrategy,
	options,
} from '../utils/options.js';
import { getRowsAndColumns } from '../utils/get-rows-and-columns.js';
import { camera } from '../utils/camera.js';
import { Sprites } from '../utils/sprites.js';
import { randomChoice } from '../utils/random.js';
import {size} from "../utils/size.js";

export class ImageRendererModule extends RendererModule {
	#fellas = [];
	#fellasElement = null;
	#containerElement = null;
	#animationFrame = null;

	initialize(
		containerElement,
	) {
		this.#containerElement = containerElement;

		this.#fellasElement = document.createElement('div');
		this.#containerElement.appendChild(this.#fellasElement);

		this.#fellasElement.style.overflow = 'hidden';
		this.#fellasElement.style.position = 'absolute';
		this.#fellasElement.style.width = '100%';
		this.#fellasElement.style.height = '100%';
		this.#fellasElement.style.transformOrigin = 'top left';
		this.#fellasElement.style.imageRendering = 'pixelated';
		this.#fellasElement.style.userSelect = 'none';
		this.#fellasElement.style.fontSize = '0'

		this.updateSprites();
		this.updateSize();
		this.updateCount();
		this.updateCamera();

		this.#loop();
	}

	updateCount() {
		this.#fellas.forEach(fella => fella.element.remove());

		for (let i = 0; i < options.count; i++) {
			const fella = this.#createFella();
			this.#fellas.push(fella);
		}

		let { rowsWithOverflow, columns } = getRowsAndColumns(options.count);

		const sprites = Sprites[options.sprites];

		this.#fellasElement.style.width = `${columns * sprites.width}px`;
		this.#fellasElement.style.height = `${rowsWithOverflow * sprites.height}px`;
	}

	updateCamera() {
		if (options.img.offsetStrategy === ImgOffsetStrategy.POSITION) {
			this.#fellasElement.style.top = `${camera.offset.y * camera.scale}px`;
			this.#fellasElement.style.left = `${camera.offset.x * camera.scale}px`;
			this.#fellasElement.style.transform = `scale(${camera.scale})`;
		} else {
			this.#fellasElement.style.top = '0';
			this.#fellasElement.style.left = '0';
			this.#fellasElement.style.transform = `scale(${camera.scale}) translate(${camera.offset.x}px, ${camera.offset.y}px)`;
		}
	}

	updateSize() {
		if (size.x === 0 || size.y === 0) {
			return;
		}

		console.debug('ImageRendererModule.updateSize', size);
	}

	updateSprites() {
		this.updateCount();
	}

	destroy() {
		this.#fellas.forEach(fella => fella.element.remove());
		this.#fellas = [];
		this.#fellasElement.remove();
		this.#fellasElement = null;
		this.#containerElement = null;
		cancelAnimationFrame(this.#animationFrame);
	}

	#createFella() {
		const animated = options.animated;

		const variations = Sprites[options.sprites].variations;
		const variation = randomChoice(variations);

		let element = null;

		if (options.img.elementType === ImgElementType.IMG) {
			element = document.createElement('img');
			element.draggable = false;
		} else if (options.img.elementType === ImgElementType.DIV) {
			const sprites = Sprites[options.sprites];
			element = document.createElement('div');
			element.style.display = 'inline-block';
			element.style.width = `${sprites.width}px`;
			element.style.height = `${sprites.height}px`;
			element.style.backgroundSize = 'contain';
			element.style.backgroundRepeat = 'no-repeat';
			element.style.imageRendering = 'pixelated';
		}

		const fella = { element, variation, animated };

		this.#updateFella(fella);

		this.#fellasElement.appendChild(element);

		return fella;
	}

	#loop() {
		this.#swapFellas();
		this.#animateFellas();

		this.#animationFrame = requestAnimationFrame(() => {
			this.#loop();
		});
	}

	#swapFellas() {
		for (let i = 0; i < options.variationChangesPerFrame; i++) {
			const variations = Sprites[options.sprites].variations;
			const newVariation = randomChoice(variations);
			const fella = randomChoice(this.#fellas);
			fella.variation = newVariation;
			this.#updateFella(fella);
		}
	}

	#animateFellas() {
		for (let i = 0; i < options.animationChangesPerFrame; i++) {
			const fella = randomChoice(this.#fellas);
			fella.animated = !fella.animated;
			this.#updateFella(fella);
		}
	}

	#getFellaSrc(fella) {
		const srcFunc = fella.animated
			? Sprites[options.sprites].assets.animated
			: Sprites[options.sprites].assets.still;

		let src = srcFunc(fella.variation);

		if (options.img.uniqueImages) {
			src += `?${Math.random()}`;
		}

		return src;
	}

	#updateFella(fella) {
		const src = this.#getFellaSrc(fella);

		if (options.img.elementType === ImgElementType.IMG) {
			fella.element.src = src;
		} else if (options.img.elementType === ImgElementType.DIV) {
			fella.element.style.backgroundImage = `url(${src})`;
		}
	}
}
