import { ColorSource } from 'pixi.js'
import { SmoothGraphics as _Graphics } from '@pixi/graphics-smooth'
import { GeoPoint } from '../../util/geometry'
import { PixiComponent } from '@pixi/react'
import { FunctionComponent, useMemo } from 'react'
import { useMotionSpeedPoint } from '../../hooks/use-motion-speed'
import { MotionBlurredContainer } from './motion-blurred-container'
import { MotionBlurFilter } from '@pixi/filter-motion-blur'

export type MetronomeDotProps = {
  point: GeoPoint
  color: ColorSource
  radius: number
}

export const MetronomeDot = PixiComponent<MetronomeDotProps, _Graphics>(
  'MetronomeBeatDot',
  {
    create: ({ point: [x, y], color, radius }) => {
      const g = new _Graphics()

      g.beginFill(color, 1, true)
      g.drawCircle(0, 0, radius)
      g.endFill()

      g.position.x = x
      g.position.y = y

      return g
    },
    applyProps: (
      g,
      { color: oldColor, radius: oldRadius }: MetronomeDotProps,
      { point: [x, y], color, radius }
    ) => {
      const needRedraw = color !== oldColor || radius !== oldRadius

      if (needRedraw) {
        g.clear()
        g.beginFill(color, 1, true)
        g.drawCircle(0, 0, radius)
        g.endFill()
      }

      g.position.x = x
      g.position.y = y
    },
  }
)

export type BlurredMetronomeDotProps = MetronomeDotProps & {
  running: boolean
  speedFactor: number
  speedTrigger: number
  motionBlur: Partial<
    InstanceType<typeof MotionBlurFilter> & {
      construct: ConstructorParameters<typeof MotionBlurFilter>
    }
  >
}

export const MotionBlurredMetronomeDot: FunctionComponent<
  BlurredMetronomeDotProps
> = (props) => {
  const {
    running,
    speedFactor,
    speedTrigger,
    motionBlur,
    ...metronomeDotProps
  } = props

  const { point } = metronomeDotProps

  const motionSpeedPoint = useMotionSpeedPoint(running, point, speedFactor)
  const moving = useMemo(
    () =>
      running &&
      (Math.abs(motionSpeedPoint.x) >= speedTrigger ||
        Math.abs(motionSpeedPoint.y) >= speedTrigger),
    [running, motionSpeedPoint, speedTrigger]
  )

  return (
    <>
      {moving ? (
        <MotionBlurredContainer
          motionBlur={{ velocity: motionSpeedPoint, ...motionBlur }}
        >
          <MetronomeDot {...metronomeDotProps} />
        </MotionBlurredContainer>
      ) : null}

      <MetronomeDot {...metronomeDotProps} />
    </>
  )
}
