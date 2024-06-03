import { Atom, atom } from 'jotai'
import { atomEffect } from 'jotai-effect'
import { focusAtom } from 'jotai-optics'
import * as Tone from 'tone'
import { store } from './store'

export const metronomeSignatures = [3, 4, 5, 6, 7] as const
export type MetronomeSignature = typeof metronomeSignatures[number]

export type MetronomeState = {
  bpm: number
  signature: MetronomeSignature
  running: boolean
  progress: number
}

const initialMetronomeState: MetronomeState = {
  bpm: 90,
  signature: 4,
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

const synth = new Tone.PluckSynth()
synth.toDestination()

const transport = Tone.getTransport()
transport.timeSignature = initialMetronomeState.signature

const loop = new Tone.Sequence(
  (time, note) => {
    synth.triggerAttackRelease(note, 0.1, time)
    // draw.schedule(() => {
    //   store.set(metronomeProgress, loop.progress)
    // }, time)
  },
  [
    'D4',
    ...new Array(initialMetronomeState.signature - 1)
      .fill(null)
      .map(() => 'C4'),
  ],
  '4n'
)

let tickerId: number | null = null
const followProgressTick = () => {
  store.set(metronomeProgressAtom, loop.progress)
  tickerId = requestAnimationFrame(followProgressTick)
}

export const updateMetronomeBpmEffect = atomEffect((get) => {
  const bpm = get(metronomeBpmAtom)
  transport.bpm.value = bpm
})

export const updateMetronomeRunningEffect = atomEffect((get, set) => {
  const running = get(metronomeRunningAtom)

  if (running) {
    if (loop.state !== 'started') {
      loop.start(0)
    } // else leave it running
    if (transport.state !== 'started') {
      transport.start()
    } // else leave it running
    if (tickerId == null) {
      tickerId = requestAnimationFrame(followProgressTick)
    } // else leave it running
  } else {
    if (transport.state !== 'stopped') {
      transport.stop()
    } // else leave it stopped
    if (loop.state !== 'stopped') {
      loop.stop()
    } // else leave it stopped
    if (tickerId != null) {
      cancelAnimationFrame(tickerId)
      tickerId = null
    } // else leave it stopped
    set(metronomeProgressAtom, 0)
  }
})

export const updateMetronomeSignatureEffect = atomEffect((get) => {
  const signature = get(metronomeSignatureAtom)

  transport.timeSignature = signature
  loop.events = ['D4', ...new Array(signature - 1).fill(null).map(() => 'C4')]
})

// Tone.Transport.on('stop', function () {
//   console.log('loop stopped')
// })
