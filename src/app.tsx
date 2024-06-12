import { Box, CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2/Grid2'
import { Provider as JotaiProvider, useAtom } from 'jotai'
import { FunctionComponent, PropsWithChildren, useMemo } from 'react'
import { AppDrawer } from './components/app-drawer'
import { ControlBar } from './components/control-bar'
import { Navbar, NavbarOffset } from './components/navbar'
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
        <_App />
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

const _App = () => {
  useAtom(updateMetronomeRunningEffect)
  useAtom(updateMetronomeBpmEffect)
  useAtom(updateMetronomeSignatureEffect)
  useAtom(updateMetronomeSubdivisionEffect)

  return (
    <>
      <AppDrawer />

      <Grid container direction={'column'} width="100%" height="100%">
        <Grid
          xs
          // marginBottom={2}
          component={Box}
          display="flex"
          height="100%"
          overflow={'hidden'}
        >
          <ShapeVisualization
            height={'100%'}
            width={'100%'}
            overflow={'hidden'}
          />
        </Grid>

        <Grid
          xs="auto"
          justifySelf={'flex-end'}
          marginTop={'auto'}
          marginBottom={3}
          container
          justifyContent={'center'}
        >
          <Grid xs={'auto'} component={ControlBar} />
        </Grid>

        {/* <Grid xs="auto" justifySelf={'flex-end'}>
            <Debugger />
          </Grid> */}

        <Grid xs={'auto'} justifySelf={'flex-end'}>
          <Navbar sx={{ top: 'auto', bottom: 0 }} />
          <NavbarOffset />
        </Grid>
      </Grid>
    </>
  )
}

export default App
