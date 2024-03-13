import { AbstractRenderer } from '../abstract-renderer.js';
import { randomChoice } from '../../utils/random.js';
import { SpriteSets } from '../../state/sprite-sets.js';
import {
	ImgAnimationStrategy,
	ImgElementType,
	ImgOffsetStrategy,
} from '../../state/options.js';
import { countToRowsAndColumns } from '../../utils/count-to-rows-and-columns.js';

export class ImageRenderer extends AbstractRenderer {
	containerElement = null;
	state = null;
	fellas = [];
	animationFrame = null;
	fellasElement = null;
	lastUpdateTime = performance.now();

	constructor(state, containerElement) {
		super();

		this.state = state;
		this.containerElement = containerElement;

		this.setupStateObservers();
		this.setup();
		this.loop();
	}

	setupStateObservers() {
		this.state.observe('screenSize', this.updateDisplaySize.bind(this));
		this.state.observe('camera.offset', this.updateCamera.bind(this));
		this.state.observe([
			'options.count',
			'options.spriteSet',
			'options.isAnimatedByDefault',
			'options.img.offsetStrategy',
			'options.img.useUniqueImages',
			'options.img.elementType',
			'options.img.animationStrategy',
		], this.setup.bind(this));
	}

	setup() {
		this.containerElement.replaceChildren();

		const options = this.state.options;
		const spriteSet = SpriteSets[options.spriteSet];

		this.fellasElement = document.createElement('div');
		this.containerElement.appendChild(this.fellasElement);

		this.updateDisplaySize();
		this.updateCamera();

		this.fellas.forEach((fella) => fella.element.remove());
		this.fellas = [];

		for (let i = 0; i < options.count; i++) {
			const fella = {
				isAnimated: options.isAnimatedByDefault,
				variation: randomChoice(spriteSet.variations),
				frame: 0,
				timeOnFrame: 0,
				needsSrcUpdate: true,
			};

			switch (options.img.elementType) {
				case ImgElementType.IMG:
					fella.element = document.createElement('img');
					fella.element.draggable = false;
					break;
				case ImgElementType.DIV:
					fella.element = document.createElement('div');
					fella.element.className = 'image-div';
					fella.element.style.width = `${spriteSet.width}px`;
					fella.element.style.height = `${spriteSet.height}px`;
					break;
				default:
					throw new Error(`Unknown element type "${options.img.elementType}".`);
			}

			this.fellasElement.appendChild(fella.element);
			this.fellas.push(fella);
		}

		this.updateImages();
	}

	updateImages() {
		const manuallyAnimating = this.state.options.img.animationStrategy !== ImgAnimationStrategy.GIF;

		const updateTime = performance.now();
		const deltaTime = updateTime - this.lastUpdateTime;
		this.lastUpdateTime = updateTime;

		const spriteSet = SpriteSets[this.state.options.spriteSet];
		// For performance reasons, don't access the options object directly in the loop.
		const srcUpdateOptions = {
			animationStrategy: this.state.options.img.animationStrategy,
			useUniqueImages: this.state.options.img.useUniqueImages,
			elementType: this.state.options.img.elementType,
			spriteSet,
		}

		if (this.state.options.img.animationStrategy === ImgAnimationStrategy.SPRITE_SHEET) {
			srcUpdateOptions.spriteSheetCoordinates = [];
			for (let frame = 0; frame < spriteSet.frames; frame++) {
				const x = (frame % spriteSet.spriteSheetDimensions.columns) * spriteSet.width;
				const y = Math.floor(frame / spriteSet.spriteSheetDimensions.columns) * spriteSet.height;
				srcUpdateOptions.spriteSheetCoordinates[frame] = { x, y };
			}
		}

		for (const fella of this.fellas) {
			if (manuallyAnimating && fella.isAnimated) {
				fella.timeOnFrame += deltaTime;
				if (fella.timeOnFrame > spriteSet.frameDuration) {
					const addedFrames = Math.floor(fella.timeOnFrame / spriteSet.frameDuration);
					fella.timeOnFrame = fella.timeOnFrame % spriteSet.frameDuration;
					fella.frame = (fella.frame + addedFrames) % spriteSet.frames;
					fella.needsSrcUpdate = true;
				}
			}

			if (fella.needsSrcUpdate) {
				this.updateFellaSrc(fella, srcUpdateOptions);
				fella.needsSrcUpdate = false;
			}
		}
	}

	updateFellaSrc(fella, options) {
		if (!fella.isAnimated) {
			if (options.animationStrategy === ImgAnimationStrategy.SPRITE_SHEET) {
				fella.element.style.backgroundImage = null;
				fella.element.style.backgroundSize = null;
				fella.element.style.backgroundRepeat = null;
				fella.element.style.backgroundPosition = null;
				fella.currentSpriteSheet = null;
			}
			this.updateFellaSrcSingleImage(fella, options);
			return;
		}

		switch (options.animationStrategy) {
			case ImgAnimationStrategy.GIF:
				this.updateFellaSrcSingleImage(fella, options);
				break;
			case ImgAnimationStrategy.FRAMES:
				const src = options.spriteSet.assets.frame[fella.variation][fella.frame];
				this.setElementSrc(fella, options, src);
				break;
			case ImgAnimationStrategy.SPRITE_SHEET:
				this.updateFellaSrcSpriteSheet(fella, options);
				break;
		}
	}

	updateFellaSrcSingleImage(fella, options) {
		let src = fella.isAnimated
			? options.spriteSet.assets.animated[fella.variation]
			: options.spriteSet.assets.still[fella.variation];

		if (options.useUniqueImages) {
			src += `?${Math.random()}`;
		}

		this.setElementSrc(fella, options, src);
	}

	setElementSrc(fella, options, src) {
		if (options.elementType === ImgElementType.IMG) {
			fella.element.src = src;
		} else if (options.elementType === ImgElementType.DIV) {
			fella.element.style.backgroundImage = `url(${src})`;
		}
	}

	updateFellaSrcSpriteSheet(fella, options) {
			if (fella.currentSpriteSheet !== fella.variation) {
				if (fella.currentSpriteSheet == null) {
					const spriteSheetWidth = options.spriteSet.width * options.spriteSet.spriteSheetDimensions.columns;
					const spriteSheetHeight = options.spriteSet.height * options.spriteSet.spriteSheetDimensions.rows;
					fella.element.style.backgroundRepeat = 'no-repeat';
					fella.element.style.backgroundSize = `${spriteSheetWidth}px ${spriteSheetHeight}px`;
				}
				const src = options.spriteSet.assets.spriteSheet[fella.variation];
				fella.element.style.backgroundImage = `url(${src})`;
				fella.currentSpriteSheet = fella.variation;
		}

		const {x, y} = options.spriteSheetCoordinates[fella.frame];
		fella.element.style.backgroundPosition = `-${x}px -${y}px`;
	}

	updateDisplaySize() {
		const options = this.state.options;
		const spriteSet = SpriteSets[options.spriteSet];
		const { rowsWithOverflow, columns } = countToRowsAndColumns(options.count);
		this.fellasElement.className = 'transform-wrapper';
		this.fellasElement.style.width = `${columns * spriteSet.width}px`;
		this.fellasElement.style.height = `${rowsWithOverflow * spriteSet.height}px`;
	}

	updateCamera() {
		const options = this.state.options;
		const { offset, scale } = this.state.camera;

		switch (options.img.offsetStrategy) {
			case ImgOffsetStrategy.POSITION:
				this.fellasElement.style.left = `${offset.x * scale}px`;
				this.fellasElement.style.top = `${offset.y * scale}px`;
				this.fellasElement.style.transform = `scale(${scale})`;
				break;
			case ImgOffsetStrategy.TRANSLATE:
				const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
				this.fellasElement.style.transform = transform;
				this.fellasElement.style.left = '0';
				this.fellasElement.style.top = '0';
				break;
			default:
				throw new Error(`Unknown offset strategy "${options.img.offsetStrategy}".`);
		}
	}

	loop() {
		this.swapFellaVariations();
		this.swapFellaAnimations();
		this.updateImages();

		this.animationFrame = requestAnimationFrame(this.loop.bind(this));
	}

	destroy() {
		cancelAnimationFrame(this.animationFrame);
		this.containerElement.replaceChildren()
	}

	swapFellaVariations() {
		const options = this.state.options;

		const spriteSet = SpriteSets[options.spriteSet];

		for (let i = 0; i < options.variationChangesPerFrame; i++) {
			const fella = randomChoice(this.fellas);
			fella.variation = randomChoice(spriteSet.variations);
			fella.frame = 0;
			fella.timeOnFrame = 0;
			fella.needsSrcUpdate = true;
		}
	}

	swapFellaAnimations() {
		const options = this.state.options;

		for (let i = 0; i < options.animationChangesPerFrame; i++) {
			const fella = randomChoice(this.fellas);
			fella.isAnimated = !fella.isAnimated;
			fella.frame = 0;
			fella.timeOnFrame = 0;
			fella.needsSrcUpdate = true;
		}
	}
}
