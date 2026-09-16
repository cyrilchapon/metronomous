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
- **Shape** — circle or regular polygon, with the beats (and optionally
  every subdivision) marked around it.
- **Cursor** — a dot, a radial line, or both. Its motion is either linear or
  inertial, with eight easing "masses" from linear to circular.
- **Flash** — the shape and/or the subdivision dots pulse on each tick.
- **Light, dark, or system** color mode; the visualization follows it.

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

**The canvas reads its colors from CSS.** PixiJS can't read the theme, so
the visualization's palette is declared as `--metronome-*` custom properties
in `src/index.css`, derived from the shadcn tokens next to them:

```css
--metronome-back: var(--background);
--metronome-main: var(--foreground); /* the accent in dark mode */
--metronome-cursor: var(--metronome-accent);
```

`readDrawPalette` resolves them to the numbers PixiJS wants, and
`useDrawPalette` re-reads them whenever the `dark` class on `<html>`
changes. They are plain custom properties rather than `@theme` entries
because nothing renders them as Tailwind utilities.
