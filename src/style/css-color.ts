let context: CanvasRenderingContext2D | null | undefined

const getContext = () => {
  if (context === undefined) {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    context = canvas.getContext('2d', { willReadFrequently: true })
  }

  return context
}

/**
 * Packs an opaque CSS color into the `0xRRGGBB` number PixiJS wants.
 *
 * PixiJS only parses a handful of notations — `oklch()`, which every shadcn
 * token uses, isn't one of them, and `getComputedStyle` hands custom
 * properties back as their raw token stream rather than resolved sRGB. So
 * rather than reimplementing the conversion, let the browser rasterize a
 * single pixel and read the bytes back out.
 *
 * Returns `undefined` for anything the browser doesn't recognize as a color,
 * because canvas silently keeps its previous `fillStyle` in that case.
 */
export const cssColorToNumber = (color: string): number | undefined => {
  if (!CSS.supports('color', color)) {
    return undefined
  }

  const ctx = getContext()

  if (ctx == null) {
    return undefined
  }

  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)

  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data

  return (r << 16) + (g << 8) + b
}
