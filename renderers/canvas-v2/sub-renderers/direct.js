import { CanvasSubrenderer } from '../subrenderer.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { CanvasFrameType } from '../../../state/options.js';
import { createFellas } from '../create-fellas.js';
import { CanvasThing } from '../canvas-thing.js';

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

		const spriteSet = SpriteSets[spriteSetKey];

		const useSpriteSheet = frameType === CanvasFrameType.SPRITE_SHEET;

		const camera = {
			offset: {
				x: initialCamera.offset.x,
				y: initialCamera.offset.y,
			},
			scale: initialCamera.scale,
		};

		const fellas = createFellas(count, isAnimatedByDefault, spriteSet);

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
