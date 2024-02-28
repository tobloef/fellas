import { SpriteSetOptions } from './options.js';

export const SpriteSets = {
	[SpriteSetOptions.FROG]: {
		width: 64,
		height: 64,
		variations: [ 'green', 'red', 'purple', 'yellow' ],
		assets: {
			still: (variation) => `assets/froggy/froggy_${variation}/tile000.png`,
			animated: (variation) => `assets/froggy/froggy_${variation}.gif`,
		},
	},
	[SpriteSetOptions.TEST]: {
		width: 250,
		height: 250,
		variations: ['8', '12.5', '16.66', '25', '33.33', '50', '60', '100'],
		assets: {
			still: (variation) => `assets/test_gifs/${variation}fps.png`,
			animated: (variation) => `assets/test_gifs/${variation}fps.gif`,
		},
	}
};
