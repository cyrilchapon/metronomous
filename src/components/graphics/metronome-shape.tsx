import { ColorSource, Graphics as _Graphics } from 'pixi.js'
import { GeoPolygon } from '../../util/geometry'
import { PixiComponent, applyDefaultProps } from '@pixi/react'
import { isEqual as deepEquals } from 'lodash-es'

export type MetronomePolygonProps = {
  polygon: GeoPolygon
  color: ColorSource
  fillOpacity: number
  lineWidth: number
  lineOpacity: number
}
export const MetronomePolygon = PixiComponent<MetronomePolygonProps, _Graphics>(
  'MetronomePolygon',
  {
    create: () => new _Graphics(),
    applyProps: (g, oldProps: MetronomePolygonProps, newProps) => {
      const {
        polygon: oldPolygon,
        color: oldColor,
        fillOpacity: oldFillOpacity,
        lineWidth: oldLineWidth,
        lineOpacity: oldLineOpacity,
        ...oldRestProps
      } = oldProps

      const {
        polygon,
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
        (oldPolygon !== polygon && !deepEquals(oldPolygon, polygon))

      if (needRedraw) {
        g.clear()
        g.beginFill(color, fillOpacity)
        g.lineStyle(lineWidth, color, lineOpacity)
        g.drawPolygon([...polygon.flatMap((point) => point)])
        g.endFill()
      }
    },
  }
)
