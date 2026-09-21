import * as easings from '@juliendargelos/easings'

/**
 * Share of the flash spent rising to full brightness. Something that is
 * simply *on* at full opacity on its very first frame reads as a digital
 * switch; a real flash — a strobe, a struck surface — takes a moment to
 * reach its peak. At the 500ms the flashes run for, this is ~25ms: two
 * frames, short enough that the perceived onset is still the beat itself
 * (the first frame is already at half brightness), long enough to round
 * off the edge.
 */
const ATTACK = 0.05

/**
 * Steepness of the brightness decay. Light — and the energy of an impact —
 * dies off exponentially rather than polynomially: most of it is gone
 * early, then a long faint tail. `(1 - t)³`, what this used to be, spends
 * far too long in the middle of that.
 *
 * Normalized so it still reaches exactly 0 at `t = 1`: `Math.exp` never
 * does on its own, and a flash that never quite ends is a flash that never
 * stops costing a draw.
 */
const DECAY = 6
const DECAY_FLOOR = Math.exp(-DECAY)
const DECAY_SCALE = 1 / (1 - DECAY_FLOOR)

const decay = (u: number) => (Math.exp(-DECAY * u) - DECAY_FLOOR) * DECAY_SCALE

/**
 * Expansion curve. A shockwave leaves fast, decelerates as it spends
 * itself, and — being a physical thing rather than a tween — drifts a
 * couple of percent past where it settles before relaxing back. The
 * overshoot is deliberately small (~2%): enough to stop the growth from
 * landing dead flat, not enough to read as a bounce.
 */
const expand = easings.back.out.with({ overshoot: 0.8 })

/**
 * Below this, a flash is still costing a full-size fill every frame and
 * paying nothing back: at 1% alpha a red disc moves the pixels under it by
 * about one 8-bit step. An exponential decay spends a long time down
 * there — with the current steepness the last quarter of every flash's
 * life is under this — and a shape flash is a disc covering the whole
 * visualization, several of which can be alive at once. So the tail is cut
 * rather than drawn: `flashValuesAt` reports it as over, which is what
 * lets the callers hide the graphics outright.
 */
const MIN_VISIBLE_OPACITY = 0.01

export type FlashValues = {
  opacity: number
  /**
   * Relative to `toRadius`, *not* to `fromRadius`: the shape is drawn once
   * at its largest and scaled down from there, so a circle's tessellation
   * is always built for the biggest it will ever be (scaling a small
   * circle up by 10x would show its facets) and so a stroke never has to
   * be magnified.
   */
  scale: number
}

/**
 * Shared timing curve for every "flash" animation (division/subdivision
 * dots and shape pulses).
 *
 * Returns a transform rather than a geometry: a flash is the same shape
 * throughout its life, only brighter/bigger, so nothing about it needs
 * redrawing per frame — see `FlashDot`/`FlashCircleShape`.
 */
export const flashValuesAt = (
  t: number,
  fromOpacity: number,
  fromRadius: number,
  toRadius: number
): FlashValues => {
  const brightness =
    t < ATTACK
      ? easings.quadratic.out(t / ATTACK)
      : decay((t - ATTACK) / (1 - ATTACK))

  const radius = fromRadius + (toRadius - fromRadius) * expand(t)
  const opacity = fromOpacity * brightness

  return {
    opacity: opacity < MIN_VISIBLE_OPACITY ? 0 : opacity,
    scale: radius / toRadius,
  }
}
