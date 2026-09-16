import { useLayoutEffect, useState } from 'react'
import { DrawPalette, readDrawPalette } from '../style/draw-palette'

const isSameDrawPalette = (a: DrawPalette, b: DrawPalette) =>
  a.back === b.back && a.main === b.main && a.cursor === b.cursor

/**
 * The draw palette lives in CSS, so it changes when `<html>` does — which is
 * how `useApplyColorMode` switches themes. Watching the element rather than
 * the color-mode atom keeps this right whoever flips the class, and avoids
 * depending on the order React runs the two layout effects in.
 */
export const useDrawPalette = (): DrawPalette => {
  const [drawPalette, setDrawPalette] = useState(readDrawPalette)

  useLayoutEffect(() => {
    const update = () =>
      setDrawPalette((prevState) => {
        const nextState = readDrawPalette()
        return isSameDrawPalette(prevState, nextState) ? prevState : nextState
      })

    update()

    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    return () => observer.disconnect()
  }, [])

  return drawPalette
}
