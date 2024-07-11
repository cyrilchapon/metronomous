import * as Tone from 'tone'
import { emptyArray } from './array'
import { UnreachableCaseError } from './unreachable-case-error'
import { TransportClass } from 'tone/build/esm/core/clock/Transport'
import { createNanoEvents, Emitter } from 'nanoevents'

export const metronomeSignatures = [3, 4, 5, 6, 7] as const
export type MetronomeSignature = (typeof metronomeSignatures)[number]

export const metronomeSubdivisions = [1, 2, 3, 4, 6] as const
export type MetronomeSubdivision = (typeof metronomeSubdivisions)[number]

export type MetronomeTick = {
  divisionIndex: number
  subdivisionIndex: number
}

export type MetronomeNote = {
  name: string
  velocity: number
}

export type MetronomeSequenceItem = {
  note: MetronomeNote
  tick: MetronomeTick
}

export type MetronomeProgress = {
  progress: number
  progressInDivision: number
  divisionIndex: number
  progressInSubdivision: number
  subdivisionIndex: number
  subdivisionIndexInDivision: number
}

export type MetronomeEvents = {
  progress: (progress: MetronomeProgress) => void
  tick: (divisionIndex: number, progress: MetronomeProgress) => void
  subdivisionTick: (
    subdivisionIndex: number,
    divisionIndex: number,
    progress: MetronomeProgress
  ) => void
  subdivisionOnlyTick: (
    subdivisionIndex: number,
    divisionIndex: number,
    progress: MetronomeProgress
  ) => void
}

export class Metronome {
  static getSequenceEvents = (
    signature: MetronomeSignature,
    subdivisions: MetronomeSubdivision
  ) => {
    return emptyArray(signature).flatMap<MetronomeSequenceItem>((_v1, beat) =>
      emptyArray(subdivisions).map<MetronomeSequenceItem>(
        (_v, subdivision) => ({
          note: {
            name: beat === 0 && subdivision === 0 ? 'A2' : 'C2',
            velocity: subdivision === 0 ? 0.8 : 0.2,
          },
          tick: {
            divisionIndex: beat,
            subdivisionIndex: subdivision,
          },
        })
      )
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
  readonly transport: TransportClass

  private _emitter: Emitter<MetronomeEvents>
  on<E extends keyof MetronomeEvents>(event: E, callback: MetronomeEvents[E]) {
    return this._emitter.on(event, callback)
  }

  private _sequence: Tone.Sequence<MetronomeSequenceItem>
  get sequence() {
    return this._sequence
  }

  private metronomeTickerId: number | null = null

  private _signature: MetronomeSignature
  get signature() {
    return this._signature
  }

  private _subdivisions: MetronomeSubdivision
  get subdivisions() {
    return this._subdivisions
  }
  get totalSubdivisions() {
    return this._subdivisions * this._signature
  }

  get running() {
    return this.transport.state === 'started' && this.metronomeTickerId != null
  }

  private _getProgress(forceProgress?: number): MetronomeProgress {
    const progress = forceProgress ?? this._sequence.progress
    const divisionIndex = Math.floor(progress * this._signature)
    const progressInDivision =
      (progress - (1 / this._signature) * divisionIndex) * this._signature

    const subdivisionIndexInDivision = Math.floor(
      progressInDivision * this._subdivisions
    )
    const subdivisionIndex =
      divisionIndex * this._subdivisions + subdivisionIndexInDivision

    const progressInSubdivision =
      progressInDivision * this._subdivisions - subdivisionIndexInDivision

    return {
      progress,
      progressInDivision,
      divisionIndex,
      progressInSubdivision,
      subdivisionIndex,
      subdivisionIndexInDivision,
    }
  }

  get progress(): MetronomeProgress {
    return this._getProgress()
  }

  constructor(
    transport: TransportClass,
    initialTimeSignature: MetronomeSignature,
    initialSubdivisions: MetronomeSubdivision
  ) {
    this._emitter = createNanoEvents<MetronomeEvents>()

    this._signature = initialTimeSignature
    this._subdivisions = initialSubdivisions

    this.synth = new Tone.MembraneSynth()
    this.synth.toDestination()

    this.transport = transport
    this.transport.timeSignature = this._signature

    this._sequence = new Tone.Sequence<MetronomeSequenceItem>(
      (time, { tick, note }) => {
        Metronome.playNote(this.synth)(time, note)
        Tone.getDraw().schedule(this.handleTick.bind(this, tick), time)
      },
      Metronome.getSequenceEvents(this._signature, this._subdivisions),
      Metronome.getSequenceSubdivision(this._subdivisions)
    )
    this._sequence.start(0)
  }

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

  start() {
    if (this.transport.state !== 'started') {
      this.transport.start()
    } // else leave it running

    if (this.metronomeTickerId == null) {
      this.metronomeTickerId = Metronome.requestDrawFrame(this.transport, this.tick.bind(this))
    } // else leave it running
  }

  stop() {
    if (this.transport.state !== 'stopped') {
      this.sendProgress(0)
      this.transport.stop()
    } // else leave it running

    if (this.metronomeTickerId != null) {
      Metronome.cancelDrawFrame(this.transport, this.metronomeTickerId)
      this.metronomeTickerId = null
    } // else leave it stopped
  }

  tick() {
    this.sendProgress()
    this.metronomeTickerId = Metronome.requestDrawFrame(this.transport, this.tick.bind(this))
  }

  static requestDrawFrame(transport: TransportClass, callback: () => void) {
    return requestAnimationFrame(() => {
      Tone.getDraw().schedule(callback, transport.immediate())
    })
  }

  static cancelDrawFrame(transport: TransportClass, id: number) {
    transport.clear(id)
  }

  private sendProgress(forceProgress?: number) {
    const progress = this._getProgress(forceProgress)
    this._emitter.emit('progress', progress)
  }

  private handleTick({ divisionIndex, subdivisionIndex }: MetronomeTick) {
    if (subdivisionIndex === 0) {
      this._emitter.emit('tick', divisionIndex, this._getProgress())
    } else {
      this._emitter.emit(
        'subdivisionOnlyTick',
        subdivisionIndex,
        divisionIndex,
        this._getProgress()
      )
    }

    this._emitter.emit(
      'subdivisionTick',
      subdivisionIndex,
      divisionIndex,
      this._getProgress()
    )
  }

  private _rebuildSequence() {
    this._sequence.dispose()
    this._sequence = new Tone.Sequence<MetronomeSequenceItem>(
      (time, { tick, note }) => {
        Metronome.playNote(this.synth)(time, note)
        Tone.getDraw().schedule(this.handleTick.bind(this, tick), time)
      },
      Metronome.getSequenceEvents(this._signature, this._subdivisions),
      Metronome.getSequenceSubdivision(this._subdivisions)
    )

    this._sequence.start(
      this.transport.state === 'started' ? this.transport.progress : 0
    )
  }
}
