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
				return (observedPathOrPaths, callback) => {
					const observedPaths = Array.isArray(observedPathOrPaths)
						? observedPathOrPaths
						: [observedPathOrPaths];

					const wrappedCallback = (e) => {
						const { newValue, oldValue } = e.detail;
						if (newValue === oldValue) {
							return;
						}

						return callback(e.detail);
					};

					for (const observedPath of observedPaths) {
						if (unobservedProps.includes(observedPath)) {
							throw new Error(`Path "${observedPath}" is not observable.`);
						}

						eventTarget.addEventListener(observedPath, wrappedCallback);
					}

					return () => {
						for (const observedPath of observedPaths) {
							eventTarget.removeEventListener(observedPath, wrappedCallback);
						}
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

			const fullPath = parentPath ? `${parentPath}.${key}` : key;
			const parts = fullPath.split('.');

			[fullPath, ...parts].forEach((path) => {
				const isObservable = !unobservedProps.includes(path);

				if (isObservable) {
					eventTarget.dispatchEvent(
						new CustomEvent(path, { detail: { oldValue, newValue } }),
					);
				}
			})

			return true;
		},
	};
}
