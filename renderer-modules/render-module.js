import {randomChoice} from "../utils/random.js";

export class RenderModule {
	containerElement = null;
	count = 0;
	dimensions = { x: 0, y: 0 };
	spriteSet = null;
	camera = null;
	isAnimatedByDefault = false;
	animationChangesPerFrame = 0;
	variationChangesPerFrame = 0;
	fellas = [];

	initialize(options) {
		this.containerElement = options.containerElement;
		this.count = options.count;
		this.dimensions = options.dimensions;
		this.spriteSet = options.spriteSet;
		this.camera = options.camera;
		this.isAnimatedByDefault = options.isAnimatedByDefault;
		this.animationChangesPerFrame = options.animationChangesPerFrame;
		this.variationChangesPerFrame = options.variationChangesPerFrame;

		this.onCountUpdated();
		this.onDimensionsUpdated();
		this.onSpriteSetUpdated();
		this.onCameraUpdated();
	}

	onCountUpdated() {
		if (this.fellas.length > this.count) {
			const fellasToRemove = this.fellas.length - this.count;
			const removedFellas = this.fellas.splice(0, fellasToRemove);
			removedFellas.forEach(this.destroyFella);
		}

		if (this.fellas.length < this.count) {
			const fellasToAdd = this.count - this.fellas.length;
			for (let i = 0; i < fellasToAdd; i++) {
				const fella = this.createFella();
				this.fellas.push(fella);
			}
		}
	}

	onDimensionsUpdated() {}

	onSpriteSetUpdated() {
		for (let i = 0; i < this.fellas.length; i++) {
			this.destroyFella(this.fellas[i]);
			this.fellas[i] = this.createFella();
		}
	}

	onCameraUpdated() {}

	destroyFella(fella) {}

	createFella() {
		const fella = {
			isAnimated: this.isAnimatedByDefault,
			variation: randomChoice(this.spriteSet.variations),
		}

		return fella;
	}

	destroy() {
		this.fellas.forEach(this.destroyFella);
		this.fellas = [];
		this.containerElement = null;
		this.camera = null;
		this.spriteSet = null;
	}
}
