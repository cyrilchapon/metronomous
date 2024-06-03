import { useAtom } from 'jotai'
import { colorModeSettingAtom } from '../state/global-settings'
import { useSystemPaletteMode } from './use-system-color-mode'
import { useMemo } from 'react'

export const usePaletteMode = () => {
  const [settingsColorMode] = useAtom(colorModeSettingAtom)
  const systemColorMode = useSystemPaletteMode()

  const colorMode = useMemo(
    () =>
      settingsColorMode === 'system' ? systemColorMode : settingsColorMode,
    [settingsColorMode, systemColorMode]
  )

  return colorMode
}
