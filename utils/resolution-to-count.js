export function resolutionToCount(resolution, spriteSet) {
  const { width: spriteWidth, height: spriteHeight } = spriteSet;

  const columns = Math.ceil(resolution / spriteWidth);
  const rows = Math.ceil(resolution / spriteHeight);

  return columns * rows;
}