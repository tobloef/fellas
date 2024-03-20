import { WorkerMessageType } from './worker-message-type.js';
import { CanvasThing } from './canvas-thing.js';
import { createFellas } from './create-fellas.js';

let canvasThing = null;
let fellas = null;

self.addEventListener('message', handleMessage);

function handleMessage(event) {
	switch (event.data.type) {
		case WorkerMessageType.SETUP:
			setup(event.data);
			break;
		case WorkerMessageType.UPDATE_CAMERA:
			updateCamera(event.data);
			break;
		case WorkerMessageType.UPDATE_DISPLAY_SIZE:
			updateDisplaySize(event.data);
			break;
	}
}

function setup(data) {
	const {
		canvas,
		spriteSet,
		onlyDrawChanges,
		useSpriteSheet,
		camera,
		variationChangesPerFrame,
		animationChangesPerFrame,
		isAnimatedByDefault,
		count,
		baseUrl,
	} = data;

	const ctx = canvas.getContext('2d', { alpha: false, antialias: false });
	ctx.imageSmoothingEnabled = false;

	fellas = createFellas(count, isAnimatedByDefault, spriteSet);

	canvasThing = new CanvasThing({
		ctx,
		spriteSet,
		useCamera: true,
		onlyDrawChanges,
		useSpriteSheet,
		camera,
		variationChangesPerFrame,
		animationChangesPerFrame,
		fellas,
		baseUrl,
	});
}

function updateCamera(data) {
	canvasThing.updateCamera(data.camera);
}

function updateDisplaySize(data) {
	canvasThing.updateDisplaySize(data.width, data.height);
}
