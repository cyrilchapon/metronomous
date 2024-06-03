import { Box, Drawer, DrawerProps, Slider, Stack } from '@mui/material'
import { useAtom } from 'jotai'
import { FunctionComponent, useCallback } from 'react'
import { displaySettingsAtom } from '../state/display-settings'
import { menuDrawerOpenAtom } from '../state/global-ui'
import { assertIsEasingMass, easingMasses } from '../util/mass-easing'

const marks = easingMasses.map((m) => ({ value: m }))
const minMass = Math.min(...easingMasses)
const maxMass = Math.max(...easingMasses)

export type AppDrawerProps = Omit<DrawerProps, 'open' | 'onClose'>

export const AppDrawer: FunctionComponent<AppDrawerProps> = (props) => {
  const [menuDrawerOpen, setMenuDrawerOpen] = useAtom(menuDrawerOpenAtom)
  const [displaySettings, setDisplaySettings] = useAtom(displaySettingsAtom)

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
      <Box width={250} height={'100%'} paddingX={2} paddingY={4}>
        <Stack>
          <Box>
            Masse du curseur
            <Slider
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
        </Stack>
      </Box>
    </Drawer>
  )
}
