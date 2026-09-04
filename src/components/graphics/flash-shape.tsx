import { ColorSource, Graphics } from 'pixi.js'
import { useCallback, useRef } from 'react'
import { GeoPoint, boundPolygon } from '../../util/geometry'
import { Metronome, MetronomeEvents } from '../../util/metronome'
import { useTickFlash } from '../../hooks/use-tick-flash'
import { flashValuesAt } from '../../util/flash'

const FLASH_DURATION_MS = 500
const noop = () => {}

type FlashShapeCommonProps<E extends keyof MetronomeEvents> = {
  color: ColorSource
  fromOpacity: number
  fromRadius: number
  toRadius: number
  metronome: Metronome
  event: E
  matches: (...args: Parameters<MetronomeEvents[E]>) => boolean
}

export type FlashCircleShapeProps<E extends keyof MetronomeEvents> =
  FlashShapeCommonProps<E> & {
    center: GeoPoint
    lineWidth?: number
  }

/** A circle that pulses outward from a division/subdivision tick. */
export function FlashCircleShape<E extends keyof MetronomeEvents>({
  center: [cx, cy],
  lineWidth,
  color,
  fromOpacity,
  fromRadius,
  toRadius,
  metronome,
  event,
  matches,
}: FlashCircleShapeProps<E>) {
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
        g.circle(cx, cy, radius)
        if (lineWidth) {
          g.stroke({ width: lineWidth, color, alpha: opacity })
        } else {
          g.fill({ color, alpha: opacity })
        }
      }
    },
    [cx, cy, lineWidth, color, fromOpacity, fromRadius, toRadius]
  )

  useTickFlash(metronome, event, matches, FLASH_DURATION_MS, onFrame)

  return <pixiGraphics ref={graphicsRef} draw={noop} />
}

export type FlashPolygonShapeProps<E extends keyof MetronomeEvents> =
  FlashShapeCommonProps<E> & {
    center: GeoPoint
    sides: number
    paddedRatio: number
    lineWidth?: number
  }

/** A regular polygon that pulses outward from a division/subdivision tick. */
export function FlashPolygonShape<E extends keyof MetronomeEvents>({
  center,
  sides,
  paddedRatio,
  lineWidth,
  color,
  fromOpacity,
  fromRadius,
  toRadius,
  metronome,
  event,
  matches,
}: FlashPolygonShapeProps<E>) {
  const graphicsRef = useRef<Graphics>(null)

  const onFrame = useCallback(
    (t: number) => {
      const g = graphicsRef.current
      if (!g) {
        return
      }

      const { opacity, radius } = flashValuesAt(t, fromOpacity, fromRadius, toRadius)
      const points = boundPolygon({ center, radius }, sides, paddedRatio)

      g.clear()
      if (opacity > 0) {
        g.poly(points.flatMap((point) => point))
        if (lineWidth) {
          g.stroke({ width: lineWidth, color, alpha: opacity })
        } else {
          g.fill({ color, alpha: opacity })
        }
      }
    },
    [center, sides, paddedRatio, lineWidth, color, fromOpacity, fromRadius, toRadius]
  )

  useTickFlash(metronome, event, matches, FLASH_DURATION_MS, onFrame)

  return <pixiGraphics ref={graphicsRef} draw={noop} />
}
