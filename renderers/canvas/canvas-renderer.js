import { AbstractRenderer } from '../abstract-renderer.js';
import { draw } from './drawer.js';
import { SpriteSets } from '../../state/sprite-sets.js';
import { randomChoice } from '../../utils/random.js';
import { countToRowsAndColumns } from '../../utils/count-to-rows-and-columns.js';
import {CanvasOffsetStrategy} from "../../state/options.js";

export class CanvasRenderer extends AbstractRenderer {
	#state = null;
	#fellas = [];
	#worker = null;
	#spriteSet = null;
	#images = {};
	#containerElement = null;
	#canvasesElement = null;
	#animationFrame = null;
	#needsGlobalRedraw = true;

	#displayContexts = [];
	#bufferContexts = [];

	async initialize(state, containerElement) {
		this.#state = state;
		this.#containerElement = containerElement;

		this.#setupStateObservers();

		this.#reinitialize();

		if (this.#state.options.canvas.useWorker) {
			this.#setupWorkers();
		}

		this.#loop();
	}

	destroy() {
		cancelAnimationFrame(this.#animationFrame);
		this.#bufferContexts.forEach((ctx) => ctx.canvas.remove());
		this.#displayContexts.forEach((ctx) => ctx.canvas.remove());
		this.#bufferContexts = [];
		this.#displayContexts = [];
	}

	#setupStateObservers() {
		this.#state.observe('screenSize', this.#updateScreenSize.bind(this));
		this.#state.observe('camera.offset', this.#updateOffset.bind(this));
		this.#state.observe('options', this.#reinitialize.bind(this));
	}

	async #reinitialize() {
		this.#setupCanvas();
		await this.#updateSpriteSet();
		this.#updateScreenSize();
		this.#updateOffset();
		await this.#setupImages();
		this.#setupFellas();
	}

	#setupCanvas() {
		this.#containerElement.replaceChildren();


		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.DIRECT_CANVAS) {
			const canvas = document.createElement('canvas');
			canvas.style.imageRendering = 'pixelated';
			const context = canvas.getContext('2d', { alpha: false, antialias: false });
			context.imageSmoothingEnabled = false;
			this.#displayContexts.push(context);
		}

		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.CSS_TRANSFORM) {
			const
		}

		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.BUFFER_CANVAS) {
			
		}
		
		const canvas = document.createElement('canvas');
		canvas.style.imageRendering = 'pixelated';

		this.#ctx = canvas.getContext('2d', { alpha: false, antialias: false });
		this.#ctx.imageSmoothingEnabled = false;

		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.CSS_TRANSFORM) {
			this.#canvasesElement = document.createElement('div');
			this.#canvasesElement.className = 'transform-wrapper';
			this.#containerElement.appendChild(this.#canvasesElement);
			this.#canvasesElement.appendChild(canvas);
		} else {
			this.#containerElement.appendChild(canvas);
		}

		this.#needsGlobalRedraw = true;

		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.BUFFER_CANVAS) {
			this.#bufferCanvas = new OffscreenCanvas(0, 0);
			this.#bufferCtx = this.#bufferCanvas.getContext('2d', { alpha: false, antialias: false });
			this.#bufferCtx.imageSmoothingEnabled = false;
		}
	}

	async #updateSpriteSet() {
		const spriteSet = SpriteSets[this.#state.options.spriteSet];

		if (spriteSet === undefined) {
			throw new Error(`Unknown sprite set "${this.#state.options.spriteSet}".`);
		}

		this.#spriteSet = spriteSet;
	}

	async #setupImages() {
		if (this.#state.options.canvas.useWorker) {
			// TODO
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

	#updateOffset() {
		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.CSS_TRANSFORM) {
			const { offset, scale } = this.#state.camera;
			const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
			this.#canvasesElement.style.transform = transform;
		}

		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.DIRECT_CANVAS) {
			this.#needsGlobalRedraw = true;
		}
	}

	#updateScreenSize() {
		const { columns, rowsWithOverflow } = countToRowsAndColumns(this.#state.options.count);
		const gridWidth = columns * this.#spriteSet.width;
		const gridHeight = rowsWithOverflow * this.#spriteSet.height;

		const screenWidth = this.#state.screenSize.width;
		const screenHeight = this.#state.screenSize.height;

		const useCssTransform = this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.CSS_TRANSFORM;

		if (useCssTransform) {
			this.#ctx.canvas.style.width = `${gridWidth}px`;
			this.#ctx.canvas.style.height = `${gridHeight}px`;
		} else {
			this.#ctx.canvas.style.width = `100%`;
			this.#ctx.canvas.style.height = `100%`;
		}

		this.#ctx.canvas.width = useCssTransform ? gridWidth : screenWidth;
		this.#ctx.canvas.height = useCssTransform ? gridHeight : screenHeight;
		this.#ctx.imageSmoothingEnabled = false;

		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.BUFFER_CANVAS) {
			this.#bufferCanvas.width = gridWidth;
			this.#bufferCanvas.height = gridHeight;
			this.#bufferCtx.imageSmoothingEnabled = false;
		}
	}

	#createFella() {
		const options = this.#state.options;

		const fella = {
			isAnimated: options.isAnimatedByDefault,
			variation: randomChoice(this.#spriteSet.variations),
			needsRedraw: true,
		};

		if (!options.canvas.useWorker) {
			fella.image = this.#images[fella.variation];
		}

		return fella;
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

	#draw() {
		if (this.#state.options.canvas.useWorker) {
			this.#updateWorkers();
		}

		if (!this.#state.options.canvas.useWorker) {
			if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.BUFFER_CANVAS) {
				draw(this.#bufferCtx, this.#state, this.#fellas, this.#needsGlobalRedraw);
				const offset = this.#state.camera.offset;
				const scale = this.#state.camera.scale;
				const x = offset.x * scale;
				const y = offset.y * scale;
				const w = this.#bufferCtx.canvas.width * scale;
				const h = this.#bufferCtx.canvas.height * scale;
				this.#ctx.clearRect(0, 0, this.#ctx.canvas.width, this.#ctx.canvas.height);
				this.#ctx.drawImage(this.#bufferCanvas, x, y, w, h);
			} else {
				draw(this.#ctx, this.#state, this.#fellas, this.#needsGlobalRedraw);
			}
			this.#needsGlobalRedraw = false;
		}
	}

	#loop() {
		this.#swapFellaVariations();
		this.#swapFellaAnimations();

		this.#draw();

		this.#animationFrame = requestAnimationFrame(this.#loop.bind(this));
	}

	async #getBitmap(src) {
		const image = new Image();
		image.src = src;
		await image.decode();
		return createImageBitmap(image);
	}
}
