const CanvasFrameType = {
	INDIVIDUAL_IMAGES: "Individual Images",
	SPRITE_SHEET: "Sprite Sheet",
};

let ctx;
let camera;
let spriteSet;
let frameType;
let onlyDrawChanges;
let spriteSheetCoordinates;
let images;
let fellas;
let needsGlobalRedraw;
let lastUpdateTime = performance.now();

onmessage = handleMessage;

function handleMessage(event) {
	switch (event.data.type) {
		case "setup":
			setup(event.data);
			break;
		case "updateCamera":
			updateCamera(event.data);
			break;
		case "updateDisplaySize":
			updateDisplaySize(event.data);
			break;
		case "updateFellas":
			updateFellas(event.data);
			break;
		case "draw":
			draw();
			break;
		case "setImage":
			setImage(event.data);
			break;
	}
}

function setup(data) {
	ctx = data.canvas.getContext("2d", { alpha: false, antialias: false });
	ctx.imageSmoothingEnabled = false;

	camera = data.camera;
	spriteSet = data.spriteSet;
	frameType = data.frameType;
	onlyDrawChanges = data.onlyDrawChanges;
	spriteSheetCoordinates = data.spriteSheetCoordinates;
	images = {};
	fellas = [];

	const loop = () => {
		draw();
		requestAnimationFrame(loop);
	};

	if (data.autoDraw) {
		loop();
	}
}

function setImage(data) {
	const { image, imageType, variation, frame } = data;
	if (images == null) {
		images = {};
	}
	switch (imageType) {
		case "still":
			if (images.stills == null) {
				images.stills = {};
			}
			images.stills[variation] = image;
			break;
		case "frame":
			if (images.frames == null) {
				images.frames = {};
			}
			if (images.frames[variation] == null) {
				images.frames[variation] = [];
			}
			images.frames[variation][frame] = image;
			break;
		case "spriteSheet":
			if (images.spriteSheets == null) {
				images.spriteSheets = {};
			}
			images.spriteSheets[variation] = image;
			break;
	}
}

function updateDisplaySize(data) {
	const { width, height } = data;

	ctx.canvas.width = width;
	ctx.canvas.height = height;
	ctx.imageSmoothingEnabled = false;

	needsGlobalRedraw = true;
}

function updateCamera(data) {
	camera.offset = data.offset;
	camera.scale = data.scale;
	needsGlobalRedraw = true;
}

function updateFellas(data) {
	const { updatedFellas } = data;
	Object.entries(updatedFellas).forEach(([id, fella]) => {
		if (fellas[id] == null) {
			fellas[id] = fella;
		} else {
			Object.assign(fellas[id], fella);
		}
	});
}

function draw() {
	updateAnimations();

	const redrawAll = !onlyDrawChanges || needsGlobalRedraw;

	if (redrawAll) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	}

	const width = spriteSet.width * camera.scale;
	const height = spriteSet.height * camera.scale;

	const offsetX = camera.offset.x * camera.scale;
	const offsetY = camera.offset.y * camera.scale;

	for (let i = 0; i < fellas.length; i++) {
		const fella = fellas[i];

		if (!redrawAll && !fella.needsRedraw) {
			continue;
		}

		let image;
		if (fella.isAnimated) {
			if (frameType === CanvasFrameType.INDIVIDUAL_IMAGES) {
				image = images.frames[fella.variation][fella.frame];
			} else if (frameType === CanvasFrameType.SPRITE_SHEET) {
				image = images.spriteSheets[fella.variation];
			}
		} else {
			image = images.stills[fella.variation];
		}

		if (image == null) {
			continue;
		}

		const { columns } = countToRowsAndColumns(fellas.length);

		const x = (i % columns) * width + offsetX;
		const y = Math.floor(i / columns) * height + offsetY;

		if (!redrawAll) {
			ctx.clearRect(x, y, width, height);
		}

		if (fella.isAnimated && frameType === CanvasFrameType.SPRITE_SHEET) {
			ctx.drawImage(
				image,
				spriteSheetCoordinates[fella.frame].x,
				spriteSheetCoordinates[fella.frame].y,
				spriteSet.width,
				spriteSet.height,
				x,
				y,
				width,
				height,
			);
		} else {
			ctx.drawImage(
				image,
				x,
				y,
				width,
				height,
			);
		}

		fella.needsRedraw = false;
	}

	needsGlobalRedraw = false;
}

function updateAnimations() {
	const updateTime = performance.now();
	const deltaTime = updateTime - lastUpdateTime;
	lastUpdateTime = updateTime;

	for (const fella of fellas) {
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

function countToRowsAndColumns(count) {
	const columns = Math.ceil(Math.sqrt(count));
	const rows = Math.floor(count / columns);
	const overflowAmount = (count - columns * rows);
	const rowsWithOverflow = rows + (overflowAmount > 0 ? 1 : 0);

	return {
		columns,
		rows,
		rowsWithOverflow,
		overflowAmount,
	};
}
