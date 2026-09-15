import { useAtom } from 'jotai'
import { Monitor, Moon, Sun } from 'lucide-react'
import { FunctionComponent } from 'react'
import { colorModeSettingAtom } from '../state/global-settings'
import { isColorModeSetting } from '../style/color-mode'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export type ColorModeToggleGroupProps = Pick<
  React.ComponentProps<typeof ToggleGroup>,
  'className' | 'variant' | 'size' | 'spacing'
>

export const ColorModeToggleGroup: FunctionComponent<
  ColorModeToggleGroupProps
> = ({ className, ...props }) => {
  const [settingColorMode, setSettingColorMode] = useAtom(colorModeSettingAtom)

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={settingColorMode}
      onValueChange={(value) => {
        if (!isColorModeSetting(value)) {
          return
        }
        setSettingColorMode(value)
      }}
      className={cn('w-full', className)}
      {...props}
    >
      <ToggleGroupItem value="light" className="flex-1" aria-label="Clair">
        <Sun />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" className="flex-1" aria-label="Système">
        <Monitor />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" className="flex-1" aria-label="Sombre">
        <Moon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
