import { AbstractRenderer } from '../abstract-renderer.js';
import { draw } from './drawer.js';
import { SpriteSets } from '../../state/sprite-sets.js';
import { randomChoice } from '../../utils/random.js';
import { getRowsAndColumns } from '../../utils/get-rows-and-columns.js';

export class CanvasRenderer extends AbstractRenderer {
	#state = null;
	#fellas = [];
	#ctx = null;
	#worker = null;
	#spriteSet = null;
	#images = {};
	#containerElement = null;
	#canvasesElement = null;
	#animationFrame = null;

	async initialize(state, containerElement) {
		this.#state = state;
		this.#containerElement = containerElement;

		this.#setupStateObservers();

		this.#setupCanvas();
		await this.#updateSpriteSet();

		if (this.#state.options.canvas.useWorker) {
			this.#setupWorkers();
		}

		this.#loop();
	}

	destroy() {
		cancelAnimationFrame(this.#animationFrame);
		this.#ctx.canvas.remove();
		this.#ctx = null;
	}

	#setupStateObservers() {
		this.#state.observe('screenSize', this.#updateScreenSize.bind(this));
		this.#state.observe('options.spriteSet', this.#updateSpriteSet.bind(this));
		this.#state.observe('options.isAnimatedByDefault', this.#setupFellas.bind(this));
		this.#state.observe('options.count', this.#setupFellas.bind(this));
		this.#state.observe('camera.offset', this.#updateOffset.bind(this));
		this.#state.observe('options.canvas.useCssTransform', this.#setupCanvas.bind(this));
	}

	#setupCanvas() {
		this.#containerElement.replaceChildren();

		const canvas = document.createElement('canvas');
		canvas.style.imageRendering = 'pixelated';

		this.#ctx = canvas.getContext('2d', { alpha: false, antialias: false });
		this.#ctx.imageSmoothingEnabled = false;

		if (this.#state.options.canvas.useCssTransform) {
			this.#canvasesElement = document.createElement('div');
			this.#canvasesElement.className = 'transform-wrapper';
			this.#containerElement.appendChild(this.#canvasesElement);
			this.#canvasesElement.appendChild(canvas);
		} else {
			this.#containerElement.appendChild(canvas);
		}

		this.#updateScreenSize();
		this.#updateOffset();
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
		if (!this.#state.options.canvas.useCssTransform) {
			return;
		}
		const { offset, scale } = this.#state.camera;
		const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
		this.#canvasesElement.style.transform = transform;
	}

	#updateScreenSize() {
		let width;
		let height;

		if (this.#state.options.canvas.useCssTransform) {
			const { columns, rowsWithOverflow } = getRowsAndColumns(this.#state.options.count);
			width = columns * this.#spriteSet.width;
			height = rowsWithOverflow * this.#spriteSet.height;
			this.#ctx.canvas.style.width = `${width}px`;
			this.#ctx.canvas.style.height = `${height}px`;
		} else {
			width = this.#state.screenSize.width;
			height = this.#state.screenSize.height;
			this.#ctx.canvas.style.width = `100%`;
			this.#ctx.canvas.style.height = `100%`;
		}

		this.#ctx.canvas.width = width;
		this.#ctx.canvas.height = height;

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

		this.#animationFrame = requestAnimationFrame(this.#loop.bind(this));
	}

	async #getBitmap(src) {
		const image = new Image();
		image.src = src;
		await image.decode();
		return createImageBitmap(image);
	}
}
