export const colorModes = ['light', 'dark'] as const
export type ColorMode = (typeof colorModes)[number]

export const colorModeSettings = [...colorModes, 'system'] as const
export type ColorModeSetting = (typeof colorModeSettings)[number]

export const isColorModeSetting = (s: unknown): s is ColorModeSetting =>
  typeof s === 'string' && colorModeSettings.includes(s as ColorModeSetting)
