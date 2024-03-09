import './state/options.js';
import { setupDebugGui } from './state/debug-gui.js';
import { createState } from './state/state.js';
import {
	observeStateToUpdateSearchParams,
	setStateFromSearchParams,
} from './state/search-params.js';
import { setupSizeObserver } from './state/size-observer.js';
import { setupInputHandlers } from './state/input-handlers.js';
import { setupRenderers } from './renderers/index.js';
import {findMaxCanvasSize} from "./utils/max-canvas-size.js";
import {resolutionToCount} from "./utils/resolution-to-count.js";
import {SpriteSets} from "./state/sprite-sets.js";

const containerElement = document.querySelector('#container');

const state = createState();

observeStateToUpdateSearchParams(state); // TODO: Remove this in prod
setStateFromSearchParams(state);
setupDebugGui(state);
setupSizeObserver(state, containerElement);
setupInputHandlers(state, containerElement);
setupRenderers(state, containerElement);
