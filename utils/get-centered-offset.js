import { getRowsAndColumns } from './get-rows-and-columns';

function getCenteredOffset(worldDimensions, spriteDimensions, spriteCount, cameraScale) {
	let { rows, rowsWithOverflow } = getRowsAndColumns(spriteCount);

	return {
		x: ((worldDimensions.x / 2) / cameraScale) - (rowsWithOverflow * spriteDimensions.x / 2),
		y: ((worldDimensions.y / 2) / cameraScale) - (rows * spriteDimensions.y / 2),
	};
}
