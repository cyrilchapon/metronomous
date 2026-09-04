import { useCallback, useEffect, useRef } from 'react'
import { useTick } from '@pixi/react'
import { Metronome, MetronomeEvents } from '../util/metronome'

/**
 * Drives a short, fire-and-forget animation ("flash") entirely outside of
 * React's render cycle.
 *
 * The animation is armed by a discrete metronome event (a beat/subdivision
 * tick, already synchronized to the audio clock via `Tone.Draw`) and then
 * advanced every PixiJS tick by calling `onFrame(t)` with `t` going from `0`
 * to `1` over `durationMs`. `onFrame` is expected to imperatively redraw a
 * `pixi.Graphics` ref — no state is set, so an idle flash (the overwhelming
 * majority of frames, for the overwhelming majority of instances) costs a
 * single boolean check per frame instead of a React re-render.
 */
export const useTickFlash = <E extends keyof MetronomeEvents>(
  metronome: Metronome,
  event: E,
  matches: (...args: Parameters<MetronomeEvents[E]>) => boolean,
  durationMs: number,
  onFrame: (t: number) => void
) => {
  const activeRef = useRef(false)
  const startedAtRef = useRef(0)

  useEffect(() => {
    const unsubscribe = metronome.on(event, (...args: unknown[]) => {
      if (!matches(...(args as Parameters<MetronomeEvents[E]>))) {
        return
      }

      startedAtRef.current = performance.now()
      activeRef.current = true
    })

    return unsubscribe
  }, [metronome, event, matches])

  const tick = useCallback(() => {
    if (!activeRef.current) {
      return
    }

    const elapsedMs = performance.now() - startedAtRef.current
    const t = elapsedMs / durationMs

    if (t >= 1) {
      activeRef.current = false
      onFrame(1)
      return
    }

    onFrame(t)
  }, [durationMs, onFrame])

  useTick(tick)
}
