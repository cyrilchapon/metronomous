import {
  Box,
  Divider,
  Drawer,
  DrawerProps,
  InputLabel,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useAtom } from 'jotai'
import { FunctionComponent, useCallback } from 'react'
import {
  CursorMode,
  ShapeMode,
  displaySettingsAtom,
} from '../state/display-settings'
import { menuDrawerOpenAtom } from '../state/global-ui'
import { assertIsEasingMass, easingMasses } from '../util/mass-easing'
import { ColorModeToggleButton } from './color-mode-toggle-button'
import {
  metronomeSignatureAtom,
  metronomeSubdivisionAtom,
} from '../state/metronome'
import { SubdivisionIcon } from './subdivision-icon'
import {
  MetronomeSignature,
  MetronomeSubdivision,
  metronomeSignatures,
  metronomeSubdivisions,
} from '../util/metronome'
import PentagonOutlinedIcon from '@mui/icons-material/PentagonOutlined'
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined'
import CommitOutlinedIcon from '@mui/icons-material/CommitOutlined'
import AnimationOutlinedIcon from '@mui/icons-material/AnimationOutlined'

const marks = easingMasses.map((m) => ({ value: m }))
const minMass = Math.min(...easingMasses)
const maxMass = Math.max(...easingMasses)

export type AppDrawerProps = Omit<DrawerProps, 'open' | 'onClose'>

export const AppDrawer: FunctionComponent<AppDrawerProps> = (props) => {
  const [menuDrawerOpen, setMenuDrawerOpen] = useAtom(menuDrawerOpenAtom)
  const [displaySettings, setDisplaySettings] = useAtom(displaySettingsAtom)
  const [metronomeSignature, setMetronomeSignature] = useAtom(
    metronomeSignatureAtom
  )
  const [metronomeSubdivision, setMetronomeSubdivision] = useAtom(
    metronomeSubdivisionAtom
  )

  const handleDrawerToggle = useCallback(() => {
    setMenuDrawerOpen(false)
  }, [setMenuDrawerOpen])

  return (
    <Drawer
      open={menuDrawerOpen}
      anchor="right"
      onClose={handleDrawerToggle}
      elevation={0}
      {...props}
    >
      <Box
        width={[300, 400, 500]}
        height={'100%'}
        paddingX={[4, 5, 8]}
        paddingY={4}
        display={'flex'}
        flexDirection={'row'}
      >
        <Stack flex={1} spacing={4}>
          <Stack spacing={2}>
            <Typography variant="h5" lineHeight={1}>Métronome</Typography>
            <Box>
              <InputLabel sx={{ marginBottom: 2 }}>Signature</InputLabel>

              <ToggleButtonGroup
                value={metronomeSignature}
                exclusive
                onChange={(_event, value: MetronomeSignature) => {
                  if (value == null) {
                    return
                  }
                  setMetronomeSignature(value)
                }}
                fullWidth
              >
                {metronomeSignatures.map((signature) => (
                  <ToggleButton key={signature} value={signature}>
                    {signature}/4
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box>
              <InputLabel sx={{ marginBottom: 2 }}>Subdivisions</InputLabel>

              <ToggleButtonGroup
                value={metronomeSubdivision}
                exclusive
                onChange={(_event, value: MetronomeSubdivision) => {
                  if (value == null) {
                    return
                  }
                  setMetronomeSubdivision(value)
                }}
                fullWidth
              >
                {metronomeSubdivisions.map((subdivision) => (
                  <ToggleButton key={subdivision} value={subdivision}>
                    <SubdivisionIcon subdivision={subdivision} />
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5" lineHeight={1}>
              Fond
            </Typography>

            <Box>
              <InputLabel htmlFor="line-shape-input" sx={{ marginBottom: 1 }}>
                Forme du contour
              </InputLabel>

              <ToggleButtonGroup
                value={displaySettings.shapeMode}
                exclusive
                onChange={(_event, value: ShapeMode) => {
                  if (value == null) {
                    return
                  }
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    shapeMode: value,
                  }))
                }}
                fullWidth
              >
                <ToggleButton value={'circle'}>
                  <CircleOutlinedIcon sx={{ mr: 1 }} /> Cercle
                </ToggleButton>
                <ToggleButton value={'polygon'}>
                  <PentagonOutlinedIcon sx={{ mr: 1 }} /> Polygone
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5" lineHeight={1}>Curseur</Typography>

            <Box>
              <InputLabel htmlFor="cursor-mass-input" sx={{ marginBottom: 1 }}>
                Mode de curseur
              </InputLabel>

              <ToggleButtonGroup
                value={displaySettings.cursorMode}
                exclusive
                onChange={(_event, value: CursorMode) => {
                  if (value == null) {
                    return
                  }
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    cursorMode: value,
                  }))
                }}
                fullWidth
              >
                <ToggleButton value={'mass'}>
                  <AnimationOutlinedIcon sx={{ mr: 1 }} /> Inertie
                </ToggleButton>
                <ToggleButton value={'subdivisions'}>
                  <CommitOutlinedIcon sx={{ mr: 1 }} /> Subdivisions
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <InputLabel
                htmlFor="cursor-mass-input"
                sx={{ marginBottom: 1 }}
                disabled={displaySettings.cursorMode !== 'mass'}
              >
                Masse du curseur
              </InputLabel>

              <Slider
                id="cursor-mass-input"
                value={displaySettings.cursorMass}
                disabled={displaySettings.cursorMode !== 'mass'}
                onChange={(_e, value) => {
                  assertIsEasingMass(value)

                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    cursorMass: value,
                  }))
                }}
                step={null}
                marks={marks}
                valueLabelDisplay="auto"
                min={minMass}
                max={maxMass}
              />
            </Box>
          </Stack>

          <Divider
            sx={{
              marginBottom: 2,
              justifySelf: 'flex-end',
              marginTop: 'auto !important',
            }}
          />

          <Stack spacing={2}>
            <Box>
              <InputLabel sx={{ marginBottom: 2 }}>Mode de couleur</InputLabel>
              <ColorModeToggleButton size="small" color="primary" fullWidth />
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  )
}
