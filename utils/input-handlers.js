import { clamp } from "./clamp.js";

export function initialize(element, camera, handlers) {
	element.addEventListener('mousedown', () => {
		camera.dragging = true;
	});

	element.addEventListener('mouseup', () => {
		camera.dragging = false;
	});

	element.addEventListener('mouseleave', () => {
		camera.dragging = false;
	});

	element.addEventListener('mousemove', (e) => {
		if (!camera.dragging) {
			return;
		}

		camera.hasPanned = true;

		const newMousePos = {
			x: e.clientX,
			y: e.clientY,
		};

		const oldMousePos = {
			x: newMousePos.x - e.movementX,
			y: newMousePos.y - e.movementY,
		};

		const oldWorldPos = mousePosToWorldPos(oldMousePos, camera.scale, camera.offset);
		const newWorldPos = mousePosToWorldPos(newMousePos, camera.scale, camera.offset);

		const deltaWorldPos = {
			x: newWorldPos.x - oldWorldPos.x,
			y: newWorldPos.y - oldWorldPos.y,
		};

		camera.offset = {
			x: camera.offset.x + deltaWorldPos.x,
			y: camera.offset.y + deltaWorldPos.y,
		};

		handlers.onOffsetUpdated?.();
	});

	element.addEventListener('wheel', (e) => {
		e.preventDefault();

		const delta = e.deltaY * camera.zoomSensitivity;

		const oldScale = camera.scale;

		const newScale = clamp(
			oldScale - (delta * oldScale),
			camera.minScale,
			camera.maxScale,
		);

		const mousePos = {
			x: e.clientX,
			y: e.clientY,
		};

		const oldWorldPos = mousePosToWorldPos(mousePos, oldScale, camera.offset);
		const newWorldPos = mousePosToWorldPos(mousePos, newScale, camera.offset);

		const deltaWorldPos = {
			x: newWorldPos.x - oldWorldPos.x,
			y: newWorldPos.y - oldWorldPos.y,
		};

		const newOffset = {
			x: camera.offset.x + deltaWorldPos.x,
			y: camera.offset.y + deltaWorldPos.y,
		};

		camera.scale = newScale;
		camera.offset = newOffset;

		handlers.onScaleUpdated?.();
		handlers.onOffsetUpdated?.();
	});
}

function mousePosToWorldPos(mousePos, scale, offset) {
	return {
		x: (mousePos.x / scale) - offset.x,
		y: (mousePos.y / scale) - offset.y,
	};
}
