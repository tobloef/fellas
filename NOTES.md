## Notes

* Hardware acceleration makes a positive difference (with `<img>`) on Chrome
* See how at 1M `<img>`, we're bottle-necked by the CPU.
* See how opaque versions perform for every version.
* Look at memory performance at some point
* Disabling image scaling for the `Canvas` version actually only seems to make performance worse. Why?
* Uh oh, `Canvas` has a max size, which is problematic when we use Canvas + CSS transforms: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size
* Use a smoother 60fps (50fps for gifs) animated fella, so we can always zoom in and see whether the slowness is from the rendering or the transformation.
* Browser framerate stats can miss-report, as they're a moving average over a long period.
  * Therefore, it's nice to add a little high-fps sanity check gif in the corner
  * See here for an example: https://share.cleanshot.com/6bLnN3mD
  * You can see how the red and blue sections of the FPS graph alternates. So it's not actually a stable 60fps, it's alternating between a very high and very low FPS (120 and 10, for example).
  * Notice also how the CPU usage is at 0%. I imagine this is because the browser is mostly using the GPU at that point, as opposed to when we're padding.
* "Forgetting" to do clearReact properly when doing diff drawing is quite funny.
* One thing to dislike about the "CSS transform" trick is that it's not very reusable. Like, it works great for this one case, but in anything more complex, it adds a lot of complexity.
* Buffer canvas as an alternative to CSS transform is great. The performance is on par and you keep it in the canvas.
  * In fact, I'm seeing a performance gain even when not using delta drawing. Perhaps due to not scaling?
* When you start the page, sometimes there is a period where moving your mouse consumes 100% cpu and makes the canvas lag. Why? Who fucking knows! It goes away if you switch tab to YouTube for a moment...
* The "only draw changes" is somewhat of a specific optimization if you think about it. The grid helps us a lot.
* Synchronizing worker threads might add latency or tearing. Perhaps a toggleable synchronization step?
* When we get up to a high fella-count, we actually have to be careful about performance in our loops. Stuff you normally don't think about, every math operation counts when you do it 500K times.
* It seems like larger tiles = slower updates. But if there are no updates, the larger ones are faster, because we iterate through fewer of them?
  * Doing a little experiment. X by X tiles with a total of Y by Y pixels. Every frame, fill a full rect with a random color.
    * Where Y=20000, X=16 is laggy. Around 30 FPS and 70% GPU usage.
    * X=8, 60 FPS. Around 35% GPU usage.
    * X=4, 60 FPS. Around 30% CPU usage.
    * X=2, 60 FPS. 5% CPU usage.
    * I keep having to do the tab trick to make then stable.
    * Maybe the tab trick makes the browser take priority somehow?
    * Going up to X=21000 makes the performance drop very sharply. With Y=2 it's 70-100% CPU utilization.
    * Going down to X=16384.
    * Y=1, 30%, 60 FPS.
    * Doesn't change much as you increase Y, but at 32 it is CPU bottlenecked again at least and starts hovering around 30 FPS.
    * Conclusion: Doing large operations on a few large canvases is better than doing it on many smaller.
  * A similar experiment, drawing small rects on larger tiles. It seems like it's faster doing X writes to 1 canvas than doing 1 write to X canvases.
    * Especially as the canvas size increases.
  * What about a middle ground, doing a lot of smaller writes.
    * For 20K size and 16 subs, doing random-tile writes is slow, whereas doing repeating writes is fast.
    * For smaller amount of subs, the difference becomes smaller, but still measurable.
  * Doing X writes every frame, with one tile:
    * Smaller resolution is faster than large.
  * Conclusion: Fewer drawing operations is better. Fewer updated canvases it better. Smaller canvas is better.
    * Canvas performance is largely about balancing these parameters.
    * We can't really change the amount of drawing ops.
    * We can decrease the amount of canvases, but at the cost of canvas resolution being larger.
    * So we have to balance these two parameters. Play around and see what yields the best results.
* Performance with individual frames (vs GIFs) is much better! And performance with sprite sheets is a bit better than even that!
* No noticeable difference between individual frames and sprite sheets for canvas.
* For CPU bound stuff (all animated, 10000 fellas, 100 changes):
  * Buffer is slower than direct, which is slower than tiled.
  * Buffer has to do more work, so of course it's a slower.
  * My guess is that tiled is faster because even though it is a larger canvas, it doesn't have to as much math, due to lack of scaling.
  * Direct of course becomes much slower than buffer when you pan around.
* Worker notes:
  * 100,000 fellas, animated, only draw changes, 1000 variation swaps.
    * 30 FPS, but not stable. Most time spent drawImage and clearRect.
    * If worker thread is turned on, the performance is the same, but at least the rest of the UI is smooth.
    * Actually, maybe the performance is a little better when panning around, due to event handling being able to be smoother?
* It does not seem to matter if the worker is running the animation loop or not.
* Be careful, there's a limit to how many canvases, how many workers and how many core you use. Each of these three is a factor. Check the browser stats.

* Canvas Journey (on macbook)
  * Direct, 10,000, 0 swaps, full redraw
  * Just below 120 FPS. ~80% CPU. Panning feels smooth.
  * [Talk about using a worker, to offload the main thread.]
  * Using profiler we see that `CanvasRenderingContext2D.drawImage` is by far the most expensive part.
  * How can we reduce that?
  * We only draw changes of course!
  * Direct, 1,000,000, 0 swaps, only draw changes.
  * Takes a few laggy seconds to load.
  * Stable 120 FPS!
  * However, we're at 50% CPU even when not moving.
  * `FellaCanvas.draw` and `FellaCanvas.animations` are the hotspots.
  * But we're not doing anything?? Well, we are.
  * We're still looping through every fella and doing an if-check to see if we should draw. That adds up!
  * Now, there are probably some things we can do around data structures, cache locality, and so on.
  * But we have way bigger fish to fry. We might visit this at a later date though.
  * Because when we try to pan around on the canvas, we're suddenly measuring seconds per frame, not frames per second. Oof!
  * The more fellas needs a redraw per frame (due to animation, etc.), we also see this.
  * This if of course only natural, the more we have to redraw fellas, the more it lags.
  * So let's see if we can reduce the need for redrawing.
  * The panning for example: Here we employ some funky tricks!
  * CSS Transform, 1,000,000, 0 swaps, only draw changes.
  * It still takes a while to load, but once everything has settled, we can pan around with a smooth 120 FPS.
  * If this trick is too weird, we can also implement a version of this with a buffer-canvas.
  * That way we have more control, at the cost of having to draw the buffers onto another canvas.
  * [Talk about max canvas size and tiling]
  * [Talk about multiple workers]
  * [Talk about which of the canvas approaches gave the best performance for different scenarios]
  * At 2,000,000 still fellas, my computer starts to look very glitchy.
  * There are simply too many large canvasses to draw and the GPU starts freaking out.
  * Yeah, we need more control. More direct access. We need WebGL.

## Rules/Requirements

* No relying on occlusion culling, they must all be viewable at the same time
* Must handle X fella swaps per second
* Must handle Y fella animations per second
* Animations must be independent

## Comparisons

* Performance of Rendering vs Updating vs Transforming
* Performance as count changes
* Performance as amount of unique sprites changes
* Performance as sprite resolution changes
* Performance as sprite FPS changes

### `<img>`

* With vs without hardware acceleration
* Unique urls vs common urls
* PNGs vs GIFs
* Different image formats
* Img vs Div
  * This is actually only relevant if we want to do the sprite sheet hack
  * There is a difference in image loading strategy, that results in a lot of black divs when "unique images" is on and there's a (somewhat) high swap rate.
* Position vs Translate

### `Canvas`

* Integer coordinates and scaling
* No scaling
* Disabling pixel-art sampling
* Calculated transformation vs CSS
* Animated vs still
* Full vs diff drawing
* Unique vs common urls
* Common Image objects instead of many instances

## Misc.

### Canvas display modes

Screen-canvas
  One display canvas, no buffer canvases
  Draw fellas directly to display

CSS Transform
  Many display canvases, no buffer canvases
  Draw fellas tiled to display canvases

Buffer-canvases
  One display canvas, many buffer canvases
  Draw fellas tiled to buffer canvases
  Then draw buffer canvases to display canvas

## TODO

* Write some notes on performance of the different renderers

# WebGL Notes

### Plan

#### Many-quad renderer
1. Render a quad with a given sprite
2. Render multiple fellas (one quad each)
3. Swap fella variations
4. Animate the sprite on CPU (image per frame)
5. Animate the sprite on CPU (sprite sheet)
6. Animate the sprite on GPU (sprite sheet + time-offset)

#### Single-quad renderer
1. Render a quad with many sprites
2. Swap fella variations
3. Animate fellas on the CPU

### Shader example

https://succinct-wide-sunscreen.glitch.me/
https://succinct-wide-sunscreen.glitch.me/test.js

```glsl
///////////////////// Vertex /////////////////////

varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}


//////////////////// Fragment ////////////////////

uniform sampler2D uTileAtlas;
uniform sampler2D uTileMap;
uniform float uSeconds;
uniform vec2 uMapDim;
uniform vec2 uAtlasDim;

varying vec2 vUv;

const float sp = 256.0;
const vec4 splay = vec4(sp, sp * sp, sp * sp * sp, sp * sp * sp * sp);

void main() {
	vec2 tileUv = fract(vUv * uMapDim);
	vec4 tileId = texture2D(uTileMap,vUv) * splay;
	tileId -= fract(tileId);
	float index = tileId.x + tileId.y + tileId.z + tileId.w;
	index += uSeconds * 10.;
	index -= fract(index);
	vec2 normalizedTileDim = tileUv / uAtlasDim;
	vec2 tileSize = 1.0 / uAtlasDim;
	float row = mod(index, uAtlasDim.x);
	float col = index / uAtlasDim.x;
	col = mod(col - fract(col), uAtlasDim.y);
	gl_FragColor = texture2D(uTileAtlas, normalizedTileDim + tileSize*vec2(col,row));
}
```