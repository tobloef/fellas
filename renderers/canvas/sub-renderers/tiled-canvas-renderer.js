import {countToRowsAndColumns} from '../../../utils/count-to-rows-and-columns.js';
import {SpriteSets} from '../../../state/sprite-sets.js';
import {CanvasFrameType} from "../../../state/options.js";

export class TiledCanvasSubRenderer {
  containerElement = null;
  state = null;
  canvasesElement = null;
  displayContexts = [];
  needsGlobalRedraw = false;
  images = {};
  fellas = [];
  spriteSheetCoordinates = [];

  constructor(state, containerElement) {
    this.state = state;
    this.containerElement = containerElement;
  }

  setupCanvases() {
    this.containerElement?.replaceChildren();
    this.displayContexts = [];

    const spriteSet = SpriteSets[this.state.options.spriteSet];
    const maxCanvasSize = this.state.options.canvas.maxCanvasSize;

    const {
      columns: neededColumns,
      rowsWithOverflow: neededRows,
    } = countToRowsAndColumns(this.state.options.count);

    const neededWidth = neededColumns * spriteSet.width;
    const neededHeight = neededRows * spriteSet.height;
    const maxSpriteColumns = Math.floor(maxCanvasSize / spriteSet.width);
    const maxSpriteRows = Math.floor(maxCanvasSize / spriteSet.height);

    let spriteColumnsRemaining = neededColumns;
    let spriteRowsRemaining = neededRows;

    this.canvasesElement = document.createElement('div');
    this.canvasesElement.className = 'transform-wrapper';
    this.canvasesElement.style.display = 'flex';
    this.canvasesElement.style.width = `${neededWidth}px`;
    this.canvasesElement.style.height = `${neededHeight}px`;
    this.containerElement.appendChild(this.canvasesElement);

    let column = 0;
    let row = 0;

    while (spriteColumnsRemaining > 0) {
      this.displayContexts[column] = [];

      const columnElement = document.createElement('div');
      columnElement.className = 'transform-column';
      this.canvasesElement.appendChild(columnElement);

      while (spriteRowsRemaining > 0) {
        const canvas = document.createElement('canvas');
        columnElement.appendChild(canvas);

        const spriteColumnsForCanvas = Math.min(spriteColumnsRemaining, maxSpriteColumns);
        const spriteRowsForCanvas = Math.min(spriteRowsRemaining, maxSpriteRows);

        canvas.width = spriteColumnsForCanvas * spriteSet.width;
        canvas.height = spriteRowsForCanvas * spriteSet.height;
        canvas.style.imageRendering = 'pixelated';
        canvas.style.width = `${canvas.width}px`;
        canvas.style.height = `${canvas.height}px`;

        const context = canvas.getContext('2d', { alpha: false, antialias: false });
        context.imageSmoothingEnabled = false;

        this.displayContexts[column][row] = context;

        spriteRowsRemaining -= spriteRowsForCanvas;
        row++;
      }
      spriteRowsRemaining = neededRows;
      spriteColumnsRemaining -= Math.min(spriteColumnsRemaining, maxSpriteColumns);
      row = 0;
      column++;
    }
  }

  updateDisplaySize() {
  }

  updateCamera() {
    const { offset, scale } = this.state.camera;
    const transform = `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`;
    this.canvasesElement.style.transform = transform;
  }

  draw() {
    const { options } = this.state;
    const spriteSet = SpriteSets[options.spriteSet];
    const frameType = options.canvas.frameType;

    if (this.images == null) {
      return;
    }

    const doGlobalRedraw = !options.canvas.onlyDrawChanges || this.needsGlobalRedraw;

    if (doGlobalRedraw) {
      for (let column = 0; column < this.displayContexts.length; column++) {
        for (let row = 0; row < this.displayContexts[column].length; row++) {
          const context = this.displayContexts[column][row];
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        }
      }
    }

    const totalColumns = this.displayContexts.length;
    let canvasColumn = 0;
    let canvasRow = 0;
    let spriteColumn = -1;
    let spriteRow = 0;

    const width = spriteSet.width;
    const height = spriteSet.height;

    let ctx = this.displayContexts[canvasColumn][canvasRow];
    let contextNeedsUpdate = false;

    // Prepare for some ugly logic, because we have to give a damn about performance here
    let maxSpriteColumns;
    let maxSpriteRows;

    const updateContext = () => {
      ctx = this.displayContexts[canvasColumn][canvasRow];

      maxSpriteColumns = ctx.canvas.width / width;
      maxSpriteRows = ctx.canvas.height / height;
    }

    updateContext();

    const updateSpritePosition = () => {
      spriteColumn++;

      if (spriteColumn === maxSpriteColumns) {
        spriteColumn = 0;
        canvasColumn++;
        contextNeedsUpdate = true;

        if (canvasColumn === totalColumns) {
          canvasColumn = 0;
          spriteRow++;
          contextNeedsUpdate = true;

          if (spriteRow === maxSpriteRows) {
            spriteRow = 0;
            canvasRow++;
            contextNeedsUpdate = true;
          }
        }

        if (contextNeedsUpdate) {
          updateContext();
          contextNeedsUpdate = false;
        }
      }
    }

    for (let i = 0; i < this.fellas.length; i++) {
      updateSpritePosition();

      const fella = this.fellas[i];

      if (!fella.needsRedraw && !doGlobalRedraw) {
        continue;
      }

      let image;
      if (fella.isAnimated) {
        if (frameType === CanvasFrameType.INDIVIDUAL_IMAGES) {
          image = this.images.frames[fella.variation][fella.frame];
        } else if (frameType === CanvasFrameType.SPRITE_SHEET) {
          image = this.images.spriteSheets[fella.variation];
        }
      } else {
        image = this.images.stills[fella.variation];
      }

      if (image == null) {
        continue;
      }

      const x = spriteColumn * width;
      const y = spriteRow * height;

      if (!doGlobalRedraw) {
        ctx.clearRect(x, y, width, height);
      }

      if (fella.isAnimated && frameType === CanvasFrameType.SPRITE_SHEET) {
        ctx.drawImage(
          image,
          this.spriteSheetCoordinates[fella.frame].x,
          this.spriteSheetCoordinates[fella.frame].y,
          spriteSet.width,
          spriteSet.height,
          x,
          y,
          width,
          height,
        );
      } else {
        ctx.drawImage(image, x, y, width, height);
      }

      fella.needsRedraw = false;
    }

    this.needsGlobalRedraw = false;
  }

  destroy() {
    this.displayContexts = [];
  }
}
