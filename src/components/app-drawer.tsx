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
import { displaySettingsAtom } from '../state/display-settings'
import { menuDrawerOpenAtom } from '../state/global-ui'
import { assertIsEasingMass, easingMasses } from '../util/mass-easing'
import { ColorModeToggleButton } from './color-mode-toggle-button'
import { metronomeSignatureAtom, metronomeSignatures } from '../state/metronome'

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
            <InputLabel htmlFor="cursor-mass-input" sx={{ marginBottom: 1 }}>
              Inertie du curseur
            </InputLabel>
            <Slider
              id="cursor-mass-input"
              value={displaySettings.cursorMass}
              onChange={(_e, value) => {
                assertIsEasingMass(value)

                setDisplaySettings((prevState) => ({
                  ...prevState,
                  cursorMass: value,
                }))
              }}
              step={null}
              marks={marks}
              // aria-label="Temperature"
              valueLabelDisplay="auto"
              min={minMass}
              max={maxMass}
            />
          </Box>

          <Box>
            <InputLabel sx={{ marginBottom: 2 }}>
              Signature
            </InputLabel>

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
              fullWidth
            >
              {metronomeSignatures.map((signature) => (
                <ToggleButton
                  key={signature}
                  value={signature}
                  aria-label="left aligned"
                >
                  {signature}/4
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          <Divider
            sx={{ justifySelf: 'flex-end', marginTop: 'auto !important', marginBottom: 2 }}
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
