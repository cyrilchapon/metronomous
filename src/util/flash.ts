import * as easings from '@juliendargelos/easings'

/**
 * Shared timing curve for every "flash" animation (division/subdivision
 * dots and shape pulses): opacity eases out (cubic), radius eases out
 * (quadratic) — matching the feel of the metronome's original springs.
 */
export const flashValuesAt = (
  t: number,
  fromOpacity: number,
  fromRadius: number,
  toRadius: number
) => ({
  opacity: fromOpacity * (1 - easings.cubic.out(t)),
  radius: fromRadius + (toRadius - fromRadius) * easings.quadratic.out(t),
})
