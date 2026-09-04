import { ColorSource, Graphics } from 'pixi.js'
import { PixiElements } from '@pixi/react'
import { GeoPoint } from '../../util/geometry'
import { FunctionComponent, memo, useCallback } from 'react'

export type MetronomeDotProps = Omit<
  PixiElements['pixiGraphics'],
  'draw' | 'x' | 'y'
> & {
  point: GeoPoint
  color: ColorSource
  radius: number
  opacity: number
}

const MetronomeDotImpl: FunctionComponent<MetronomeDotProps> = ({
  point: [x, y],
  color,
  radius,
  opacity,
  ...graphicsProps
}) => {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear()
      g.circle(0, 0, radius)
      g.fill({ color, alpha: opacity })
    },
    [color, opacity, radius]
  )

  return <pixiGraphics x={x} y={y} draw={draw} {...graphicsProps} />
}

export const MetronomeDot = memo(MetronomeDotImpl)
