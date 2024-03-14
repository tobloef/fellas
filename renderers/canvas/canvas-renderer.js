import { AbstractRenderer } from '../abstract-renderer.js';
import { CanvasOffsetStrategy } from '../../state/options.js';
import { DirectCanvasSubRenderer } from './sub-renderers/direct-canvas-renderer.js';
import { BufferedCanvasSubRenderer } from './sub-renderers/buffered-canvas-renderer.js';
import { TiledCanvasSubRenderer } from './sub-renderers/tiled-canvas-renderer.js';

export class CanvasRenderer extends AbstractRenderer {
	subRenderer = null;
	containerElement = null;
	state = null;
	animationFrame = null;

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
			'options.canvas.offsetStrategy',
		], this.setup.bind(this));
	}

	setup() {
		this.subRenderer?.destroy();

		switch (this.state.options.canvas.offsetStrategy) {
			case CanvasOffsetStrategy.DIRECT_CANVAS:
				this.subRenderer = new DirectCanvasSubRenderer(this.state, this.containerElement);
				break;
			case CanvasOffsetStrategy.CSS_TRANSFORM:
				this.subRenderer = new TiledCanvasSubRenderer(this.state, this.containerElement);
				break;
			case CanvasOffsetStrategy.BUFFER_CANVAS:
				this.subRenderer = new BufferedCanvasSubRenderer(this.state, this.containerElement);
				break;
			default:
				throw new Error(`Unknown canvas offset strategy: ${this.state.options.canvas.offsetStrategy}`);
		}

		this.subRenderer.setup();
		this.updateDisplaySize();
		this.updateCamera();
	}

	updateDisplaySize() {
		this.subRenderer.updateDisplaySize();
	}

	updateCamera() {
		this.subRenderer.updateCamera();
	}

	loop() {
		this.subRenderer.loop();
		this.animationFrame = requestAnimationFrame(this.loop.bind(this));
	}

	destroy() {
		this.subRenderer.destroy();
		cancelAnimationFrame(this.animationFrame);
		this.containerElement.replaceChildren();
	}
}
