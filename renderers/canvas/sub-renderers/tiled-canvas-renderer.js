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
			};
		}
	}

	setupCanvases() {
		this.containerElement?.replaceChildren();
		this.displayContexts = [];

		const spriteSet = SpriteSets[this.state.options.spriteSet];

		const {
			columns: neededColumns,
			rowsWithOverflow: neededRows,
		} = countToRowsAndColumns(this.state.options.count);

		const neededWidth = neededColumns * spriteSet.width;
		const neededHeight = neededRows * spriteSet.height;
		const maxSpriteColumns = Math.floor(MAX_CANVAS_SIZE / spriteSet.width);
		const maxSpriteRows = Math.floor(MAX_CANVAS_SIZE / spriteSet.height);

		let spriteColumnsRemaining = neededColumns;
		let spriteRowsRemaining = neededRows;

		this.canvasesElement = document.createElement('div');
		this.canvasesElement.className = 'transform-wrapper';
		this.canvasesElement.style.width = `${neededWidth}px`;
		this.canvasesElement.style.height = `${neededHeight}px`;
		this.containerElement.appendChild(this.canvasesElement);

		let column = 0;
		let row = 0;

		while (spriteColumnsRemaining > 0) {
			this.displayContexts[column] = [];

			const columnElement = document.createElement('div');
			columnElement.className = 'transform-column';
			this.canvasesElement.appendChild(columnElement);

			while (spriteRowsRemaining > 0) {
				const canvas = document.createElement('canvas');
				columnElement.appendChild(canvas);

				const spriteColumnsForCanvas = Math.min(spriteColumnsRemaining, maxSpriteColumns);
				const spriteRowsForCanvas = Math.min(spriteRowsRemaining, maxSpriteRows);

				canvas.width = spriteColumnsForCanvas * spriteSet.width;
				canvas.height = spriteRowsForCanvas * spriteSet.height;
				canvas.style.imageRendering = 'pixelated';
				canvas.style.width = `${canvas.width}px`;
				canvas.style.height = `${canvas.height}px`;

				const context = canvas.getContext('2d', { alpha: false, antialias: false });
				context.imageSmoothingEnabled = false;

				this.displayContexts[column][row] = context;

				spriteRowsRemaining -= spriteRowsForCanvas;
				row++;
			}
			spriteRowsRemaining = neededRows;
			spriteColumnsRemaining -= Math.min(spriteColumnsRemaining, maxSpriteColumns);
			row = 0;
			column++;
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

	updateDisplaySize() {
	}

	updateCamera() {
		const { offset, scale } = this.state.camera;
		const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
		this.canvasesElement.style.transform = transform;
	}

	loop() {
		this.swapFellaVariations();
		this.swapFellaAnimations();

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

		let ctx = this.displayContexts[canvasColumn][canvasRow];
		let updateContext = false;

		for (let i = 0; i < this.fellas.length; i++) {
			spriteColumn++;

			if (spriteColumn === ctx.canvas.width / spriteSet.width) {
				spriteColumn = 0;
				canvasColumn++;
				updateContext = true;
			}

			if (canvasColumn === this.displayContexts.length) {
				canvasColumn = 0;
				spriteRow++;
				updateContext = true;
			}

			if (spriteRow === ctx.canvas.height / spriteSet.height) {
				spriteRow = 0;
				canvasRow++;
				updateContext = true;
			}

			if (updateContext) {
				ctx = this.displayContexts[canvasColumn][canvasRow];
				updateContext = false;
			}

			const fella = this.fellas[i];

			if (!fella.needsRedraw) {
				continue;
			}

			const image = this.images[fella.variation];

			if (image == null) {
				continue;
			}

			const x = spriteColumn * spriteSet.width;
			const y = spriteRow * spriteSet.height;
			const width = spriteSet.width;
			const height = spriteSet.height;

			ctx.clearRect(x, y, width, height);
			ctx.drawImage(image, x, y, width, height);

			fella.needsRedraw = false;
		}
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

	destroy() {
		this.displayContexts = [];
	}
}
