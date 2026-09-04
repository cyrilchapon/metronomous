import { Chip, Paper, PaperProps } from '@mui/material'
import { useAtomValue } from 'jotai'
import { metronomeStateAtom } from '../state/metronome'
import { FunctionComponent } from 'react'
import { mergeSx } from 'merge-sx'
import CircleIcon from '@mui/icons-material/Circle'
import BoltIcon from '@mui/icons-material/Bolt';
import Grid from '@mui/material/Grid'

export const Debugger: FunctionComponent<PaperProps> = (props) => {
  const { bpm, running } = useAtomValue(metronomeStateAtom)

  return (
    <Paper elevation={3} {...props} sx={mergeSx({ paddingX: 2, paddingY: 1 }, props.sx)}>
      <Grid container>
        <Grid size="grow" sx={{ display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={running ? 'running' : 'stopped'}
            icon={<CircleIcon fontSize='small' color={running ? 'success' : 'disabled'} />}
          />
        </Grid>

        <Grid size="grow" sx={{ display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={`${`${bpm}`.padStart(3, '0')} bpm`}
            icon={<BoltIcon />}
          />
        </Grid>
      </Grid>
    </Paper>
  )
}
