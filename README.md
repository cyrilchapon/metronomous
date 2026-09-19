# Metronomous

A metronome that you watch as much as you hear: alongside the click, a
PixiJS canvas animates a cursor around a circle or a polygon, flashing on
beats and subdivisions, so the pulse is visible at a glance.

The interface is in French.

## Features

- **Tempo** — 20 to 400 BPM. The `+` / `−` buttons accelerate while held.
- **Time signature** — 3/4 through 7/4.
- **Subdivisions** — quarter, eighth, eighth triplet, sixteenth, sixteenth
  triplet.
- **Sound** — `neo` (the app's own synthetic click), `clic` (a mechanical
  metronome's tick) or `clave` (a pair of wooden sticks). All three are
  synthesized rather than sampled — see *Sounds* below.
- **Shape** — circle or regular polygon, with the beats (and optionally
  every subdivision) marked around it.
- **Cursor** — a dot, a radial line, or both. Its motion is either linear or
  inertial, with eight easing "masses" from linear to circular.
- **Flash** — the shape and/or the subdivision dots pulse on each tick.
- **Light, dark, or system** color mode; the visualization follows it.

Every setting is remembered across visits — see *Persisted config* below.

Audio is scheduled by Tone.js on its own clock; the canvas subscribes to the
resulting tick events rather than being driven by React state, so the
animation stays in step with the sound.

## Getting started

```sh
yarn install
yarn dev
```

| Script        | What it does                                  |
| ------------- | --------------------------------------------- |
| `yarn dev`    | Vite dev server                               |
| `yarn build`  | Type-check (`tsc`) then build to `dist/`      |
| `yarn preview`| Serve the production build locally            |
| `yarn lint`   | ESLint, type-checked rules, zero warnings     |
| `yarn format` | Prettier over `src/`                          |

## Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** and **shadcn/ui** (Radix primitives, lucide icons,
  Geist) for the interface
- **PixiJS 8** via `@pixi/react` for the visualization
- **Tone.js** for audio scheduling
- **jotai** for state, with `jotai-effect` and `jotai-optics`

## Project conventions

**`src/components/ui` is vendored.** Those files come from the shadcn
registry and are meant to be regenerated with `shadcn add`, so they are kept
byte-identical to its output: excluded from Prettier via `.prettierignore`,
and exempt from the two project ESLint rules that would rewrite them. Their
type-checked correctness still applies.

**Settings are stored, not held in React state.** Each config
(`display-settings`, `global-settings`, `metronome`) is a
`persistedConfigAtom`: a jotai atom that hydrates from its own
`localStorage` key and writes back through on every change. Consumers use
it exactly like the plain `atom<T>()` it replaces, `focusAtom` included. A
change made in another tab is picked up while the app is open, through the
`storage` event.

Writing jotai's `RESET` to one *removes* its key rather than storing the
current defaults in it, so a config that was reset goes on following the
defaults as they change — which is what the drawer's "Réinitialiser la
visualisation" does to `display-settings`, leaving the tempo, the color
mode and whether the canvas is shown at all alone. Those last two live in
`global-settings` precisely so that resetting one config wholesale stays
the whole gesture, with no field singled out in the button's handler.

Because the gesture is "drop the key", anything offering it reads the
atom's `storedAtom` rather than comparing values to the defaults: a key
that happens to hold today's defaults still pins its user to them, and an
unreadable key reads *as* the defaults while being the one most worth
dropping. Comparing values would call both "nothing to reset".

*No loading state.* `localStorage` is a synchronous API, so a config is
already in its atom before React renders its first frame — including for
the pre-render color-mode read in `main.tsx`. Nothing is ever painted
against the defaults and then corrected, so there is nothing to gate
behind a splash screen.

The browser does paint the page's *background* before any module runs,
though, so the color mode is applied a second time — first, and from the
same stored setting — by an inline script in `index.html`. That is the one
place that reads a persisted config without going through
`persistedConfigAtom`, and the only one allowed to: see the comment there
for what it is allowed to get wrong.

*Changing a config's shape.* A config is stored as
`{ version, config }` and read back through a zod schema in which **every
field falls back on its own**, so most changes cost nothing: a field that
didn't exist when the config was written, one that has since been dropped,
and one whose valid values changed each resolve to that field's default
while the rest of the config survives. Unknown fields are ignored, which
also means a config written by a newer build is read for whatever the two
builds still have in common — and writing from the older build puts the
fields it didn't understand back, under the version they came with, so a
stale tab can't truncate a newer config or send it back through
migrations it has already been through. `version` + `migrations` are only
for what field-level validation can't absorb — a rename, a change of
unit, a value whose *meaning* changed while its type stayed valid. Bump
the version and add the
migration keyed by the version it migrates *from*; a stored version with
no way forward falls back to the defaults, like anything else unreadable
(absent, not JSON, storage denied by the browser). Every fallback but
"nothing stored" warns on the console, in production too: it is the only
way a user quietly loses settings, so "my settings reset themselves" has
to leave a trace. The decode cache means a given stored value is reported
once, not on every read.

Each config declares its schema as an object literal `satisfies
ConfigShape<T>`, which is what keeps validation and the runtime type from
drifting: a field of `T` with no schema, a schema for a field that no
longer exists, and a schema for the wrong type all fail to compile. Values
that shouldn't outlive a session stay out of the config — the metronome's
`running` is a separate atom, and `state/global-ui.ts` holds the rest.

**The sounds are synthesized, not sampled.** Each of the three is a couple
of Tone.js nodes built on the spot in `src/util/metronome-sound.ts` —
nothing to ship, fetch or decode before the first click, and no sample
locked to the pitch and level it was recorded at. `neo` and `clave` are the
same `MembraneSynth` recipe (a pitch envelope into an amplitude envelope) at
opposite ends of its range; `clic` is a white-noise burst through a
bandpass, which is what makes it a tick rather than a "tss".

What the `Tone.Sequence` carries is a bar of `MetronomeAccent`s —
`downbeat`, `beat`, `subdivision` — rather than notes and velocities. Every
voice answers the same three accents in its own terms, so changing the sound
swaps the voice and leaves the sequence, and the transport's phase in it,
alone: `Metronome.setSound` is audible on the very next tick, mid-bar,
without rebuilding anything. The outgoing voice is disposed a few hundred
milliseconds later rather than immediately, because the sequence has already
handed it the ticks inside Tone's scheduling look-ahead and cutting one of
those off mid-sample is an audible click.

Their levels were matched by rendering a beat of each offline and comparing
A-weighted energy, not peak amplitude — see the note above
`createMetronomeVoice` for the numbers and for why `clic` sits a few dB
below the other two.

**The canvas reads its colors from CSS.** PixiJS can't read the theme, so
the visualization's palette is declared as `--metronome-*` custom properties
in `src/index.css`, derived from the shadcn tokens next to them:

```css
:root {
  --metronome-back: var(--background);
  --metronome-main: var(--foreground);
  --metronome-cursor: var(--metronome-accent);
}

/* The shape and the cursor swap roles in the dark theme. */
.dark {
  --metronome-main: var(--metronome-accent);
  --metronome-cursor: var(--foreground);
}
```

`readDrawPalette` resolves them to the numbers PixiJS wants, and
`useDrawPalette` re-reads them whenever the `dark` class on `<html>`
changes. They are plain custom properties rather than `@theme` entries
because nothing renders them as Tailwind utilities.
