## Notes

* Hardware acceleration makes a positive difference (with `<img>`) on Chrome
* See how at 1M `<img>`, we're bottle-necked by the CPU.
* See how opaque versions perform for every version.

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

## TODO

* Try canvas with pre-scaled image in canvas
* Try canvas with pure CSS pan/zoom
* Try only drawing diffs for the canvas
* Render animated fellas on the canvas