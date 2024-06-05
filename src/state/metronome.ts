import { Atom, atom } from 'jotai'
import { atomEffect } from 'jotai-effect'
import { focusAtom } from 'jotai-optics'
import * as Tone from 'tone'
import { store } from './store'
import { emptyArray } from '../util/array'
import { UnreachableCaseError } from '../util/unreachable-case-error'

export const metronomeSignatures = [3, 4, 5, 6, 7] as const
export type MetronomeSignature = (typeof metronomeSignatures)[number]

export const metronomeSubdivisions = [1, 2, 3, 4, 6] as const
export type MetronomeSubdivision = (typeof metronomeSubdivisions)[number]

export type MetronomeState = {
  bpm: number
  signature: MetronomeSignature
  subdivisions: MetronomeSubdivision
  running: boolean
  progress: number
}

const initialMetronomeState: MetronomeState = {
  bpm: 90,
  signature: 4,
  subdivisions: 2,
  running: false,
  progress: 0,
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

export type MetronomeTempo = {
  divisonIndex: number
  progressInDivision: number
}
export const metronomeTempoAtom: Atom<{
  divisionIndex: number
  progressInDivision: number
}> = atom((get) => {
  const { progress, signature } = get(metronomeStateAtom)

  const divisionIndex = Math.floor(progress * signature)
  const progressInDivision =
    (progress - (1 / signature) * divisionIndex) * signature

  const tempo = {
    divisionIndex,
    progressInDivision,
  }

  return tempo
})

const synth = new Tone.MembraneSynth()
synth.toDestination()

const transport = Tone.getTransport()
transport.timeSignature = initialMetronomeState.signature

type MetronomeNote = {
  name: string
  velocity: number
}

const getSequenceEvents = (
  signature: MetronomeSignature,
  subdivisions: MetronomeSubdivision
) => {
  return emptyArray(signature).flatMap<MetronomeNote>((_v1, beat) =>
    emptyArray(subdivisions).map<MetronomeNote>((_v, subdivision) => ({
      name: beat === 0 && subdivision === 0 ? 'A2' : 'C2',
      velocity: subdivision === 0 ? 1 : 0.2,
    }))
  )
}

const getSequenceSubdivision = (subdivisions: MetronomeSubdivision) => {
  switch (subdivisions) {
    case 1:
      return '4n'
    case 2:
      return '8n'
    case 3:
      return '8t'
    case 4:
      return '16n'
    case 6:
      return '16t'
    default:
      throw new UnreachableCaseError(subdivisions)
  }
}

const playNote: Tone.ToneEventCallback<MetronomeNote> = (
  time,
  { name: note, velocity }
) => {
  synth.triggerAttackRelease(note, '64n', time, velocity)
}

const buildSequence = (
  signature: MetronomeSignature,
  subdivisions: MetronomeSubdivision
) =>
  new Tone.Sequence<MetronomeNote>(
    playNote,
    getSequenceEvents(signature, subdivisions),
    getSequenceSubdivision(subdivisions)
  )

let sequence = buildSequence(
  initialMetronomeState.signature,
  initialMetronomeState.subdivisions
)

let tickerId: number | null = null
const followProgressTick = () => {
  store.set(metronomeProgressAtom, sequence.progress)
  tickerId = requestAnimationFrame(followProgressTick)
}

export const updateMetronomeBpmEffect = atomEffect((get) => {
  const bpm = get(metronomeBpmAtom)
  transport.bpm.value = bpm
})

export const updateMetronomeRunningEffect = atomEffect((get, set) => {
  const running = get(metronomeRunningAtom)

  if (running) {
    startMetronome()
  } else {
    stopMetronome()
    set(metronomeProgressAtom, 0)
  }
})

const startMetronome = () => {
  if (sequence.state !== 'started') {
    sequence.start(0)
  } // else leave it running
  if (transport.state !== 'started') {
    transport.start()
  } // else leave it running
  if (tickerId == null) {
    tickerId = requestAnimationFrame(followProgressTick)
  } // else leave it running
}

const stopMetronome = () => {
  if (transport.state !== 'stopped') {
    transport.stop()
  } // else leave it stopped
  if (sequence.state !== 'stopped') {
    sequence.stop()
  } // else leave it stopped
  if (tickerId != null) {
    cancelAnimationFrame(tickerId)
    tickerId = null
  } // else leave it stopped
}

export const updateMetronomeSignatureEffect = atomEffect((get) => {
  const signature = get(metronomeSignatureAtom)
  const subdivisions = get.peek(metronomeSubdivisionAtom)

  transport.timeSignature = signature
  sequence.events = getSequenceEvents(signature, subdivisions)
})

export const updateMetronomeSubdivisionEffect = atomEffect((get, set) => {
  const subdivisions = get(metronomeSubdivisionAtom)
  const signature = get.peek(metronomeSignatureAtom)
  const running = get.peek(metronomeRunningAtom)

  stopMetronome()
  sequence.dispose()
  set(metronomeProgressAtom, 0)

  transport.timeSignature = signature
  sequence = buildSequence(signature, subdivisions)

  if (running) {
    startMetronome()
  }
})

// Tone.Transport.on('stop', function () {
//   console.log('loop stopped')
// })
