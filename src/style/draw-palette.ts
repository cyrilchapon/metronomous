import { cssColorToNumber } from './css-color'

export type DrawPalette = {
  back: number
  main: number
  cursor: number
}

/**
 * The visualization draws on a PixiJS canvas, which can't read CSS. Its
 * colors are still declared as custom properties in `index.css`, next to
 * (and partly derived from) the shadcn tokens, so light/dark switching goes
 * through the one mechanism — they're just resolved to numbers here.
 *
 * The fallbacks only matter if a token is missing entirely.
 */
export const readDrawPalette = (): DrawPalette => {
  const styles = getComputedStyle(document.documentElement)

  const read = (property: string, fallback: number) =>
    cssColorToNumber(styles.getPropertyValue(property).trim()) ?? fallback

  return {
    back: read('--metronome-back', 0x000000),
    main: read('--metronome-main', 0xffffff),
    cursor: read('--metronome-cursor', 0xff3300),
  }
}
