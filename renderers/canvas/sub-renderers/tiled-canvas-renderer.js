import { countToRowsAndColumns } from '../../../utils/count-to-rows-and-columns.js';
import { MAX_CANVAS_SIZE } from '../../../utils/max-canvas-size.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { AbstractCanvasSubRenderer } from '../abstract-canvas-sub-renderer.js';

export class TiledCanvasSubRenderer extends AbstractCanvasSubRenderer {
	containerElement = null;
	state = null;
	canvasesElement = null;
	displayContexts = [];

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
		this.displayContexts = [];

		const spriteSet = SpriteSets[this.state.options.spriteSet];

		const { columns, rowsWithOverflow } = countToRowsAndColumns(this.state.options.count);
		const width = columns * spriteSet.width;
		const height = rowsWithOverflow * spriteSet.height;
		const horizontalCanvasCount = Math.ceil(width / MAX_CANVAS_SIZE);
		const verticalCanvasCount = Math.ceil(height / MAX_CANVAS_SIZE);

		this.canvasesElement = document.createElement('div');
		this.canvasesElement.className = 'transform-wrapper';
		this.containerElement.appendChild(this.canvasesElement);

		for (let column = 0; column < horizontalCanvasCount; column++) {
			let columnElement = document.createElement('div');
			columnElement.className = 'transform-column';
			this.canvasesElement.appendChild(columnElement);

			for (let row = 0; row < verticalCanvasCount; row++) {
				const canvas = document.createElement('canvas');
				canvas.width = 0;
				canvas.height = 0;
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
}
