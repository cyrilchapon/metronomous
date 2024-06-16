import { ColorSource, Graphics as _Graphics } from 'pixi.js'
import { GeoCircle } from '../../util/geometry'
import { PixiComponent } from '@pixi/react'

export type MetronomeCircleProps = {
  circle: GeoCircle
  color: ColorSource
}
export const MetronomeCircle = PixiComponent<MetronomeCircleProps, _Graphics>(
  'MetronomeCircle',
  {
    create: () => new _Graphics(),
    applyProps: (g, _, { circle, color }) => {
      g.clear()
      g.beginFill(color, 0.1)
      g.lineStyle(4, color, 0.5)
      g.drawCircle(circle.center[0], circle.center[1], circle.radius)
      g.endFill()
    },
  }
)
