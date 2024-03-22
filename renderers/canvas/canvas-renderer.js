import { CanvasOffsetStrategy } from '../../state/options.js';
import { CanvasRendererObservers } from './observers.js';
import { DirectCanvasSubrenderer } from './sub-renderers/direct.js';
import { DirectWorkerCanvasSubrenderer } from './sub-renderers/direct-worker.js';
import { TiledCanvasSubrenderer } from './sub-renderers/tiled.js';
import { TiledWorkerCanvasSubrenderer } from './sub-renderers/tiled-worker.js';
import { BufferedCanvasSubrenderer } from './sub-renderers/buffered.js';
import { BufferedWorkerCanvasSubrenderer } from './sub-renderers/buffered-worker.js';

export class CanvasRenderer {
	containerElement = null;
	state = null;
	observers = null;
	subrenderer = null;

	constructor(state, containerElement) {
		this.state = state;
		this.containerElement = containerElement;

		this.setup();
	}

	setup() {
		this.destroy();

		const SubrendererClass = this.getSubrendererClass();
		this.subrenderer = new SubrendererClass(
			this.state,
			this.containerElement,
		);

		this.subrenderer.setup();
		this.subrenderer.updateScreenSize();
		this.subrenderer.updateCamera();

		this.observers = new CanvasRendererObservers(this.state, {
			onScreenSizeUpdate: this.subrenderer.updateScreenSize.bind(this.subrenderer),
			onCameraUpdate: this.subrenderer.updateCamera.bind(this.subrenderer),
			onOptionsUpdate: this.setup.bind(this),
		});
	}

	getSubrendererClass() {
		const {
			canvas: {
				offsetStrategy,
				useWorker,
			},
		} = this.state.options;

		const isDirect = offsetStrategy === CanvasOffsetStrategy.DIRECT_CANVAS;
		const isTiled = offsetStrategy === CanvasOffsetStrategy.CSS_TRANSFORM;
		const isBuffered = offsetStrategy === CanvasOffsetStrategy.BUFFER_CANVAS;

		switch (true) {
			case isDirect && !useWorker:
				return DirectCanvasSubrenderer;
			case isDirect && useWorker:
				return DirectWorkerCanvasSubrenderer;
			case isTiled && !useWorker:
				return TiledCanvasSubrenderer;
			case isTiled && useWorker:
				return TiledWorkerCanvasSubrenderer;
			case isBuffered && !useWorker:
				return BufferedCanvasSubrenderer;
			case isBuffered && useWorker:
				return BufferedWorkerCanvasSubrenderer;
			default:
				throw new Error('Couldn\'t find an appropriate subrenderer.');
		}
	}

	destroy() {
		this.subrenderer?.destroy();
		this.subrenderer = null;
		this.observers?.destroy();
		this.observers = null;
		this.containerElement.replaceChildren();
	}
}
