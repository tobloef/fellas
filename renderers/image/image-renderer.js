import { AbstractRenderer } from '../abstract-renderer.js';
import { randomChoice } from '../../utils/random.js';
import { SpriteSets } from '../../state/sprite-sets.js';
import {
	ImgElementType,
	ImgOffsetStrategy,
} from '../../state/options.js';
import { countToRowsAndColumns } from '../../utils/count-to-rows-and-columns.js';

export class ImageRenderer extends AbstractRenderer {
	containerElement = null;
	state = null;
	fellas = [];
	animationFrame = null;
	fellasElement = null;

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
			'options.img.offsetStrategy',
			'options.img.useUniqueImages',
			'options.img.elementType',
		], this.setup.bind(this));
	}

	setup() {
		this.containerElement.replaceChildren();

		const options = this.state.options;
		const spriteSet = SpriteSets[options.spriteSet];

		this.fellasElement = document.createElement('div');
		this.containerElement.appendChild(this.fellasElement);

		this.updateDisplaySize();
		this.updateCamera();

		this.fellas.forEach((fella) => fella.element.remove());
		this.fellas = [];

		for (let i = 0; i < options.count; i++) {
			const fella = {
				isAnimated: options.isAnimatedByDefault,
				variation: randomChoice(spriteSet.variations),
			};

			switch (options.img.elementType) {
				case ImgElementType.IMG:
					fella.element = document.createElement('img');
					fella.element.draggable = false;
					break;
				case ImgElementType.DIV:
					fella.element = document.createElement('div');
					fella.element.className = 'image-div';
					fella.element.style.width = `${spriteSet.width}px`;
					fella.element.style.height = `${spriteSet.height}px`;
					break;
				default:
					throw new Error(`Unknown element type "${options.img.elementType}".`);
			}

			this.updateFellaSrc(fella, spriteSet);

			this.fellasElement.appendChild(fella.element);
			this.fellas.push(fella);
		}
	}

	updateFellaSrc(fella, spriteSet) {
		const options = this.state.options;

		const srcFunc = fella.isAnimated
			? spriteSet.assets.animated
			: spriteSet.assets.still;

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

	updateDisplaySize() {
		const options = this.state.options;
		const spriteSet = SpriteSets[options.spriteSet];
		const { rowsWithOverflow, columns } = countToRowsAndColumns(options.count);
		this.fellasElement.className = 'transform-wrapper';
		this.fellasElement.style.width = `${columns * spriteSet.width}px`;
		this.fellasElement.style.height = `${rowsWithOverflow * spriteSet.height}px`;
	}

	updateCamera() {
		const options = this.state.options;
		const { offset, scale } = this.state.camera;

		switch (options.img.offsetStrategy) {
			case ImgOffsetStrategy.POSITION:
				this.fellasElement.style.left = `${offset.x * scale}px`;
				this.fellasElement.style.top = `${offset.y * scale}px`;
				this.fellasElement.style.transform = `scale(${scale})`;
				break;
			case ImgOffsetStrategy.TRANSLATE:
				const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
				this.fellasElement.style.transform = transform;
				this.fellasElement.style.left = '0';
				this.fellasElement.style.top = '0';
				break;
			default:
				throw new Error(`Unknown offset strategy "${options.img.offsetStrategy}".`);
		}
	}

	loop() {
		this.swapFellaVariations();
		this.swapFellaAnimations();
		this.animationFrame = requestAnimationFrame(this.loop.bind(this));
	}

	destroy() {
		cancelAnimationFrame(this.animationFrame);
		this.containerElement.replaceChildren()
	}

	swapFellaVariations() {
		const options = this.state.options;

		const spriteSet = SpriteSets[options.spriteSet];

		for (let i = 0; i < options.variationChangesPerFrame; i++) {
			const fella = randomChoice(this.fellas);
			fella.variation = randomChoice(spriteSet.variations);
			this.updateFellaSrc(fella, spriteSet);
		}
	}

	swapFellaAnimations() {
		const options = this.state.options;

		const spriteSet = SpriteSets[options.spriteSet];

		for (let i = 0; i < options.animationChangesPerFrame; i++) {
			const fella = randomChoice(this.fellas);
			fella.isAnimated = !fella.isAnimated;
			this.updateFellaSrc(fella, spriteSet);
		}
	}
}
