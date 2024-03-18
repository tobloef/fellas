import {randomChoice} from "../../utils/random.js";
import {countToRowsAndColumns} from "../../utils/count-to-rows-and-columns.js";

export function createFellas(count, isAnimatedByDefault, spriteSet) {
  const { columns, rowsWithOverflow: rows } = countToRowsAndColumns(count);

  let column = 0;
  let row = 0;

  let fellas = [];
  for (let i = 0; i < count; i++) {
    fellas[i] = {
      isAnimated: isAnimatedByDefault,
      variation: randomChoice(spriteSet.variations),
      needsRedraw: true,
      frame: 0,
      timeOnFrame: 0,
      x: column * spriteSet.width,
      y: row * spriteSet.height,
    };

    column++;
    if (column >= columns) {
      column = 0;
      row++;
    }
  }
  return fellas;
}