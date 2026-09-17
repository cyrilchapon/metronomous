import * as easings from '@juliendargelos/easings'
import { EasingFunction } from '@juliendargelos/easings'

export const easingMasses = [0, 1, 2, 3, 4, 5, 6, 7] as const
export type EasingMass = (typeof easingMasses)[number]

/**
 * Keyed by mass rather than positional. This used to be an array indexed by
 * the mass itself, which silently returned `undefined` for any mass that
 * wasn't also a valid index — adding a non-contiguous entry to
 * `easingMasses` now fails to compile here instead.
 *
 * Kept module-private so a mass is the only way in.
 */
const easingsInByMass: Record<EasingMass, EasingFunction> = {
  0: easings.linear,
  1: easings.sinusoidal.in,
  2: easings.quadratic.in,
  3: easings.cubic.in,
  4: easings.quartic.in,
  5: easings.quintic.in,
  6: easings.exponential.in,
  7: easings.circular.in,
}

export const massEasingIn = (mass: EasingMass): EasingFunction =>
  easingsInByMass[mass]

export const isEasingMass = (n: unknown): n is EasingMass =>
  typeof n === 'number' && !isNaN(n) && easingMasses.includes(n as EasingMass)
