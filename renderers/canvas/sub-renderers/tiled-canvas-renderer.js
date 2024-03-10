import { countToRowsAndColumns } from '../../../utils/count-to-rows-and-columns.js';
import { MAX_CANVAS_SIZE } from '../../../utils/max-canvas-size.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { AbstractCanvasSubRenderer } from '../abstract-canvas-sub-renderer.js';
import { randomChoice } from '../../../utils/random.js';

export class TiledCanvasSubRenderer extends AbstractCanvasSubRenderer {
	containerElement = null;
	state = null;
	canvasesElement = null;
	displayContexts = [];
	images = {};
	spriteColumnCount = 0;
	spriteRowCount = 0;
	canvasWidth = 0;
	canvasHeight = 0;

	constructor(state, containerElement) {
		super();
		this.state = state;
		this.containerElement = containerElement;
	}

	setup() {
		this.setupImages();
		this.setupCanvases();
		this.setupFellas();
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

	setupCanvases() {
		this.containerElement?.replaceChildren();
		this.displayContexts = [];

		const spriteSet = SpriteSets[this.state.options.spriteSet];

		const { columns, rowsWithOverflow } = countToRowsAndColumns(this.state.options.count);
		const totalWidth = columns * spriteSet.width;
		const totalHeight = rowsWithOverflow * spriteSet.height;

		this.spriteColumnCount = Math.floor(MAX_CANVAS_SIZE / spriteSet.width);
		this.spriteRowCount = Math.floor(MAX_CANVAS_SIZE / spriteSet.height);
		this.canvasWidth = this.spriteColumnCount * spriteSet.width;
		this.canvasHeight = this.spriteRowCount * spriteSet.height;
		this.canvasColumns = Math.ceil(totalWidth / this.canvasWidth);
		this.canvasRows = Math.ceil(totalHeight / this.canvasHeight);

		this.canvasesElement = document.createElement('div');
		this.canvasesElement.className = 'transform-wrapper';
		this.canvasesElement.style.width = `${totalWidth}px`;
		this.canvasesElement.style.height = `${totalHeight}px`;
		this.containerElement.appendChild(this.canvasesElement);

		for (let column = 0; column < this.canvasColumns; column++) {
			let columnElement = document.createElement('div');
			columnElement.className = 'transform-column';
			this.canvasesElement.appendChild(columnElement);

			for (let row = 0; row < this.canvasRows; row++) {
				const canvas = document.createElement('canvas');
				canvas.width = this.canvasWidth;
				canvas.height = this.canvasHeight;
				canvas.style.imageRendering = 'pixelated';

				const context = canvas.getContext('2d', { alpha: false, antialias: false });
				context.imageSmoothingEnabled = false;

				if (this.displayContexts[column] === undefined) {
					this.displayContexts[column] = [];
				}
				this.displayContexts[column][row] = context;

				columnElement.appendChild(canvas);
			}
		}
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

	updateDisplaySize() {}

	updateCamera() {
		const { offset, scale } = this.state.camera;
		const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
		this.canvasesElement.style.transform = transform;
	}

	loop() {
		this.draw();
	}

	draw() {
		const { options } = this.state;
		const spriteSet = SpriteSets[options.spriteSet];

		if (this.images == null) {
			return;
		}

		let canvasColumn = 0;
		let canvasRow = 0;
		let spriteColumn = -1;
		let spriteRow = 0;

		for (let i = 0; i < this.fellas.length; i++) {
			spriteColumn++;

			if (spriteColumn === this.spriteColumnCount) {
				spriteColumn = 0;
				canvasColumn++;
			}

			if (canvasColumn === this.canvasColumns) {
				canvasColumn = 0;
				spriteRow++;
			}

			if (spriteRow === this.spriteRowCount) {
				spriteRow = 0;
				canvasRow++;
			}

			const fella = this.fellas[i];

			if (!fella.needsRedraw) {
				continue;
			}

			const image = this.images[fella.variation];

			if (image == null) {
				continue;
			}

			const ctx = this.displayContexts[canvasColumn][canvasRow];

			const x = spriteColumn * spriteSet.width;
			const y = spriteRow * spriteSet.height;
			const width = spriteSet.width;
			const height = spriteSet.height;

			ctx.clearRect(x, y, width, height);

			ctx.drawImage(
				image,
				x,
				y,
				width,
				height,
			);

			fella.needsRedraw = false;
		}
	}

	destroy() {
		this.displayContexts = [];
	}
}
