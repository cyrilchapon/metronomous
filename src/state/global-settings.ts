import { focusAtom } from 'jotai-optics'
import { z } from 'zod'
import { ColorModeSetting, colorModeSettings } from '../style/color-mode'
import { ConfigShape, configSchema, persistedConfigAtom } from './persistence'

export type GlobalSettings = {
  colorMode: ColorModeSetting
}

const defaultGlobalSettings: GlobalSettings = {
  // The OS preference, rather than dark for everyone: it is resolved
  // synchronously (`matchMedia`, both in `main.tsx` and in
  // `useSystemColorMode`), so honoring it costs no first frame in the
  // wrong theme — and both themes are designed for.
  colorMode: 'system',
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
