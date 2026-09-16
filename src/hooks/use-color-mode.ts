import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { colorModeSettingAtom } from '../state/global-settings'
import { ColorMode } from '../style/color-mode'
import { useSystemColorMode } from './use-system-color-mode'

/** The color mode actually in effect, resolving the `system` setting. */
export const useColorMode = (): ColorMode => {
  const settingColorMode = useAtomValue(colorModeSettingAtom)
  const systemColorMode = useSystemColorMode()

  return useMemo(
    () => (settingColorMode === 'system' ? systemColorMode : settingColorMode),
    [settingColorMode, systemColorMode]
  )
}
