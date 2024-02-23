// Parameters

const USE_CSS_TRANSFORM = true;
const USE_DIFF_DRAW = true;
const USE_WORKER = true;
const USE_BITMAP = true; // Needs to be true if USE_WORKER is true
const BULK_POST_SWAPS = true; // Required when swaps per frame is high

const SWAPS_PER_FRAME = 10000;

const spriteWidth = 64;
const spriteHeight = 64;

let countX = 250;
let countY = 250;
let count = countX * countY;

const minScale = 0.01;
const maxScale = 20;
const scrollSensitivity = 0.005;

let scale = 1;
let offset = { x: 0, y: 0 };

let dragging = false;
let needsGlobalRedraw = true;
let didPan = false;

// Elements

const canvasElement = document.querySelector('#canvas');
const containerElement = document.querySelector('#container');
const countXInputElement = document.querySelector('#countX');
const countYInputElement = document.querySelector('#countY');
const totalCountElement = document.querySelector('#totalCount');

let canvas = canvasElement;
let worker;

if (USE_WORKER) {
	const offscreenCanvas = canvasElement.transferControlToOffscreen();
	canvas = offscreenCanvas;
	worker = new Worker('canvas-worker.js');
}

// Fella factory

const fellas = [];

const images = {};

const colors = [
	'green',
	'red',
	'purple',
	'yellow',
];

const still_urls = colors.map(color => `assets/froggy/froggy_${color}/tile000.png`);
const animated_urls = colors.map(color => `assets/froggy/froggy_${color}.gif`);

const randomUrl = (urls, unique = false) => urls[randomInt(0, urls.length - 1)] + (unique ? `?${Math.random()}` : '');

const createFella = async () => {
	const url = randomUrl(still_urls);

	if (!images[url]) {
		const image = new Image();
		image.src = url;
		await image.decode();
		if (USE_BITMAP) {
			const bitmap = await createImageBitmap(image);
			images[url] = bitmap;
		} else {
			images[url] = image;
		}
	}

	return { url, needsRedraw: true };
};

const ensureFellas = async (count) => {
	if (fellas.length > count) {
		const fellasToRemove = fellas.length - count;
		const removedFellas = fellas.splice(0, fellasToRemove);
	}

	if (fellas.length < count) {
		const fellasToAdd = count - fellas.length;
		for (let i = 0; i < fellasToAdd; i++) {
			const fella = await createFella();
			fellas.push(fella);
		}
	}

	if (USE_WORKER) {
		worker.postMessage({ type: 'fellas', fellas });
	}
};

// Setup

let ctx;

observeSize(canvasElement, (width, height) => {
	canvas.width = width;
	canvas.height = height;

	if (ctx != null) {
		ctx.imageSmoothingEnabled = false;
	}

	needsGlobalRedraw = true;

	if (USE_WORKER) {
		worker.postMessage({ type: 'size', width, height });
	}

	if (!didPan) {
		updateOffset(getCenteredOffset());
	}
});

await updateCount(countX, countY);
updateScale(scale);
updateOffset(getCenteredOffset());

if (USE_WORKER) {
	worker.postMessage(
		{
			type: 'setup',
			canvas,
			USE_DIFF_DRAW,
			USE_CSS_TRANSFORM,
			USE_BITMAP,
			spriteWidth,
			spriteHeight,
			countX,
			countY,
			scale,
			offset,
			images,
			urls: still_urls,
		},
		[ canvas ],
	);
} else {
	ctx = canvasElement.getContext('2d', { alpha: false, antialias: false });
	ctx.imageSmoothingEnabled = false;
}

// Update functions

async function updateCount(newCountX, newCountY) {
	countX = newCountX;
	countY = newCountY;

	count = countX * countY;

	await ensureFellas(count);

	if (USE_CSS_TRANSFORM) {
		canvasElement.style.width = `${countX * spriteWidth}px`;
		canvasElement.style.height = `${countY * spriteHeight}px`;
	}

	countXInputElement.value = countX;
	countYInputElement.value = countY;
	totalCountElement.innerText = count.toLocaleString();

	if (USE_WORKER) {
		worker.postMessage({ type: 'count', countX, countY });
	}
}

function updateOffset(newOffset) {
	const integerOffset = {
		x: Math.round(newOffset.x),
		y: Math.round(newOffset.y),
	};

	offset = newOffset;

	if (USE_CSS_TRANSFORM) {
		canvasElement.style.top = `${offset.y * scale}px`;
		canvasElement.style.left = `${offset.x * scale}px`;
	} else {
		needsGlobalRedraw = true;
		if (USE_WORKER) {
			worker.postMessage({ type: 'offset', offset });
		}
	}
}

function updateScale(newScale) {
	scale = newScale;

	if (USE_CSS_TRANSFORM) {
		canvasElement.style.transform = `scale(${scale})`;
	} else {
		if (USE_WORKER) {
			worker.postMessage({ type: 'scale', scale });
		}
	}
}

// Event listeners

const mouseDraggerElement = USE_CSS_TRANSFORM ? containerElement : canvasElement;

mouseDraggerElement.addEventListener('mousedown', () => {
	dragging = true;
});

mouseDraggerElement.addEventListener('mouseup', () => {
	dragging = false;
});

mouseDraggerElement.addEventListener('mouseleave', () => {
	dragging = false;
});

mouseDraggerElement.addEventListener('mousemove', (e) => {
	if (!dragging) {
		return;
	}

	didPan = true;

	const newMousePos = {
		x: e.clientX,
		y: e.clientY,
	};

	const oldMousePos = {
		x: newMousePos.x - e.movementX,
		y: newMousePos.y - e.movementY,
	};

	const oldWorldPos = mousePosToWorldPos(oldMousePos, scale, offset);
	const newWorldPos = mousePosToWorldPos(newMousePos, scale, offset);

	const deltaWorldPos = {
		x: newWorldPos.x - oldWorldPos.x,
		y: newWorldPos.y - oldWorldPos.y,
	};

	const newOffset = {
		x: offset.x + deltaWorldPos.x,
		y: offset.y + deltaWorldPos.y,
	};

	updateOffset(newOffset);
});

mouseDraggerElement.addEventListener('wheel', (e) => {
	e.preventDefault();

	const delta = e.deltaY * scrollSensitivity;

	const oldScale = scale;

	const newScale = clamp(
		oldScale - (delta * oldScale),
		minScale,
		maxScale,
	);

	const mousePos = {
		x: e.clientX,
		y: e.clientY,
	};

	const oldWorldPos = mousePosToWorldPos(mousePos, oldScale, offset);
	const newWorldPos = mousePosToWorldPos(mousePos, newScale, offset);

	const deltaWorldPos = {
		x: newWorldPos.x - oldWorldPos.x,
		y: newWorldPos.y - oldWorldPos.y,
	};

	const newOffset = {
		x: offset.x + deltaWorldPos.x,
		y: offset.y + deltaWorldPos.y,
	};

	updateScale(newScale);
	updateOffset(newOffset);
});

countXInputElement.addEventListener('change', async () => {
	const newCountX = countXInputElement.value;
	await updateCount(newCountX, countY);
});

countYInputElement.addEventListener('change', async () => {
	const newCountY = countYInputElement.value;
	await updateCount(countX, newCountY);
});

// Rendering

const draw = () => {
	if (!USE_DIFF_DRAW || needsGlobalRedraw) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	for (let i = 0; i < fellas.length; i++) {
		const fella = fellas[i];

		if (!fella.needsRedraw && !needsGlobalRedraw && USE_DIFF_DRAW) {
			continue;
		}

		let width = spriteWidth;
		let height = spriteHeight;

		if (!USE_CSS_TRANSFORM) {
			width *= scale;
			height *= scale;
		}

		let x = (i % countX) * width;
		let y = Math.floor(i / countX) * height;

		if (!USE_CSS_TRANSFORM) {
			x += offset.x * scale;
			y += offset.y * scale;
		}

		if (USE_DIFF_DRAW) {
			ctx.clearRect(x, y, width, height);
		}

		const image = images[fella.url];

		ctx.drawImage(
			image,
			x,
			y,
			width,
			height,
		);

		fella.needsRedraw = false;
	}

	needsGlobalRedraw = false;
};

const swapFellas = () => {
	let bulkSwap = [];
	for (let i = 0; i < SWAPS_PER_FRAME; i++) {
		const fellaIndex = randomInt(0, fellas.length - 1);
		const url = randomUrl(still_urls);
		const fella = fellas[fellaIndex];
		fella.url = url;
		fella.needsRedraw = true;
		if (USE_WORKER) {
			if (!BULK_POST_SWAPS) {
				worker.postMessage({ type: 'swap', index: fellaIndex, fella });
			} else {
				bulkSwap.push({ index: fellaIndex, urlIndex: still_urls.indexOf(url) });
			}
		}
	}
	if (USE_WORKER && BULK_POST_SWAPS) {
		worker.postMessage({ type: 'swapBulk', fellas: bulkSwap });
	}
};

const renderLoop = () => {
	swapFellas();
	if (!USE_WORKER) {
		draw();
	}
	requestAnimationFrame(renderLoop);
};

renderLoop();

// Helper functions

function observeSize(
	element,
	callback,
) {
	let previousWidth = 0;
	let previousHeight = 0;

	const resizeObserver = new ResizeObserver((entries) => {
		for (const entry of entries) {
			const size = entry.devicePixelContentBoxSize?.[0];

			const width = size.inlineSize / window.devicePixelRatio;
			const height = size.blockSize / window.devicePixelRatio;

			if (
				width === previousWidth &&
				height === previousHeight
			) {
				return;
			}

			previousWidth = width;
			previousHeight = height;

			callback(width, height);
		}
	});

	resizeObserver.observe(element, { box: 'device-pixel-content-box' });

	const cleanup = () => {
		resizeObserver.disconnect();
	};

	return cleanup;
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mousePosToWorldPos(mousePos, scale, offset) {
	return {
		x: (mousePos.x / scale) - offset.x,
		y: (mousePos.y / scale) - offset.y,
	};
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function getCenteredOffset() {
	if (USE_CSS_TRANSFORM) {
		return {
			x: ((containerElement.clientWidth / 2) / scale) - (countX * spriteWidth / 2),
			y: ((containerElement.clientHeight / 2) / scale) - (countY * spriteHeight / 2),
		};
	} else {
		return {
			x: (canvas.width / scale) / 2 - ((countX * spriteWidth) / 2),
			y: (canvas.height / scale) / 2 - ((countY * spriteHeight) / 2),
		};
	}
}
