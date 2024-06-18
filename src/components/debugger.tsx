import { Chip, Paper, PaperProps } from '@mui/material'
import { useAtomValue } from 'jotai'
import { metronomeStateAtom } from '../state/metronome'
import { FunctionComponent } from 'react'
import { mergeSx } from 'merge-sx'
import CircleIcon from '@mui/icons-material/Circle'
import BoltIcon from '@mui/icons-material/Bolt';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import Grid from '@mui/material/Unstable_Grid2/Grid2'

export const Debugger: FunctionComponent<PaperProps> = (props) => {
  const { bpm, running, progress } = useAtomValue(metronomeStateAtom)

  return (
    <Paper elevation={3} {...props} sx={mergeSx({ paddingX: 2, paddingY: 1 }, props.sx)}>
      <Grid container>
        <Grid xs display="flex" justifyContent="center">
          <Chip
            label={running ? 'running' : 'stopped'}
            icon={<CircleIcon fontSize='small' color={running ? 'success' : 'disabled'} />}
          />
        </Grid>

        <Grid xs display="flex" justifyContent="center">
          <Chip
            label={`${`${bpm}`.padStart(3, '0')} bpm`}
            icon={<BoltIcon />}
          />
        </Grid>

        <Grid xs display="flex" justifyContent="center">
          <Chip
            label={`${`${Math.round(progress.progress * 100)}`.padStart(3, '0')} %`}
            icon={<TimelapseIcon />}
          />
        </Grid>
      </Grid>
    </Paper>
  )
}
