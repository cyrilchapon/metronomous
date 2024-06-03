import {
  AppBar,
  AppBarProps,
  Divider,
  IconButton, Toolbar,
  Typography
} from '@mui/material'
import { FunctionComponent } from 'react'
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { mergeSx } from 'merge-sx'
import { useAtom } from 'jotai'
import {
  metronomeBpmAtom,
  metronomeRunningAtom
} from '../state/metronome'
import PauseIcon from '@mui/icons-material/Pause'

export type ControlBarProps = AppBarProps<'div'>

export const ControlBar: FunctionComponent<ControlBarProps> = (props) => {
  const [metronomeRunning, setMetronomeRunning] = useAtom(metronomeRunningAtom)
  const [metronomeBpm, setMetronomeBpm] = useAtom(metronomeBpmAtom)

  return (
    <AppBar
      variant="outlined"
      elevation={0}
      color="transparent"
      position="static"
      {...props}
      sx={mergeSx(
        (theme) => ({
          borderRadius: theme.shape.borderRadius,
        }),
        props.sx
      )}
      component={'div'}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          size="medium"
          onClick={() => setMetronomeBpm((prevState) => prevState - 1)}
        >
          <RemoveOutlinedIcon fontSize="inherit" />
        </IconButton>

        <IconButton
          color="primary"
          size="medium"
          onClick={() => setMetronomeRunning((prevState) => !prevState)}
        >
          {metronomeRunning ? (
            <PauseIcon fontSize="large" />
          ) : (
            <PlayArrowIcon fontSize="large" />
          )}
        </IconButton>

        <IconButton
          color="inherit"
          size="medium"
          onClick={() => setMetronomeBpm((prevState) => prevState + 1)}
        >
          <AddOutlinedIcon fontSize="inherit" />
        </IconButton>

        <Divider
          orientation="vertical"
          variant={'middle'}
          flexItem
          sx={{ marginX: 3 }}
        />

        <Typography variant="h5">
          {metronomeBpm}
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
