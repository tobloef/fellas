export function getRowsAndColumns(count) {
	const columns = Math.ceil(Math.sqrt(count));
	const rows = Math.floor(count / columns);
	const overflowAmount = (count - columns * rows);
	const rowsWithOverflow = rows + (overflowAmount > 0 ? 1 : 0);

	return {
		columns,
		rows,
		rowsWithOverflow,
		overflowAmount,
	};
}
