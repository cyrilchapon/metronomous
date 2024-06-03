import { PaletteMode, useMediaQuery } from '@mui/material'

export const useSystemPaletteMode = (): PaletteMode => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  return prefersDarkMode ? 'dark' : 'light'
}
