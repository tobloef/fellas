import { countToRowsAndColumns } from '../../../utils/count-to-rows-and-columns.js';
import { MAX_CANVAS_SIZE } from '../../../utils/max-canvas-size.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { AbstractCanvasSubRenderer } from '../abstract-canvas-sub-renderer.js';

export class BufferedCanvasSubRenderer extends AbstractCanvasSubRenderer {
	containerElement = null;
	state = null;
	displayContext = null;
	bufferContexts = [];

	constructor(state, containerElement) {
		super();
		this.state = state;
		this.containerElement = containerElement;
	}

	setup() {
		this.setupCanvases();
	}

	updateDisplaySize() {

	}

	updateCamera() {

	}

	loop() {

	}

	destroy() {

	}

	setupCanvases() {
		this.containerElement?.replaceChildren();
		this.displayContext = null
		this.bufferContexts = []

		const spriteSet = SpriteSets[this.state.options.spriteSet];

		const displayCanvas = document.createElement('canvas');
		displayCanvas.style.imageRendering = 'pixelated';
		displayCanvas.width = 0;
		displayCanvas.height = 0;

		this.displayContext = displayCanvas.getContext('2d', { alpha: false, antialias: false });
		this.displayContext.imageSmoothingEnabled = false;

		const { columns, rowsWithOverflow } = countToRowsAndColumns(this.state.options.count);
		const width = columns * spriteSet.width;
		const height = rowsWithOverflow * spriteSet.height;
		const horizontalCanvasCount = Math.ceil(width / MAX_CANVAS_SIZE);
		const verticalCanvasCount = Math.ceil(height / MAX_CANVAS_SIZE);

		for (let column = 0; column < horizontalCanvasCount; column++) {
			for (let row = 0; row < verticalCanvasCount; row++) {
				const canvas = new OffscreenCanvas(0, 0);

				const context = canvas.getContext('2d', { alpha: false, antialias: false });
				context.imageSmoothingEnabled = false;

				if (this.bufferContexts[column] === undefined) {
					this.bufferContexts[column] = [];
				}

				this.bufferContexts[column][row] = context;
			}
		}
	}
}
