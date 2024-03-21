import { CanvasSubrenderer } from '../subrenderer.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { CanvasFrameType } from '../../../state/options.js';
import { countToRowsAndColumns } from '../../../utils/count-to-rows-and-columns.js';
import { randomChoice } from '../../../utils/random.js';
import { WorkerMessageType } from '../worker-message-type.js';

export class TiledWorkerCanvasSubrenderer extends CanvasSubrenderer {
	canvasesElement = null;
	workers = null;

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

		let fellasForWorkers = [];

		for (let i = 0; i < count; i++) {
			const spriteColumn = i % totalSpriteColumns;
			const spriteRow = Math.floor(i / totalSpriteColumns);

			const canvasColumn = Math.floor(spriteColumn / maxSpriteColumns);
			const canvasRow = Math.floor(spriteRow / maxSpriteRows);

			const spriteRowInCanvas = spriteRow % maxSpriteRows;
			const spriteColumnInCanvas = spriteColumn % maxSpriteColumns;

			if (!fellasForWorkers[canvasColumn]) {
				fellasForWorkers[canvasColumn] = [];
			}

			if (!fellasForWorkers[canvasColumn][canvasRow]) {
				fellasForWorkers[canvasColumn][canvasRow] = [];
			}

			fellasForWorkers[canvasColumn][canvasRow].push({
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

		for (let column = 0; column < fellasForWorkers.length; column++) {
			for (let row = 0; row < fellasForWorkers[column].length; row++) {
				if (!columnElements[column]) {
					columnElements[column] = document.createElement('div');
					columnElements[column].className = 'transform-column';
					this.canvasesElement.appendChild(columnElements[column]);
				}

				const fellas = fellasForWorkers[column][row];

				const canvas = document.createElement('canvas');
				columnElements[column].appendChild(canvas);

				canvas.width = maxCanvasSize;
				canvas.height = maxCanvasSize;

				if (column === fellasForWorkers.length - 1) {
					canvas.width = overflowSpriteColumns * spriteSet.width;
				}

				if (row === fellasForWorkers[column].length - 1) {
					canvas.height = overflowSpriteRows * spriteSet.height;
				}

				canvas.style.imageRendering = 'pixelated';
				canvas.style.width = `${canvas.width}px`;
				canvas.style.height = `${canvas.height}px`;

				columnElements[column].appendChild(canvas);

				const offscreenCanvas = canvas.transferControlToOffscreen();

				const worker = new Worker(new URL('../worker.js', import.meta.url), {
					type: 'module',
				});

				worker.postMessage({
					type: WorkerMessageType.SETUP,
					canvas: offscreenCanvas,
					spriteSet,
					onlyDrawChanges,
					useSpriteSheet,
					camera: null,
					variationChangesPerFrame,
					animationChangesPerFrame,
					fellas,
					baseUrl: window.location.origin,
				}, [offscreenCanvas]);

				if (!this.workers) {
					this.workers = [];
				}

				if (!this.workers[column]) {
					this.workers[column] = [];
				}

				this.workers[column][row] = worker;
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
		for (const column of this.workers) {
			for (const worker of column) {
				worker.terminate();
			}
		}

		this.canvasesElement.remove();
		this.canvasesElement = null;
	}
}
