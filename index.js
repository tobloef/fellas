import './state/options.js';
import { setupDebugGui } from './state/debug-gui.js';
import { createState } from './state/state.js';
import { setStateFromSearchParams } from './state/search-params.js';
import { setupSizeObserver } from './state/size-observer.js';
import { setupInputHandlers } from './state/input-handlers.js';
import { setupRenderers } from './renderers/index.js';

const containerElement = document.querySelector('#container');

const state = createState();

setStateFromSearchParams(state);
setupDebugGui(state);
setupSizeObserver(state, containerElement);
setupInputHandlers(state, containerElement);
setupRenderers(state, containerElement);
