import { useMedia } from 'react-use'
import { ColorMode, prefersDarkQuery } from '../style/color-mode'

export const useSystemColorMode = (): ColorMode => {
  // No `defaultState`: react-use returns it verbatim from `getInitialState`
  // and only corrects the value in a post-paint effect, so passing one paints
  // a light first frame for a dark OS. Omitting it reads `matchMedia`
  // synchronously, the way MUI's `useMediaQuery` did.
  const prefersDarkMode = useMedia(prefersDarkQuery)
  return prefersDarkMode ? 'dark' : 'light'
}
