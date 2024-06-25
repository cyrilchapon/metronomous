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
import * as Tone from 'tone'

export type MetronomeState = {
  bpm: number
  signature: MetronomeSignature
  subdivisions: MetronomeSubdivision
  running: boolean
  progress: MetronomeProgress
}

const initialMetronomeState: MetronomeState = {
  bpm: 50,
  signature: 4,
  subdivisions: 2,
  running: false,
  progress: {
    progress: 0,
    divisionIndex: 0,
    progressInDivision: 0,
  },
}

const transport = Tone.getTransport()

const metronome = new Metronome(
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
export const metronomeProgressAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('progress')
)
export const metronomeSignatureAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('signature')
)
export const metronomeSubdivisionAtom = focusAtom(metronomeStateAtom, (optic) =>
  optic.prop('subdivisions')
)

export type MetronomeSubdivisionProgressState = {
  totalSubdivisions: number
  subdivisionIndexInDivision: number
  subdivisionIndex: number
  progressInSubdivision: number
}
export const metronomeSubdivisionProgressAtom =
  atom<MetronomeSubdivisionProgressState>((get) => {
    const {
      signature,
      subdivisions,
      progress: { divisionIndex, progressInDivision },
    } = get(metronomeStateAtom)

    const totalSubdivisions = subdivisions * signature
    const subdivisionIndexInDivision = Math.floor(
      progressInDivision * subdivisions
    )
    const subdivisionIndex =
      divisionIndex * subdivisions + subdivisionIndexInDivision

    const progressInSubdivision = (progressInDivision * subdivisions) - subdivisionIndexInDivision

    return {
      totalSubdivisions,
      subdivisionIndexInDivision,
      subdivisionIndex,
      progressInSubdivision
    }
  })

metronome.setOnProgress((metronomeProgress) => {
  store.set(metronomeProgressAtom, metronomeProgress)
})

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
