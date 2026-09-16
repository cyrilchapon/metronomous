import { useSetAtom } from 'jotai'
import { Settings2 } from 'lucide-react'
import { FunctionComponent, useCallback } from 'react'
import darkImgUrl from '../assets/metronomous-512-light-blue.png'
import lightImgUrl from '../assets/metronomous-512-blue.png'
import { useColorMode } from '../hooks/use-color-mode'
import { menuDrawerOpenAtom } from '../state/global-ui'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export type NavbarProps = React.ComponentProps<'nav'>

export const Navbar: FunctionComponent<NavbarProps> = ({
  className,
  ...props
}) => {
  const setMenuDrawerOpen = useSetAtom(menuDrawerOpenAtom)
  const colorMode = useColorMode()

  const handleDrawerToggle = useCallback(() => {
    setMenuDrawerOpen((prevState) => !prevState)
  }, [setMenuDrawerOpen])

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t bg-background/50 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      <div className="flex h-14 items-center gap-3 px-4">
        <img
          className="h-8 w-auto"
          alt=""
          src={colorMode === 'dark' ? darkImgUrl : lightImgUrl}
        />

        <span className="flex-1 font-heading text-lg font-semibold">
          Metronomous
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleDrawerToggle}
          aria-label="Ouvrir les réglages"
        >
          <Settings2 />
        </Button>
      </div>
    </nav>
  )
}
