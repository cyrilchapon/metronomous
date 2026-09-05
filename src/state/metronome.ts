import { atom } from 'jotai'
import { atomEffect } from 'jotai-effect'
import { focusAtom } from 'jotai-optics'
import {
  Metronome,
  MetronomeSignature,
  MetronomeSubdivision,
} from '../util/metronome'
import * as Tone from 'tone'

export type MetronomeState = {
  bpm: number
  signature: MetronomeSignature
  subdivisions: MetronomeSubdivision
  running: boolean
  muted: boolean
}

const initialMetronomeState: MetronomeState = {
  bpm: 50,
  signature: 4,
  subdivisions: 2,
  running: false,
  muted: false,
}

const transport = Tone.getTransport()

export const metronome = new Metronome(
  transport,
  initialMetronomeState.signature,
  initialMetronomeState.subdivisions
)

export const metronomeStateAtom = atom<MetronomeState>(initialMetronomeState)
export const metronomeRunningAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('running')
)
export const metronomeBpmAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('bpm')
)
export const metronomeSignatureAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('signature')
)
export const metronomeSubdivisionAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('subdivisions')
)
export const metronomeMutedAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('muted')
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
