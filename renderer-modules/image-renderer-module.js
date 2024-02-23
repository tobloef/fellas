import { RendererModule } from './renderer-module.js';
import { randomAssetUrl } from '../utils/random-asset-url.js';
import {
	ImgOffsetStrategy,
	options,
} from '../utils/options.js';
import { getRowsAndColumns } from '../utils/get-rows-and-columns.js';
import { camera } from '../utils/camera.js';
import { sprites } from '../utils/sprites.js';

export class ImageRendererModule extends RendererModule {
	#fellas = [];
	#imagesElement = null;
	#containerElement = null;

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
	}

	#createFella() {
		const image = document.createElement('img');

		image.src = randomAssetUrl(
			sprites[options.sprites].assets.still,
			sprites[options.sprites].variations,
			options.img.uniqueImages
		);
		image.draggable = false;
		this.#imagesElement.appendChild(image);

		return { image };
	}

	destroy() {
	}

	updateSize() {
	}

	updateSprites() {
		this.updateCount();
	}
}
