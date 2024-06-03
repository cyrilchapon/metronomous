import { PaletteMode } from '@mui/material'
import { atom } from 'jotai'
import { focusAtom } from 'jotai-optics'

export type ColorModeSetting = PaletteMode | 'system'
const _settingColorModes = [
  'light',
  'dark',
  'system',
] satisfies ColorModeSetting[]
export const isColorModeSetting = (s: unknown): s is ColorModeSetting =>
  typeof s === 'string' && _settingColorModes.includes(s as ColorModeSetting)

export type GlobalSettings = {
  colorMode: PaletteMode | 'system'
}

const initialGlobalSettings: GlobalSettings = {
  colorMode: 'dark',
}

export const globalSettingsAtom = atom<GlobalSettings>(initialGlobalSettings)
export const colorModeSettingAtom = focusAtom(globalSettingsAtom, (optic) =>
  optic.prop('colorMode')
)
