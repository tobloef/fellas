import { AbstractRenderer } from '../abstract-renderer.js';
import { CanvasOffsetStrategy } from '../../state/options.js';
import { DirectCanvasSubRenderer } from './sub-renderers/direct-canvas-renderer.js';
import { BufferedCanvasSubRenderer } from './sub-renderers/buffered-canvas-renderer.js';
import { TiledCanvasSubRenderer } from './sub-renderers/tiled-canvas-renderer.js';

export class CanvasRenderer extends AbstractRenderer {
	subRenderer = null;
	containerElement = null;
	state = null;
	animationFrame = null;

	constructor(state, containerElement) {
		super();

		this.state = state;
		this.containerElement = containerElement;

		this.setupStateObservers();
		this.setup();
		this.loop();
	}

	setupStateObservers() {
		this.state.observe('screenSize', this.updateDisplaySize.bind(this));
		this.state.observe('camera.offset', this.updateCamera.bind(this));
		this.state.observe([
			'options.count',
			'options.spriteSet',
			'options.isAnimatedByDefault',
			'options.canvas.offsetStrategy',
		], this.setup.bind(this));
	}

	setup() {
		this.subRenderer?.destroy();

		switch (this.state.options.canvas.offsetStrategy) {
			case CanvasOffsetStrategy.DIRECT_CANVAS:
				this.subRenderer = new DirectCanvasSubRenderer(this.state, this.containerElement);
				break;
			case CanvasOffsetStrategy.CSS_TRANSFORM:
				this.subRenderer = new TiledCanvasSubRenderer(this.state, this.containerElement);
				break;
			case CanvasOffsetStrategy.BUFFER_CANVAS:
				this.subRenderer = new BufferedCanvasSubRenderer(this.state, this.containerElement);
				break;
			default:
				throw new Error(`Unknown canvas offset strategy: ${this.state.options.canvas.offsetStrategy}`);
		}

		this.subRenderer.setup();
		this.updateDisplaySize();
		this.updateCamera();
	}

	updateDisplaySize() {
		this.subRenderer.updateDisplaySize();
	}

	updateCamera() {
		this.subRenderer.updateCamera();
	}

	loop() {
		this.subRenderer.loop();
		this.animationFrame = requestAnimationFrame(this.loop.bind(this));
	}

	destroy() {
		this.subRenderer.destroy();
		cancelAnimationFrame(this.animationFrame);
		this.containerElement.replaceChildren();
	}

	/*	#updateOffset() {
		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.CSS_TRANSFORM) {
			const { offset, scale } = this.#state.camera;
			const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
			this.#canvasesElement.style.transform = transform;
		}

		if (this.#state.options.canvas.offsetStrategy === CanvasOffsetStrategy.DIRECT_CANVAS) {
			this.#needsGlobalRedraw = true;
		}
	}*/

	/*#updateScreenSize() {
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
	}*/

	/*#draw() {
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
	}*/

	/*#loop() {
		this.#swapFellaVariations();
		this.#swapFellaAnimations();

		this.#draw();

		this.#animationFrame = requestAnimationFrame(this.#loop.bind(this));
	}*/
}
