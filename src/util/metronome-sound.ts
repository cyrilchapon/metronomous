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

/** The same in Hz, for a voice that derives other partials from it. */
type ClaveNote = {
  note: number
  velocity: Tone.Unit.NormalRange
}

/** A tone and the band its noise transient is filtered into. */
type AccentHit = {
  band: number
  note: number
  velocity: Tone.Unit.NormalRange
}

/**
 * The frequency ratio of a free-free bar's first overtone to its
 * fundamental — (3.011 / 1.875)^2, the wooden-bar constant behind every
 * marimba and every pair of claves.
 */
const barOvertone = 2.76

/**
 * Output trims, in dB, set by ear — see `createMetronomeVoice` for what
 * that corrected and by how much.
 *
 * They are per-voice rather than per-node so that the balance *inside* a
 * voice (the clic's escapement against its case, the clave's overtone
 * against its fundamental) is written as an offset from one number and
 * survives a level change.
 */
const clicVolume = -1.8
const claveVolume = -16.4
const neoVolume = -5.8

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
 * The original sound: a `MembraneSynth`'s pitch-swept sine, low and round,
 * with the downbeat set apart by pitch and the subdivisions by level.
 *
 * Note for note what it has always been — the trim is the only thing that
 * has moved, and it moved for the other two's sake.
 */
const createNeoVoice = (): MetronomeVoice => {
  const synth = new Tone.MembraneSynth({ volume: neoVolume }).toDestination()

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
 * A wind-up metronome, in the two parts one actually makes its noise
 * with: the escapement's tick — 4ms of filtered noise — and the wooden
 * case answering it a couple of octaves lower.
 *
 * The case is doing most of the work, and deliberately so. Noise alone is
 * where the first version went wrong: it is nearly all peak and very
 * little energy, so it has to be kept quiet to avoid clipping and reads
 * as a hiss with a gate on it rather than as a thing ticking. The tone
 * underneath is what gives the click a body to be heard through — and
 * even so, this is the voice with the least headroom of the three: its
 * downbeat is what stops `clicVolume` going any higher.
 */
const createClicVoice = (): MetronomeVoice => {
  const filter = new Tone.Filter({
    type: 'bandpass',
    frequency: 2500,
    Q: 3,
  }).toDestination()

  const chiff = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.0003, decay: 0.0035, sustain: 0, release: 0.003 },
    volume: clicVolume - 4,
  }).connect(filter)

  const body = new Tone.MembraneSynth({
    pitchDecay: 0.005,
    octaves: 1.2,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.0004, decay: 0.055, sustain: 0, release: 0.03 },
    volume: clicVolume,
  }).toDestination()

  const hits: AccentValues<AccentHit> = {
    downbeat: { band: 3000, note: 960, velocity: 0.9 },
    beat: { band: 2500, note: 800, velocity: 0.8 },
    subdivision: { band: 2000, note: 660, velocity: 0.32 },
  }

  return {
    trigger: (time, accent) => {
      const { band, note, velocity } = hits[accent]
      filter.frequency.setValueAtTime(band, time)
      chiff.triggerAttackRelease(0.004, time, velocity)
      body.triggerAttackRelease(note, 0.03, time, velocity)
    },
    dispose: () => {
      chiff.dispose()
      body.dispose()
      filter.dispose()
    },
  }
}

/**
 * A struck wooden bar, in the three parts one is made of: the stick's
 * contact (3ms of noise), the bar's first overtone, and the fundamental
 * ringing under both.
 *
 * The overtone is the whole point. A free-free bar's first partial sits
 * at 2.76x its fundamental — an interval that belongs to no scale, which
 * is exactly why the ear hears wood rather than a tone generator. A
 * single sine, however well enveloped, has nothing inharmonic in it and
 * reads as synthetic no matter what is done to its pitch. The second
 * thing that reads as wood is duration: claves are hardwood and they
 * *ring*, so the fundamental is given 130ms rather than the 50 it had.
 */
const createClaveVoice = (): MetronomeVoice => {
  const body = new Tone.MembraneSynth({
    // A short drop into the fundamental — the stick's blow, not a
    // portamento you could hum.
    pitchDecay: 0.0025,
    octaves: 0.7,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.0004, decay: 0.13, sustain: 0, release: 0.05 },
    volume: claveVolume,
  }).toDestination()

  const overtone = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.0004, decay: 0.028, sustain: 0, release: 0.02 },
    volume: claveVolume - 13,
  }).toDestination()

  const contactFilter = new Tone.Filter({
    type: 'bandpass',
    frequency: 4200,
    Q: 1.2,
  }).toDestination()

  const contact = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.0002, decay: 0.003, sustain: 0, release: 0.002 },
    volume: claveVolume - 15,
  }).connect(contactFilter)

  const notes: AccentValues<ClaveNote> = {
    downbeat: { note: 2300, velocity: 0.9 },
    beat: { note: 1750, velocity: 0.9 },
    subdivision: { note: 1750, velocity: 0.3 },
  }

  return {
    trigger: (time, accent) => {
      const { note, velocity } = notes[accent]
      body.triggerAttackRelease(note, 0.08, time, velocity)
      overtone.triggerAttackRelease(
        note * barOvertone,
        0.02,
        time,
        velocity * 0.9
      )
      contact.triggerAttackRelease(0.003, time, velocity)
    },
    dispose: () => {
      body.dispose()
      overtone.dispose()
      contact.dispose()
      contactFilter.dispose()
    },
  }
}

/**
 * Builds the voice for a sound, connected to the destination and ready to
 * be triggered. The caller owns it: exactly one voice is alive at a time
 * (see `Metronome.setSound`), and it is the caller's to dispose.
 *
 * The trims above are what put the three at the same loudness — three
 * sounds this different are nowhere near it at the same velocity, and
 * changing the sound is not meant to change how loud the metronome is.
 *
 * They were set by ear, because the obvious measurement got it wrong.
 * Matching A-weighted energy over the first ~180ms, which is how loud a
 * sound *is* in a model calibrated on steady tones, had landed all three
 * within 0.05dB of one another; listening to them in rotation, the two
 * pitched ones were plainly louder from there. `clave` came down 8.1dB
 * and `neo` 2dB, while `clic` ended up back within a tenth of where the
 * measurement had put it. Measured now: `clic` -26.4dB, `neo` -28.4dB,
 * `clave` -34.5dB — a spread the metric calls badly mismatched and the
 * ear calls even.
 *
 * The last dB of that came off `clic` on a laptop and a phone, where the
 * balance set on a bigger speaker had it sitting proud. Both ends of that
 * are `neo`: its fundamental is a 65Hz sine that a small speaker barely
 * reproduces, so it loses more than the others do on the way out. If the
 * three ever need to hold on *both* kinds of output at once, the lever is
 * a high-pass on `neo` — giving it presence where a small speaker can
 * actually play it — rather than another trim, which only moves the
 * problem from one output to the other.
 *
 * The blind spot is worth keeping, because a fourth sound would walk into
 * it too: A-weighted energy integrates, and ignores the shape the energy
 * arrives in. `clave` is a clean 1.75kHz ring lasting 130ms — pitched, and
 * sitting where hearing is sharpest — against `clic`'s broadband 50ms
 * knock. Tonal and sustained reads far louder than noisy and brief at
 * equal energy. Use the numbers to find the headroom; use the ear to set
 * the level.
 *
 * The headroom is what the numbers are still good for. `clic`'s downbeat
 * is the peak-critical tick of the three: over 60 offline renders it lands
 * between -3.0 and -1.4dBFS (median -2.3), nothing at or above 0. Those
 * 1.4dB are the whole margin, and it is `clicVolume` that spends them —
 * anything much above -0.5 starts clipping the odd downbeat.
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
