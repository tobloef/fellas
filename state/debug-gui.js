import {
  CanvasFrameType,
  CanvasOffsetStrategy,
  ImgAnimationStrategy,
  ImgElementType,
  ImgOffsetStrategy, MaxCanvasSize,
  RendererOptions,
  SpriteSetOptions,
} from "./options.js";
import {copyStateAsUrl} from "./search-params.js";

export function setupDebugGui(state) {
  const options = state.options;

  const gui = new dat.GUI();

  gui.width = 300;

  let folders = {};

  const copyButtonName = "Copy settings as URL";
  gui.add(
    {
      copyStateAsUrl: () => {
        const controller = gui.__controllers.find(
          (controller) => controller.property === "copyStateAsUrl",
        );
        controller.name(`${copyButtonName} (Copied!)`);
        setTimeout(() => {
          controller.name(copyButtonName);
        }, 1000);
        copyStateAsUrl(state);
      },
    },
    "copyStateAsUrl",
  ).name(copyButtonName);

  gui.add(options, "renderer", Object.values(RendererOptions))
    .name("Renderer")
    .onChange(() => {
      Object.values(RendererOptions).forEach((renderer) => {
        folders[renderer].hide();
      });

      folders[options.renderer].show();
    });

  gui.add(options, "spriteSet", Object.values(SpriteSetOptions))
    .name("Sprites");

  gui.add(options, "isAnimatedByDefault")
    .name("Animated by default");

  gui.add(options, "count")
    .name("Count")
    .step(1);

  gui.add(options, "animationChangesPerFrame")
    .name("Animation Changes Per Frame")
    .step(1);

  gui.add(options, "variationChangesPerFrame")
    .name("Variation Changes Per Frame")
    .step(1);

  folders[RendererOptions.IMAGE] = gui.addFolder("Image");
  folders[RendererOptions.IMAGE].open();
  folders[RendererOptions.IMAGE].hide();
  folders[RendererOptions.IMAGE]
    .add(options.img, "offsetStrategy", Object.values(ImgOffsetStrategy))
    .name("Panning");
  folders[RendererOptions.IMAGE]
    .add(options.img, "useUniqueImages")
    .name("Unique Images");
  let elementTypeController;
  let animationStrategyController;
  elementTypeController = folders[RendererOptions.IMAGE]
    .add(options.img, "elementType", Object.values(ImgElementType))
    .name("Element Type")
    .onChange(() => {
      if (
        options.img.animationStrategy === ImgAnimationStrategy.SPRITE_SHEET &&
        options.img.elementType !== ImgElementType.DIV
      ) {
        alert("Can't use sprite sheet with image elements. Switching to individual frames.");
        options.img.animationStrategy = ImgAnimationStrategy.FRAMES;
        animationStrategyController.updateDisplay();
      }
    });
  animationStrategyController = folders[RendererOptions.IMAGE]
    .add(options.img, "animationStrategy", Object.values(ImgAnimationStrategy))
    .name("Animation")
    .onChange(() => {
      if (
        options.img.animationStrategy === ImgAnimationStrategy.SPRITE_SHEET &&
        options.img.elementType !== ImgElementType.DIV
      ) {
        alert("Can't use sprite sheet with image elements. Switching to divs.");
        options.img.elementType = ImgElementType.DIV;
        elementTypeController.updateDisplay();
      }
    });

  let maxCanvasSizeController;
  const setMaxCanvasSizeVisibility = () => {
    if (options.canvas.offsetStrategy === CanvasOffsetStrategy.DIRECT_CANVAS) {
      maxCanvasSizeController.__li.style.display = "none";
    } else {
      maxCanvasSizeController.__li.style.display = "";
    }
  };

  folders[RendererOptions.CANVAS] = gui.addFolder("Canvas");
  folders[RendererOptions.CANVAS].open();
  folders[RendererOptions.CANVAS].hide();
  folders[RendererOptions.CANVAS]
    .add(options.canvas, "offsetStrategy", Object.values(CanvasOffsetStrategy))
    .name("Panning")
    .onChange(setMaxCanvasSizeVisibility);
  folders[RendererOptions.CANVAS]
    .add(options.canvas, "onlyDrawChanges")
    .name("Only draw changes")
  elementTypeController = folders[RendererOptions.CANVAS]
    .add(options.canvas, "frameType", Object.values(CanvasFrameType))
    .name("Frame Type");
  maxCanvasSizeController = folders[RendererOptions.CANVAS]
    .add(options.canvas, "maxCanvasSize", Object.values(MaxCanvasSize))
    .name("Max Canvas Size");
  setMaxCanvasSizeVisibility();
  folders[RendererOptions.CANVAS]
    .add(options.canvas, "useWorker")
    .name("Use worker(s)");

  folders[RendererOptions.WEBGL] = gui.addFolder("WebGL");
  folders[RendererOptions.WEBGL].open();
  folders[RendererOptions.WEBGL].hide();

  folders[RendererOptions.WEBGPU] = gui.addFolder("WebGPU");
  folders[RendererOptions.WEBGPU].open();
  folders[RendererOptions.WEBGPU].hide();

  folders[options.renderer].show();
}
