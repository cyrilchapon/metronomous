import { PaletteMode, alpha, createTheme } from '@mui/material'
import { blue } from '@mui/material/colors'
import { ColorSource } from 'pixi.js'

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Palette {
    'semi-transparent': Palette['primary']
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface PaletteOptions {
    'semi-transparent'?: PaletteOptions['primary']
  }
}

declare module '@mui/material/AppBar' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface AppBarPropsColorOverrides {
    'semi-transparent': true
  }
}

declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Theme {
    drawPalette: {
      main: ColorSource
      cursor: ColorSource
    }
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ThemeOptions {
    drawPalette: {
      main: ColorSource
      cursor: ColorSource
    }
  }
}

const getTheme = (mode: PaletteMode) => {
  let theme = createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: {
              main: blue[500],
            },
          }
        : {}),
    },
    drawPalette:
      mode === 'light'
        ? {
            main: 0x000000,
            cursor: 0xff3300,
          }
        : {
            main: 0xff3300,
            cursor: 0xffffff,
          },
    shape: {
      borderRadius: 2,
    },
  })

  theme = createTheme({
    ...theme,
    palette: {
      ...theme.palette,
      'semi-transparent': {
        main: alpha(theme.palette.background.default, 0.5),
      },
    },
  })

  theme = createTheme({
    ...theme,
    components: {
      MuiAppBar: {
        variants: [
          {
            props: { color: 'semi-transparent' },
            style: {
              backgroundColor: theme.palette['semi-transparent'].main,
              color: 'inherit',
              backdropFilter: 'blur(8px)',
            },
          },
        ],
      },
    },
  })

  return theme
}

export { getTheme }
