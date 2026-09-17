import { atom } from 'jotai'
import { atomEffect } from 'jotai-effect'
import { focusAtom } from 'jotai-optics'
import { z } from 'zod'
import {
  clampMetronomeBpm,
  Metronome,
  MetronomeSignature,
  metronomeSignatures,
  MetronomeSubdivision,
  metronomeSubdivisions,
} from '../util/metronome'
import { ConfigShape, configSchema, persistedConfigAtom } from './persistence'
import { store } from './store'
import * as Tone from 'tone'

/** The part of the metronome that outlives a session. */
export type MetronomeConfig = {
  bpm: number
  signature: MetronomeSignature
  subdivisions: MetronomeSubdivision
  muted: boolean
}

export type MetronomeState = MetronomeConfig & {
  running: boolean
}

const defaultMetronomeConfig: MetronomeConfig = {
  bpm: 50,
  signature: 4,
  subdivisions: 2,
  muted: false,
}

const metronomeConfigShape = {
  // A tempo that no longer fits the allowed range (the bounds moved, or a
  // hand-edited config) is worth clamping rather than resetting: "as fast
  // as this build allows" is closer to what was stored than 50 BPM is.
  bpm: z.number().transform((bpm) => clampMetronomeBpm(Math.round(bpm))),
  signature: z.literal(metronomeSignatures),
  subdivisions: z.literal(metronomeSubdivisions),
  muted: z.boolean(),
} satisfies ConfigShape<MetronomeConfig>

export const metronomeConfigAtom = persistedConfigAtom({
  key: 'metronome',
  version: 1,
  defaults: defaultMetronomeConfig,
  schema: configSchema(metronomeConfigShape),
})

/**
 * Deliberately *not* persisted, and the reason the running state lives
 * outside `metronomeConfigAtom`: coming back to the app shouldn't start
 * clicking on its own — the browser wouldn't let it anyway, since Tone's
 * audio context needs a user gesture to start.
 */
export const metronomeRunningAtom = atom(false)

export const metronomeStateAtom = atom<MetronomeState>((get) => ({
  ...get(metronomeConfigAtom),
  running: get(metronomeRunningAtom),
}))

export const metronomeBpmAtom = focusAtom(metronomeConfigAtom, (optic) =>
  optic.prop('bpm')
)
export const metronomeSignatureAtom = focusAtom(metronomeConfigAtom, (optic) =>
  optic.prop('signature')
)
export const metronomeSubdivisionAtom = focusAtom(
  metronomeConfigAtom,
  (optic) => optic.prop('subdivisions')
)
export const metronomeMutedAtom = focusAtom(metronomeConfigAtom, (optic) =>
  optic.prop('muted')
)

const transport = Tone.getTransport()

// Built from the *stored* config — which `persistedConfigAtom` has already
// hydrated synchronously by the time this module runs — so the sequence is
// right from the start instead of being rebuilt by the effects below as
// soon as the app mounts.
const initialConfig = store.get(metronomeConfigAtom)

export const metronome = new Metronome(
  transport,
  initialConfig.signature,
  initialConfig.subdivisions
)

export const updateMetronomeBpmEffect = atomEffect((get) => {
  const bpm = get(metronomeBpmAtom)
  transport.bpm.value = bpm
})

export const updateMetronomeRunningEffect = atomEffect((get) => {
  const running = get(metronomeRunningAtom)

  if (running) {
    metronome.start()
  } else {
    metronome.stop()
  }
})

export const updateMetronomeSignatureEffect = atomEffect((get) => {
  const signature = get(metronomeSignatureAtom)
  metronome.setSignature(signature)
})

export const updateMetronomeSubdivisionEffect = atomEffect((get) => {
  const subdivisions = get(metronomeSubdivisionAtom)
  metronome.setSubdivisions(subdivisions)
})

export const updateMetronomeMutedEffect = atomEffect((get) => {
  const muted = get(metronomeMutedAtom)
  Tone.getDestination().mute = muted
})
