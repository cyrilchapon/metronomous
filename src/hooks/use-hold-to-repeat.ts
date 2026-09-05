import * as easings from '@juliendargelos/easings'
import { PointerEventHandler, useCallback, useEffect, useRef } from 'react'

export type HoldToRepeatOptions = {
  /** How long to hold before repeating starts. */
  holdDelayMs?: number
  /** Interval between the first few repeats. */
  startIntervalMs?: number
  /** Interval repeats accelerate down to, and stay at. */
  minIntervalMs?: number
  /** How long it takes to ramp from `startIntervalMs` down to `minIntervalMs`. */
  rampMs?: number
}

export type HoldToRepeatHandlers = {
  onClick: () => void
  onPointerDown: PointerEventHandler
  onPointerUp: PointerEventHandler
  onPointerLeave: PointerEventHandler
  onPointerCancel: PointerEventHandler
}

/**
 * A single tap calls `onStep` once. Holding calls it repeatedly, starting
 * slow and accelerating (a quadratic ease-in over `rampMs`, the same feel
 * as e.g. a native scroll spinner) down to `minIntervalMs`, for as long as
 * the pointer stays down.
 */
export const useHoldToRepeat = (
  onStep: () => void,
  {
    holdDelayMs = 400,
    startIntervalMs = 220,
    minIntervalMs = 30,
    rampMs = 2500,
  }: HoldToRepeatOptions = {}
): HoldToRepeatHandlers => {
  const onStepRef = useRef(onStep)
  onStepRef.current = onStep

  const timeoutRef = useRef<number | undefined>(undefined)
  const holdStartedAtRef = useRef(0)
  // Whether this press already repeated at least once — if so, the click
  // event that follows releasing the pointer is a leftover of that same
  // press (not a separate tap) and must not trigger one extra step.
  const repeatedRef = useRef(false)

  const stop = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  const tick = useCallback(() => {
    repeatedRef.current = true
    onStepRef.current()

    const elapsedMs = performance.now() - holdStartedAtRef.current
    const t = Math.min(elapsedMs / rampMs, 1)
    const interval =
      startIntervalMs - (startIntervalMs - minIntervalMs) * easings.quadratic.in(t)

    timeoutRef.current = window.setTimeout(tick, interval)
  }, [minIntervalMs, rampMs, startIntervalMs])

  const onPointerDown = useCallback<PointerEventHandler>(() => {
    repeatedRef.current = false
    holdStartedAtRef.current = performance.now()
    timeoutRef.current = window.setTimeout(tick, holdDelayMs)
  }, [holdDelayMs, tick])

  const onClick = useCallback(() => {
    if (!repeatedRef.current) {
      onStepRef.current()
    }
  }, [])

  useEffect(() => stop, [stop])

  return {
    onClick,
    onPointerDown,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  }
}
