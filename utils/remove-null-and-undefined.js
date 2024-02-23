export function removeUndefined(obj) {
	return Object.fromEntries(
		Object.entries(obj).filter(([ _, value ]) => value !== undefined),
	);
}

export function removeNull(obj) {
	return Object.fromEntries(
		Object.entries(obj).filter(([ _, value ]) => value !== null),
	);
}

export function removeNullAndUndefined(obj) {
	return removeNull(removeUndefined(obj));
}
