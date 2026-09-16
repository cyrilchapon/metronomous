import { useMedia } from 'react-use'
import { ColorMode, prefersDarkQuery } from '../style/color-mode'

export const useSystemColorMode = (): ColorMode => {
  const prefersDarkMode = useMedia(prefersDarkQuery, false)
  return prefersDarkMode ? 'dark' : 'light'
}
