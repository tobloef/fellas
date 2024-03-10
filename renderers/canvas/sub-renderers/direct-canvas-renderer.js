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
		this.setupImages();
		this.setupCanvas();
		this.setupFellas();
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

	setupFellas() {
		this.fellas = [];

		const { spriteSet, count, isAnimatedByDefault } = this.state.options;

		for (let i = 0; i < count; i++) {
			const fella = {
				isAnimated: isAnimatedByDefault,
				variation: randomChoice(SpriteSets[spriteSet].variations),
				needsRedraw: true,
			};

			this.fellas.push(fella);
		}
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
				this.needsRedraw = true;
			}
		}
	}

	updateDisplaySize() {
		const screenSize = this.state.screenSize;

		this.ctx.canvas.style.width = `100%`;
		this.ctx.canvas.style.height = `100%`;
		this.ctx.canvas.width = screenSize.width;
		this.ctx.canvas.height = screenSize.height;
		this.ctx.imageSmoothingEnabled = false;

		this.needsRedraw = true;
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

		if (this.images == null) {
			return;
		}

		if (!options.canvas.onlyDrawChanges || this.needsRedraw) {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		}

		let width = spriteSet.width * camera.scale;
		let height = spriteSet.height * camera.scale;

		const count = options.count;
		const onlyDrawChanges = options.canvas.onlyDrawChanges;

		for (let i = 0; i < this.fellas.length; i++) {
			const fella = this.fellas[i];

			if (onlyDrawChanges && !fella.needsRedraw && !this.needsRedraw) {
				continue;
			}

			const image = this.images[fella.variation];

			if (image == null) {
				continue;
			}

			const { columns } = countToRowsAndColumns(count);

			let x = (i % columns);
			let y = Math.floor(i / columns);

			x *= width;
			y *= height;

			x += camera.offset.x * camera.scale;
			y += camera.offset.y * camera.scale;

			if (onlyDrawChanges) {
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
		}

		this.needsRedraw = false;
	}

	destroy() {

	}

	swapFellaVariations() {
		const { spriteSet, variationChangesPerFrame } = this.state.options;

		for (let i = 0; i < variationChangesPerFrame; i++) {
			const fella = randomChoice(this.fellas);
			fella.variation = randomChoice(SpriteSets[spriteSet].variations);
			fella.needsRedraw = true;
		}
	}

	swapFellaAnimations() {
		const { animationChangesPerFrame } = this.state.options;

		for (let i = 0; i < animationChangesPerFrame; i++) {
			const fella = randomChoice(this.fellas);
			fella.isAnimated = !fella.isAnimated;
			fella.needsRedraw = true;
		}
	}
}
