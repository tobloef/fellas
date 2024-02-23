import { SpriteOptions } from './options.js';

export const Sprites = {
	[SpriteOptions.FROG]: {
		width: 64,
		height: 64,
		variations: ["green", "red", "purple", "yellow"],
		assets: {
			still: (variation) => `assets/froggy/froggy_${variation}/tile000.png`,
			animated: (variation) => `assets/froggy/froggy_${variation}.gif`,
		}
	},
};
