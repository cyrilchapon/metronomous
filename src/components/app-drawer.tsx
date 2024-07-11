import {
  Box,
  Divider,
  Drawer,
  DrawerProps,
  InputLabel,
  Slider,
  Stack,
  SvgIcon,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useAtom } from 'jotai'
import { FunctionComponent, useCallback } from 'react'
import {
  CursorMode,
  CursorMoveMode,
  FlashMode,
  ShapeDivisions,
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
import HdrStrongOutlinedIcon from '@mui/icons-material/HdrStrongOutlined'
import CircleIcon from '@mui/icons-material/Circle'
import MdiSineWave from '@mdi/svg/svg/sine-wave.svg?react'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import RadarOutlinedIcon from '@mui/icons-material/RadarOutlined';

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
            <Typography variant="h5" lineHeight={1}>
              Métronome
            </Typography>
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
                size="small"
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
                size="small"
              >
                {metronomeSubdivisions.map((subdivision) => (
                  <ToggleButton key={subdivision} value={subdivision}>
                    <SubdivisionIcon
                      subdivision={subdivision}
                      fontSize="small"
                    />
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
                Forme
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
                size="small"
              >
                <ToggleButton value={'circle'}>
                  <CircleOutlinedIcon sx={{ mr: 1 }} fontSize="small" /> Cercle
                </ToggleButton>
                <ToggleButton value={'polygon'}>
                  <PentagonOutlinedIcon sx={{ mr: 1 }} fontSize="small" />{' '}
                  Polygone
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <InputLabel htmlFor="cursor-mass-input" sx={{ marginBottom: 1 }}>
                Subdivisions
              </InputLabel>

              <ToggleButtonGroup
                value={displaySettings.shapeSubdivisions}
                exclusive
                onChange={(_event, value: ShapeDivisions) => {
                  if (value == null) {
                    return
                  }
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    shapeSubdivisions: value,
                  }))
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value={'off'}>Off</ToggleButton>
                <ToggleButton value={'divisions'}>
                  <CircleIcon
                    sx={{ mr: 1, fontSize: '1em' }}
                    fontSize="small"
                  />{' '}
                  Temps
                </ToggleButton>
                <ToggleButton value={'subdivisions'}>
                  <HdrStrongOutlinedIcon sx={{ mr: 1 }} fontSize="small" />{' '}
                  Toutes
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <Typography variant="h5" lineHeight={1}>
              Curseur
            </Typography>

            <Box>
              <InputLabel htmlFor="cursor-mass-input" sx={{ marginBottom: 1 }}>
                Mouvement
              </InputLabel>

              <ToggleButtonGroup
                value={displaySettings.cursorMoveMode}
                exclusive
                onChange={(_event, value: CursorMoveMode) => {
                  if (value == null) {
                    return
                  }
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    cursorMoveMode: value,
                  }))
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value={'eased'}>
                  <SvgIcon
                    sx={{ mr: 1 }}
                    fontSize="small"
                    inheritViewBox
                    component={MdiSineWave}
                  />
                  Inertiel
                </ToggleButton>

                <ToggleButton value={'linear'}>
                  <HorizontalRuleIcon sx={{ mr: 1 }} fontSize="small" />{' '}
                  Linéaire
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <InputLabel
                htmlFor="cursor-mass-input"
                sx={{ marginBottom: 1 }}
                disabled={displaySettings.cursorMoveMode !== 'eased'}
              >
                Inertie
              </InputLabel>

              <Slider
                id="cursor-mass-input"
                value={displaySettings.cursorMass}
                disabled={displaySettings.cursorMoveMode !== 'eased'}
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

            <Box>
              <InputLabel htmlFor="cursor-flash-input" sx={{ marginBottom: 1 }}>
                Modes de curseur
              </InputLabel>

              <ToggleButtonGroup
                value={displaySettings.cursorMode}
                onChange={(_event, value: CursorMode[]) => {
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    cursorMode: value,
                  }))
                }}
                fullWidth
              >
                <ToggleButton value={'dot'}>
                  <AnimationOutlinedIcon sx={{ mr: 1 }} fontSize="small" />{' '}
                  Point
                </ToggleButton>
                <ToggleButton value={'line'}>
                  <RadarOutlinedIcon sx={{ mr: 1 }} fontSize="small" />{' '}
                  Ligne
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>

          <Stack spacing={2}>
            <Typography variant="h5" lineHeight={1}>
              Flash
            </Typography>

            <Box>
              <InputLabel htmlFor="cursor-flash-input" sx={{ marginBottom: 1 }}>
                Modes de flash
              </InputLabel>

              <ToggleButtonGroup
                value={displaySettings.flashMode}
                onChange={(_event, value: FlashMode[]) => {
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    flashMode: value,
                  }))
                }}
                fullWidth
              >
                <ToggleButton value={'shape'}>
                  {displaySettings.shapeMode === 'circle' ? (
                    <CircleOutlinedIcon sx={{ mr: 1 }} fontSize="small" />
                  ) : displaySettings.shapeMode === 'polygon' ? (
                    <PentagonOutlinedIcon sx={{ mr: 1 }} fontSize="small" />
                  ) : null}
                  Forme
                </ToggleButton>
                <ToggleButton value={'divisions'}>
                  <CommitOutlinedIcon sx={{ mr: 1 }} fontSize="small" />{' '}
                  Subdivisions
                </ToggleButton>
              </ToggleButtonGroup>
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
