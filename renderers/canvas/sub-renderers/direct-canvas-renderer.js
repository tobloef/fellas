import { AbstractCanvasSubRenderer } from '../abstract-canvas-sub-renderer.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { randomChoice } from '../../../utils/random.js';
import { countToRowsAndColumns } from '../../../utils/count-to-rows-and-columns.js';
import {CanvasFrameType} from "../../../state/options.js";

export class DirectCanvasSubRenderer extends AbstractCanvasSubRenderer{
	containerElement = null;
	state = null;
	ctx = null;
	needsGlobalRedraw = false;
	images = {};
	fellas = [];

	constructor(state, containerElement) {
		super();
		this.state = state;
		this.containerElement = containerElement;
	}

	setupCanvases() {
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

		this.updateDisplaySize();
	}

	updateDisplaySize() {
		const screenSize = this.state.screenSize;

		this.ctx.canvas.style.width = `100%`;
		this.ctx.canvas.style.height = `100%`;
		this.ctx.canvas.width = screenSize.width;
		this.ctx.canvas.height = screenSize.height;
		this.ctx.imageSmoothingEnabled = false;

		this.needsGlobalRedraw = true;
	}

	updateCamera() {
		this.needsGlobalRedraw = true;
	}

	draw() {
		const { options, camera } = this.state;
		const spriteSet = SpriteSets[options.spriteSet];
		const frameType = options.canvas.frameType;

		if (this.images == null) {
			return;
		}

		if (!options.canvas.onlyDrawChanges || this.needsGlobalRedraw) {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		}

		let width = spriteSet.width * camera.scale;
		let height = spriteSet.height * camera.scale;

		const count = options.count;
		const onlyDrawChanges = options.canvas.onlyDrawChanges;

		for (let i = 0; i < this.fellas.length; i++) {
			const fella = this.fellas[i];

			if (onlyDrawChanges && !fella.needsRedraw && !this.needsGlobalRedraw) {
				continue;
			}

			let image;
			if (fella.isAnimated) {
				if (frameType === CanvasFrameType.INDIVIDUAL_IMAGES) {
					image = this.images.frames[fella.variation][fella.frame];
				} else if (frameType === CanvasFrameType.SPRITE_SHEET) {
					image = this.images.spriteSheets[fella.variation];
				}
			} else {
				image = this.images.stills[fella.variation];
			}

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

			if (fella.isAnimated && frameType === CanvasFrameType.SPRITE_SHEET) {
				this.ctx.drawImage(
					image,
					this.spriteSheetCoordinates[fella.frame].x,
					this.spriteSheetCoordinates[fella.frame].y,
					spriteSet.width,
					spriteSet.height,
					x,
					y,
					width,
					height,
				);
			} else {
				this.ctx.drawImage(
					image,
					x,
					y,
					width,
					height,
				);
			}

			fella.needsRedraw = false;
		}

		this.needsGlobalRedraw = false;
	}

	destroy() {}
}
