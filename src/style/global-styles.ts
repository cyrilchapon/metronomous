import { Interpolation, Theme } from '@mui/material'

export const globalStyles: Interpolation<Theme> = () => ({
  html: { margin: 0, padding: 0, height: '100%' },
  body: { margin: 0, padding: 0, height: '100%', 'minHeight': '100%' },
  '#root': { margin: 0, padding: 0, height: '100%' },
})
