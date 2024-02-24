const STATE_TO_SEARCH_PARAMS = {
	options: {
		renderer: string,
		spriteSet: string,
		isAnimatedByDefault: boolean,
		count: integer,
		variationChangesPerFrame: integer,
		animationChangesPerFrame: integer,
		img: {
			offsetStrategy: string, useUniqueImages: boolean, elementType: string,
		},
	},
};

export function copyStateAsUrl(state) {
	const searchParams = getSearchParamsFromState(state);
	const url = searchParamsToUrl(searchParams);
	navigator.clipboard.writeText(url);
}

export function setStateFromSearchParams(state) {
	const searchParams = new URLSearchParams(window.location.search);

	const flattenedState = flattenNestedObject(STATE_TO_SEARCH_PARAMS);

	Object.keys(flattenedState)
		.forEach((key) => {
			const mapper = flattenedState[key];
			const value = mapper(searchParams.get(key));

			if (value == null) {
				return;
			}

			const parentRef = flattenedKeyToParentRef(state, key);
			const lastKey = key.split('.').pop();

			parentRef[lastKey] = value;
		});
}

export function getSearchParamsFromState(state) {
	const searchParams = new URLSearchParams();

	const flattenedState = flattenNestedObject(STATE_TO_SEARCH_PARAMS);

	Object.keys(flattenedState)
		.forEach((key) => {
			const currentValue = flattenedKeyToValue(state, key);
			searchParams.set(key, currentValue);
		});

	return searchParams;
}

export function observeStateToUpdateSearchParams(state) {
	const flattenedState = flattenNestedObject(STATE_TO_SEARCH_PARAMS);

	Object.keys(flattenedState)
		.forEach((key) => {
			state.observe(key, ({ newValue }) => {
				const searchParams = new URLSearchParams(window.location.search);
				searchParams.set(key, newValue);
				setUrl(searchParamsToUrl(searchParams));
			});
		});
}

function combineSearchParams(...searchParams) {
	const combinedSearchParams = new URLSearchParams();

	for (const params of searchParams) {
		for (const [ key, value ] of params) {
			combinedSearchParams.set(key, value);
		}
	}

	return combinedSearchParams;
}

function searchParamsToUrl(searchParams) {
	return `${window.location.origin}${window.location.pathname}?${searchParams}`;
}

function setUrl(url) {
	window.history.replaceState({}, '', url);
}

function flattenNestedObject(obj, parentPath = '') {
	const result = {};

	for (const [ key, value ] of Object.entries(obj)) {
		const path = parentPath ? `${parentPath}.${key}` : key;
		if (typeof value === 'object') {
			Object.assign(result, flattenNestedObject(value, path));
		} else {
			result[path] = value;
		}
	}

	return result;
}

function flattenedKeyToParentRef(obj, key) {
	const keys = key.split('.').slice(0, -1);
	let ref = obj;
	for (const key of keys) {
		ref = ref[key];
	}
	return ref;
}

function flattenedKeyToValue(obj, key) {
	const keys = key.split('.');
	let value = obj;
	for (const key of keys) {
		value = value[key];
	}
	return value;
}

function string(string) {
	return string;
}

function boolean(string) {
	return string ? string === 'true' : string;
}

function integer(string) {
	return string ? parseInt(string) : string;
}
