import {
  randomChoice,
  randomInt,
} from '../../utils/random.js';

export class CanvasThing {
	// From the constructor
	ctx;
	spriteSet;
	useCamera;
	onlyDrawChanges;
	useSpriteSheet;
	camera;
	fellas;
	animationChangesPerFrame;
	variationChangesPerFrame;

	// We set these up internally
	images;
	spriteSheetCoordinates;
	animationFrame;
	needsGlobalRedraw = true;
	lastUpdateTime = performance.now();

	constructor(params) {
		Object.assign(this, params);
		this.setup();
	}

	setup() {
		this.setupImages();
		this.loop();
	}

	setupImages() {
		this.images = {
			frames: [],
			spriteSheets: [],
		};

		for (const variation of this.spriteSet.variations) {
			this.images.frames[variation] = [];
		}

		const loadImageInto = (src, container, key) => {
			const image = new Image();
			image.src = src;
			image.onload = async () => {
				const bitmap = await createImageBitmap(image);
				container[key] = bitmap;
				this.needsGlobalRedraw = true;
			};
		};

		for (const variation of this.spriteSet.variations) {
			for (let frame = 0; frame < this.spriteSet.frames; frame++) {
				const src = this.spriteSet.assets.frames[variation][frame];
				loadImageInto(src, this.images.frames[variation], frame);
			}
		}

		for (const variation of this.spriteSet.variations) {
			const src = this.spriteSet.assets.spriteSheets[variation];
			loadImageInto(src, this.images.spriteSheets, variation);
		}

		this.spriteSheetCoordinates = [];
		for (let frame = 0; frame < this.spriteSet.frames; frame++) {
			const x = (frame % this.spriteSet.spriteSheetDimensions.columns) * this.spriteSet.width;
			const y = Math.floor(frame / this.spriteSet.spriteSheetDimensions.columns) * this.spriteSet.height;
			this.spriteSheetCoordinates[frame] = { x, y };
		}
	}

	updateDisplaySize(width, height) {
		this.ctx.canvas.width = width;
		this.ctx.canvas.height = height;
		this.ctx.imageSmoothingEnabled = false;
		this.needsGlobalRedraw = true;
	}

	updateCamera(camera) {
		this.camera = camera;
		this.needsGlobalRedraw = true;
	}


	loop() {
		this.animations();
		this.swaps();
		this.draw();
		this.animationFrame = requestAnimationFrame(
			this.loop.bind(this),
		);
	}

	animations() {
		const updateTime = performance.now();
		const deltaTime = updateTime - this.lastUpdateTime;
		this.lastUpdateTime = updateTime;

		for (const fella of this.fellas) {
			if (!fella.isAnimated) {
				continue;
			}

			fella.timeOnFrame += deltaTime;
			if (fella.timeOnFrame > this.spriteSet.frameDuration) {
				const addedFrames = Math.floor(fella.timeOnFrame / this.spriteSet.frameDuration);
				fella.timeOnFrame = fella.timeOnFrame % this.spriteSet.frameDuration;
				fella.frame = (fella.frame + addedFrames) % this.spriteSet.frames;
				fella.needsRedraw = true;
			}
		}
	}

	swaps() {
		for (let i = 0; i < this.variationChangesPerFrame; i++) {
			const index = randomInt(0, this.fellas.length - 1);
			this.fellas[index].variation = randomChoice(this.spriteSet.variations);
			this.fellas[index].frame = 0;
			this.fellas[index].timeOnFrame = 0;
			this.fellas[index].needsRedraw = true;
		}

		for (let i = 0; i < this.animationChangesPerFrame; i++) {
			const index = randomInt(0, this.fellas.length - 1);
			this.fellas[index].isAnimated = !this.fellas[index].isAnimated;
		}
	}

	draw() {
		const doFullRedraw = !this.onlyDrawChanges || this.needsGlobalRedraw;

		if (doFullRedraw) {
			this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		}

		let offsetX = 0;
		let offsetY = 0;
		let scale = 1;

		if (this.useCamera) {
			offsetX = this.camera.offset.x;
			offsetY = this.camera.offset.y;
			scale = this.camera.scale;
		}

		const width = this.spriteSet.width * scale;
		const height = this.spriteSet.height * scale;

		for (const fella of this.fellas) {
			if (!doFullRedraw && !fella.needsRedraw) {
				continue;
			}

			const image = this.getImage(fella);

			if (image == null) {
				continue;
			}

			const x = (fella.x + offsetX) * scale;
			const y = (fella.y + offsetY) * scale;

			if (this.onlyDrawChanges) {
				this.ctx.clearRect(x, y, width, height);
			}

			this.drawImage(fella, image, x, y, width, height);
			fella.needsRedraw = false;
		}

		this.needsGlobalRedraw = false;
	}

	getImage(fella) {
		if (this.images == null) {
			return null;
		}

		if (this.useSpriteSheet) {
			return this.images.spriteSheets[fella.variation];
		} else {
			return this.images.frames[fella.variation][fella.frame];
		}
	}

	drawImage(fella, image, x, y, width, height) {
		if (fella.isAnimated && this.useSpriteSheet) {
			this.ctx.drawImage(
				image,
				this.spriteSheetCoordinates[fella.frame].x,
				this.spriteSheetCoordinates[fella.frame].y,
				this.spriteSet.width,
				this.spriteSet.height,
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
	}

	destroy() {
		cancelAnimationFrame(this.animationFrame);
		this.animationFrame = null;
		this.images = null;
	}
}
