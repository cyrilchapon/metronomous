import { ColorSource, Graphics as PixiGraphics } from 'pixi.js'
import { GeoPoint } from '../../util/geometry'
import { Graphics } from '@pixi/react'
import {
  FunctionComponent,
  Ref,
  forwardRef,
  memo,
  useCallback,
  useMemo,
} from 'react'
import { useMotionSpeedPoint } from '../../hooks/use-motion-speed'
import { MotionBlurredContainer } from './motion-blurred-container'
import { MotionBlurFilter } from '@pixi/filter-motion-blur'
import {
  Draw,
  IGraphics,
  ISmoothGraphics,
  SmoothDraw,
  SmoothGraphics,
} from './smooth-graphics'
import { SmoothGraphics as PixiSmoothGraphics } from '@pixi/graphics-smooth'

type _MetronomeDotProps = {
  point: GeoPoint
  color: ColorSource
  radius: number
  opacity: number
}

export type NativeMetronomeDotProps = Omit<
  IGraphics,
  'ref' | 'position' | 'draw'
> &
  _MetronomeDotProps

const _NativeMetronomeDot: FunctionComponent<NativeMetronomeDotProps> =
  forwardRef<typeof PixiGraphics, NativeMetronomeDotProps>(
    function __NativeMetronomeDot(
      { point: [x, y], color, radius, opacity, ...graphicsProps },
      ref
    ) {
      const redraw = useCallback<Draw>(
        (g) => {
          g.clear()
          g.beginFill(color, opacity)
          g.drawCircle(0, 0, radius)
          g.endFill()
        },
        [color, opacity, radius]
      )

      return (
        <Graphics
          position={[x, y]}
          draw={redraw}
          ref={ref as Ref<PixiGraphics>}
          {...graphicsProps}
        />
      )
    }
  )

export const NativeMetronomeDot = memo(_NativeMetronomeDot)

export type MetronomeDotProps = Omit<
  ISmoothGraphics,
  'ref' | 'position' | 'draw'
> &
  _MetronomeDotProps

const _MetronomeDot: FunctionComponent<MetronomeDotProps> = forwardRef<
  PixiSmoothGraphics,
  MetronomeDotProps
>(function __MetronomeDot(
  { point: [x, y], color, radius, opacity, ...graphicsProps },
  ref
) {
  const redraw = useCallback<SmoothDraw>(
    (g) => {
      g.clear()
      g.beginFill(color, opacity, true)
      g.drawCircle(0, 0, radius)
      g.endFill()
    },
    [color, opacity, radius]
  )

  return (
    <SmoothGraphics
      position={[x, y]}
      draw={redraw}
      ref={ref as Ref<PixiSmoothGraphics>}
      {...graphicsProps}
    />
  )
})

export const MetronomeDot = memo(_MetronomeDot)

export type BlurredMetronomeDotProps = MetronomeDotProps &
  NativeMetronomeDotProps & {
    running: boolean
    speedFactor: number
    speedTrigger: number
    motionBlur: Partial<
      InstanceType<typeof MotionBlurFilter> & {
        construct: ConstructorParameters<typeof MotionBlurFilter>
      }
    >
  }

const _MotionBlurredMetronomeDot: FunctionComponent<
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
      ) : (
        <NativeMetronomeDot {...metronomeDotProps} />
      )}

      {/* <MetronomeDot {...metronomeDotProps} /> */}
    </>
  )
}

export const MotionBlurredMetronomeDot = memo(_MotionBlurredMetronomeDot)
