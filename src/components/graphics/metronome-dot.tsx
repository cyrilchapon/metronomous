import { ColorSource } from 'pixi.js'
import { SmoothGraphics as _Graphics } from '@pixi/graphics-smooth'
import { GeoPoint } from '../../util/geometry'
import { PixiComponent } from '@pixi/react'
import { FunctionComponent, useMemo } from 'react'
import { useMotionSpeedPoint } from '../../hooks/use-motion-speed'
import { MotionBlurredContainer } from './motion-blurred-container'
import { MotionBlurFilter } from '@pixi/filter-motion-blur'
import { EasingFunction } from '@juliendargelos/easings'

export type MetronomeDotProps = {
  point: GeoPoint
  color: ColorSource
  radius: number
  opacity: number
}

export const MetronomeDot = PixiComponent<MetronomeDotProps, _Graphics>(
  'MetronomeDot',
  {
    create: ({ point: [x, y], color, radius, opacity }) => {
      const g = new _Graphics()

      g.beginFill(color, opacity, true)
      g.drawCircle(0, 0, radius)
      g.endFill()

      g.position.x = x
      g.position.y = y

      return g
    },
    applyProps: (
      g,
      {
        color: oldColor,
        radius: oldRadius,
        opacity: oldOpacity,
      }: MetronomeDotProps,
      { point: [x, y], color, radius, opacity }
    ) => {
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
  }
)

export type MetronomePulsatingDotProps = {
  point: GeoPoint
  color: ColorSource
  minRadius: number
  maxRadius: number
  radiusEasing: EasingFunction
  minOpacity: number
  maxOpacity: number
  opacityEasing: EasingFunction
  progress: number
  active: boolean
}

export const MetronomePulsatingDot = PixiComponent<
  MetronomePulsatingDotProps,
  _Graphics
>('MetronomePulsatingDot', {
  create: ({
    point: [x, y],
    color,
    minRadius,
    maxRadius,
    radiusEasing,
    minOpacity,
    maxOpacity,
    opacityEasing,
    progress,
    active,
  }) => {
    const g = new _Graphics()

    if (active) {
      const radius = minRadius + radiusEasing(progress) * (maxRadius - minRadius)
      const opacity = (minOpacity + opacityEasing(1 - progress) * (maxOpacity - minOpacity))

      g.beginFill(color, opacity, true)
      g.drawCircle(0, 0, radius)
      g.endFill()
    }

    g.position.x = x
    g.position.y = y

    return g
  },
  applyProps: (
    g,
    {
      color: oldColor,
      minRadius: oldMinRadius,
      maxRadius: oldMaxRadius,
      minOpacity: oldMinOpacity,
      maxOpacity: oldMaxOpacity,
      progress: oldProgress,
      active: oldActive,
      radiusEasing: oldRadiusEasing,
      opacityEasing: oldOpacityEasing,
    }: MetronomePulsatingDotProps,
    {
      point: [x, y],
      color,
      minRadius,
      maxRadius,
      minOpacity,
      maxOpacity,
      progress,
      active,
      radiusEasing,
      opacityEasing,
    }
  ) => {
    const needRedraw =
      color !== oldColor ||
      minRadius !== oldMinRadius ||
      maxRadius !== oldMaxRadius ||
      minOpacity !== oldMinOpacity ||
      maxOpacity !== oldMaxOpacity ||
      progress !== oldProgress ||
      active !== oldActive ||
      radiusEasing !== oldRadiusEasing ||
      opacityEasing !== oldOpacityEasing

    if (needRedraw) {
      g.clear()

      if (active) {
        const radius = minRadius + radiusEasing(progress) * (maxRadius - minRadius)
        const opacity = (minOpacity + opacityEasing(1 - progress) * (maxOpacity - minOpacity))
  
        g.beginFill(color, opacity, true)
        g.drawCircle(0, 0, radius)
        g.endFill()
      }
    }

    g.position.x = x
    g.position.y = y
  },
})

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
