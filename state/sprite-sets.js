import {SpriteSetOptions} from "./options.js";

export const SpriteSets = {
  [SpriteSetOptions.FROG]: {
    width: 64,
    height: 64,
    frames: 12,
    frameDuration: 1000 * (1 / 10),
    variations: ["green", "red", "purple", "yellow"],
    spriteSheetDimensions: { rows: 3, columns: 4 },
    assetGenerators: {
      stills: (variation) => `assets/froggy/froggy_${variation}/tile000.png`,
      animated: (variation) => `assets/froggy/froggy_${variation}.gif`,
      spriteSheets: (variation) => `assets/froggy/froggy_${variation}.png`,
      frames: (variation, frame) => `assets/froggy/froggy_${variation}/tile${String(frame).padStart(3, "0")}.png`,
    },
  },
};

Object.values(SpriteSets).forEach((spriteSet) => {
  spriteSet.assets = {
    stills: {},
    animated: {},
    spriteSheets: {},
    frames: {},
  };

  spriteSet.variations.forEach((variation) => {
    spriteSet.assets.stills[variation] = spriteSet.assetGenerators.stills(variation);
    spriteSet.assets.animated[variation] = spriteSet.assetGenerators.animated(variation);
    spriteSet.assets.spriteSheets[variation] = spriteSet.assetGenerators.spriteSheets(variation);
    spriteSet.assets.frames[variation] = Array.from({ length: spriteSet.frames }, (_, i) => spriteSet.assetGenerators.frames(variation, i));
  });

  spriteSet.assetGenerators = null;
});
