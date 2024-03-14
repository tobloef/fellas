import {countToRowsAndColumns} from '../../../utils/count-to-rows-and-columns.js';
import {MAX_CANVAS_SIZE} from '../../../utils/max-canvas-size.js';
import {SpriteSets} from '../../../state/sprite-sets.js';
import {AbstractCanvasSubRenderer} from '../abstract-canvas-sub-renderer.js';
import {CanvasFrameType} from "../../../state/options.js";

export class BufferedCanvasSubRenderer extends AbstractCanvasSubRenderer {
  containerElement = null;
  state = null;
  displayContext = null;
  bufferContexts = [];
  needsGlobalRedraw = false;
  images = {};
  fellas = [];
  spriteSheetCoordinates = [];

  constructor(state, containerElement) {
    super();
    this.state = state;
    this.containerElement = containerElement;
  }

  setupCanvases() {
    this.containerElement?.replaceChildren();
    this.bufferContexts = [];

    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = 0;
    displayCanvas.height = 0;
    displayCanvas.style.imageRendering = 'pixelated';
    this.containerElement.appendChild(displayCanvas);

    const displayContext = displayCanvas.getContext('2d', { alpha: false, antialias: false });
    displayContext.imageSmoothingEnabled = false;
    this.displayContext = displayContext;

    this.updateDisplaySize();

    const spriteSet = SpriteSets[this.state.options.spriteSet];

    const {
      columns: neededColumns,
      rowsWithOverflow: neededRows,
    } = countToRowsAndColumns(this.state.options.count);

    const maxSpriteColumns = Math.floor(MAX_CANVAS_SIZE / spriteSet.width);
    const maxSpriteRows = Math.floor(MAX_CANVAS_SIZE / spriteSet.height);

    let spriteColumnsRemaining = neededColumns;
    let spriteRowsRemaining = neededRows;

    let column = 0;
    let row = 0;

    while (spriteColumnsRemaining > 0) {
      this.bufferContexts[column] = [];

      while (spriteRowsRemaining > 0) {
        const canvas = new OffscreenCanvas(0, 0);

        const spriteColumnsForCanvas = Math.min(spriteColumnsRemaining, maxSpriteColumns);
        const spriteRowsForCanvas = Math.min(spriteRowsRemaining, maxSpriteRows);

        canvas.width = spriteColumnsForCanvas * spriteSet.width;
        canvas.height = spriteRowsForCanvas * spriteSet.height;

        const context = canvas.getContext('2d', { alpha: false, antialias: false });
        context.imageSmoothingEnabled = false;

        this.bufferContexts[column][row] = context;

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
    const screenSize = this.state.screenSize;

    this.displayContext.canvas.style.width = `100%`;
    this.displayContext.canvas.style.height = `100%`;
    this.displayContext.canvas.width = screenSize.width;
    this.displayContext.canvas.height = screenSize.height;
    this.displayContext.imageSmoothingEnabled = false;

    this.needsGlobalRedraw = true;
  }

  updateCamera() {
  }

  draw() {
    this.drawBuffers();
    this.drawDisplay();
  }

  drawBuffers() {
    const { options } = this.state;
    const spriteSet = SpriteSets[options.spriteSet];
    const frameType = options.canvas.frameType;

    if (this.images == null) {
      return;
    }

    const doGlobalRedraw = !options.canvas.onlyDrawChanges || this.needsGlobalRedraw;

    if (doGlobalRedraw) {
      for (let column = 0; column < this.bufferContexts.length; column++) {
        for (let row = 0; row < this.bufferContexts[column].length; row++) {
          const context = this.bufferContexts[column][row];
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        }
      }
    }

    const totalColumns = this.bufferContexts.length;
    let canvasColumn = 0;
    let canvasRow = 0;
    let spriteColumn = -1;
    let spriteRow = 0;

    const width = spriteSet.width;
    const height = spriteSet.height;

    let ctx = this.bufferContexts[canvasColumn][canvasRow];
    let contextNeedsUpdate = false;

    // Prepare for some ugly logic, because we have to give a damn about performance here
    let maxSpriteColumns;
    let maxSpriteRows;

    const updateContext = () => {
      ctx = this.bufferContexts[canvasColumn][canvasRow];

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

  drawDisplay() {
    this.displayContext.clearRect(0, 0, this.displayContext.canvas.width, this.displayContext.canvas.height);

    const { camera: { offset, scale } } = this.state;

    let x = offset.x * scale;
    let y = offset.y * scale;
    let w = 0;
    let h = 0;

    for (let column = 0; column < this.bufferContexts.length; column++) {
      for (let row = 0; row < this.bufferContexts[column].length; row++) {
        const context = this.bufferContexts[column][row];
        w = context.canvas.width * scale;
        h = context.canvas.height * scale;
        this.displayContext.drawImage(context.canvas, x, y, w, h);
        y += h;
      }
      y = offset.y * scale;
      x += w;
    }
  }

  destroy() {
    this.bufferContexts = [];
  }
}
