import {
  AppBar,
  AppBarProps,
  Divider,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from '@mui/material'
import { FunctionComponent } from 'react'
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { mergeSx } from 'merge-sx'
import { useAtom } from 'jotai'
import {
  metronomeBpmAtom,
  metronomeRunningAtom,
  metronomeSignatureAtom,
} from '../state/metronome'
import PauseIcon from '@mui/icons-material/Pause'

export type ControlBarProps = AppBarProps<'div'>

export const ControlBar: FunctionComponent<ControlBarProps> = (props) => {
  const [metronomeRunning, setMetronomeRunning] = useAtom(metronomeRunningAtom)
  const [metronomeBpm, setMetronomeBpm] = useAtom(metronomeBpmAtom)
  const [metronomeSignature, setMetronomeSignature] = useAtom(
    metronomeSignatureAtom
  )

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

        <Typography variant="h5" marginLeft={2}>
          {metronomeBpm}
        </Typography>

        <Divider
          orientation="vertical"
          variant={'middle'}
          flexItem
          sx={{ marginX: 3 }}
        />

        <ToggleButtonGroup
          value={metronomeSignature}
          exclusive
          onChange={(_event, value: typeof metronomeSignature) => {
            if (value == null) {
              return
            }
            setMetronomeSignature(value)
          }}
          aria-label="text alignment"
        >
          <ToggleButton value={3} aria-label="left aligned">
            3/4
          </ToggleButton>

          <ToggleButton value={4} aria-label="centered">
            4/4
          </ToggleButton>
        </ToggleButtonGroup>
      </Toolbar>
    </AppBar>
  )
}
