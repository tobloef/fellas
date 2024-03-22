import { WorkerMessageType } from './worker-message-type.js';
import { FellaCanvas } from './fella-canvas.js';

let fellasCanvas = null;

addEventListener('message', handleMessage);

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
		id,
		canvas,
		spriteSet,
		onlyDrawChanges,
		useSpriteSheet,
		camera,
		variationChangesPerFrame,
		animationChangesPerFrame,
		fellas,
		baseUrl,
		sendCanvasBitmaps,
	} = data;

	const ctx = canvas.getContext('2d', { alpha: false, antialias: false });
	ctx.imageSmoothingEnabled = false;

	fellasCanvas = new FellaCanvas({
		ctx,
		spriteSet,
		useCamera: camera != null,
		onlyDrawChanges,
		useSpriteSheet,
		camera,
		variationChangesPerFrame,
		animationChangesPerFrame,
		fellas,
		baseUrl,
	});

	if (sendCanvasBitmaps) {
		fellasCanvas.onLoop = async () => {
			const bitmap = await createImageBitmap(canvas);

			postMessage({
				type: WorkerMessageType.CANVAS_BITMAP,
				id,
				bitmap,
			}, [bitmap]);
		};
	}
}

function updateCamera(data) {
	fellasCanvas.updateCamera(data.camera);
}

function updateDisplaySize(data) {
	fellasCanvas.updateDisplaySize(data.width, data.height);
}
