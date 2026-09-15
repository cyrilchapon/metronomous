import { useLayoutEffect } from 'react'
import { useColorMode } from './use-color-mode'

/**
 * Reflects the resolved color mode on `<html>`, which is where Tailwind's
 * `dark` variant and the shadcn theme tokens are keyed.
 */
export const useApplyColorMode = () => {
  const colorMode = useColorMode()

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', colorMode === 'dark')
    root.style.colorScheme = colorMode
  }, [colorMode])
}
