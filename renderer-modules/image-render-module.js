import { RenderModule } from './render-module.js';
import {
	ImgElementType,
	ImgOffsetStrategy,
} from '../utils/options.js';
import { getRowsAndColumns } from '../utils/get-rows-and-columns.js';
import { randomChoice } from '../utils/random.js';

export class ImageRenderModule extends RenderModule {
	offsetStrategy;
	useUniqueImages;
	elementType;

	fellasElement = null;
	animationFrame = null;

	initialize(options) {
		this.fellasElement = document.createElement('div');
		this.fellasElement.style.overflow = 'hidden';
		this.fellasElement.style.position = 'absolute';
		this.fellasElement.style.width = '100%';
		this.fellasElement.style.height = '100%';
		this.fellasElement.style.transformOrigin = 'top left';
		this.fellasElement.style.imageRendering = 'pixelated';
		this.fellasElement.style.userSelect = 'none';
		this.fellasElement.style.fontSize = '0'

		super.initialize(options);

		this.containerElement.appendChild(this.fellasElement);

		this.loop();
	}

	onCountUpdated() {
		super.onCountUpdated();

		let { rowsWithOverflow, columns } = getRowsAndColumns(this.count);
		this.fellasElement.style.width = `${columns * this.spriteSet.width}px`;
		this.fellasElement.style.height = `${rowsWithOverflow * this.spriteSet.height}px`;
	}

	onCameraUpdated() {
		super.onCameraUpdated();

		if (this.offsetStrategy === ImgOffsetStrategy.POSITION) {
			this.fellasElement.style.top = `${this.camera.offset.y * this.camera.scale}px`;
			this.fellasElement.style.left = `${this.camera.offset.x * this.camera.scale}px`;
			this.fellasElement.style.transform = `scale(${this.camera.scale})`;
		} else if (this.offsetStrategy === ImgOffsetStrategy.TRANSLATE) {
			this.fellasElement.style.top = '0';
			this.fellasElement.style.left = '0';
			this.fellasElement.style.transform = `scale(${this.camera.scale}) translate(${this.camera.offset.x}px, ${this.camera.offset.y}px)`;
		} else {
			throw new Error(`Unknown offset strategy: ${this.offsetStrategy}.`);
		}
	}

	destroy() {
		super.destroy();
		this.fellasElement.remove();
		this.fellasElement = null;
		cancelAnimationFrame(this.animationFrame);
	}

	destroyFella(fella) {
		super.destroyFella(fella);
		fella.element.remove();
	}

	createFella() {
		const fella = super.createFella();

		let element = null;

		if (this.elementType === ImgElementType.IMG) {
			element = document.createElement('img');
			element.draggable = false;
		} else if (this.elementType === ImgElementType.DIV) {
			element = document.createElement('div');
			element.className = "image-div";
			element.style.width = `${this.spriteSet.width}px`;
			element.style.height = `${this.spriteSet.height}px`;
		} else {
			throw new Error(`Unknown element type: ${this.elementType}.`);
		}

		fella.element = element;

		this.updateFellaSrc(fella);

		this.fellasElement.appendChild(element);

		return fella;
	}

	loop() {
		this.swapFellas();
		this.animateFellas();

		this.animationFrame = requestAnimationFrame(() => {
			this.loop();
		});
	}

	swapFellas() {
		for (let i = 0; i < this.variationChangesPerFrame; i++) {
			const newVariation = randomChoice(this.spriteSet.variations);
			const fella = randomChoice(this.fellas);
			fella.variation = newVariation;
			this.updateFellaSrc(fella);
		}
	}

	animateFellas() {
		for (let i = 0; i < this.animationChangesPerFrame; i++) {
			const fella = randomChoice(this.fellas);
			fella.isAnimated = !fella.isAnimated;
			this.updateFellaSrc(fella);
		}
	}

	getFellaSrc(fella) {
		const srcFunc = fella.isAnimated
			? this.spriteSet.assets.animated
			: this.spriteSet.assets.still;

		let src = srcFunc(fella.variation);

		if (this.useUniqueImages) {
			src += `?${Math.random()}`;
		}

		return src;
	}

	updateFellaSrc(fella) {
		const src = this.getFellaSrc(fella);

		if (this.elementType === ImgElementType.IMG) {
			fella.element.src = src;
		} else if (this.elementType === ImgElementType.DIV) {
			fella.element.style.backgroundImage = `url(${src})`;
		} else {
			throw new Error(`Unknown element type: ${this.elementType}.`);
		}
	}
}
