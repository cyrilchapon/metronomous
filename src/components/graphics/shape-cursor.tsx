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

/**
 * How finely the shape is walked behind the cursor. The line's sector
 * needs every one of these: it shades a large area, and a band of flat
 * alpha that wide reads as banding — 14 of them is a visible staircase,
 * 42 is a gradient.
 */
const TRAIL_SAMPLES = 42
/**
 * The dot's trail takes every third sample instead. It is a thin stroke,
 * where that much resolution buys nothing visible, and this keeps it at
 * the 14 segments it has always cost. When the line isn't on screen, the
 * sampling itself drops to this stride too — so the common case (dot
 * only) walks the shape exactly as many times as it used to.
 */
const DOT_TRAIL_STRIDE = 3
const DOT_TRAIL_SEGMENTS = TRAIL_SAMPLES / DOT_TRAIL_STRIDE

const TRAIL_MAX_ALPHA = 0.85
// The line's trail sweeps a whole sector rather than tracing a thin path,
// so the same alpha over that much area would read several times heavier
// — about a fifth of the dot's, by eye, is where the two weigh the same.
const LINE_TRAIL_MAX_ALPHA = 0.15

// The cursor line is drawn once, along +x, at this length, and then merely
// rotated and stretched (see `renderAt`). Any reference length works; a
// round number well above a stroke width keeps the baked quad comfortably
// non-degenerate.
const LINE_REFERENCE_LENGTH = 100

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
 * the moving cursor (dot + line to the center + trails) and its motion
 * blur.
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
  const lineTrailGraphicsRef = useRef<Graphics>(null)

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
  const trailWidthRef = useRef(trailWidth)
  trailWidthRef.current = trailWidth

  // The previous frame's point, used only to derive the motion-blur
  // velocity. `null` means "don't blur the next frame" — used to prevent a
  // *legitimate* discontinuity (the cursor being snapped/reset rather than
  // having actually travelled there) from being read as an enormous
  // instantaneous speed and producing a burst of ghost dots (the motion
  // blur kernel smearing a huge fake velocity across a few taps).
  const lastPointRef = useRef<GeoPoint | null>(null)

  // Flat `[x, y, x, y, …]` buffer of the trail's sample points, index 0
  // being the cursor itself and the rest walking backwards along the
  // shape. Written in place every frame: both trails read the same
  // samples, so the shape's boundary is walked once whatever is on screen,
  // and the sampling allocates nothing per frame beyond what
  // `getPointAtProgress` itself returns.
  const trailSamplesRef = useRef<number[]>(
    new Array<number>((TRAIL_SAMPLES + 1) * 2).fill(0)
  )

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

  // A light, cheap-quality glow on the dot's trail only (not the dot, not
  // the line's sector — a filter over an area that large is a different
  // order of cost) — kept as a single persistent filter instance/instruction
  // so redrawing the trail's (short, small) path every frame is the only
  // per-frame cost; the glow itself doesn't need any updating.
  //
  // `quality` (shader sample count, "the higher the less performant" per
  // the filter's own docs) is by far the dominant per-frame cost of the
  // whole cursor+trail: profiling with it disabled entirely dropped frame
  // time back down near the no-cursor baseline, while every other part
  // (trail geometry, motion blur) was in the noise by comparison. 0.05 (half
  // the filter's own default of 0.1) recovers most of that at a glow small
  // enough that the difference isn't visible — verified against 0.15.
  const trailGlowFilter = useMemo(
    () =>
      new GlowFilter({
        distance: Math.max(trailWidth * 2, 4),
        outerStrength: 1.5,
        innerStrength: 0,
        quality: 0.05,
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

  /**
   * Walks the shape backwards from `currentProgress` into
   * `trailSamplesRef`, every `stride` samples.
   */
  const sampleTrail = useCallback((currentProgress: number, stride: number) => {
    const samples = trailSamplesRef.current

    const secondsPerBar = signatureRef.current * (60 / bpmRef.current)
    const span = Math.min(
      TRAIL_DURATION_MS / 1000 / secondsPerBar,
      TRAIL_MAX_SPAN
    )

    for (let i = 0; i <= TRAIL_SAMPLES; i += stride) {
      const [x, y] = getPointAtProgressRef.current(
        currentProgress - span * (i / TRAIL_SAMPLES)
      )
      samples[i * 2] = x
      samples[i * 2 + 1] = y
    }
  }, [])

  /** The dot's trail: a tapering stroke along the boundary behind it. */
  const drawDotTrail = useCallback(() => {
    const g = trailGraphicsRef.current
    if (!g) {
      return
    }

    const samples = trailSamplesRef.current
    const color = colorRef.current
    const width = trailWidthRef.current

    g.clear()

    for (let i = 1; i <= DOT_TRAIL_SEGMENTS; i++) {
      // Degressive: dense right behind the dot, fading out toward the tail.
      const alpha = (1 - i / DOT_TRAIL_SEGMENTS) ** 2 * TRAIL_MAX_ALPHA
      if (alpha <= 0.01) {
        continue
      }

      const from = (i - 1) * DOT_TRAIL_STRIDE
      const to = i * DOT_TRAIL_STRIDE

      g.moveTo(samples[from * 2], samples[from * 2 + 1])
      g.lineTo(samples[to * 2], samples[to * 2 + 1])
      // Flat (not round) caps: each segment gets its own alpha, drawn as
      // its own little stroked path, so a round cap would bulge at every
      // segment boundary — a string of beads instead of a smooth taper.
      // Adjacent segments share exact endpoints, so flat caps tile
      // together cleanly.
      g.stroke({ width, color, alpha, cap: 'butt' })
    }
  }, [])

  /**
   * The line's trail: the same taper, swept. Where the dot leaves a path
   * behind it, the line sweeps an area, so its trail is that area — a
   * sector, built as a fan of triangles off the center, each carrying the
   * same degressive alpha its stroked counterpart would. Same span, same
   * fade law, same duration as the dot's; only the shape differs, because
   * the thing leaving it does.
   */
  const drawLineTrail = useCallback(() => {
    const g = lineTrailGraphicsRef.current
    if (!g) {
      return
    }

    const samples = trailSamplesRef.current
    const [cx, cy] = centerPointRef.current
    const color = colorRef.current

    g.clear()

    for (let i = 1; i <= TRAIL_SAMPLES; i++) {
      const alpha = (1 - i / TRAIL_SAMPLES) ** 2 * LINE_TRAIL_MAX_ALPHA
      if (alpha <= 0.01) {
        continue
      }

      // A fresh array per triangle: `Polygon` keeps the one it is handed
      // rather than copying it, so a shared scratch buffer would leave
      // every triangle reading the last one's coordinates.
      g.poly([
        cx,
        cy,
        samples[(i - 1) * 2],
        samples[(i - 1) * 2 + 1],
        samples[i * 2],
        samples[i * 2 + 1],
      ])
      g.fill({ color, alpha })
    }
  }, [])

  const renderAt = useCallback(
    (
      progress: MetronomeProgress,
      { snap = false }: { snap?: boolean } = {}
    ) => {
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
        const dx = x - cx
        const dy = y - cy

        // The line is one quad that never changes: it is baked once (see
        // `drawLine`) from the center along +x, and placed here by the
        // only two things about it that actually move — its angle and its
        // length. Clearing and re-stroking a path every frame rebuilt that
        // same quad sixty times a second for nothing. Scaling x alone
        // stretches the quad along its length and leaves its thickness
        // (which lies in y) exactly at `lineWidth`; the rotation that
        // follows is rigid, so nothing shears.
        line.rotation = Math.atan2(dy, dx)
        line.scale.x = Math.hypot(dx, dy) / LINE_REFERENCE_LENGTH
      }

      if (snap) {
        trailGraphicsRef.current?.clear()
        lineTrailGraphicsRef.current?.clear()
        return
      }

      const lineTrail = lineTrailGraphicsRef.current
      if (trailGraphicsRef.current || lineTrail) {
        sampleTrail(progress.progress, lineTrail ? 1 : DOT_TRAIL_STRIDE)
        drawDotTrail()
        drawLineTrail()
      }
    },
    [
      sampleTrail,
      drawDotTrail,
      drawLineTrail,
      motionBlurFilter,
      speedFactor,
      speedTrigger,
    ]
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

  const drawLine = useCallback(
    (g: Graphics) => {
      g.clear()
      g.moveTo(0, 0)
      g.lineTo(LINE_REFERENCE_LENGTH, 0)
      g.stroke({ width: lineWidth, color, alpha: 1, cap: 'butt' })
    },
    [color, lineWidth]
  )

  const [centerX, centerY] = centerPoint

  return (
    <>
      {showLine ? (
        <>
          <pixiGraphics ref={lineTrailGraphicsRef} draw={noop} />
          <pixiGraphics
            ref={lineGraphicsRef}
            x={centerX}
            y={centerY}
            draw={drawLine}
          />
        </>
      ) : null}
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
