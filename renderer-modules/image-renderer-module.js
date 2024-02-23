import { RendererModule } from './renderer-module.js';
import {
	ImgOffsetStrategy,
	options,
} from '../utils/options.js';
import { getRowsAndColumns } from '../utils/get-rows-and-columns.js';
import { camera } from '../utils/camera.js';
import { sprites } from '../utils/sprites.js';
import { randomChoice } from '../utils/random.js';

export class ImageRendererModule extends RendererModule {
	#fellas = [];
	#imagesElement = null;
	#containerElement = null;
	#animationFrame = null;

	initialize(
		containerElement,
	) {
		this.#containerElement = containerElement;

		this.#imagesElement = document.createElement('div');
		this.#containerElement.appendChild(this.#imagesElement);

		this.#imagesElement.style.overflow = 'hidden';
		this.#imagesElement.style.position = 'absolute';
		this.#imagesElement.style.width = '100%';
		this.#imagesElement.style.height = '100%';
		this.#imagesElement.style.transformOrigin = 'top left';
		this.#imagesElement.style.imageRendering = 'pixelated';
		this.#imagesElement.style.userSelect = 'none';
		this.#imagesElement.style.fontSize = '0'

		this.updateSprites();
		this.updateSize();
		this.updateCount();
		this.updateCamera();

		this.#loop();
	}

	updateCount() {
		this.#fellas.forEach(fella => fella.image.remove());

		for (let i = 0; i < options.count; i++) {
			const fella = this.#createFella();
			this.#fellas.push(fella);
		}

		let { rowsWithOverflow, columns } = getRowsAndColumns(options.count);

		this.#imagesElement.style.width = `${columns * sprites[options.sprites].width}px`;
		this.#imagesElement.style.height = `${rowsWithOverflow * sprites[options.sprites].height}px`;
	}

	updateCamera() {
		if (options.img.offsetStrategy === ImgOffsetStrategy.POSITION) {
			this.#imagesElement.style.top = `${camera.offset.y * camera.scale}px`;
			this.#imagesElement.style.left = `${camera.offset.x * camera.scale}px`;
			this.#imagesElement.style.transform = `scale(${camera.scale})`;
		} else {
			this.#imagesElement.style.top = '0';
			this.#imagesElement.style.left = '0';
			this.#imagesElement.style.transform = `scale(${camera.scale}) translate(${camera.offset.x}px, ${camera.offset.y}px)`;
		}
	}

	updateSize() {
	}

	updateSprites() {
		this.updateCount();
	}

	destroy() {
		this.#fellas.forEach(fella => fella.image.remove());
		this.#fellas = [];
		this.#imagesElement.remove();
		this.#imagesElement = null;
		this.#containerElement = null;
		cancelAnimationFrame(this.#animationFrame);
	}

	#createFella() {
		const image = document.createElement('img');

		const animated = false;

		const variations = sprites[options.sprites].variations;
		const variation = randomChoice(variations);

		image.src = this.#getFellaSrc(variation, animated);
		image.draggable = false;
		image.decoding = 'async';
		this.#imagesElement.appendChild(image);


		return { image, variation, animated };
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
			const variations = sprites[options.sprites].variations;
			const newVariation = randomChoice(variations);
			const fella = randomChoice(this.#fellas);
			fella.variation = newVariation;
			fella.image.src = this.#getFellaSrc(newVariation, fella.animated);
		}
	}

	#animateFellas() {
		for (let i = 0; i < options.animationChangesPerFrame; i++) {
			const fella = randomChoice(this.#fellas);
			fella.animated = !fella.animated;
			fella.image.src = this.#getFellaSrc(fella.variation, fella.animated);
		}
	}

	#getFellaSrc(variation, animated) {
		const srcFunc = animated
			? sprites[options.sprites].assets.animated
			: sprites[options.sprites].assets.still;

		let src = srcFunc(variation);

		if (options.img.uniqueImages) {
			src += `?${Math.random()}`;
		}

		return src;
	}
}
