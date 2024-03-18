class CanvasThing {
  fellas;
  ctx;
  images;
  useCamera;
  camera;
  needsGlobalRedraw;
  onlyDrawChanges;
  spriteWidth;
  spriteHeight;
  useSpriteSheet;
  spriteSheetCoordinates;

  draw() {
    const doFullRedraw = !this.onlyDrawChanges || this.needsGlobalRedraw;

    if (doFullRedraw) {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;

    if (this.useCamera) {
      offsetX = this.camera.offset.x;
      offsetY = this.camera.offset.y;
      scale = this.camera.scale;
    }

    const width = this.spriteWidth * scale;
    const height = this.spriteHeight * scale;

    for (const fella of this.fellas) {
      if (!doFullRedraw && !fella.needsRedraw) {
        continue;
      }

      const image = this.getImage(fella);

      const x = (fella.x + offsetX) * scale;
      const y = (fella.y + offsetY) * scale;

      if (onlyDrawChanges) {
        this.ctx.clearRect(x, y, width, height);
      }

      this.drawImage(fella, image, x, y, width, height);
    }
  }

  getImage(fella) {
    if (fella.isAnimated) {
      if (this.useSpriteSheet) {
        return this.images.spriteSheets[fella.variation];
      } else {
        return this.images.frames[fella.variation][fella.frame];
      }
    } else {
      return this.images.stills[fella.variation];
    }
  }

  drawImage(fella, image, x, y, width, height) {
    if (fella.isAnimated && this.useSpriteSheet) {
      this.ctx.drawImage(
        image,
        this.spriteSheetCoordinates[fella.frame].x,
        this.spriteSheetCoordinates[fella.frame].y,
        width,
        height,
        x,
        y,
        width,
        height,
      );
    } else {
      this.ctx.drawImage(
        image,
        x,
        y,
        width,
        height,
      );
    }
  }
}