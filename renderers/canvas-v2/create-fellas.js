import {randomChoice} from "../../utils/random.js";

export function createFellas(count, isAnimatedByDefault, spriteSet) {
  let fellas = [];
  for (let i = 0; i < count; i++) {
    fellas[i] = {
      isAnimated: isAnimatedByDefault,
      variation: randomChoice(spriteSet.variations),
      needsRedraw: true,
      frame: 0,
      timeOnFrame: 0,
    };
  }
  return fellas;
}