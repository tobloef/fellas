## Notes

* Hardware acceleration makes a positive difference (with `<img>`) on Chrome
* See how at 1M `<img>`, we're bottle-necked by the CPU.
* See how opaque versions perform for every version.
* Look at memory performance at some point
* Disabling image scaling for the `Canvas` version actually only seems to make performance worse. Why? 
* Uh oh, `Canvas` has a max size: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas#maximum_canvas_size

## Rules/Requirements

* No relying on occlusion culling, they must all be viewable at the same time
* Must handle X fella swaps per second
* Must handle Y fella animations per second
* Animations must be independent

## Comparisons

* Performance of Rendering vs Updating vs Transforming

### `<img>`
* With vs without hardware acceleration
* Unique urls vs common urls
* PNGs vs GIFs

### `Canvas`
* Integer coordinates and scaling
* No scaling
* Disabling pixel-art sampling
* Calculated transformation vs CSS
* Animated vs still
* Full vs diff drawing
* Unique vs common urls
* Common Image objects instead of many instances

## TODO

* Try canvas with pure CSS pan/zoom
* Try only drawing diffs for the canvas
* Render animated fellas on the canvas