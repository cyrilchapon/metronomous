import { atom } from 'jotai'
import { focusAtom } from 'jotai-optics'
import { ColorModeSetting } from '../style/color-mode'

export type GlobalSettings = {
  colorMode: ColorModeSetting
}

const initialGlobalSettings: GlobalSettings = {
  colorMode: 'dark',
}

export const globalSettingsAtom = atom<GlobalSettings>(initialGlobalSettings)
export const colorModeSettingAtom = focusAtom(globalSettingsAtom, (optic) =>
  optic.prop('colorMode')
)
