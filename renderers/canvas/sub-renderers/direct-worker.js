import { CanvasSubrenderer } from '../subrenderer.js';
import { SpriteSets } from '../../../state/sprite-sets.js';
import { CanvasFrameType } from '../../../state/options.js';
import { WorkerMessageType } from '../worker-message-type.js';
import { countToRowsAndColumns } from '../../../utils/count-to-rows-and-columns.js';
import { randomChoice } from '../../../utils/random.js';

export class DirectWorkerCanvasSubrenderer extends CanvasSubrenderer {
	worker = null;

	setup() {
		const {
			screenSize,
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

		const camera = {
			offset: {
				x: this.state.camera.offset.x,
				y: this.state.camera.offset.y,
			},
			scale: this.state.camera.scale,
		};

		const spriteSet = SpriteSets[spriteSetKey];

		const useSpriteSheet = frameType === CanvasFrameType.SPRITE_SHEET;

		const canvas = document.createElement('canvas');
		this.containerElement.appendChild(canvas);
		canvas.width = screenSize.width;
		canvas.height = screenSize.height;
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.imageRendering = 'pixelated';

		const offscreenCanvas = canvas.transferControlToOffscreen();

		this.worker = new Worker(new URL('../worker.js', import.meta.url), {
			type: 'module',
		});

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

		this.worker.postMessage({
			type: WorkerMessageType.SETUP,
			canvas: offscreenCanvas,
			spriteSet,
			onlyDrawChanges,
			useSpriteSheet,
			camera,
			variationChangesPerFrame,
			animationChangesPerFrame,
			fellas,
			baseUrl: window.location.origin,
		}, [offscreenCanvas]);
	}


	updateScreenSize() {
		this.worker.postMessage({
			type: WorkerMessageType.UPDATE_DISPLAY_SIZE,
			width: this.state.screenSize.width,
			height: this.state.screenSize.height,
		});
	}

	updateCamera() {
		const camera = {
			offset: {
				x: this.state.camera.offset.x,
				y: this.state.camera.offset.y,
			},
			scale: this.state.camera.scale,
		};

		this.worker.postMessage({
			type: WorkerMessageType.UPDATE_CAMERA,
			camera,
		});
	}

	destroy() {
		this.worker.terminate();
		this.worker = null;
	}
}
