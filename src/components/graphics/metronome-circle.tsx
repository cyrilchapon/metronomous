import { ColorSource, Graphics as _Graphics } from 'pixi.js'
import { GeoPoint } from '../../util/geometry'
import { PixiComponent, applyDefaultProps } from '@pixi/react'

export type MetronomeCircleProps = {
  center: GeoPoint
  radius: number
  color: ColorSource
  fillOpacity: number
  lineWidth: number
  lineOpacity: number
}
export const MetronomeCircle = PixiComponent<MetronomeCircleProps, _Graphics>(
  'MetronomeCircle',
  {
    create: () => new _Graphics(),
    applyProps: (g, oldProps: MetronomeCircleProps, newProps) => {
      const {
        center: oldCenter,
        radius: oldRadius,
        color: oldColor,
        fillOpacity: oldFillOpacity,
        lineWidth: oldLineWidth,
        lineOpacity: oldLineOpacity,
        ...oldRestProps
      } = oldProps

      const {
        center,
        radius,
        color,
        fillOpacity,
        lineWidth,
        lineOpacity,
        ...newRestProps
      } = newProps

      applyDefaultProps(g, oldRestProps, newRestProps)

      const needRedraw =
        color !== oldColor ||
        oldFillOpacity !== oldFillOpacity ||
        oldLineWidth !== lineWidth ||
        oldLineOpacity !== lineOpacity ||
        oldCenter !== center ||
        oldRadius !== radius

      if (needRedraw) {
        g.clear()
        g.beginFill(color, fillOpacity)
        g.lineStyle(lineWidth, color, lineOpacity)
        g.drawCircle(center[0], center[1], radius)
        g.endFill()
      }
    },
  }
)
