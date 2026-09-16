export const colorModes = ['light', 'dark'] as const
export type ColorMode = (typeof colorModes)[number]

export const colorModeSettings = [...colorModes, 'system'] as const
export type ColorModeSetting = (typeof colorModeSettings)[number]

export const isColorModeSetting = (s: unknown): s is ColorModeSetting =>
  typeof s === 'string' && colorModeSettings.includes(s as ColorModeSetting)

export const prefersDarkQuery = '(prefers-color-scheme: dark)'

export const resolveColorMode = (setting: ColorModeSetting): ColorMode =>
  setting !== 'system'
    ? setting
    : window.matchMedia(prefersDarkQuery).matches
      ? 'dark'
      : 'light'

/**
 * Reflects a color mode on `<html>`, which is what Tailwind's `dark` variant,
 * the shadcn tokens and the metronome draw palette are all keyed on.
 */
export const applyColorMode = (colorMode: ColorMode) => {
  const root = document.documentElement
  root.classList.toggle('dark', colorMode === 'dark')
  root.style.colorScheme = colorMode
}
