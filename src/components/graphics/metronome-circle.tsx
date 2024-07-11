import { ColorSource } from 'pixi.js'
import { ISmoothGraphics, SmoothDraw, SmoothGraphics } from './smooth-graphics'
import { FunctionComponent, Ref, forwardRef, memo, useCallback } from 'react'
import { GeoPoint } from '../../util/geometry'
import { SmoothGraphics as PixiSmoothGraphics } from '@pixi/graphics-smooth'

export type _MetronomeCircleProps = {
  center: GeoPoint
  radius: number
  color: ColorSource
  fillOpacity: number
  lineWidth: number
  lineOpacity: number
}

export type MetronomeCircleProps = Omit<ISmoothGraphics, 'ref' | 'draw'> &
  _MetronomeCircleProps

const _MetronomeCircle: FunctionComponent<MetronomeCircleProps> = forwardRef<
  PixiSmoothGraphics,
  MetronomeCircleProps
>(function __MetronomeCircle(
  {
    center: [centerX, centerY],
    radius,
    color,
    fillOpacity,
    lineWidth,
    lineOpacity,
    ...graphicsProps
  },
  ref
) {
  const redraw = useCallback<SmoothDraw>(
    (g) => {
      g.clear()
      g.beginFill(color, fillOpacity)
      g.lineStyle(lineWidth, color, lineOpacity)
      g.drawCircle(centerX, centerY, radius)
      g.endFill()
    },
    [centerX, centerY, radius, color, fillOpacity, lineWidth, lineOpacity]
  )

  return (
    <SmoothGraphics
      draw={redraw}
      ref={ref as Ref<PixiSmoothGraphics>}
      {...graphicsProps}
    />
  )
})

export const MetronomeCircle = memo(_MetronomeCircle)
