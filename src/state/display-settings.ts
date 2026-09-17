import { z } from 'zod'
import { EasingMass, easingMasses } from '../util/mass-easing'
import { ConfigShape, configSchema, persistedConfigAtom } from './persistence'

export const shapeModes = ['circle', 'polygon'] as const
export type ShapeMode = (typeof shapeModes)[number]

export const shapeDivisions = ['divisions', 'subdivisions', 'off'] as const
export type ShapeDivisions = (typeof shapeDivisions)[number]

export const cursorMoveModes = ['eased', 'linear'] as const
export type CursorMoveMode = (typeof cursorMoveModes)[number]

export const cursorModes = ['dot', 'line'] as const
export type CursorMode = (typeof cursorModes)[number]

export const flashModes = ['divisions', 'shape'] as const
export type FlashMode = (typeof flashModes)[number]

export type DisplaySettings = {
  shapeMode: ShapeMode
  shapeSubdivisions: ShapeDivisions
  cursorMass: EasingMass
  cursorMoveMode: CursorMoveMode
  cursorMode: CursorMode[]
  flashMode: FlashMode[]
}

/** Exported so the interface can tell whether there is anything to reset. */
export const defaultDisplaySettings: DisplaySettings = {
  shapeMode: 'circle',
  shapeSubdivisions: 'subdivisions',
  // Only ever read in `eased` mode, so this is really "what the user gets
  // the moment they flip that switch". The heavier masses park the cursor
  // next to the previous beat and snap it across at the last instant —
  // quintic has covered 3% of the way at mid-beat — which reads as a
  // glitch rather than as inertia. Quadratic (25% at mid-beat) lags
  // visibly while still tracking the beat it's travelling through.
  cursorMass: 2,
  // Constant angular speed: the distance covered *is* the time elapsed,
  // which is the reading a metronome is there to give. `eased` is the more
  // spectacular one, but it has to be asked for.
  cursorMoveMode: 'linear',
  cursorMode: ['dot'],
  flashMode: ['divisions'],
}

/**
 * How the visualization is *drawn*. Whether it is drawn at all lives in
 * `global-settings`, so that resetting this config wholesale doesn't turn
 * the canvas back on behind the user's back.
 *
 * Validated against the same tuples the types are built from, so an option
 * added to (or dropped from) one of them needs nothing here.
 */
const displaySettingsShape = {
  shapeMode: z.enum(shapeModes),
  shapeSubdivisions: z.enum(shapeDivisions),
  cursorMass: z.literal(easingMasses),
  cursorMoveMode: z.enum(cursorMoveModes),
  cursorMode: z.array(z.enum(cursorModes)),
  flashMode: z.array(z.enum(flashModes)),
} satisfies ConfigShape<DisplaySettings>

export const displaySettingsAtom = persistedConfigAtom({
  key: 'display-settings',
  version: 1,
  defaults: defaultDisplaySettings,
  schema: configSchema(displaySettingsShape),
})
