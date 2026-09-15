import { useAtomValue } from 'jotai'
import { Circle, Zap } from 'lucide-react'
import { FunctionComponent } from 'react'
import { metronomeStateAtom } from '../state/metronome'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type DebuggerProps = React.ComponentProps<typeof Card>

export const Debugger: FunctionComponent<DebuggerProps> = ({
  className,
  ...props
}) => {
  const { bpm, running } = useAtomValue(metronomeStateAtom)

  return (
    <Card
      className={cn(
        'flex-row items-center justify-center gap-4 p-3',
        className
      )}
      {...props}
    >
      <Badge variant="outline">
        <Circle
          className={cn(
            'fill-current',
            running ? 'text-green-500' : 'text-muted-foreground'
          )}
        />
        {running ? 'running' : 'stopped'}
      </Badge>

      <Badge variant="outline">
        <Zap />
        {`${bpm}`.padStart(3, '0')} bpm
      </Badge>
    </Card>
  )
}
