import { focusAtom } from 'jotai-optics'
import { z } from 'zod'
import { ColorModeSetting, colorModeSettings } from '../style/color-mode'
import { ConfigShape, configSchema, persistedConfigAtom } from './persistence'

export type GlobalSettings = {
  colorMode: ColorModeSetting
  showVisualization: boolean
}

const defaultGlobalSettings: GlobalSettings = {
  // The OS preference, rather than dark for everyone: it is resolved
  // synchronously (`matchMedia`, both in `main.tsx` and in
  // `useSystemColorMode`), so honoring it costs no first frame in the
  // wrong theme — and both themes are designed for.
  colorMode: 'system',
  showVisualization: true,
}

const globalSettingsShape = {
  colorMode: z.enum(colorModeSettings),
  showVisualization: z.boolean(),
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

/**
 * Whether the canvas is on at all — which is why it sits here rather than
 * in `display-settings`, next to the settings that describe how it is
 * drawn: it is toggled from the control bar, not from the drawer, and it
 * has to survive "Réinitialiser la visualisation", which drops that whole
 * config.
 */
export const showVisualizationAtom = focusAtom(globalSettingsAtom, (optic) =>
  optic.prop('showVisualization')
)
