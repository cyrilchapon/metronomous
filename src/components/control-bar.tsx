import { useAtom } from 'jotai'
import {
  Eye,
  EyeOff,
  Minus,
  Pause,
  Play,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { FunctionComponent } from 'react'
import { useHoldToRepeat } from '../hooks/use-hold-to-repeat'
import { displaySettingsAtom } from '../state/display-settings'
import {
  metronomeBpmAtom,
  metronomeMutedAtom,
  metronomeRunningAtom,
} from '../state/metronome'
import { clampMetronomeBpm } from '../util/metronome'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export type ControlBarProps = React.ComponentProps<typeof Card>

export const ControlBar: FunctionComponent<ControlBarProps> = ({
  className,
  ...props
}) => {
  const [metronomeRunning, setMetronomeRunning] = useAtom(metronomeRunningAtom)
  const [metronomeBpm, setMetronomeBpm] = useAtom(metronomeBpmAtom)
  const [metronomeMuted, setMetronomeMuted] = useAtom(metronomeMutedAtom)
  const [displaySettings, setDisplaySettings] = useAtom(displaySettingsAtom)

  const decrementBpm = () =>
    setMetronomeBpm((prevState) => clampMetronomeBpm(prevState - 1))
  const incrementBpm = () =>
    setMetronomeBpm((prevState) => clampMetronomeBpm(prevState + 1))

  const decrementHandlers = useHoldToRepeat(decrementBpm)
  const incrementHandlers = useHoldToRepeat(incrementBpm)

  return (
    <Card
      className={cn('w-fit flex-row items-center gap-1 p-2', className)}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Diminuer le tempo"
        {...decrementHandlers}
      >
        <Minus />
      </Button>

      <Button
        size="icon-lg"
        aria-label={metronomeRunning ? 'Arrêter' : 'Démarrer'}
        onClick={() => setMetronomeRunning((prevState) => !prevState)}
      >
        {metronomeRunning ? <Pause /> : <Play />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Augmenter le tempo"
        {...incrementHandlers}
      >
        <Plus />
      </Button>

      <Separator orientation="vertical" className="mx-2 h-6" />

      <span className="text-2xl font-semibold tabular-nums">
        {metronomeBpm}
      </span>

      <Separator orientation="vertical" className="mx-2 h-6" />

      <Button
        variant="ghost"
        size="icon"
        aria-label={
          displaySettings.showVisualization
            ? 'Masquer la visualisation'
            : 'Afficher la visualisation'
        }
        onClick={() =>
          setDisplaySettings((prevState) => ({
            ...prevState,
            showVisualization: !prevState.showVisualization,
          }))
        }
      >
        {displaySettings.showVisualization ? <Eye /> : <EyeOff />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={metronomeMuted ? 'Réactiver le son' : 'Couper le son'}
        onClick={() => setMetronomeMuted((prevState) => !prevState)}
      >
        {metronomeMuted ? <VolumeX /> : <Volume2 />}
      </Button>
    </Card>
  )
}
