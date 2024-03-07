import { countToRowsAndColumns } from '../../utils/count-to-rows-and-columns.js';
import { SpriteSets } from '../../state/sprite-sets.js';
import {CanvasOffsetStrategy} from "../../state/options.js";

export function draw(ctx, state, fellas, needsGlobalRedraw) {
	const { options, camera } = state;

	if (!options.canvas.onlyDrawChanges || needsGlobalRedraw) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	}

	const spriteSet = SpriteSets[options.spriteSet];

	let width = spriteSet.width;
	let height = spriteSet.height;

	if (options.canvas.offsetStrategy === CanvasOffsetStrategy.FULL_REDRAW) {
		width *= camera.scale;
		height *= camera.scale;
	}

	let { columns } = countToRowsAndColumns(options.count);

	for (let i = 0; i < fellas.length; i++) {
		const fella = fellas[i];

		if (options.canvas.onlyDrawChanges && !fella.needsRedraw && !needsGlobalRedraw) {
			continue;
		}

		let x = (i % columns);
		let y = Math.floor(i / columns);

		x *= width;
		y *= height;

		if (options.canvas.offsetStrategy === CanvasOffsetStrategy.FULL_REDRAW) {
			x += camera.offset.x * camera.scale;
			y += camera.offset.y * camera.scale;
		}

		if (options.canvas.onlyDrawChanges) {
			ctx.clearRect(x, y, width, height);
		}

		ctx.drawImage(
			fella.image,
			x,
			y,
			width,
			height,
		);

		fella.needsRedraw = false;
	}
}
