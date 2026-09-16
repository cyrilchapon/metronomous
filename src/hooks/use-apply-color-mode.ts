import { useLayoutEffect } from 'react'
import { applyColorMode } from '../style/color-mode'
import { useColorMode } from './use-color-mode'

/**
 * Keeps `<html>` in sync with the color mode. The *initial* mode is applied
 * in `main.tsx`, before React renders — a layout effect here would run after
 * the effects of the components that read the resulting theme.
 */
export const useApplyColorMode = () => {
  const colorMode = useColorMode()

  useLayoutEffect(() => {
    applyColorMode(colorMode)
  }, [colorMode])
}
