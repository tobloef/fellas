import { SpriteSets } from '../../../../state/sprite-sets.js';
import { countToRowsAndColumns } from '../../../../utils/count-to-rows-and-columns.js';
import { CanvasFrameType } from '../../../../state/options.js';

export class DirectCanvasSubRenderer {
	containerElement = null;
	state = null;
	ctx = null;
	needsGlobalRedraw = false;
	images = {};
	fellas = [];
	spriteSheetCoordinates = [];
	lastUpdateTime = performance.now();
	worker = null;
	autoDrawWorker = false;
	readyToDrawAgain = true;

	constructor(state, containerElement) {
		this.state = state;
		this.containerElement = containerElement;
	}

	setup() {
		this.containerElement?.replaceChildren();
		this.ctx = null;
		this.fellas = [];

		const canvas = document.createElement('canvas');
		canvas.width = 0;
		canvas.height = 0;
		canvas.style.imageRendering = 'pixelated';
		this.containerElement.appendChild(canvas);

		if (this.state.options.canvas.useWorker) {
			this.setupWorker(canvas);
		} else {
			const context = canvas.getContext('2d', { alpha: false, antialias: false });
			context.imageSmoothingEnabled = false;
			this.ctx = context;
		}

		this.updateDisplaySize();
	}

	setupWorker(canvas) {
		this.worker = new Worker(new URL('./worker.js', import.meta.url));
		this.worker.onmessage = (event) => {
			if (event.data.type === 'drawComplete') {
				this.readyToDrawAgain = true;
			}
		};

		const offscreenCanvas = canvas.transferControlToOffscreen();

		const { options, camera } = this.state;
		const { frameType, onlyDrawChanges } = options.canvas;
		const spriteSet = SpriteSets[options.spriteSet];

		this.worker.postMessage({
			type: 'setup',
			canvas: offscreenCanvas,
			spriteSet: {
				width: spriteSet.width,
				height: spriteSet.height,
				frameDuration: spriteSet.frameDuration,
				frames: spriteSet.frames,
			},
			camera: {
				offset: {
					x: camera.offset.x,
					y: camera.offset.y,
				},
				scale: camera.scale,
			},
			frameType,
			onlyDrawChanges,
			spriteSheetCoordinates: this.spriteSheetCoordinates,
			autoDraw: this.autoDrawWorker,
		}, [ offscreenCanvas ]);
	}

	setImage(image, imageType, variation, frame) {
		if (this.state.options.canvas.useWorker) {
			this.worker.postMessage({
				type: 'setImage',
				image,
				imageType,
				variation,
				frame,
			});
		} else {
			switch (imageType) {
				case 'still':
					if (this.images.stills == null) {
						this.images.stills = {};
					}
					this.images.stills[variation] = image;
					break;
				case 'frame':
					if (this.images.frames == null) {
						this.images.frames = {};
					}
					if (this.images.frames[variation] == null) {
						this.images.frames[variation] = [];
					}
					this.images.frames[variation][frame] = image;
					break;
				case 'spriteSheet':
					if (this.images.spriteSheets == null) {
						this.images.spriteSheets = {};
					}
					this.images.spriteSheets[variation] = image;
					break;
			}
			this.needsGlobalRedraw = true;
		}
	}

	updateFellas(updatedFellas) {
		if (this.state.options.canvas.useWorker) {
			this.worker.postMessage({
				type: 'updateFellas',
				updatedFellas,
			});
		}

		Object.entries(updatedFellas).forEach(([ i, fella ]) => {
			if (this.fellas[i] == null) {
				this.fellas[i] = fella;
			} else {
				Object.assign(this.fellas[i], fella);
			}
		});
	}

	updateDisplaySize() {
		const screenSize = this.state.screenSize;

		if (this.state.options.canvas.useWorker) {
			this.worker.postMessage({
				type: 'updateDisplaySize',
				width: screenSize.width,
				height: screenSize.height,
			});
		} else {
			this.ctx.canvas.style.width = '100%';
			this.ctx.canvas.style.height = '100%';
			this.ctx.canvas.width = screenSize.width;
			this.ctx.canvas.height = screenSize.height;
			this.ctx.imageSmoothingEnabled = false;
			this.needsGlobalRedraw = true;
		}
	}

	updateCamera() {
		if (this.state.options.canvas.useWorker) {
			this.worker.postMessage({
				type: 'updateCamera',
				offset: {
					x: this.state.camera.offset.x,
					y: this.state.camera.offset.y,
				},
				scale: this.state.camera.scale,
			});
		} else {
			this.needsGlobalRedraw = true;
		}
	}

	draw() {
		const { options, camera } = this.state;
		const spriteSet = SpriteSets[options.spriteSet];
		const frameType = options.canvas.frameType;
		const useWorker = options.canvas.useWorker;

		if (useWorker) {
			if (!this.autoDrawWorker && this.readyToDrawAgain) {
				this.readyToDrawAgain = false;
				this.worker.postMessage({ type: 'draw' });
			}
			return;
		}

		this.updateAnimations();

		if (this.images == null) {
			return;
		}

		if (!options.canvas.onlyDrawChanges || this.needsGlobalRedraw) {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		}

		let width = spriteSet.width * camera.scale;
		let height = spriteSet.height * camera.scale;

		let offsetX = camera.offset.x * camera.scale;
		let offsetY = camera.offset.y * camera.scale;

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
					image = this.images?.frames?.[fella.variation]?.[fella.frame];
				} else if (frameType === CanvasFrameType.SPRITE_SHEET) {
					image = this.images?.spriteSheets?.[fella.variation];
				}
			} else {
				image = this.images?.stills?.[fella.variation];
			}

			if (image == null) {
				continue;
			}

			const { columns } = countToRowsAndColumns(count);

			let x = (i % columns);
			let y = Math.floor(i / columns);

			x *= width;
			y *= height;

			x += offsetX;
			y += offsetY;

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

	updateAnimations() {
		const updateTime = performance.now();
		const deltaTime = updateTime - this.lastUpdateTime;
		this.lastUpdateTime = updateTime;

		const spriteSet = SpriteSets[this.state.options.spriteSet];

		for (const fella of this.fellas) {
			if (!fella.isAnimated) {
				continue;
			}

			fella.timeOnFrame += deltaTime;
			if (fella.timeOnFrame > spriteSet.frameDuration) {
				const addedFrames = Math.floor(fella.timeOnFrame / spriteSet.frameDuration);
				fella.timeOnFrame = fella.timeOnFrame % spriteSet.frameDuration;
				fella.frame = (fella.frame + addedFrames) % spriteSet.frames;
				fella.needsRedraw = true;
			}
		}
	}

	destroy() {
		if (this.worker != null) {
			this.worker.terminate();
		}
	}
}
