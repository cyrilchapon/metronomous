import { ColorSource, Graphics } from 'pixi.js'
import { PixiElements } from '@pixi/react'
import { GeoPoint } from '../../util/geometry'
import { FunctionComponent, memo, useCallback } from 'react'

export type MetronomeCircleProps = Omit<
  PixiElements['pixiGraphics'],
  'draw'
> & {
  center: GeoPoint
  radius: number
  color: ColorSource
  fillOpacity: number
  lineWidth: number
  lineOpacity: number
}

const MetronomeCircleImpl: FunctionComponent<MetronomeCircleProps> = ({
  center: [centerX, centerY],
  radius,
  color,
  fillOpacity,
  lineWidth,
  lineOpacity,
  ...graphicsProps
}) => {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      g.circle(centerX, centerY, radius)

      if (fillOpacity > 0) {
        g.fill({ color, alpha: fillOpacity })
      }
      if (lineWidth > 0 && lineOpacity > 0) {
        g.stroke({ width: lineWidth, color, alpha: lineOpacity })
      }
    },
    [centerX, centerY, radius, color, fillOpacity, lineWidth, lineOpacity]
  )

  return <pixiGraphics draw={draw} {...graphicsProps} />
}

export const MetronomeCircle = memo(MetronomeCircleImpl)
