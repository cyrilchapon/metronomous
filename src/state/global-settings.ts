import { focusAtom } from 'jotai-optics'
import { z } from 'zod'
import { ColorModeSetting, colorModeSettings } from '../style/color-mode'
import { ConfigShape, configSchema, persistedConfigAtom } from './persistence'

export type GlobalSettings = {
  colorMode: ColorModeSetting
}

const defaultGlobalSettings: GlobalSettings = {
  colorMode: 'dark',
}

const globalSettingsShape = {
  colorMode: z.enum(colorModeSettings),
} satisfies ConfigShape<GlobalSettings>

export const globalSettingsAtom = persistedConfigAtom({
  key: 'global-settings',
  version: 1,
  defaults: defaultGlobalSettings,
  schema: configSchema(globalSettingsShape),
})

export const colorModeSettingAtom = focusAtom(globalSettingsAtom, (optic) =>
  optic.prop('colorMode')
)
