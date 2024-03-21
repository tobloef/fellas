import { CanvasSubrenderer } from '../subrenderer.js';
import {SpriteSets} from "../../../state/sprite-sets.js";
import {countToRowsAndColumns} from "../../../utils/count-to-rows-and-columns.js";
import {CanvasFrameType} from "../../../state/options.js";
import {randomChoice} from "../../../utils/random.js";
import {CanvasThing} from "../canvas-thing.js";
import {WorkerMessageType} from "../worker-message-type.js";

export class BufferedWorkerCanvasSubrenderer extends CanvasSubrenderer {
	displayCtx = null;
	bufferWorkers = null;
	bufferBitmaps = null;
	animationFrame = null;

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

		const maxSpriteColumns = Math.floor(maxCanvasSize / spriteSet.width);
		const maxSpriteRows = Math.floor(maxCanvasSize / spriteSet.height);

		const {
			columns: totalSpriteColumns,
			rowsWithOverflow: totalSpriteRows,
		} = countToRowsAndColumns(count);

		const overflowSpriteColumns = (totalSpriteColumns % maxSpriteColumns) || maxSpriteColumns;
		const overflowSpriteRows = (totalSpriteRows % maxSpriteRows) || maxSpriteRows;

		const useSpriteSheet = frameType === CanvasFrameType.SPRITE_SHEET;

		const displayCanvas = document.createElement('canvas');
		this.containerElement.appendChild(displayCanvas);

		this.displayCtx = displayCanvas.getContext('2d', {
			alpha: false,
			antialias: false,
		});

		this.updateScreenSize();

		let fellasForBuffers = [];

		for (let i = 0; i < count; i++) {
			const spriteColumn = i % totalSpriteColumns;
			const spriteRow = Math.floor(i / totalSpriteColumns);

			const canvasColumn = Math.floor(spriteColumn / maxSpriteColumns);
			const canvasRow = Math.floor(spriteRow / maxSpriteRows);

			const spriteRowInCanvas = spriteRow % maxSpriteRows;
			const spriteColumnInCanvas = spriteColumn % maxSpriteColumns;

			if (!fellasForBuffers[canvasColumn]) {
				fellasForBuffers[canvasColumn] = [];
			}

			if (!fellasForBuffers[canvasColumn][canvasRow]) {
				fellasForBuffers[canvasColumn][canvasRow] = [];
			}

			fellasForBuffers[canvasColumn][canvasRow].push({
				isAnimated: isAnimatedByDefault,
				variation: randomChoice(spriteSet.variations),
				needsRedraw: true,
				frame: 0,
				timeOnFrame: 0,
				x: spriteColumnInCanvas * spriteSet.width,
				y: spriteRowInCanvas * spriteSet.height,
			});
		}

		this.bufferWorkers = [];

		for (let column = 0; column < fellasForBuffers.length; column++) {
			for (let row = 0; row < fellasForBuffers[column].length; row++) {
				const fellas = fellasForBuffers[column][row];

				if (!this.bufferWorkers[column]) {
					this.bufferWorkers[column] = [];
				}

				const canvas = new OffscreenCanvas(maxCanvasSize, maxCanvasSize);

				if (row === fellasForBuffers.length - 1) {
					canvas.height = overflowSpriteRows * spriteSet.height;
				}

				if (column === fellasForBuffers[row].length - 1) {
					canvas.width = overflowSpriteColumns * spriteSet.width;
				}

				const worker = new Worker(new URL('../worker.js', import.meta.url), {
					type: 'module',
				});

				worker.postMessage({
					type: WorkerMessageType.SETUP,
					id: `${column}-${row}`,
					canvas,
					spriteSet,
					onlyDrawChanges,
					useSpriteSheet,
					camera: null,
					variationChangesPerFrame,
					animationChangesPerFrame,
					fellas,
					baseUrl: window.location.origin,
					sendCanvasBitmaps: true,
				}, [canvas]);

				worker.onmessage = (event) => {
					if (event.data?.type === WorkerMessageType.CANVAS_BITMAP) {
						 const [column, row] = event.data.id.split('-').map(Number);
						 const bitmap = event.data.bitmap;
						 if (!this.bufferBitmaps) {
							 this.bufferBitmaps = [];
						 }

						 if (!this.bufferBitmaps[column]) {
							 this.bufferBitmaps[column] = [];
						 }

						 this.bufferBitmaps[column][row]?.close();

						 this.bufferBitmaps[column][row] = bitmap;
					}
				}

				this.bufferWorkers[column][row] = worker;
			}
		}

		this.loop();
	}

	loop() {
		this.draw();

		this.animationFrame = requestAnimationFrame(this.loop.bind(this));
	}

	draw() {
		this.displayCtx.clearRect(
			0,
			0,
			this.displayCtx.canvas.width,
			this.displayCtx.canvas.height
		);

		const { camera: { offset, scale } } = this.state;

		let x = offset.x * scale;
		let y = offset.y * scale;
		let w = 0;
		let h = 0;

		if (!this.bufferBitmaps) {
			return;
		}

		for (let column = 0; column < this.bufferBitmaps.length; column++) {
			if (!this.bufferBitmaps[column]) {
				continue;
			}

			for (let row = 0; row < this.bufferBitmaps[column].length; row++) {
				const bitmap = this.bufferBitmaps[column][row];

				if (!bitmap) {
					continue;
				}

				w = bitmap.width * scale;
				h = bitmap.height * scale;
				this.displayCtx.drawImage(bitmap, x, y, w, h);

				y += h;
			}
			y = offset.y * scale;
			x += w;
		}
	}

	updateCamera() {}

	updateScreenSize() {
		const {
			screenSize: {
				width,
				height,
			}
		} = this.state;

		this.displayCtx.canvas.width = width;
		this.displayCtx.canvas.height = height;
		this.displayCtx.canvas.style.width = `${width}px`;
		this.displayCtx.canvas.style.height = `${height}px`;
		this.displayCtx.imageSmoothingEnabled = false;
	}

	destroy() {
		cancelAnimationFrame(this.animationFrame);
		this.animationFrame = null;

		this.displayCtx.canvas.remove();
		this.displayCtx = null;

		for (const column of this.bufferWorkers) {
			for (const worker of column) {
				worker.terminate();
			}
		}

		for (const column of this.bufferBitmaps) {
			for (const bitmap of column) {
				bitmap.close();
			}
		}
	}
}
