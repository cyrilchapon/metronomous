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
} from '@mui/material'
import { useAtom } from 'jotai'
import { FunctionComponent, useCallback } from 'react'
import { CursorMode, displaySettingsAtom } from '../state/display-settings'
import { menuDrawerOpenAtom } from '../state/global-ui'
import { assertIsEasingMass, easingMasses } from '../util/mass-easing'
import { ColorModeToggleButton } from './color-mode-toggle-button'
import {
  MetronomeSignature,
  MetronomeSubdivision,
  metronomeSignatureAtom,
  metronomeSignatures,
  metronomeSubdivisionAtom,
  metronomeSubdivisions,
} from '../state/metronome'
import { SubdivisionIcon } from './subdivision-icon'

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
        <Stack flex={1} spacing={2}>
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

          <Box>
            <InputLabel htmlFor="cursor-mass-input" sx={{ marginBottom: 1 }}>
              Mode d&apos;affichage
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
              <ToggleButton value={'mass'}>Inertie</ToggleButton>
              <ToggleButton value={'subdivisions'}>Subdivisions</ToggleButton>
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

          <Divider
            sx={{
              justifySelf: 'flex-end',
              marginTop: 'auto !important',
              marginBottom: 2,
            }}
          />
          <Box>
            <InputLabel sx={{ marginBottom: 2 }}>Mode de couleur</InputLabel>
            <ColorModeToggleButton size="small" color="primary" fullWidth />
          </Box>
        </Stack>
      </Box>
    </Drawer>
  )
}
