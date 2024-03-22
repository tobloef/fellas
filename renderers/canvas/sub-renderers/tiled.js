import { CanvasSubrenderer } from '../subrenderer.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { CanvasFrameType } from '../../../state/options.js';
import { countToRowsAndColumns } from '../../../utils/count-to-rows-and-columns.js';
import { FellaCanvas } from '../fella-canvas.js';
import { randomChoice } from '../../../utils/random.js';

export class TiledCanvasSubrenderer extends CanvasSubrenderer {
	canvasesElement = null;
	fellaCanvases = null;

	setup() {
		const {
			options: {
				count,
				isAnimatedByDefault,
				variationChangesPerFrame,
				animationChangesPerFrame,
				spriteSet: spriteSetKey,
				canvas: {
					onlyDrawChanges,
					frameType,
					maxCanvasSize,
				},
			},
		} = this.state;

		const spriteSet = SpriteSets[spriteSetKey];

		const useSpriteSheet = frameType === CanvasFrameType.SPRITE_SHEET;

		const maxSpriteColumns = Math.floor(maxCanvasSize / spriteSet.width);
		const maxSpriteRows = Math.floor(maxCanvasSize / spriteSet.height);

		const {
			columns: totalSpriteColumns,
			rowsWithOverflow: totalSpriteRows,
		} = countToRowsAndColumns(count);

		const overflowSpriteColumns = (totalSpriteColumns % maxSpriteColumns) || maxSpriteColumns;
		const overflowSpriteRows = (totalSpriteRows % maxSpriteRows) || maxSpriteRows;

		const totalWidth = totalSpriteColumns * spriteSet.width;
		const totalHeight = totalSpriteRows * spriteSet.height;

		this.canvasesElement = document.createElement('div');
		this.canvasesElement.className = 'transform-wrapper';
		this.canvasesElement.style.display = 'flex';
		this.canvasesElement.style.width = `${totalWidth}px`;
		this.canvasesElement.style.height = `${totalHeight}px`;
		this.containerElement.appendChild(this.canvasesElement);

		this.fellaCanvases = [];

		for (let i = 0; i < count; i++) {
			const spriteColumn = i % totalSpriteColumns;
			const spriteRow = Math.floor(i / totalSpriteColumns);

			const canvasColumn = Math.floor(spriteColumn / maxSpriteColumns);
			const canvasRow = Math.floor(spriteRow / maxSpriteRows);

			const spriteRowInCanvas = spriteRow % maxSpriteRows;
			const spriteColumnInCanvas = spriteColumn % maxSpriteColumns;

			if (!this.fellaCanvases[canvasColumn]) {
				this.fellaCanvases[canvasColumn] = [];
			}

			if (!this.fellaCanvases[canvasColumn][canvasRow]) {
				const canvas = document.createElement('canvas');

				const ctx = canvas.getContext('2d', {
					alpha: false,
					antialias: false,
				});
				ctx.imageSmoothingEnabled = false;

				this.fellaCanvases[canvasColumn][canvasRow] = new FellaCanvas({
					ctx,
					spriteSet,
					useCamera: false,
					onlyDrawChanges,
					useSpriteSheet,
					fellas: [],
					variationChangesPerFrame,
					animationChangesPerFrame,
					baseUrl: window.location.origin,
				});
			}

			this.fellaCanvases[canvasColumn][canvasRow].fellas.push({
				isAnimated: isAnimatedByDefault,
				variation: randomChoice(spriteSet.variations),
				needsRedraw: true,
				frame: 0,
				timeOnFrame: 0,
				x: spriteColumnInCanvas * spriteSet.width,
				y: spriteRowInCanvas * spriteSet.height,
			});
		}

		let columnElements = [];

		for (let column = 0; column < this.fellaCanvases.length; column++) {
			for (let row = 0; row < this.fellaCanvases[column].length; row++) {
				if (!columnElements[column]) {
					columnElements[column] = document.createElement('div');
					columnElements[column].className = 'transform-column';
					this.canvasesElement.appendChild(columnElements[column]);
				}

				const { canvas } = this.fellaCanvases[column][row].ctx

				canvas.width = maxCanvasSize;
				canvas.height = maxCanvasSize;

				if (column === this.fellaCanvases.length - 1) {
					canvas.width = overflowSpriteColumns * spriteSet.width;
				}

				if (row === this.fellaCanvases[column].length - 1) {
					canvas.height = overflowSpriteRows * spriteSet.height;
				}

				canvas.style.imageRendering = 'pixelated';
				canvas.style.width = `${canvas.width}px`;
				canvas.style.height = `${canvas.height}px`;

				columnElements[column].appendChild(canvas);
			}
		}
	}

	updateCamera() {
		const { offset, scale } = this.state.camera;
		const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
		this.canvasesElement.style.transform = transform;
	}

	updateScreenSize() {}

	destroy() {
		for (const column of this.fellaCanvases) {
			for (const fellaCanvas of column) {
				fellaCanvas.destroy();
			}
		}

		this.canvasesElement.remove();
		this.canvasesElement = null;
	}
}
