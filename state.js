const DEFAULT_STATE = {
	options: {},
	camera: {},
	world: {},
}

const UNOBSERVED_PROPS = [

];

export const state = new Proxy(
	DEFAULT_STATE,
	getNestedObservableProxyHandler(UNOBSERVED_PROPS)
);

function getNestedObservableProxyHandler(
	unobservedProps = [],
	parentPath = null,
	eventTarget = new EventTarget(),
) {
	return {
		get(target, key) {
			const path = parentPath ? `${parentPath}.${key}` : key;
			const isObservable = !unobservedProps.includes(parentPath) && !unobservedProps.includes(path);

			if (key === 'observe' && isObservable) {
				return (callback) => {
					eventTarget.addEventListener(parentPath, callback);
					return () => {
						eventTarget.removeEventListener(parentPath, callback);
					}
				};
			}

			const isObject = typeof target[key] === 'object' && target[key] !== null;

			if (isObject && isObservable) {
				return new Proxy(target[key], getNestedObservableProxyHandler(path, eventTarget));
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
