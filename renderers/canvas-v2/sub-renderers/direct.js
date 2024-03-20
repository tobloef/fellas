import { CanvasSubrenderer } from '../subrenderer.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { CanvasFrameType } from '../../../state/options.js';
import { CanvasThing } from '../canvas-thing.js';
import { countToRowsAndColumns } from '../../../utils/count-to-rows-and-columns.js';
import { randomChoice } from '../../../utils/random.js';

export class DirectCanvasSubrenderer extends CanvasSubrenderer {
	canvasThing = null;

	setup() {
		const {
			screenSize,
			camera: initialCamera,
			options: {
				count,
				isAnimatedByDefault,
				variationChangesPerFrame,
				animationChangesPerFrame,
				spriteSet: spriteSetKey,
				canvas: {
					onlyDrawChanges,
					frameType,
				},
			},
		} = this.state;

		const spriteSet = SpriteSets[spriteSetKey];

		const useSpriteSheet = frameType === CanvasFrameType.SPRITE_SHEET;

		const camera = {
			offset: {
				x: initialCamera.offset.x,
				y: initialCamera.offset.y,
			},
			scale: initialCamera.scale,
		};

		const { columns } = countToRowsAndColumns(count);

		let column = 0;
		let row = 0;

		let fellas = [];
		for (let i = 0; i < count; i++) {
			fellas[i] = {
				isAnimated: isAnimatedByDefault,
				variation: randomChoice(spriteSet.variations),
				needsRedraw: true,
				frame: 0,
				timeOnFrame: 0,
				x: column * spriteSet.width,
				y: row * spriteSet.height,
			};

			column++;
			if (column >= columns) {
				column = 0;
				row++;
			}
		}

		const canvas = document.createElement('canvas');
		this.containerElement.appendChild(canvas);
		canvas.width = screenSize.width;
		canvas.height = screenSize.height;
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.imageRendering = 'pixelated';

		const ctx = canvas.getContext('2d', {
			alpha: false,
			antialias: false,
		});
		ctx.imageSmoothingEnabled = false;

		this.canvasThing = new CanvasThing({
			ctx,
			spriteSet,
			useCamera: true,
			onlyDrawChanges,
			useSpriteSheet,
			camera,
			fellas,
			variationChangesPerFrame,
			animationChangesPerFrame,
			baseUrl: window.location.origin,
		});
	}

	updateScreenSize() {
		const {
			screenSize: {
				width,
				height,
			},
		} = this.state;


		this.canvasThing.updateDisplaySize(width, height);
	}

	updateCamera() {
		this.canvasThing.updateCamera(this.state.camera);
	}

	destroy() {
		this.canvasThing?.destroy();
		this.canvasThing = null;
	}
}
