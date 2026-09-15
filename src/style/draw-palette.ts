import { ColorSource } from 'pixi.js'
import { ColorMode } from './color-mode'

export type DrawPalette = {
  back: ColorSource
  main: ColorSource
  cursor: ColorSource
}

const drawPalettes: Record<ColorMode, DrawPalette> = {
  light: {
    back: 0xffffff,
    main: 0x000000,
    cursor: 0xff3300,
  },
  dark: {
    back: 0x121212,
    main: 0xff3300,
    cursor: 0xffffff,
  },
}

export const getDrawPalette = (mode: ColorMode): DrawPalette =>
  drawPalettes[mode]
