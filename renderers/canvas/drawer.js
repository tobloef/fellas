import { getRowsAndColumns } from '../../utils/get-rows-and-columns.js';
import { SpriteSets } from '../../state/sprite-sets.js';

export function draw(ctx, state, fellas, needsGlobalRedraw) {
	const { options, camera } = state;

	if (!options.canvas.drawDeltas || needsGlobalRedraw) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	}

	const spriteSet = SpriteSets[options.spriteSet];

	let width = spriteSet.width;
	let height = spriteSet.height;

	if (!options.canvas.useCssTransform) {
		width *= camera.scale;
		height *= camera.scale;
	}

	let { columns } = getRowsAndColumns(options.count);

	for (let i = 0; i < fellas.length; i++) {
		const fella = fellas[i];

		if (options.canvas.drawDeltas && !fella.needsRedraw && !needsGlobalRedraw) {
			continue;
		}

		let x = (i % columns);
		let y = Math.floor(i / columns);

		x *= width;
		y *= height;

		if (!options.canvas.useCssTransform) {
			x += camera.offset.x * camera.scale;
			y += camera.offset.y * camera.scale;
		}

		if (options.canvas.drawDeltas) {
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
