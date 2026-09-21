import { ColorSource, Graphics } from 'pixi.js'
import { useCallback, useRef } from 'react'
import { GeoPoint, boundPolygon } from '../../util/geometry'
import { Metronome, MetronomeEvents } from '../../util/metronome'
import { useTickFlash } from '../../hooks/use-tick-flash'
import { flashValuesAt } from '../../util/flash'

/**
 * A flash lasts one beat — which at 120bpm is the 500ms it always was,
 * and which now stretches and tightens with the tempo. It is a whole beat
 * rather than a fraction of one because a given dot only flashes once per
 * *bar*, so this is a quarter of that dot's cycle in 4/4 whatever the
 * tempo, not a light left on.
 */
const FLASH_BEATS = 1

/**
 * Note on `lineWidth`: the stroke rides the same `scale` as the shape it
 * outlines, so a stroked pulse starts out thinner than `lineWidth` (by the
 * `fromRadius / toRadius` it starts at) and reaches it as it expands.
 * Pixi has no non-scaling stroke, and paying for a full re-tessellation
 * every frame to hold the width flat is not worth it — a ring that
 * thickens as it dissipates is, if anything, the more physical of the two.
 */
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

/**
 * A circle that pulses outward from a division/subdivision tick.
 *
 * Built once at `toRadius` around the graphics' own origin, then animated
 * with `scale`/`alpha` alone — see `FlashDot` for why the geometry is
 * drawn at its largest and scaled *down*.
 */
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

  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      g.circle(0, 0, toRadius)
      if (lineWidth) {
        g.stroke({ width: lineWidth, color, alpha: 1 })
      } else {
        g.fill({ color, alpha: 1 })
      }
    },
    [lineWidth, color, toRadius]
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

  useTickFlash(metronome, event, matches, FLASH_BEATS, onFrame)

  return (
    <pixiGraphics ref={graphicsRef} x={cx} y={cy} draw={draw} visible={false} />
  )
}

export type FlashPolygonShapeProps<E extends keyof MetronomeEvents> =
  FlashShapeCommonProps<E> & {
    center: GeoPoint
    sides: number
    paddedRatio: number
    lineWidth?: number
  }

/**
 * A regular polygon that pulses outward from a division/subdivision tick.
 *
 * `boundPolygon` is a homothety of its bounding circle — every vertex, the
 * vertical shift included, scales linearly with the radius about the
 * center — so the growing polygon *is* one polygon under a `scale`, and
 * the vertices only ever have to be computed once, around a `[0, 0]`
 * center the graphics is then positioned at. Rebuilding them every frame
 * (and with them the whole tessellation) was the single most expensive
 * thing on screen with subdivision flashes on: a 7/6 bar puts 42 of these
 * in the tree.
 */
export function FlashPolygonShape<E extends keyof MetronomeEvents>({
  center: [cx, cy],
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

  const draw = useCallback(
    (g: Graphics) => {
      const points = boundPolygon(
        { center: [0, 0], radius: toRadius },
        sides,
        paddedRatio
      )

      g.clear()
      g.poly(points.flat())
      if (lineWidth) {
        g.stroke({ width: lineWidth, color, alpha: 1 })
      } else {
        g.fill({ color, alpha: 1 })
      }
    },
    [sides, paddedRatio, lineWidth, color, toRadius]
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

  useTickFlash(metronome, event, matches, FLASH_BEATS, onFrame)

  return (
    <pixiGraphics ref={graphicsRef} x={cx} y={cy} draw={draw} visible={false} />
  )
}
