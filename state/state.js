import { DEFAULT_OPTIONS } from './options.js';
import { DEFAULT_CAMERA } from './camera.js';

const DEFAULT_STATE = {
	options: DEFAULT_OPTIONS,
	camera: DEFAULT_CAMERA,
	screenSize: { width: 0, height: 0 },
};

const UNOBSERVED_PROPS = [];

export function createState() {
	return new Proxy(
		DEFAULT_STATE,
		getRecursivelyObservableProxyHandler(UNOBSERVED_PROPS),
	);
}

function getRecursivelyObservableProxyHandler(
	unobservedProps = [],
	parentPath = null,
	eventTarget = new EventTarget(),
) {
	return {
		get(target, key) {
			const path = parentPath ? `${parentPath}.${key}` : key;
			if (parentPath == null && key === 'observe') {
				return (observedPath, callback) => {
					if (unobservedProps.includes(observedPath)) {
						throw new Error(`Path "${observedPath}" is not observable.`);
					}

					const wrappedCallback = (e) => callback(e.detail);

					eventTarget.addEventListener(observedPath, wrappedCallback);

					return () => {
						eventTarget.removeEventListener(observedPath, wrappedCallback);
					};
				};
			}

			const isObject = typeof target[key] === 'object' && target[key] !== null;

			if (isObject) {
				return new Proxy(target[key], getRecursivelyObservableProxyHandler(unobservedProps, path, eventTarget));
			}

			return target[key];
		},

		set(target, key, newValue) {
			const oldValue = target[key];
			target[key] = newValue;

			const path = parentPath ? `${parentPath}.${key}` : key;

			const isObservable = !unobservedProps.includes(path);
			if (isObservable) {
				eventTarget.dispatchEvent(
					new CustomEvent(path, { detail: { oldValue, newValue } }),
				);
			}

			return true;
		},
	};
}
