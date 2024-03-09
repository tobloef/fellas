import { AbstractCanvasSubRenderer } from '../abstract-canvas-sub-renderer.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { randomChoice } from '../../../utils/random.js';
import { countToRowsAndColumns } from '../../../utils/count-to-rows-and-columns.js';

export class DirectCanvasSubRenderer extends AbstractCanvasSubRenderer{
	containerElement = null;
	state = null;
	ctx = null;
	needsRedraw = false;
	images = {};

	constructor(state, containerElement) {
		super();
		this.state = state;
		this.containerElement = containerElement;
	}

	setup() {
		this.setupCanvas();
		this.setupImages();
		this.setupFellas();
		console.debug('needsRedraw = true')
		this.needsRedraw = true;
	}

	setupCanvas() {
		this.containerElement?.replaceChildren();
		this.ctx = null;

		const canvas = document.createElement('canvas');
		canvas.width = 0;
		canvas.height = 0;
		canvas.style.imageRendering = 'pixelated';
		this.containerElement.appendChild(canvas);

		const context = canvas.getContext('2d', { alpha: false, antialias: false });
		context.imageSmoothingEnabled = false;
		this.ctx = context;
	}

	setupImages() {
		this.images = {};

		const spriteSet = SpriteSets[this.state.options.spriteSet];

		for (const variation of spriteSet.variations) {
			const stillLSrcFunc = spriteSet.assets.still;
			const src = stillLSrcFunc(variation);

			const image = new Image();
			image.src = src;
			image.onload = async () => {
				this.images[variation] = await createImageBitmap(image);
			}
		}
	}

	setupFellas() {
		this.fellas = [];

		const options = this.state.options;
		const spriteSet = SpriteSets[options.spriteSet];

		for (let i = 0; i < options.count; i++) {
			const fella = {
				isAnimated: options.isAnimatedByDefault,
				variation: randomChoice(spriteSet.variations),
			};

			this.fellas.push(fella);
		}
	}

	updateDisplaySize() {
		const screenSize = this.state.screenSize;

		this.ctx.canvas.style.width = `100%`;
		this.ctx.canvas.style.height = `100%`;
		this.ctx.canvas.width = screenSize.width;
		this.ctx.canvas.height = screenSize.height;
		this.ctx.imageSmoothingEnabled = false;
	}

	updateCamera() {
		this.needsRedraw = true;
	}

	loop() {
		this.swapFellaVariations();
		this.swapFellaAnimations();

		this.draw();
	}

	draw() {
		const { options, camera } = this.state;
		const spriteSet = SpriteSets[options.spriteSet];
		const { columns } = countToRowsAndColumns(options.count);

		if (!options.canvas.onlyDrawChanges || this.needsRedraw) {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		}

		let width = spriteSet.width * camera.scale;
		let height = spriteSet.height * camera.scale;

		let skipped = false;

		for (let i = 0; i < this.fellas.length; i++) {
			skipped = true;

			const fella = this.fellas[i];

			if (options.canvas.onlyDrawChanges && !fella.needsRedraw && !this.needsRedraw) {
				continue;
			}

			const image = this.images[fella.variation];

			if (image == null) {
				continue;
			}

			let x = (i % columns);
			let y = Math.floor(i / columns);

			x *= width;
			y *= height;

			x += camera.offset.x * camera.scale;
			y += camera.offset.y * camera.scale;

			if (options.canvas.onlyDrawChanges) {
				this.ctx.clearRect(x, y, width, height);
			}

			this.ctx.drawImage(
				image,
				x,
				y,
				width,
				height,
			);

			fella.needsRedraw = false;

			skipped = false;
		}

		if (!skipped) {
			this.needsRedraw = false;
		}
	}

	destroy() {

	}

	swapFellaVariations() {
		const options = this.state.options;

		const spriteSet = SpriteSets[options.spriteSet];

		for (let i = 0; i < options.variationChangesPerFrame; i++) {
			const fella = randomChoice(this.fellas);
			fella.variation = randomChoice(spriteSet.variations);
			fella.needsRedraw = true;
		}
	}

	swapFellaAnimations() {
		const options = this.state.options;

		for (let i = 0; i < options.animationChangesPerFrame; i++) {
			const fella = randomChoice(this.fellas);
			fella.isAnimated = !fella.isAnimated;
			fella.needsRedraw = true;
		}
	}
}
