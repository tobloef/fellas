import { AbstractRenderer } from '../abstract-renderer.js';
import { CanvasOffsetStrategy } from '../../state/options.js';
import { DirectCanvasSubRenderer } from './sub-renderers/direct-canvas-renderer.js';
import { BufferedCanvasSubRenderer } from './sub-renderers/buffered-canvas-renderer.js';
import { TiledCanvasSubRenderer } from './sub-renderers/tiled-canvas-renderer.js';
import {SpriteSets} from "../../state/sprite-sets.js";
import {randomChoice} from "../../utils/random.js";

export class CanvasRenderer extends AbstractRenderer {
	subRenderer = null;
	containerElement = null;
	state = null;
	animationFrame = null;
	manualRedraw = false;

	constructor(state, containerElement) {
		super();

		this.state = state;
		this.containerElement = containerElement;

		this.setupEventListeners();
		this.setup();
		this.loop();
	}

	setupEventListeners() {
		this.state.observe('screenSize', this.updateDisplaySize.bind(this));
		this.state.observe('camera.offset', this.updateCamera.bind(this));
		this.state.observe([
			'options.count',
			'options.spriteSet',
			'options.isAnimatedByDefault',
			'options.canvas.offsetStrategy',
		], this.setup.bind(this));

		document.addEventListener('keydown', (event) => {
			if (event.key === 'r') { this.subRenderer.draw(); }
			if (event.key === 'R') { this.manualRedraw = !this.manualRedraw; }
		});
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

		this.setupImages();
		this.subRenderer.setupCanvases();
		this.setupFellas();
		this.updateDisplaySize();
		this.updateCamera();

		this.subRenderer.needsGlobalRedraw = true;
	}

	setupImages() {
		this.subRenderer.images = {};

		const spriteSet = SpriteSets[this.state.options.spriteSet];

		for (const variation of spriteSet.variations) {
			const src = spriteSet.assets.still[variation];

			const image = new Image();
			image.src = src;
			image.onload = async () => {
				this.subRenderer.images[variation] = await createImageBitmap(image);
				this.subRenderer.needsGlobalRedraw = true;
			};
		}
	}

	setupFellas() {
		this.subRenderer.fellas = [];

		const { spriteSet, count, isAnimatedByDefault } = this.state.options;

		for (let i = 0; i < count; i++) {
			const fella = {
				isAnimated: isAnimatedByDefault,
				variation: randomChoice(SpriteSets[spriteSet].variations),
				needsRedraw: true,
			};

			this.subRenderer.fellas.push(fella);
		}
	}

	updateDisplaySize() {
		this.subRenderer.updateDisplaySize();
	}

	updateCamera() {
		this.subRenderer.updateCamera();
	}

	loop() {
		this.swapFellaVariations();
		this.swapFellaAnimations();

		if (!this.manualRedraw) {
			this.subRenderer.draw();
		}

		this.animationFrame = requestAnimationFrame(this.loop.bind(this));
	}

	swapFellaVariations() {
		const { spriteSet, variationChangesPerFrame } = this.state.options;

		for (let i = 0; i < variationChangesPerFrame; i++) {
			const fella = randomChoice(this.subRenderer.fellas);
			fella.variation = randomChoice(SpriteSets[spriteSet].variations);
			fella.needsRedraw = true;
		}
	}

	swapFellaAnimations() {
		const { animationChangesPerFrame } = this.state.options;

		for (let i = 0; i < animationChangesPerFrame; i++) {
			const fella = randomChoice(this.subRenderer.fellas);
			fella.isAnimated = !fella.isAnimated;
			fella.needsRedraw = true;
		}
	}

	destroy() {
		this.subRenderer.destroy();
		cancelAnimationFrame(this.animationFrame);
		this.containerElement.replaceChildren();
	}
}
