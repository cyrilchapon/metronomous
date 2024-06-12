import * as Tone from 'tone'
import { emptyArray } from './array'
import { UnreachableCaseError } from './unreachable-case-error'

export const metronomeSignatures = [3, 4, 5, 6, 7] as const
export type MetronomeSignature = (typeof metronomeSignatures)[number]

export const metronomeSubdivisions = [1, 2, 3, 4, 6] as const
export type MetronomeSubdivision = (typeof metronomeSubdivisions)[number]

export type MetronomeNote = {
  name: string
  velocity: number
}

export type MetronomeProgress = {
  progress: number
  progressInDivision: number
  divisionIndex: number
}

const INITIAL_SIGNATURE: MetronomeSignature = 4
const INITIAL_SUBDIVISION: MetronomeSubdivision = 1
const INITIAL_BPM = 90

export class Metronome {
  static buildSequence =
    (synth: Tone.Synth) =>
    (signature: MetronomeSignature, subdivisions: MetronomeSubdivision) =>
      new Tone.Sequence<MetronomeNote>(
        Metronome.playNote(synth),
        Metronome.getSequenceEvents(signature, subdivisions),
        Metronome.getSequenceSubdivision(subdivisions)
      )

  static getSequenceEvents = (
    signature: MetronomeSignature,
    subdivisions: MetronomeSubdivision
  ) => {
    return emptyArray(signature).flatMap<MetronomeNote>((_v1, beat) =>
      emptyArray(subdivisions).map<MetronomeNote>((_v, subdivision) => ({
        name: beat === 0 && subdivision === 0 ? 'A2' : 'C2',
        velocity: subdivision === 0 ? 0.8 : 0.2,
      }))
    )
  }

  static playNote =
    (synth: Tone.Synth): Tone.ToneEventCallback<MetronomeNote> =>
    (time, { name: note, velocity }) => {
      synth.triggerAttackRelease(note, '64n', time, velocity)
    }

  static getSequenceSubdivision = (subdivisions: MetronomeSubdivision) => {
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

  readonly synth: Tone.Synth
  readonly transport: ReturnType<typeof Tone.getTransport>

  private _sequence: Tone.Sequence<MetronomeNote>
  get sequence() {
    return this._sequence
  }

  private onProgress: ((progress: MetronomeProgress) => void) | null = null

  private metronomeTickerId: number | null = null

  private _signature: MetronomeSignature
  get signature() {
    return this._signature
  }

  private _subdivisions: MetronomeSubdivision
  get subdivisions() {
    return this._subdivisions
  }

  private _bpm: number
  get bpm() {
    return this._bpm
  }

  get running() {
    return this.transport.state === 'started' && this.metronomeTickerId != null
  }

  private _getProgress(forceProgress?: number): MetronomeProgress {
    const progress = forceProgress ?? this._sequence.progress
    const divisionIndex = Math.floor(progress * this._signature)
    const progressInDivision =
      (progress - (1 / this._signature) * divisionIndex) * this._signature

    return {
      progress,
      progressInDivision,
      divisionIndex,
    }
  }

  get progress(): MetronomeProgress {
    return this._getProgress()
  }

  private constructor(
    initialTimeSignature: MetronomeSignature,
    initialSubdivisions: MetronomeSubdivision,
    initialBpm: number
  ) {
    this._signature = initialTimeSignature
    this._subdivisions = initialSubdivisions
    this._bpm = initialBpm

    this.synth = new Tone.MembraneSynth()
    this.synth.toDestination()

    this.transport = Tone.getTransport()
    this.transport.timeSignature = this._signature

    this.transport.bpm.value = this._bpm

    this._sequence = Metronome.buildSequence(this.synth)(
      this._signature,
      this._subdivisions
    )
  }

  static instance = new this(
    INITIAL_SIGNATURE,
    INITIAL_SUBDIVISION,
    INITIAL_BPM
  )

  setSignature(signature: MetronomeSignature) {
    const oldSignature = this._signature
    this._signature = signature

    if (oldSignature !== this._signature) {
      this.transport.timeSignature = this._signature

      this._rebuildSequence()
    }
  }

  setSubdivisions(subdivisions: MetronomeSubdivision) {
    const oldSubdivisions = this._subdivisions
    this._subdivisions = subdivisions

    if (oldSubdivisions !== this.subdivisions) {
      this._rebuildSequence()
    }
  }

  setBpm(bpm: number) {
    this._bpm = bpm
    this.transport.bpm.value = this._bpm
  }

  setOnProgress(onProgress: (progress: MetronomeProgress) => void) {
    this.onProgress = onProgress
  }

  start() {
    if (this.transport.state !== 'started') {
      this._sequence.start(0)
      this.transport.start()
    } // else leave it running

    if (this.metronomeTickerId == null) {
      this.metronomeTickerId = requestAnimationFrame(this.tick.bind(this))
    } // else leave it running
  }

  stop() {
    if (this.transport.state !== 'stopped') {
      this.sendProgress(0)
      this._sequence.stop(0)
      this.transport.stop()
    } // else leave it running

    if (this.metronomeTickerId != null) {
      cancelAnimationFrame(this.metronomeTickerId)
      this.metronomeTickerId = null
    } // else leave it stopped
  }

  tick() {
    this.sendProgress()
    this.metronomeTickerId = requestAnimationFrame(this.tick.bind(this))
  }

  private sendProgress(forceProgress?: number) {
    if (this.onProgress != null) {
      try {
        const progress = this._getProgress(forceProgress)
        this.onProgress(progress)
      } catch (err) {
        console.error('onTick error', err)
      }
    }
  }

  private _rebuildSequence() {
    this._sequence.dispose()
    this._sequence = Metronome.buildSequence(this.synth)(
      this._signature,
      this._subdivisions
    )

    if (this.transport.state === 'started') {
      this._sequence.start(this.transport.progress)
    }
  }
}
