import { ColorSource, Graphics } from 'pixi.js'
import { MotionBlurFilter } from 'pixi-filters'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTick } from '@pixi/react'
import { GeoPoint } from '../../util/geometry'
import { Metronome, MetronomeProgress } from '../../util/metronome'

const noop = () => {}

export type ShapeCursorProps = {
  metronome: Metronome
  running: boolean
  /** Called every frame (while running) to turn a progress snapshot into a point. Should be cheap and stable in spirit — it's read through a ref, so it can safely close over fresh geometry without re-subscribing the ticker. */
  getPoint: (progress: MetronomeProgress) => GeoPoint
  centerPoint: GeoPoint
  showDot: boolean
  showLine: boolean
  color: ColorSource
  dotRadius: number
  lineWidth: number
  speedFactor: number
  speedTrigger: number
  motionBlurOffset: number
  motionBlurKernelSize: number
}

/**
 * The one part of the visualization that legitimately changes every frame:
 * the moving cursor (dot + line to the center) and its motion blur.
 *
 * Everything here is imperative — refs are mutated directly inside a
 * `useTick` callback instead of going through React state/props — so a
 * running metronome never triggers a React re-render of this component (or,
 * critically, of its siblings: the dozens of static division/subdivision
 * dots and the background shape). That's what actually fixes the
 * "flickering"/jank: previously the *entire* visualization tree re-rendered
 * on every animation frame because the live playback position lived in
 * React (jotai) state.
 */
export const ShapeCursor = ({
  metronome,
  running,
  getPoint,
  centerPoint,
  showDot,
  showLine,
  color,
  dotRadius,
  lineWidth,
  speedFactor,
  speedTrigger,
  motionBlurOffset,
  motionBlurKernelSize,
}: ShapeCursorProps) => {
  const dotGraphicsRef = useRef<Graphics>(null)
  const lineGraphicsRef = useRef<Graphics>(null)

  // "Latest" refs: read every frame from the ticker without forcing the
  // (memoized, stable) tick callback to be re-subscribed on every render.
  const runningRef = useRef(running)
  runningRef.current = running
  const getPointRef = useRef(getPoint)
  getPointRef.current = getPoint
  const centerPointRef = useRef(centerPoint)
  centerPointRef.current = centerPoint
  const colorRef = useRef(color)
  colorRef.current = color
  const lineWidthRef = useRef(lineWidth)
  lineWidthRef.current = lineWidth

  const lastPointRef = useRef<GeoPoint | null>(null)

  const motionBlurFilter = useMemo(() => {
    const filter = new MotionBlurFilter({
      velocity: { x: 0, y: 0 },
      kernelSize: motionBlurKernelSize,
      offset: motionBlurOffset,
    })
    // Filters render to an offscreen texture without the canvas' own
    // multisampling, so force it back on to avoid jagged edges while blurring.
    filter.antialias = 'inherit'
    return filter
  }, [motionBlurKernelSize, motionBlurOffset])

  const renderAt = useCallback(
    (progress: MetronomeProgress) => {
      const point = getPointRef.current(progress)
      const [x, y] = point

      const dot = dotGraphicsRef.current
      if (dot) {
        dot.position.set(x, y)

        const last = lastPointRef.current
        const vx = last ? (x - last[0]) * speedFactor : 0
        const vy = last ? (y - last[1]) * speedFactor : 0
        const moving =
          Math.abs(vx) >= speedTrigger || Math.abs(vy) >= speedTrigger

        if (moving) {
          motionBlurFilter.velocity = { x: vx, y: vy }
          dot.filters = [motionBlurFilter]
        } else if (dot.filters) {
          dot.filters = []
        }
      }
      lastPointRef.current = point

      const line = lineGraphicsRef.current
      if (line) {
        const [cx, cy] = centerPointRef.current

        line.clear()
        line.moveTo(cx, cy)
        line.lineTo(x, y)
        line.stroke({
          width: lineWidthRef.current,
          color: colorRef.current,
          alpha: 1,
        })
      }
    },
    [motionBlurFilter, speedFactor, speedTrigger]
  )

  const tick = useCallback(() => {
    if (!runningRef.current) {
      return
    }

    renderAt(metronome.progress)
  }, [metronome, renderAt])

  useTick(tick)

  // Snap the cursor back to its resting (progress = 0) position once the
  // metronome stops — otherwise it would freeze wherever it last was.
  useEffect(() => {
    if (!running) {
      renderAt(metronome.progress)
    }
  }, [running, metronome, renderAt])

  const drawDot = useCallback(
    (g: Graphics) => {
      g.clear()
      g.circle(0, 0, dotRadius)
      g.fill({ color, alpha: 1 })
    },
    [color, dotRadius]
  )

  return (
    <>
      {showLine ? <pixiGraphics ref={lineGraphicsRef} draw={noop} /> : null}
      {showDot ? (
        <pixiGraphics ref={dotGraphicsRef} draw={drawDot} />
      ) : null}
    </>
  )
}
