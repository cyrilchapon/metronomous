import { atom } from 'jotai'
import { atomEffect } from 'jotai-effect'
import { focusAtom } from 'jotai-optics'
import { store } from './store'
import {
  Metronome,
  MetronomeProgress,
  MetronomeSignature,
  MetronomeSubdivision,
} from '../util/metronome'

export type MetronomeState = {
  bpm: number
  signature: MetronomeSignature
  subdivisions: MetronomeSubdivision
  running: boolean
  progress: MetronomeProgress
}

const metronome = Metronome.instance

const initialMetronomeState: MetronomeState = {
  bpm: metronome.bpm,
  signature: metronome.signature,
  subdivisions: metronome.subdivisions,
  running: metronome.running,
  progress: metronome.progress
}

export const metronomeStateAtom = atom<MetronomeState>(initialMetronomeState)
export const metronomeRunningAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('running')
)
export const metronomeBpmAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('bpm')
)
export const metronomeProgressAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('progress')
)
export const metronomeSignatureAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('signature')
)
export const metronomeSubdivisionAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('subdivisions')
)

metronome.setOnProgress((metronomeProgress) => {
  store.set(metronomeProgressAtom, metronomeProgress)
})

export const updateMetronomeBpmEffect = atomEffect((get) => {
  const bpm = get(metronomeBpmAtom)
  metronome.setBpm(bpm)
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
