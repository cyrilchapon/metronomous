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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined'
import VolumeOffOutlinedIcon from '@mui/icons-material/VolumeOffOutlined'
import { mergeSx } from 'merge-sx'
import { useAtom } from 'jotai'
import {
  metronomeBpmAtom,
  metronomeMutedAtom,
  metronomeRunningAtom
} from '../state/metronome'
import { clampMetronomeBpm } from '../util/metronome'
import { displaySettingsAtom } from '../state/display-settings'
import { useHoldToRepeat } from '../hooks/use-hold-to-repeat'
import PauseIcon from '@mui/icons-material/Pause'

export type ControlBarProps = AppBarProps<'div'>

export const ControlBar: FunctionComponent<ControlBarProps> = (props) => {
  const [metronomeRunning, setMetronomeRunning] = useAtom(metronomeRunningAtom)
  const [metronomeBpm, setMetronomeBpm] = useAtom(metronomeBpmAtom)
  const [metronomeMuted, setMetronomeMuted] = useAtom(metronomeMutedAtom)
  const [displaySettings, setDisplaySettings] = useAtom(displaySettingsAtom)

  const decrementBpm = () =>
    setMetronomeBpm((prevState) => clampMetronomeBpm(prevState - 1))
  const incrementBpm = () =>
    setMetronomeBpm((prevState) => clampMetronomeBpm(prevState + 1))

  const decrementHandlers = useHoldToRepeat(decrementBpm)
  const incrementHandlers = useHoldToRepeat(incrementBpm)

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
        <IconButton color="inherit" size="medium" {...decrementHandlers}>
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

        <IconButton color="inherit" size="medium" {...incrementHandlers}>
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

        <Divider
          orientation="vertical"
          variant={'middle'}
          flexItem
          sx={{ marginX: 3 }}
        />

        <IconButton
          color="inherit"
          size="medium"
          aria-label={
            displaySettings.showVisualization
              ? 'Masquer la visualisation'
              : 'Afficher la visualisation'
          }
          onClick={() =>
            setDisplaySettings((prevState) => ({
              ...prevState,
              showVisualization: !prevState.showVisualization,
            }))
          }
        >
          {displaySettings.showVisualization ? (
            <VisibilityOutlinedIcon fontSize="medium" />
          ) : (
            <VisibilityOffOutlinedIcon fontSize="medium" />
          )}
        </IconButton>

        <IconButton
          color="inherit"
          size="medium"
          aria-label={metronomeMuted ? 'Réactiver le son' : 'Couper le son'}
          onClick={() => setMetronomeMuted((prevState) => !prevState)}
        >
          {metronomeMuted ? (
            <VolumeOffOutlinedIcon fontSize="medium" />
          ) : (
            <VolumeUpOutlinedIcon fontSize="medium" />
          )}
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
