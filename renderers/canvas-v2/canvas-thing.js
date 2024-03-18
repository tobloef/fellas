class CanvasThing {
  // From the constructor
  ctx;
  spriteSet;
  useCamera;
  onlyDrawChanges;
  useSpriteSheet;
  camera;
  fellas;

  // We set these up internally
  images;
  spriteSheetCoordinates;
  needsGlobalRedraw = true;

  constructor(params) {
    const {
      ctx,
      spriteSet,
      useCamera,
      onlyDrawChanges,
      useSpriteSheet,
      camera,
      fellas,
    } = params;

    this.ctx = ctx;
    this.spriteSet = spriteSet;
    this.useCamera = useCamera;
    this.onlyDrawChanges = onlyDrawChanges;
    this.useSpriteSheet = useSpriteSheet;
    this.camera = camera;
    this.fellas = fellas;

    this.setup();
  }

  setup() {
    this.setupImages();
  }

  setupImages() {
    this.images = {
      stills: [],
      frames: [],
      spriteSheets: [],
    };

    const loadImageInto = (src, container, key) => {
      const image = new Image();
      image.src = src;
      image.onload = async () => {
        const bitmap = await createImageBitmap(image);
        container[key] = bitmap;
        this.needsGlobalRedraw = true;
      };
    }

    for (const variation of this.spriteSet.variations) {
      const src = this.spriteSet.assets.stills[variation];
      loadImageInto(src, this.images.stills, variation);
    }

    for (const variation of this.spriteSet.variations) {
      for (let frame = 0; frame < this.spriteSet.frames; frame++) {
        const src = this.spriteSet.assets.frames[variation][frame];
        loadImageInto(src, this.images.frames[variation], frame);
      }
    }

    for (const variation of this.spriteSet.variations) {
      const src = this.spriteSet.assets.spriteSheets[variation];
      loadImageInto(src, this.images.spriteSheets, variation);
    }

    this.spriteSheetCoordinates = [];
    for (let frame = 0; frame < this.spriteSet.frames; frame++) {
      const x = (frame % this.spriteSet.spriteSheetDimensions.columns) * this.spriteSet.width;
      const y = Math.floor(frame / this.spriteSet.spriteSheetDimensions.columns) * this.spriteSet.height;
      this.spriteSheetCoordinates[frame] = { x, y };
    }
  }

  updateDisplaySize(width, height) {
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
    this.needsGlobalRedraw = true;
  }

  updateCamera(camera) {
    this.camera = camera;
    this.needsGlobalRedraw = true;
  }

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

    const width = this.spriteSet.width * scale;
    const height = this.spriteSet.height * scale;

    for (const fella of this.fellas) {
      if (!doFullRedraw && !fella.needsRedraw) {
        continue;
      }

      const image = this.getImage(fella);

      if (image == null) {
        continue;
      }

      const x = (fella.x + offsetX) * scale;
      const y = (fella.y + offsetY) * scale;

      if (this.onlyDrawChanges) {
        this.ctx.clearRect(x, y, width, height);
      }

      this.drawImage(fella, image, x, y, width, height);
    }
  }

  getImage(fella) {
    if (this.images == null) {
      return null;
    }

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
