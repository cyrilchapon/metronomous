import * as Tone from 'tone'
import { emptyArray } from './array'
import { UnreachableCaseError } from './unreachable-case-error'
import { TransportClass } from 'tone/build/esm/core/clock/Transport'
import { createNanoEvents, Emitter } from 'nanoevents'

export const metronomeSignatures = [3, 4, 5, 6, 7] as const
export type MetronomeSignature = (typeof metronomeSignatures)[number]

export const metronomeSubdivisions = [1, 2, 3, 4, 6] as const
export type MetronomeSubdivision = (typeof metronomeSubdivisions)[number]

export const minMetronomeBpm = 20
export const maxMetronomeBpm = 400
export const clampMetronomeBpm = (bpm: number) =>
  Math.min(maxMetronomeBpm, Math.max(minMetronomeBpm, bpm))

export type MetronomeNote = {
  name: string
  velocity: number
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

/**
 * Drives the audio scheduling (via a `Tone.Sequence`) and exposes the
 * transport's current playback position.
 *
 * Audio playback is scheduled sample-accurately by Tone's `Sequence`, as
 * before — that part doesn't need any help.
 *
 * Everything *visual* (the moving cursor, the tick/subdivision "flash"
 * events) is derived from a single, synchronous `progress` read of the
 * transport's clock, meant to be pulled once per animation frame by the
 * caller (i.e. a `useTick` callback driven by PixiJS' own ticker) rather
 * than pushed as a 60Hz event:
 *
 * - It deliberately reads the clock *without* Tone's scheduling
 *   look-ahead (`context.lookAhead`, 100ms by default): `transport.now()`
 *   (what `Transport.progress`/`Sequence.progress` use internally) returns
 *   `context.currentTime + lookAhead` — i.e. where the transport *will
 *   be* a bit in the future, which is exactly what you want when
 *   *scheduling* audio, but reading it as "now" for the cursor makes the
 *   cursor visibly run ahead of what's actually audible. `immediate()`
 *   (`context.currentTime`, no look-ahead) is the transport's true
 *   current position.
 * - `poll()` (called from the same per-frame read as the cursor) detects
 *   when that position has crossed into a new division/subdivision and
 *   emits the discrete `tick`/`subdivisionTick`/`subdivisionOnlyTick`
 *   events from it — instead of scheduling them via `Tone.Draw` (a
 *   *second*, independent `requestAnimationFrame` loop). That avoids any
 *   frame-order ambiguity between "the cursor visually reached the dot"
 *   and "the flash fired" (they're now the same read, the same frame),
 *   and avoids `Tone.Draw`'s failure mode of silently dropping a callback
 *   whose 250ms expiration window elapsed (e.g. after the tab was
 *   throttled/backgrounded).
 */
export class Metronome {
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
  readonly transport: TransportClass

  private _emitter: Emitter<MetronomeEvents>
  on<E extends keyof MetronomeEvents>(event: E, callback: MetronomeEvents[E]) {
    return this._emitter.on(event, callback)
  }

  private _sequence: Tone.Sequence<MetronomeNote>
  get sequence() {
    return this._sequence
  }

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
    return this.transport.state === 'started'
  }

  /**
   * Synchronous, allocation-light read of the transport's current position
   * (see class docs for why this deliberately avoids Tone's scheduling
   * look-ahead). Safe (and intended) to call every animation frame.
   */
  get progress(): MetronomeProgress {
    return this._getProgress()
  }

  /** The last subdivision index `poll()` emitted a tick for, or `null` while stopped/not yet polled since starting. */
  private _lastPolledSubdivisionIndex: number | null = null

  /**
   * Advances tick-detection and emits `tick`/`subdivisionTick`/
   * `subdivisionOnlyTick` for the subdivision `progress` just crossed into,
   * if any. Call this once per animation frame, from the same place that
   * reads `progress` for display — see class docs.
   *
   * Returns the same `MetronomeProgress` snapshot it used internally, so
   * that a caller who also needs `progress` this frame (e.g. to position
   * the cursor) can reuse it instead of triggering a second clock read —
   * this runs on every animation frame, so avoiding a redundant Tone.js
   * call (and a redundant object allocation) here is worth it.
   */
  poll(): MetronomeProgress {
    if (!this.running) {
      this._lastPolledSubdivisionIndex = null
      return this._getProgress()
    }

    const progress = this._getProgress()
    const { subdivisionIndex, divisionIndex, subdivisionIndexInDivision } =
      progress

    // `_lastPolledSubdivisionIndex` is `null` right after (re)starting, and
    // never equals a real (numeric) subdivision index — so the first poll
    // of a run always falls through and fires its tick/flash, including
    // for beat 0. It used to be treated as "nothing to compare against
    // yet, skip" here, which meant the very first beat never flashed.
    if (subdivisionIndex === this._lastPolledSubdivisionIndex) {
      return progress
    }

    this._lastPolledSubdivisionIndex = subdivisionIndex

    if (subdivisionIndexInDivision === 0) {
      this._emitter.emit('tick', divisionIndex, progress)
    } else {
      // `subdivisionIndex` here (and below) is the index *within the
      // division* (0 = the beat itself, matching what listeners key their
      // per-subdivision UI off of) — not `progress.subdivisionIndex`, which
      // is the cumulative index across the whole bar.
      this._emitter.emit(
        'subdivisionOnlyTick',
        subdivisionIndexInDivision,
        divisionIndex,
        progress
      )
    }

    this._emitter.emit(
      'subdivisionTick',
      subdivisionIndexInDivision,
      divisionIndex,
      progress
    )

    return progress
  }

  private _getProgress(forceProgress?: number): MetronomeProgress {
    const progress = forceProgress ?? this._immediateProgress()
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

  /**
   * The sequence always loops over exactly one bar (whatever the
   * subdivision, `signature * subdivisions` evenly-spaced notes always add
   * up to `signature` quarter notes), and is always started at transport
   * tick 0, so its phase is just `transport ticks modulo one bar`.
   */
  private _immediateProgress(): number {
    const ticksPerBar = this.transport.PPQ * this._signature
    const ticks = this.transport.getTicksAtTime(this.transport.immediate())
    return (((ticks % ticksPerBar) + ticksPerBar) % ticksPerBar) / ticksPerBar
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

    this._sequence = this._createSequence()
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
  }

  stop() {
    if (this.transport.state !== 'stopped') {
      this.transport.stop()
    } // else leave it stopped
  }

  private _createSequence() {
    return new Tone.Sequence<MetronomeNote>(
      (time, note) => {
        Metronome.playNote(this.synth)(time, note)
      },
      Metronome.getSequenceEvents(this._signature, this._subdivisions),
      Metronome.getSequenceSubdivision(this._subdivisions)
    )
  }

  private _rebuildSequence() {
    this._sequence.dispose()
    this._sequence = this._createSequence()

    this._sequence.start(
      this.transport.state === 'started' ? this.transport.progress : 0
    )
  }
}
