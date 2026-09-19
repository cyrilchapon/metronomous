import * as Tone from 'tone'
import { UnreachableCaseError } from './unreachable-case-error'

/**
 * Which timbre the metronome ticks with.
 *
 * All three are *synthesized* by Tone.js rather than played back from
 * samples: a handful of nodes, built when the sound is selected, rather
 * than audio files to ship, fetch and decode before the first click — and,
 * being synthesized, each accent gets its own pitch and level instead of
 * being stuck with whatever a recording happened to be made at.
 */
export const metronomeSounds = ['neo', 'clic', 'clave'] as const
export type MetronomeSound = (typeof metronomeSounds)[number]

/**
 * What a tick *is*, musically — the three tiers a bar is made of.
 *
 * The sequence is built from these rather than from notes and velocities,
 * which is what keeps it sound-agnostic: changing the sound swaps the
 * voice and leaves the sequence (and the transport's phase with it)
 * completely alone. Each voice answers the same three accents with its own
 * reading of them.
 */
export const metronomeAccents = ['downbeat', 'beat', 'subdivision'] as const
export type MetronomeAccent = (typeof metronomeAccents)[number]

/** One value per accent — how a voice declares that reading. */
export type AccentValues<T> = Record<MetronomeAccent, T>

/** What a pitched voice needs to know about the tick it is playing. */
type AccentNote = {
  /** A note name, or a frequency in Hz. */
  note: Tone.Unit.Frequency
  velocity: Tone.Unit.NormalRange
}

/** The same, for a voice whose only "pitch" is a filter's center frequency. */
type AccentBand = {
  frequency: Tone.Unit.Frequency
  velocity: Tone.Unit.NormalRange
}

/**
 * A live instance of one sound: its audio nodes, already connected to the
 * destination, plus the one thing the sequence asks of them.
 */
export type MetronomeVoice = {
  /**
   * Called from the `Tone.Sequence` callback with the sample-accurate
   * `time` it was handed. Everything scheduled here goes through that
   * `time` rather than through "now" — including parameter changes, which
   * is why the voices below use `setValueAtTime` and not `.value =`.
   */
  trigger: (time: number, accent: MetronomeAccent) => void
  dispose: () => void
}

/**
 * The original sound, unchanged: a `MembraneSynth`'s pitch-swept sine, low
 * and round, with the downbeat set apart by pitch and the subdivisions by
 * level.
 */
const createNeoVoice = (): MetronomeVoice => {
  const synth = new Tone.MembraneSynth().toDestination()

  const notes: AccentValues<AccentNote> = {
    downbeat: { note: 'A2', velocity: 0.8 },
    beat: { note: 'C2', velocity: 0.8 },
    subdivision: { note: 'C2', velocity: 0.2 },
  }

  return {
    trigger: (time, accent) => {
      const { note, velocity } = notes[accent]
      synth.triggerAttackRelease(note, '64n', time, velocity)
    },
    dispose: () => {
      synth.dispose()
    },
  }
}

/**
 * A mechanical metronome's escapement: a burst of noise, gone in ~25ms,
 * with no pitch of its own.
 *
 * The bandpass is what makes it a *tick* rather than a "tss", and its
 * center frequency is the only thing that moves between accents — the
 * brightness of the click standing in for the pitch it doesn't have.
 */
const createClicVoice = (): MetronomeVoice => {
  const filter = new Tone.Filter({
    type: 'bandpass',
    frequency: 2600,
    Q: 2,
  }).toDestination()

  const synth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    // Percussive to the point of being a transient: the decay *is* the
    // sound, and `sustain: 0` means the release below never really has
    // anything left to do.
    envelope: { attack: 0.0005, decay: 0.022, sustain: 0, release: 0.01 },
    volume: 9.5,
  }).connect(filter)

  const hits: AccentValues<AccentBand> = {
    downbeat: { frequency: 3400, velocity: 0.9 },
    beat: { frequency: 2600, velocity: 0.75 },
    subdivision: { frequency: 1900, velocity: 0.3 },
  }

  return {
    trigger: (time, accent) => {
      const { frequency, velocity } = hits[accent]
      filter.frequency.setValueAtTime(frequency, time)
      synth.triggerAttackRelease(0.01, time, velocity)
    },
    dispose: () => {
      synth.dispose()
      filter.dispose()
    },
  }
}

/**
 * Two sticks of wood: a high sine whose pitch drops an octave and a half
 * over the first few milliseconds — that drop is the knock — and which
 * then rings out dryly.
 *
 * The same `MembraneSynth` as `neo`, at the other end of its range: a kick
 * and a woodblock are the same recipe — a pitch envelope into an amplitude
 * envelope — thirty times the frequency apart, with a pitch envelope an
 * order of magnitude shorter.
 */
const createClaveVoice = (): MetronomeVoice => {
  const synth = new Tone.MembraneSynth({
    // Long enough to be heard as an attack rather than as a click, short
    // enough that the pitch below is the one that lands.
    pitchDecay: 0.006,
    octaves: 1.5,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.0005, decay: 0.05, sustain: 0, release: 0.02 },
    volume: -4,
  }).toDestination()

  const notes: AccentValues<AccentNote> = {
    downbeat: { note: 2500, velocity: 0.9 },
    beat: { note: 1900, velocity: 0.9 },
    subdivision: { note: 1900, velocity: 0.3 },
  }

  return {
    trigger: (time, accent) => {
      const { note, velocity } = notes[accent]
      synth.triggerAttackRelease(note, 0.03, time, velocity)
    },
    dispose: () => {
      synth.dispose()
    },
  }
}

/**
 * Builds the voice for a sound, connected to the destination and ready to
 * be triggered. The caller owns it: exactly one voice is alive at a time
 * (see `Metronome.setSound`), and it is the caller's to dispose.
 *
 * The `volume` each voice carries is what puts the three within earshot of
 * one another: a noise burst through a bandpass and a 2kHz sine are nowhere
 * near the same level at the same velocity, and changing the sound isn't
 * meant to change how loud the metronome is. They were matched by rendering
 * one beat of each offline and comparing A-weighted energy over the first
 * ~180ms — how loud they *sound* rather than how high they peak — which
 * lands `neo` at -23dB, `clave` at -26dB and `clic` at -30dB, every peak
 * under -1dBFS. `clic` doesn't come all the way up because it can't: a
 * 25ms noise burst peaks some 6dB higher than a tone of the same loudness,
 * so it runs out of headroom first. `neo` is the fixed point of all this —
 * it is what the app has always sounded like.
 */
export const createMetronomeVoice = (sound: MetronomeSound): MetronomeVoice => {
  switch (sound) {
    case 'neo':
      return createNeoVoice()
    case 'clic':
      return createClicVoice()
    case 'clave':
      return createClaveVoice()
    default:
      throw new UnreachableCaseError(sound)
  }
}
