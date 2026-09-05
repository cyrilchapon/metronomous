import { ColorSource, Graphics } from 'pixi.js'
import { GlowFilter, MotionBlurFilter } from 'pixi-filters'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTick } from '@pixi/react'
import { GeoPoint } from '../../util/geometry'
import { Metronome, MetronomeProgress } from '../../util/metronome'

const noop = () => {}

// How long a trail is, in time rather than in distance: at a given tempo
// this converts straight to a distance (more of the shape's boundary is
// covered in the same time), which is what makes it "longer at a higher
// tempo" for free, without tracking speed separately from progress itself.
const TRAIL_DURATION_MS = 320
// Cap on how much of a full bar the trail can span, so it doesn't wrap
// around and overlap itself at very high tempos.
const TRAIL_MAX_SPAN = 0.22
const TRAIL_SEGMENTS = 14
const TRAIL_MAX_ALPHA = 0.85

export type ShapeCursorProps = {
  metronome: Metronome
  running: boolean
  bpm: number
  signature: number
  /**
   * Turns a raw, looping [0, 1) bar progress into a point anywhere along
   * the shape's boundary — not just the current one (used for the cursor
   * itself), but also a short span behind it (used for the trail). Read
   * through a ref, so it can safely close over fresh geometry without
   * re-subscribing the ticker.
   */
  getPointAtProgress: (progress: number) => GeoPoint
  centerPoint: GeoPoint
  showDot: boolean
  showLine: boolean
  color: ColorSource
  dotRadius: number
  lineWidth: number
  trailWidth: number
  speedFactor: number
  speedTrigger: number
  motionBlurOffset: number
  motionBlurKernelSize: number
}

/**
 * The one part of the visualization that legitimately changes every frame:
 * the moving cursor (dot + line to the center + trail) and its motion blur.
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
  bpm,
  signature,
  getPointAtProgress,
  centerPoint,
  showDot,
  showLine,
  color,
  dotRadius,
  lineWidth,
  trailWidth,
  speedFactor,
  speedTrigger,
  motionBlurOffset,
  motionBlurKernelSize,
}: ShapeCursorProps) => {
  const dotGraphicsRef = useRef<Graphics>(null)
  const lineGraphicsRef = useRef<Graphics>(null)
  const trailGraphicsRef = useRef<Graphics>(null)

  // "Latest" refs: read every frame from the ticker without forcing the
  // (memoized, stable) tick callback to be re-subscribed on every render.
  const runningRef = useRef(running)
  runningRef.current = running
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  const signatureRef = useRef(signature)
  signatureRef.current = signature
  const getPointAtProgressRef = useRef(getPointAtProgress)
  getPointAtProgressRef.current = getPointAtProgress
  const centerPointRef = useRef(centerPoint)
  centerPointRef.current = centerPoint
  const colorRef = useRef(color)
  colorRef.current = color
  const lineWidthRef = useRef(lineWidth)
  lineWidthRef.current = lineWidth
  const trailWidthRef = useRef(trailWidth)
  trailWidthRef.current = trailWidth

  // The previous frame's point, used only to derive the motion-blur
  // velocity. `null` means "don't blur the next frame" — used to prevent a
  // *legitimate* discontinuity (the cursor being snapped/reset rather than
  // having actually travelled there) from being read as an enormous
  // instantaneous speed and producing a burst of ghost dots (the motion
  // blur kernel smearing a huge fake velocity across a few taps).
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

  // A light, cheap-quality glow on the trail only (not the dot) — kept as a
  // single persistent filter instance/instruction so redrawing the trail's
  // (short, small) path every frame is the only per-frame cost; the glow
  // itself doesn't need any updating.
  const trailGlowFilter = useMemo(
    () =>
      new GlowFilter({
        distance: Math.max(trailWidth * 2, 4),
        outerStrength: 1.5,
        innerStrength: 0,
        quality: 0.15,
        color,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  useEffect(() => {
    trailGlowFilter.color = color
  }, [trailGlowFilter, color])
  useEffect(() => {
    trailGlowFilter.distance = Math.max(trailWidth * 2, 4)
  }, [trailGlowFilter, trailWidth])

  const drawTrail = useCallback((currentProgress: number) => {
    const g = trailGraphicsRef.current
    if (!g) {
      return
    }

    g.clear()

    const secondsPerBar = signatureRef.current * (60 / bpmRef.current)
    const span = Math.min(
      TRAIL_DURATION_MS / 1000 / secondsPerBar,
      TRAIL_MAX_SPAN
    )

    const color = colorRef.current
    const width = trailWidthRef.current
    let previous = getPointAtProgressRef.current(currentProgress)

    for (let i = 1; i <= TRAIL_SEGMENTS; i++) {
      const t = i / TRAIL_SEGMENTS
      const point = getPointAtProgressRef.current(currentProgress - span * t)
      // Degressive: dense right behind the dot, fading out toward the tail.
      const alpha = (1 - t) ** 2 * TRAIL_MAX_ALPHA

      if (alpha > 0.01) {
        g.moveTo(previous[0], previous[1])
        g.lineTo(point[0], point[1])
        // Flat (not round) caps: each segment gets its own alpha, drawn as
        // its own little stroked path, so a round cap would bulge at every
        // segment boundary — a string of beads instead of a smooth taper.
        // Adjacent segments share exact endpoints, so flat caps tile
        // together cleanly.
        g.stroke({ width, color, alpha, cap: 'butt' })
      }

      previous = point
    }
  }, [])

  const renderAt = useCallback(
    (progress: MetronomeProgress, { snap = false }: { snap?: boolean } = {}) => {
      const point = getPointAtProgressRef.current(progress.progress)
      const [x, y] = point

      const dot = dotGraphicsRef.current
      if (dot) {
        dot.position.set(x, y)

        const last = snap ? null : lastPointRef.current
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

      if (snap) {
        trailGraphicsRef.current?.clear()
      } else {
        drawTrail(progress.progress)
      }
    },
    [drawTrail, motionBlurFilter, speedFactor, speedTrigger]
  )

  const tick = useCallback(() => {
    // `poll()` already reads the current progress (to detect and emit
    // ticks for the flashes) — reuse it instead of reading the clock
    // (and allocating another snapshot) a second time this frame.
    const progress = metronome.poll()

    if (!runningRef.current) {
      return
    }

    renderAt(progress)
  }, [metronome, renderAt])

  useTick(tick)

  // Snap the cursor back to its resting (progress = 0) position once the
  // metronome stops — otherwise it would freeze wherever it last was.
  useEffect(() => {
    if (!running) {
      renderAt(metronome.progress, { snap: true })
    }
  }, [running, metronome, renderAt])

  // The geometry (`getPointAtProgress`) can change while running too —
  // switching circle/polygon mode, or the signature — which is just as much
  // of a discontinuity as a stop. Forget the last point so the *next* frame
  // doesn't read it as a huge instantaneous jump (see `lastPointRef`); the
  // cursor then just resumes moving normally from wherever the new
  // geometry places it, with no fake velocity spike.
  useEffect(() => {
    lastPointRef.current = null
  }, [getPointAtProgress])

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
        <>
          <pixiGraphics
            ref={trailGraphicsRef}
            draw={noop}
            filters={[trailGlowFilter]}
          />
          <pixiGraphics ref={dotGraphicsRef} draw={drawDot} />
        </>
      ) : null}
    </>
  )
}
