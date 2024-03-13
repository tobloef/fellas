import { SpriteSetOptions } from './options.js';

export const SpriteSets = {
	[SpriteSetOptions.FROG]: {
		width: 64,
		height: 64,
		frames: 12,
		frameDuration: (1/10) * 1000,
		variations: [ 'green', 'red', 'purple', 'yellow' ],
		spriteSheetDimensions: { rows: 3, columns: 4 },
		assetGenerators: {
			still: (variation) => `assets/froggy/froggy_${variation}/tile000.png`,
			animated: (variation) => `assets/froggy/froggy_${variation}.gif`,
			spriteSheet: (variation) => `assets/froggy/froggy_${variation}.png`,
			frame: (variation, frame) => `assets/froggy/froggy_${variation}/tile${String(frame).padStart(3, '0')}.png`,
		},
	},
};

Object.entries(SpriteSets).forEach(([ key, value ]) => {
	value.assets = {
		still: {},
		animated: {},
		spriteSheet: {},
		frame: {},
	};

	value.variations.forEach((variation) => {
		value.assets.still[variation] = value.assetGenerators.still(variation);
		value.assets.animated[variation] = value.assetGenerators.animated(variation);
		value.assets.spriteSheet[variation] = value.assetGenerators.spriteSheet(variation);
		value.assets.frame[variation] = Array.from({ length: value.frames }, (_, i) => value.assetGenerators.frame(variation, i));
	});
});
