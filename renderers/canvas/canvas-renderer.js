import { AbstractRenderer } from '../abstract-renderer.js';
import { draw } from './drawer.js';
import { SpriteSets } from '../../state/sprite-sets.js';
import { randomChoice } from '../../utils/random.js';

export class CanvasRenderer extends AbstractRenderer {
	#state = null;
	#fellas = [];
	#ctx = null;
	#worker = null;
	#spriteSet = null;
	#images = {};

	async initialize(state, containerElement) {
		this.#state = state;

		const canvas = document.createElement('canvas');
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.imageRendering = 'pixelated';
		containerElement.appendChild(canvas);

		this.#ctx = canvas.getContext('2d', { alpha: false, antialias: false });
		this.#ctx.imageSmoothingEnabled = false;

		await this.#updateSpriteSet();

		this.#setupStateObservers();
		if (this.#state.options.canvas.useWorker) {
			this.#setupWorkers();
		}
		this.#updateScreenSize();

		this.#loop();
	}

	destroy() {
		this.#ctx.canvas.remove();
		this.#ctx = null;
	}

	#setupStateObservers() {
		this.#state.observe('world.screenSize', this.#updateScreenSize.bind(this));
		this.#state.observe('options.spriteSet', this.#updateSpriteSet.bind(this));
		this.#state.observe('options.isAnimatedByDefault', this.#setupFellas.bind(this));
		this.#state.observe('options.count', this.#setupFellas.bind(this));
		this.#state.observe('camera.offset', this.#updateOffset.bind(this));
	}

	async #updateSpriteSet() {
		const spriteSet = SpriteSets[this.#state.options.spriteSet];

		if (spriteSet === undefined) {
			throw new Error(`Unknown sprite set "${this.#state.options.spriteSet}".`);
		}

		this.#spriteSet = spriteSet;
		await this.#setupImages();
		this.#setupFellas();
	}

	async #setupImages() {
		if (this.#state.options.canvas.useWorker) {

		} else {
			for (const variation of this.#spriteSet.variations) {
				const stillLSrcFunc = this.#spriteSet.assets.still;

				const src = stillLSrcFunc(variation);

				this.#images[variation] = await this.#getBitmap(src);
			}
		}
	}

	#setupFellas() {
		this.#fellas = [];

		const count = this.#state.options.count;

		for (let i = 0; i < count; i++) {
			const fella = this.#createFella();
			this.#fellas.push(fella);
		}
	}

	#createFella() {
		const options = this.#state.options;

		const fella = {
			isAnimated: options.isAnimatedByDefault,
			variation: randomChoice(this.#spriteSet.variations),
		};

		if (!options.canvas.useWorker) {
			fella.image = this.#images[fella.variation];
		}

		return fella;
	}

	#updateOffset() {

	}

	#updateScreenSize() {
		this.#ctx.canvas.width = this.#state.screenSize.width;
		this.#ctx.canvas.height = this.#state.screenSize.height;
		this.#ctx.imageSmoothingEnabled = false;
	}

	#setupWorkers() {
		this.#worker = new Worker('renderers/canvas/worker.js', { type: 'module' });
		// TODO
	}

	#swapFellaVariations() {
		// TODO
	}

	#swapFellaAnimations() {
		// TODO
	}

	#updateWorkers() {
		// TODO
	}

	#loop() {
		this.#swapFellaVariations();
		this.#swapFellaAnimations();

		if (this.#state.options.canvas.useWorker) {
			this.#updateWorkers();
		}

		if (!this.#state.options.canvas.useWorker) {
			draw(this.#ctx, this.#state, this.#fellas);
		}

		requestAnimationFrame(this.#loop.bind(this));
	}

	async #getBitmap(src) {
		const image = new Image();
		image.src = src;
		await image.decode();
		return createImageBitmap(image);
	}
}
