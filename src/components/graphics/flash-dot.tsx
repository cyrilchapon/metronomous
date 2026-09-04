import { ColorSource, Graphics } from 'pixi.js'
import { useCallback, useRef } from 'react'
import { GeoPoint } from '../../util/geometry'
import { Metronome, MetronomeEvents } from '../../util/metronome'
import { useTickFlash } from '../../hooks/use-tick-flash'
import { flashValuesAt } from '../../util/flash'

const FLASH_DURATION_MS = 500
const noop = () => {}

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

  const onFrame = useCallback(
    (t: number) => {
      const g = graphicsRef.current
      if (!g) {
        return
      }

      const { opacity, radius } = flashValuesAt(t, fromOpacity, fromRadius, toRadius)

      g.clear()
      if (opacity > 0) {
        g.circle(0, 0, radius)
        g.fill({ color, alpha: opacity })
      }
    },
    [color, fromOpacity, fromRadius, toRadius]
  )

  useTickFlash(metronome, event, matches, FLASH_DURATION_MS, onFrame)

  return <pixiGraphics ref={graphicsRef} x={x} y={y} draw={noop} />
}
