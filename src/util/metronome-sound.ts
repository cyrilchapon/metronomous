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
 * The corner of `neo`'s low cut, in Hz — see `createNeoVoice`.
 */
const lowCutHz = 150

/**
 * How long a voice being replaced takes to fade out, in seconds — see
 * `Metronome._retireVoice`, which is what schedules it.
 *
 * Long enough to be a fade rather than a cut, and to let the ticks already
 * scheduled when the sound changed speak: an attack is a millisecond, so
 * 50ms still carries the body of one. Short enough that the outgoing sound
 * is gone well inside a beat — a tenth of one at 120 BPM.
 */
export const voiceFadeSeconds = 0.05

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
  /**
   * Fades this voice's output to silence over `voiceFadeSeconds`, starting
   * at `time` — how a voice stops when the sound is changed under it.
   *
   * It is what makes the change *audibly* a change: whatever the envelopes
   * still owe, the old sound is over within a fade of the new one starting
   * rather than ringing across it. Waiting the tail out instead meant the
   * one voice with a long one (`neo`, below) carried into the next beat or
   * two of whatever replaced it — the switch heard as a swell rather than
   * as a swap.
   *
   * Scheduled, like everything else here, against the audio clock: `time`
   * is a Web Audio timestamp, not a delay.
   */
  silence: (time: number) => void
  dispose: () => void
}

/** What a voice is assembled from, before `createVoice` closes it up. */
type VoiceParts = {
  /** The node every part of the voice is routed through. */
  output: Tone.Gain
  trigger: MetronomeVoice['trigger']
  /** Disposes the parts; `createVoice` adds `output` to it. */
  dispose: () => void
}

/**
 * Wraps a voice's parts into the thing `Metronome` holds.
 *
 * Routing a voice through one gain of its own, rather than each of its
 * nodes straight to the destination, is what `silence` needs to exist: the
 * fade is a single automation on the sum of a voice's parts, so a voice
 * built from three synths and two filters still stops as one thing, in one
 * ramp, with no click.
 */
const createVoice = ({
  output,
  trigger,
  dispose,
}: VoiceParts): MetronomeVoice => ({
  trigger,
  silence: (time) => {
    // `setRampPoint` pins the gain to what it is at `time` before ramping
    // off it — without it the ramp would start from the last *scheduled*
    // value, which for an untouched gain is the one it was created with.
    output.gain.setRampPoint(time)
    output.gain.linearRampToValueAtTime(0, time + voiceFadeSeconds)
  },
  dispose: () => {
    dispose()
    output.dispose()
  },
})

/**
 * The original sound: a `MembraneSynth`'s pitch-swept sine, low and round,
 * with the downbeat set apart by pitch and the subdivisions by level.
 *
 * Note for note what it has always been. What has moved is its trim, the
 * low cut it now plays through, and how long it rings.
 *
 * **The envelope.** `MembraneSynth`'s defaults are a kick drum's: 400ms
 * of decay onto a 1% sustain, released over 1.4s. Under a metronome that
 * is not a tick, it is a bass note. One `neo` tick, measured: still at
 * -40dBFS 307ms after its attack, -60 at 689ms, -90 only at 1255ms. At
 * 120 BPM every beat rings most of the way into the next one — and that
 * one ring is behind both of the things it was reported as: a sound that
 * measures level with the others but *sits* on a system that reproduces
 * it, and a sound change that takes a beat or two to finish, the outgoing
 * `neo` swelling under the first ticks of whatever replaced it.
 *
 * 180ms of decay to nothing and 80ms of release make it a tick: -40dBFS
 * in 48ms, -90 in 113. The attack, the pitch sweep, the notes and the
 * accents are untouched, and so is the peak (0.05dB) — what goes is the
 * ring, and with it the low-frequency energy the ring was made of. Over a
 * bar, downstream of the low cut, the share of `neo`'s output sitting
 * below 150Hz falls from 19% to 3%; `clic` sits at 0.8%. The one real
 * change is that `neo` no longer sustains; if it is ever wanted rounder,
 * `decay` is the number, and `createMetronomeVoice` has what it costs.
 *
 * `silence` (above) covers the sound change on its own, whatever a voice's
 * envelopes do. Both are here because they answer different halves of it:
 * the fade stops a voice that is being replaced, and the envelope stops
 * `neo` ringing over *itself* beat after beat while it is the one playing.
 *
 * **The low cut.** `neo`'s fundamental is a 65Hz sine (110Hz on the
 * downbeat) and it was reading as a bass note rather than as a click —
 * depth that also happens to be the part a laptop or a phone can't
 * reproduce, which is why three sounds balanced on one kind of speaker
 * didn't hold on the other. At 150Hz and 12dB/octave the filter takes
 * 14.6dB off C2 and 6.5dB off A2 while leaving the harmonics, the pitch
 * sweep and the attack alone: the sound keeps its shape and loses its
 * weight. Measured, it drops the share of `neo`'s energy sitting below
 * 150Hz from 56% to 12%, and costs 0.6dB of its A-weighted level — the
 * gap between what the ear calls depth and what a loudness meter counts.
 * `Q: 0.7` is Butterworth — maximally flat, no resonant bump at the
 * corner, a filter that removes rather than one that colors.
 *
 * Dynamics would have been the wrong tool, for the record: a compressor
 * changes how a sound's level *moves*, not where its energy sits, so on a
 * 30ms tick it makes the tail denser and the boom no quieter; a limiter or
 * a clipper is a headroom device rather than a tone one. The complaint was
 * spectral, so the fix is spectral.
 *
 * **It belongs to this voice, and that is the point.** It began as a
 * shared output every sound was routed through — one place to treat all
 * three, a fourth sound inheriting it for free — and that coupling cost
 * something real. A high-pass removes the low end of a sharp attack, which
 * makes what is left overshoot (the step response of a high-pass), so a
 * filter that only ever subtracts energy nonetheless *raises* the peak of
 * a percussive sound. On `clic`'s downbeat, 60 renders per position:
 * -2.5dBFS median unfiltered, -1.16 at 100Hz, -0.89 at 120, -0.67 at 140,
 * -0.41 at 200. `clic` has the least headroom of the three, so a tone
 * control meant for `neo` was quietly spending it, and moving the corner
 * past ~140Hz would have started clipping the metronome's loudest tick —
 * from a filter corner, which is not where anyone would look for it.
 *
 * `clic`'s body sits at 800Hz and `clave`'s at 1.75kHz, where this filter
 * is 0.004dB off flat: they were paying that price for a treatment that
 * does nothing audible for them. Cutting `neo` alone puts `clic` back on
 * its own peaks — 60 renders of its downbeat: -3.2 to -1.4dBFS, exactly
 * where it sat before any of this — and leaves `lowCutHz` free to be set
 * on how `neo` sounds rather than on someone else's margin. 150Hz costs
 * nothing anywhere now.
 */
const createNeoVoice = (): MetronomeVoice => {
  const output = new Tone.Gain().toDestination()

  const lowCut = new Tone.Filter({
    type: 'highpass',
    frequency: lowCutHz,
    rolloff: -12,
    Q: 0.7,
  }).connect(output)

  const synth = new Tone.MembraneSynth({
    // Everything but the envelope is `MembraneSynth`'s default, the pitch
    // sweep included — see the note above for what the envelope changes
    // and what it deliberately doesn't.
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.08 },
    volume: neoVolume,
  }).connect(lowCut)

  const notes: AccentValues<AccentNote> = {
    downbeat: { note: 'A2', velocity: 0.8 },
    beat: { note: 'C2', velocity: 0.8 },
    subdivision: { note: 'C2', velocity: 0.2 },
  }

  return createVoice({
    output,
    trigger: (time, accent) => {
      const { note, velocity } = notes[accent]
      // `'64n'` is when the release starts, and it moves with the tempo:
      // 9ms at 400 BPM, 31 at 120, 188 at the app's 20 BPM floor. The
      // envelope is short enough that this is a detail — the release rules
      // the tail either way.
      synth.triggerAttackRelease(note, '64n', time, velocity)
    },
    dispose: () => {
      synth.dispose()
      lowCut.dispose()
    },
  })
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
  const output = new Tone.Gain().toDestination()

  const filter = new Tone.Filter({
    type: 'bandpass',
    frequency: 2500,
    Q: 3,
  }).connect(output)

  const chiff = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.0003, decay: 0.0035, sustain: 0, release: 0.003 },
    volume: clicVolume - 4,
  }).connect(filter)

  const body = new Tone.MembraneSynth({
    // A multiplier, not octaves — see the note in `createClaveVoice`. At
    // 1.2 the case starts a just minor third above its pitch (6/5, 316
    // cents, 1152Hz) and falls onto it.
    pitchDecay: 0.005,
    octaves: 1.2,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.0004, decay: 0.055, sustain: 0, release: 0.03 },
    volume: clicVolume,
  }).connect(output)

  const hits: AccentValues<AccentHit> = {
    downbeat: { band: 3000, note: 960, velocity: 0.9 },
    beat: { band: 2500, note: 800, velocity: 0.8 },
    subdivision: { band: 2000, note: 660, velocity: 0.32 },
  }

  return createVoice({
    output,
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
  })
}

/**
 * A struck wooden bar, in the three parts one is made of: the stick's
 * contact (3ms of noise), the bar's first overtone, and the fundamental
 * ringing under both.
 *
 * The pitch envelope is a short bend *up* into the fundamental rather
 * than a drop onto it — see the note on `octaves` below, which is a
 * multiplier rather than a count of octaves. Over 2.5ms the direction is
 * an attack transient either way, and this is the version that was tuned
 * by ear; a downward blow would want `octaves` above 1 and another pass
 * with the sliders.
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
  const output = new Tone.Gain().toDestination()

  const body = new Tone.MembraneSynth({
    // `octaves` is a plain multiplier on where the sweep *starts*, not a
    // number of octaves: `setNote` sets the oscillator to `note * octaves`
    // and ramps it to `note` over `pitchDecay`. At 0.7 this one starts
    // below its fundamental (1225Hz) and rises into it over 2.5ms — the
    // blow bending up into the bar's pitch rather than down onto it.
    pitchDecay: 0.0025,
    octaves: 0.7,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.0004, decay: 0.13, sustain: 0, release: 0.05 },
    volume: claveVolume,
  }).connect(output)

  const overtone = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.0004, decay: 0.028, sustain: 0, release: 0.02 },
    volume: claveVolume - 13,
  }).connect(output)

  const contactFilter = new Tone.Filter({
    type: 'bandpass',
    frequency: 4200,
    Q: 1.2,
  }).connect(output)

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

  return createVoice({
    output,
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
  })
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
 * reproduces, so it loses more than the others do on the way out. Which is
 * what the low cut in `createNeoVoice` is for, and why it is a filter
 * rather than a fourth round of trims — a trim only moves that problem
 * from one kind of output to the other. These levels were set before it
 * went in and re-checked after: it costs `neo` 0.6dB of A-weighted level,
 * inside the tolerance they were set to.
 *
 * A-weighting's *other* blind spot is the bass itself, and that one came
 * back: on a desktop system with real low-end extension, `neo` was
 * reported louder than the other two — the same balance, heard through
 * something that actually reproduces the part a laptop drops. The curve is
 * calibrated at ~40 phon and takes 26dB off 65Hz, so a level it calls even
 * is one the ear calls even only at the volume, and on the speakers, it
 * was calibrated for.
 *
 * So the balance is now read three ways over a bar of four ticks at 120
 * BPM, rendered offline — A-weighted (the quiet end, bass discounted
 * hardest), B-weighted (~70 phon, the closest of the three to how anyone
 * actually listens to a metronome) and BS.1770 K-weighted (near-flat to
 * 40Hz, the full-range end) — and it is the *spread* between them that
 * says whether a sound will travel. Against `clic`, `neo` was -1.5 / +2.2
 * / +2.8dB: even to quiet on the metric that ignores its low end, 2 to 3dB
 * loud on the two that don't. Shortening its envelope (see
 * `createNeoVoice`) took the low-frequency energy out rather than the
 * level: -2.8 / +0.1 / +0.3dB, at the same trim. No number in this file
 * moved for it. `clave`, by ear and left alone, sits at -8.8 / -10.4 /
 * -8.1 — consistently under, which is what the paragraph below is about.
 *
 * The first blind spot — the one the ear caught, two paragraphs up — is
 * worth keeping too, because a fourth sound would walk into it: weighted
 * energy integrates, and ignores the shape the energy arrives in. `clave`
 * is a clean 1.75kHz ring lasting 130ms — pitched, and sitting where
 * hearing is sharpest — against `clic`'s broadband 50ms knock. Tonal and
 * sustained reads far louder than noisy and brief at equal energy. Use
 * the numbers to find the headroom and the spread; use the ear to set the
 * level.
 *
 * The headroom is what the numbers are still good for. `clic`'s downbeat
 * is the peak-critical tick of the three: over 60 offline renders it lands
 * between -2.1 and -1.4dBFS (median -1.8), nothing at or above 0. Those
 * 1.4dB are the whole margin, and `clicVolume` is what spends them.
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
