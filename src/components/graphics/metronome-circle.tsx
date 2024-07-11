import { ColorSource, Graphics as _Graphics } from 'pixi.js'
import { GeoPoint } from '../../util/geometry'
import { PixiComponent } from '@pixi/react'

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
    applyProps: (
      g,
      _,
      { center, radius, color, fillOpacity, lineWidth, lineOpacity }
    ) => {
      g.clear()
      g.beginFill(color, fillOpacity)
      g.lineStyle(lineWidth, color, lineOpacity)
      g.drawCircle(center[0], center[1], radius)
      g.endFill()
    },
  }
)
