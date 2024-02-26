import { AbstractRenderer } from './abstract-renderer.js';
import { randomChoice } from '../utils/random.js';
import { SpriteSets } from '../state/sprite-sets.js';
import {
	ImgElementType,
	ImgOffsetStrategy,
} from '../state/options.js';
import { getRowsAndColumns } from '../utils/get-rows-and-columns.js';

export class ImageRenderer extends AbstractRenderer {
	#state = null;
	#fellas = [];
	#fellasElement = null;
	#spriteSet = null;

	constructor(state, containerElement) {
		super();

		this.#state = state;

		this.#fellasElement = this.#createFellasElement();
		containerElement.appendChild(this.#fellasElement);

		this.#setupStateObservers();
		this.#updateSpriteSet();
		this.#updateTransform();
		this.#loop();
	}

	static create(state, containerElement) {
		return new ImageRenderer(state, containerElement);
	}

	destroy() {
		this.#fellasElement.remove();
		this.#fellasElement = null;
	}

	#createFellasElement() {
		const fellasElement = document.createElement('div');

		fellasElement.style.overflow = 'hidden';
		fellasElement.style.position = 'absolute';
		fellasElement.style.width = '100%';
		fellasElement.style.height = '100%';
		fellasElement.style.transformOrigin = 'top left';
		fellasElement.style.imageRendering = 'pixelated';
		fellasElement.style.userSelect = 'none';
		fellasElement.style.fontSize = '0';

		return fellasElement;
	}

	#setupStateObservers() {
		this.#state.observe('options.spriteSet', this.#updateSpriteSet.bind(this));
		this.#state.observe('options.isAnimatedByDefault', this.#setupFellas.bind(this));
		this.#state.observe('options.count', this.#updateCount.bind(this));
		this.#state.observe('camera.offset', this.#updateTransform.bind(this));
		this.#state.observe('options.img.useUniqueImages', this.#setupFellas.bind(this));
		this.#state.observe('options.img.elementType', this.#setupFellas.bind(this));
	}

	#updateSpriteSet() {
		const spriteSet = SpriteSets[this.#state.options.spriteSet];
		if (spriteSet === undefined) {
			throw new Error(`Unknown sprite set "${this.#state.options.spriteSet}".`);
		}

		this.#spriteSet = spriteSet;
		this.#updateCount();
	}

	#updateCount() {
		const { rowsWithOverflow, columns } = getRowsAndColumns(this.#state.options.count);
		this.#fellasElement.style.width = `${columns * this.#spriteSet.width}px`;
		this.#fellasElement.style.height = `${rowsWithOverflow * this.#spriteSet.height}px`;
		this.#setupFellas();
	}

	#setupFellas() {
		this.#fellas.forEach(this.#destroyFella.bind(this));
		this.#fellas = [];

		const count = this.#state.options.count;

		for (let i = 0; i < count; i++) {
			const fella = this.#createFella();
			this.#fellasElement.appendChild(fella.element);
			this.#fellas.push(fella);
		}
	}

	#createFella() {
		const options = this.#state.options;

		const fella = {
			isAnimated: options.isAnimatedByDefault,
			variation: randomChoice(this.#spriteSet.variations),
		};

		switch (options.img.elementType) {
			case ImgElementType.IMG:
				fella.element = document.createElement('img');
				fella.element.draggable = false;
				break;
			case ImgElementType.DIV:
				fella.element = document.createElement('div');
				fella.element.className = 'image-div';
				fella.element.style.width = `${this.#spriteSet.width}px`;
				fella.element.style.height = `${this.#spriteSet.height}px`;
				break;
			default:
				throw new Error(`Unknown element type "${options.img.elementType}".`);
		}

		this.#updateFellaSrc(fella);

		return fella;
	}

	#updateFellaSrc(fella) {
		const options = this.#state.options;

		const srcFunc = fella.isAnimated
			? this.#spriteSet.assets.animated
			: this.#spriteSet.assets.still;

		let src = srcFunc(fella.variation);

		if (options.img.useUniqueImages) {
			src += `?${Math.random()}`;
		}

		switch (options.img.elementType) {
			case ImgElementType.IMG:
				fella.element.src = src;
				break;
			case ImgElementType.DIV:
				fella.element.style.backgroundImage = `url(${src})`;
				break;
			default:
				throw new Error(`Unknown element type "${options.img.elementType}".`);
		}
	}

	#destroyFella(fella) {
		fella.element.remove();
	}

	#loop() {
		this.#swapFellaVariations();
		this.#swapFellaAnimations();
		requestAnimationFrame(this.#loop.bind(this));
	}

	#swapFellaVariations() {
		const options = this.#state.options;

		for (let i = 0; i < options.img.variationChangesPerFrame; i++) {
			const fella = randomChoice(this.#fellas);
			fella.variation = randomChoice(this.#spriteSet.variations);
			this.#updateFellaSrc(fella);
		}
	}

	#swapFellaAnimations() {
		const options = this.#state.options;

		for (let i = 0; i < options.img.animationChangesPerFrame; i++) {
			const fella = randomChoice(this.#fellas);
			fella.isAnimated = !fella.isAnimated;
			this.#updateFellaSrc(fella);
		}
	}

	#updateTransform() {
		const options = this.#state.options;
		const offset = this.#state.camera.offset;
		const scale = this.#state.camera.scale;

		switch (options.img.offsetStrategy) {
			case ImgOffsetStrategy.POSITION:
				this.#fellasElement.style.left = `${offset.x * scale}px`;
				this.#fellasElement.style.top = `${offset.y * scale}px`;
				this.#fellasElement.style.transform = `scale(${scale})`;
				break;
			case ImgOffsetStrategy.TRANSLATE:
				const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
				this.#fellasElement.style.transform = transform;
				this.#fellasElement.style.left = '0';
				this.#fellasElement.style.top = '0';
				break;
			default:
				throw new Error(`Unknown offset strategy "${options.img.offsetStrategy}".`);
		}
	}
}
