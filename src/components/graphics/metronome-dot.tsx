import { ColorSource, Graphics as _Graphics } from 'pixi.js'
import { GeoPoint } from '../../util/geometry'
import { PixiComponent } from '@pixi/react'

export type MetronomeDotProps = {
  point: GeoPoint
  color: ColorSource
  radius: number
}

export const MetronomeDot = PixiComponent<MetronomeDotProps, _Graphics>(
  'MetronomeBeatDot',
  {
    create: ({ point: [x, y], color, radius }) => {
      const g = new _Graphics()

      g.beginFill(color, 1)
      g.drawCircle(0, 0, radius)
      g.endFill()

      g.position.x = x
      g.position.y = y

      return g
    },
    applyProps: (
      g,
      { color: oldColor, radius: oldRadius }: MetronomeDotProps,
      { point: [x, y], color, radius }
    ) => {
      const needRedraw = color !== oldColor || radius !== oldRadius

      if (needRedraw) {
        g.clear()
        g.beginFill(color, 1)
        g.drawCircle(0, 0, radius)
        g.endFill()
      }

      g.position.x = x
      g.position.y = y
    },
  }
)
