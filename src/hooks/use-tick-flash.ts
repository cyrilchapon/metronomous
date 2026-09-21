import { useCallback, useEffect, useRef } from 'react'
import { useTick } from '@pixi/react'
import { Ticker } from 'pixi.js'
import { Metronome, MetronomeEvents } from '../util/metronome'

/**
 * Drives a short, fire-and-forget animation ("flash") entirely outside of
 * React's render cycle.
 *
 * The animation is armed by a discrete metronome event (a beat/subdivision
 * tick, emitted from the same per-frame read of the audio clock that moves
 * the cursor) and then advanced every PixiJS tick by calling `onFrame(t)`
 * with `t` going from `0` to `1` over `durationBeats` worth of the current
 * tempo. `onFrame` is expected
 * to imperatively drive a `pixi.Graphics` ref — no state is set, so an
 * idle flash (the overwhelming majority of frames, for the overwhelming
 * majority of instances) costs a single boolean check per frame instead of
 * a React re-render.
 */
export const useTickFlash = <E extends keyof MetronomeEvents>(
  metronome: Metronome,
  event: E,
  matches: (...args: Parameters<MetronomeEvents[E]>) => boolean,
  /**
   * How long the flash lasts, counted in beats rather than in
   * milliseconds: a flash is a reading of the pulse, so it should take the
   * same share of a beat whatever the tempo — slow the metronome down and
   * it should visibly unfold more slowly, not blink at the same speed
   * against a longer silence.
   */
  durationBeats: number,
  onFrame: (t: number) => void
) => {
  const activeRef = useRef(false)
  const startedAtRef = useRef(0)
  /**
   * Resolved once, when the flash fires, rather than read per frame:
   * a tempo change mid-flash then plays the rest of *that* flash at the
   * speed it started at, instead of stretching an animation already
   * underway.
   */
  const durationMsRef = useRef(0)

  useEffect(() => {
    const unsubscribe = metronome.on(event, (...args: unknown[]) => {
      if (!matches(...(args as Parameters<MetronomeEvents[E]>))) {
        return
      }

      startedAtRef.current = performance.now()
      durationMsRef.current = durationBeats * metronome.beatMs
      activeRef.current = true
    })

    return unsubscribe
  }, [metronome, event, matches, durationBeats])

  const tick = useCallback(
    (ticker: Ticker) => {
      if (!activeRef.current) {
        return
      }

      // The ticker's own timestamp rather than another `performance.now()`
      // read: every flash alive this frame then advances on exactly the
      // same instant (dozens of them can be, with a 7/6 bar), instead of
      // each sampling the clock a few microseconds apart. It is behind the
      // arming timestamp above — the metronome is polled from within the
      // frame, after the ticker stamped it — so the very first frame of a
      // flash can come out slightly negative; clamp rather than let the
      // curve run backwards.
      const elapsedMs = Math.max(0, ticker.lastTime - startedAtRef.current)
      const t = elapsedMs / durationMsRef.current

      if (t >= 1) {
        activeRef.current = false
        onFrame(1)
        return
      }

      onFrame(t)
    },
    [onFrame]
  )

  useTick(tick)
}
