import { ColorSource, Graphics } from 'pixi.js'
import { PixiElements } from '@pixi/react'
import { GeoPolygon } from '../../util/geometry'
import { FunctionComponent, memo, useCallback } from 'react'

export type MetronomePolygonProps = Omit<PixiElements['pixiGraphics'], 'draw'> & {
  polygon: GeoPolygon
  color: ColorSource
  fillOpacity: number
  lineWidth: number
  lineOpacity: number
}

const MetronomePolygonImpl: FunctionComponent<MetronomePolygonProps> = ({
  polygon,
  color,
  fillOpacity,
  lineWidth,
  lineOpacity,
  ...graphicsProps
}) => {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      g.poly(polygon.flatMap((point) => point))

      if (fillOpacity > 0) {
        g.fill({ color, alpha: fillOpacity })
      }
      if (lineWidth > 0 && lineOpacity > 0) {
        g.stroke({ width: lineWidth, color, alpha: lineOpacity })
      }
    },
    [polygon, color, fillOpacity, lineWidth, lineOpacity]
  )

  return <pixiGraphics draw={draw} {...graphicsProps} />
}

export const MetronomePolygon = memo(MetronomePolygonImpl)
