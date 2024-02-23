// Elements

const containerElement = document.querySelector('#container');
const fellasElement = document.querySelector('#fellas');
const countXInputElement = document.querySelector('#countX');
const countYInputElement = document.querySelector('#countY');
const totalCountElement = document.querySelector('#totalCount');

// Parameters

const spriteWidth = 64;
const spriteHeight = 64;

let countX = 100;
let countY = 100;

let count = countX * countY;

const minScale = 0.01;
const maxScale = 20;
const scrollSensitivity = 0.005;

let scale = 0.05;

let offset = { x: 0, y: 0 };

let dragging = false;

// Fella factory

const fellas = [];

const colors = [
	'green',
	'red',
	'purple',
	'yellow',
];

const still_urls = colors.map(color => `assets/froggy/froggy_${color}/tile000.png`);
const animated_urls = colors.map(color => `assets/froggy/froggy_${color}.gif`);

const randomUrl = (urls, unique = true) => urls[randomInt(0, urls.length - 1)] + (unique ? `?${Math.random()}` : '');

const createFella = () => {
	const fella = document.createElement('img');
	fella.src = randomUrl(still_urls);
	fella.draggable = false;
	fellasElement.appendChild(fella);
	return fella;
};

const ensureFellas = (count) => {
	if (fellas.length > count) {
		const fellasToRemove = fellas.length - count;
		const removedFellas = fellas.splice(0, fellasToRemove);
		removedFellas.forEach(fella => fella.remove());
	}

	if (fellas.length < count) {
		const fellasToAdd = count - fellas.length;
		for (let i = 0; i < fellasToAdd; i++) {
			const fella = createFella();
			fellas.push(fella);
		}
	}
};

// Initialization

updateCount(countX, countY);
updateScale(scale);
updateOffset(getCenteredOffset());

// Event listeners

containerElement.addEventListener('mousedown', () => {
	dragging = true;
});

containerElement.addEventListener('mouseup', () => {
	dragging = false;
});

containerElement.addEventListener('mouseleave', () => {
	dragging = false;
});

containerElement.addEventListener('mousemove', (e) => {
	if (!dragging) {
		return;
	}

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

containerElement.addEventListener('wheel', (e) => {
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

countXInputElement.addEventListener('change', () => {
	const newCountX = countXInputElement.value;
	updateCount(newCountX, countY);
});

countYInputElement.addEventListener('change', () => {
	const newCountY = countYInputElement.value;
	updateCount(countX, newCountY);
});

// Fella updates

const swapFellas = () => {
	const swapsPerFrame = 1;
	for (let i = 0; i < swapsPerFrame; i++) {
		const fella = fellas[randomInt(0, fellas.length - 1)];
		if (fella.src.includes('.gif')) {
			fella.src = randomUrl(still_urls);
		} else {
			fella.src = randomUrl(animated_urls);
		}
	}
};

const animateFellas = () => {
	const animatesPerFrame = 1;
	for (let i = 0; i < animatesPerFrame; i++) {
		const fella = fellas[randomInt(0, fellas.length - 1)];
		if (fella.src.includes('.gif')) {
			fella.src = randomUrl(still_urls);
		} else {
			fella.src = randomUrl(animated_urls);
		}
	}
};

const animate = () => {
	swapFellas();
	animateFellas();
	requestAnimationFrame(animate);
};
animate();

// Parameter update functions

function updateScale(newScale) {
	scale = newScale;

	fellasElement.style.transform = `scale(${scale})`;
}

function updateOffset(newOffset) {
	offset = newOffset;

	fellasElement.style.top = `${offset.y * scale}px`;
	fellasElement.style.left = `${offset.x * scale}px`;
}

function updateCount(newCountX, newCountY) {
	countX = newCountX;
	countY = newCountY;

	count = countX * countY;

	ensureFellas(count);

	fellasElement.style.width = `${countX * spriteWidth}px`;
	fellasElement.style.height = `${countY * spriteHeight}px`;

	countXInputElement.value = countX;
	countYInputElement.value = countY;
	totalCountElement.innerText = count.toLocaleString();
}

// Helper functions

function mousePosToWorldPos(mousePos, scale, offset) {
	return {
		x: (mousePos.x / scale) - offset.x,
		y: (mousePos.y / scale) - offset.y,
	};
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function getCenteredOffset() {
	return {
		x: ((containerElement.clientWidth / 2) / scale) - (countX * spriteWidth / 2),
		y: ((containerElement.clientHeight / 2) / scale) - (countY * spriteHeight / 2),
	}
}
