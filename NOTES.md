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

* Tile multiple canvases
* Worker
* Multiple canvases in different workers
* Sprite map animations with image render
* Render animated fellas on the canvas
