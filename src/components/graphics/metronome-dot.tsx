import { ColorSource } from 'pixi.js'
import { SmoothGraphics as PixiSmoothGraphics } from '@pixi/graphics-smooth'
import { GeoPoint } from '../../util/geometry'
import { PixiComponent, applyDefaultProps, Graphics } from '@pixi/react'
import { ComponentProps, FunctionComponent, useCallback, useMemo } from 'react'
import { useMotionSpeedPoint } from '../../hooks/use-motion-speed'
import { MotionBlurredContainer } from './motion-blurred-container'
import { MotionBlurFilter } from '@pixi/filter-motion-blur'

type GraphicsProps = ComponentProps<typeof Graphics>
type Draw = NonNullable<GraphicsProps['draw']>

type _MetronomeDotProps = {
  point: GeoPoint
  color: ColorSource
  radius: number
  opacity: number
}

export type MetronomeDotProps = Omit<GraphicsProps, 'position' | 'draw'> & _MetronomeDotProps

export const MetronomeDot: FunctionComponent<MetronomeDotProps> = ({
  point: [x, y],
  color,
  radius,
  opacity,
  ...graphicsProps
}) => {
  const redraw = useCallback<Draw>((g) => {
    g.clear()
    g.beginFill(color, opacity)
    g.drawCircle(0, 0, radius)
    g.endFill()
  }, [color, opacity, radius])

  return (
    <Graphics position={[x, y]} draw={redraw} {...graphicsProps} />
  )
}

export const SmoothMetronomeDot = PixiComponent<
  MetronomeDotProps,
  PixiSmoothGraphics
>('SmoothMetronomeDot', {
  create: ({ point: [x, y], color, radius, opacity }) => {
    const g = new PixiSmoothGraphics()

    g.beginFill(color, opacity, true)
    g.drawCircle(0, 0, radius)
    g.endFill()

    g.position.x = x
    g.position.y = y

    return g
  },
  applyProps: (g, oldProps: MetronomeDotProps, newProps) => {
    const {
      color: oldColor,
      radius: oldRadius,
      opacity: oldOpacity,
      ...oldRestProps
    } = oldProps

    const {
      point: [x, y],
      color,
      radius,
      opacity,
      ...newRestProps
    } = newProps

    applyDefaultProps(g, oldRestProps, newRestProps)

    const needRedraw =
      color !== oldColor || radius !== oldRadius || opacity !== oldOpacity

    if (needRedraw) {
      g.clear()
      g.beginFill(color, opacity, true)
      g.drawCircle(0, 0, radius)
      g.endFill()
    }

    g.position.x = x
    g.position.y = y
  },
})

export type BlurredMetronomeDotProps = Omit<MetronomeDotProps, 'ref'> & {
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

      <SmoothMetronomeDot {...metronomeDotProps} />
    </>
  )
}
