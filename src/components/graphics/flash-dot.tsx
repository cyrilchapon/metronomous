import { ColorSource, Graphics } from 'pixi.js'
import { useCallback, useRef } from 'react'
import { GeoPoint } from '../../util/geometry'
import { Metronome, MetronomeEvents } from '../../util/metronome'
import { useTickFlash } from '../../hooks/use-tick-flash'
import { flashValuesAt } from '../../util/flash'

const FLASH_DURATION_MS = 500

export type FlashDotProps<E extends keyof MetronomeEvents> = {
  point: GeoPoint
  color: ColorSource
  fromOpacity: number
  fromRadius: number
  toRadius: number
  metronome: Metronome
  event: E
  matches: (...args: Parameters<MetronomeEvents[E]>) => boolean
}

/**
 * A single division/subdivision "flash": a dot that pops from `fromRadius`
 * to `toRadius` while fading out, triggered by a metronome tick. Idle
 * instances (i.e. almost all of them, almost all of the time) do zero work
 * per frame beyond a boolean check — see `useTickFlash`.
 *
 * The disc itself is built exactly once, at `toRadius`, and the animation
 * is nothing but `scale`/`alpha` on it: a flash is the same shape all the
 * way through, so tearing its geometry down and re-tessellating it sixty
 * times a second (which is what `clear()` + `circle()` + `fill()` costs)
 * buys nothing. Drawing it at its *largest* and scaling down, rather than
 * the reverse, is what keeps it round: a division dot grows tenfold, and a
 * circle tessellated for a 4px radius is visibly a polygon at 40px.
 */
export function FlashDot<E extends keyof MetronomeEvents>({
  point: [x, y],
  color,
  fromOpacity,
  fromRadius,
  toRadius,
  metronome,
  event,
  matches,
}: FlashDotProps<E>) {
  const graphicsRef = useRef<Graphics>(null)

  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      g.circle(0, 0, toRadius)
      g.fill({ color, alpha: 1 })
    },
    [color, toRadius]
  )

  const onFrame = useCallback(
    (t: number) => {
      const g = graphicsRef.current
      if (!g) {
        return
      }

      const { opacity, scale } = flashValuesAt(
        t,
        fromOpacity,
        fromRadius,
        toRadius
      )

      g.visible = opacity > 0
      g.alpha = opacity
      g.scale.set(scale)
    },
    [fromOpacity, fromRadius, toRadius]
  )

  useTickFlash(metronome, event, matches, FLASH_DURATION_MS, onFrame)

  return (
    <pixiGraphics ref={graphicsRef} x={x} y={y} draw={draw} visible={false} />
  )
}
