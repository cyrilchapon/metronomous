import { useMedia } from 'react-use'
import { ColorMode } from '../style/color-mode'

export const useSystemColorMode = (): ColorMode => {
  const prefersDarkMode = useMedia('(prefers-color-scheme: dark)', false)
  return prefersDarkMode ? 'dark' : 'light'
}
