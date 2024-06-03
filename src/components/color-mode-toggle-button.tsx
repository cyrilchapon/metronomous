import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined'
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from '@mui/material'
import { FunctionComponent } from 'react'
import {
  colorModeSettingAtom,
  isColorModeSetting,
} from '../state/global-settings'
import { useAtom } from 'jotai'

export type ColorModeToggleButtonProps = Omit<
  ToggleButtonGroupProps,
  'value' | 'onChange' | 'exclusive'
>
export const ColorModeToggleButton: FunctionComponent<
  ToggleButtonGroupProps
> = (props) => {
  const [settingsColorMode, setSettingsColorMode] =
    useAtom(colorModeSettingAtom)

  const handleColorModeSettingChange = (
    _event: React.MouseEvent<HTMLElement>,
    newColorMode: unknown
  ) => {
    const parsedNewColorMode = isColorModeSetting(newColorMode)
      ? newColorMode
      : 'system'
    setSettingsColorMode(parsedNewColorMode)
  }

  return (
    <ToggleButtonGroup
      value={settingsColorMode}
      onChange={handleColorModeSettingChange}
      exclusive
      {...props}
    >
      <ToggleButton value="light">
        <LightModeOutlinedIcon />
      </ToggleButton>
      <ToggleButton value="system">
        <SettingsBrightnessOutlinedIcon />
      </ToggleButton>
      <ToggleButton value="dark">
        <DarkModeOutlinedIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
