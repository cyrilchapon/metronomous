import { ColorSource, Graphics as PixiGraphics } from 'pixi.js'
import { GeoPoint } from '../../util/geometry'
import { Graphics } from '@pixi/react'
import { FunctionComponent, Ref, forwardRef, memo, useCallback } from 'react'
import {
  Draw,
  IGraphics,
  ISmoothGraphics,
  SmoothDraw,
  SmoothGraphics,
} from './smooth-graphics'
import { SmoothGraphics as PixiSmoothGraphics } from '@pixi/graphics-smooth'

type _MetronomeLineProps = {
  pointA: GeoPoint
  pointB: GeoPoint
  color: ColorSource
  lineWidth: number
  lineOpacity: number
}
export type NativeMetronomeLineProps = Omit<IGraphics, 'ref' | 'draw'> &
  _MetronomeLineProps

const _NativeMetronomeLine: FunctionComponent<NativeMetronomeLineProps> =
  forwardRef<PixiGraphics, NativeMetronomeLineProps>(
    function _NativeMetronomeLine(
      {
        pointA: [xA, yA],
        pointB: [xB, yB],
        color,
        lineWidth,
        lineOpacity,
        ...graphicsProps
      },
      ref
    ) {
      const redraw = useCallback<Draw>(
        (g) => {
          g.clear()
          g.lineStyle(lineWidth, color, lineOpacity)
          g.drawPolygon([xA, yA, xB, yB])
        },
        [xA, yA, xB, yB, color, lineWidth, lineOpacity]
      )

      return (
        <Graphics
          draw={redraw}
          ref={ref as Ref<PixiGraphics>}
          {...graphicsProps}
        />
      )
    }
  )

export const NativeMetronomeLine = memo(_NativeMetronomeLine)

export type MetronomeLineProps = Omit<ISmoothGraphics, 'ref' | 'draw'> &
  _MetronomeLineProps

const _MetronomeLine: FunctionComponent<MetronomeLineProps> = forwardRef<
  PixiSmoothGraphics,
  MetronomeLineProps
>(function __MetronomeLine(
  {
    pointA: [xA, yA],
    pointB: [xB, yB],
    color,
    lineWidth,
    lineOpacity,
    ...graphicsProps
  },
  ref
) {
  const redraw = useCallback<SmoothDraw>(
    (g) => {
      g.clear()
      g.lineStyle(lineWidth, color, lineOpacity)
      g.drawPolygon([xA, yA, xB, yB])
    },
    [xA, yA, xB, yB, color, lineWidth, lineOpacity]
  )

  return (
    <SmoothGraphics
      draw={redraw}
      ref={ref as Ref<PixiSmoothGraphics>}
      {...graphicsProps}
    />
  )
})

export const MetronomeLine = memo(_MetronomeLine)
