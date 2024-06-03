import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import {
  AppBar,
  AppBarProps,
  Box,
  IconButton,
  Toolbar,
  Typography,
  styled,
  useTheme,
} from '@mui/material'
import { useSetAtom } from 'jotai'
import { FunctionComponent, useCallback } from 'react'
import { menuDrawerOpenAtom } from '../state/global-ui'
import darkImgUrl from '../assets/metronomous-512-light-blue.png'
import lightImgUrl from '../assets/metronomous-512-blue.png'

export type NavbarProps = Omit<AppBarProps, 'component'>

export const Navbar: FunctionComponent<NavbarProps> = (props) => {
  const setMenuDrawerOpen = useSetAtom(menuDrawerOpenAtom)

  const handleDrawerToggle = useCallback(() => {
    setMenuDrawerOpen((prevState) => !prevState)
  }, [setMenuDrawerOpen])

  const {
    palette: { mode: colorMode },
  } = useTheme()

  return (
    <AppBar
      {...props}
      color="semi-transparent"
      variant="outlined"
      elevation={0}
      component="nav"
    >
      <Toolbar>
        <Box
          component="img"
          sx={{ maxHeight: 40, mr: 2 }}
          alt="Your logo."
          src={colorMode === 'dark' ? darkImgUrl : lightImgUrl}
        />

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Metronomous
        </Typography>

        <IconButton
          color="inherit"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ ml: 2 }}
        >
          <TuneOutlinedIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}

export const NavbarOffset = styled('div')(({ theme }) => theme.mixins.toolbar)
