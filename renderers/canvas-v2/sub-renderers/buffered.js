import { CanvasSubrenderer } from '../subrenderer.js';
import {SpriteSets} from "../../../state/sprite-sets.js";
import {randomChoice} from "../../../utils/random.js";
import {countToRowsAndColumns} from "../../../utils/count-to-rows-and-columns.js";
import {CanvasThing} from "../canvas-thing.js";
import {CanvasFrameType} from "../../../state/options.js";

export class BufferedCanvasSubrenderer extends CanvasSubrenderer {
	displayCtx = null;
	bufferCanvasThings = null;
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

		this.bufferCanvasThings = [];

		for (let column = 0; column < fellasForBuffers.length; column++) {
			for (let row = 0; row < fellasForBuffers[column].length; row++) {
				const fellas = fellasForBuffers[column][row];

				if (!this.bufferCanvasThings[column]) {
					this.bufferCanvasThings[column] = [];
				}

				const canvas = new OffscreenCanvas(maxCanvasSize, maxCanvasSize);

				if (row === fellasForBuffers.length - 1) {
					canvas.height = overflowSpriteRows * spriteSet.height;
				}

				if (column === fellasForBuffers[row].length - 1) {
					canvas.width = overflowSpriteColumns * spriteSet.width;
				}

				const ctx = canvas.getContext('2d', {
					alpha: false,
					antialias: false,
				});

				this.bufferCanvasThings[column][row] = new CanvasThing({
					ctx,
					spriteSet,
					useCamera: false,
					onlyDrawChanges,
					useSpriteSheet,
					fellas,
					variationChangesPerFrame,
					animationChangesPerFrame,
					baseUrl: window.location.origin,
				});
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

		for (let column = 0; column < this.bufferCanvasThings.length; column++) {
			for (let row = 0; row < this.bufferCanvasThings[column].length; row++) {
				const canvasThing = this.bufferCanvasThings[column][row];
				const canvas = canvasThing.ctx.canvas;
				w = canvas.width * scale;
				h = canvas.height * scale;
				this.displayCtx.drawImage(canvas, x, y, w, h);
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
		this.displayCtx.canvas.style.imageRendering = 'pixelated';
		this.displayCtx.imageSmoothingEnabled = false;
	}

	destroy() {
		cancelAnimationFrame(this.animationFrame);
		this.animationFrame = null;

		this.displayCtx.canvas.remove();
		this.displayCtx = null;

		for (const column of this.bufferCanvasThings) {
			for (const canvasThing of column) {
				canvasThing.destroy();
			}
		}
	}
}
