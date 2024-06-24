import { ColorSource, Graphics as _Graphics } from 'pixi.js'
import { GeoPolygon } from '../../util/geometry'
import { PixiComponent } from '@pixi/react'

export type MetronomePolygonProps = {
  polygon: GeoPolygon
  color: ColorSource
  lineWidth: number
}
export const MetronomePolygon = PixiComponent<MetronomePolygonProps, _Graphics>(
  'MetronomeShape',
  {
    create: () => new _Graphics(),
    applyProps: (g, _, { polygon, color, lineWidth }) => {
      g.clear()
      g.beginFill(color, 0.1)
      g.lineStyle(lineWidth, color, 0.5)
      g.drawPolygon([...polygon.flatMap((point) => point)])
      g.endFill()
    },
  }
)
