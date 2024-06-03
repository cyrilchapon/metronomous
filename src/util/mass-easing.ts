import * as easings from '@juliendargelos/easings'

export const easingMasses = [0, 1, 2, 3, 4, 5, 6, 7] as const
export type EasingMass = (typeof easingMasses)[number]
export const easingsInByMass = [
  easings.linear,
  easings.sinusoidal.in,
  easings.quadratic.in,
  easings.cubic.in,
  easings.quartic.in,
  easings.quintic.in,
  easings.exponential.in,
  easings.circular.in,
]
export const easingsOutByMass = [
  easings.linear,
  easings.sinusoidal.out,
  easings.quadratic.out,
  easings.cubic.out,
  easings.quartic.out,
  easings.quintic.out,
  easings.exponential.out,
  easings.circular.out,
]
export const easingsInOutByMass = [
  easings.linear,
  easings.sinusoidal,
  easings.quadratic,
  easings.cubic,
  easings.quartic,
  easings.quintic,
  easings.exponential,
  easings.circular,
]

export const massEasingIn = (mass: EasingMass) => easingsInByMass[mass]
export const massEasingOut = (mass: EasingMass) => easingsOutByMass[mass]
export const massEasingInOut = (mass: EasingMass) => easingsInOutByMass[mass]

export const isEasingMass = (n: unknown): n is EasingMass =>
  typeof n === 'number' && !isNaN(n) && easingMasses.includes(n as EasingMass)
export function assertIsEasingMass(n: unknown): asserts n is EasingMass {
  if (!isEasingMass(n)) {
    throw new TypeError(`${String(n)} is not an EasingMass`)
  }
}
