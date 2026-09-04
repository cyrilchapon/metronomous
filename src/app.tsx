import { Box, CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material'
import { Provider as JotaiProvider, useAtom } from 'jotai'
import { FunctionComponent, PropsWithChildren, useMemo } from 'react'
import { AppDrawer } from './components/app-drawer'
import { ControlBar } from './components/control-bar'
import { Navbar } from './components/navbar'
import { NavbarOffset } from './components/navbar-offset'
import { usePaletteMode } from './hooks/use-actual-color-mode'
import {
  updateMetronomeBpmEffect,
  updateMetronomeRunningEffect,
  updateMetronomeSignatureEffect,
  updateMetronomeSubdivisionEffect,
} from './state/metronome'
import { globalStyles } from './style/global-styles'
import { getTheme } from './style/theme'
import { ShapeVisualization } from './components/shape-visualization'
import { store } from './state/store'
// import { Debugger } from './components/debugger'

const App = () => {
  return (
    <JotaiProvider store={store}>
      <Theme>
        <AppRoot />
      </Theme>
    </JotaiProvider>
  )
}

const Theme: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const paletteMode = usePaletteMode()
  const theme = useMemo(() => getTheme(paletteMode), [paletteMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <GlobalStyles styles={globalStyles} />

      {children}
    </ThemeProvider>
  )
}

const AppRoot = () => {
  useAtom(updateMetronomeRunningEffect)
  useAtom(updateMetronomeBpmEffect)
  useAtom(updateMetronomeSignatureEffect)
  useAtom(updateMetronomeSubdivisionEffect)

  return (
    <>
      <AppDrawer />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
        }}
      >
        <Box
          sx={{ display: 'flex', flex: '1 1 auto', height: '100%', overflow: 'hidden' }}
        >
          <ShapeVisualization />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 'auto',
            marginBottom: 3,
          }}
        >
          <ControlBar />
        </Box>

        {/* <Debugger /> */}

        <Box>
          <Navbar sx={{ top: 'auto', bottom: 0 }} />
          <NavbarOffset />
        </Box>
      </Box>
    </>
  )
}

export default App
