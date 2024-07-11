import { ColorSource } from 'pixi.js'
import { GeoPolygon } from '../../util/geometry'
import { ISmoothGraphics, SmoothDraw, SmoothGraphics } from './smooth-graphics'
import {
  FunctionComponent,
  Ref,
  forwardRef,
  memo,
  useCallback,
  useMemo,
} from 'react'
import { SmoothGraphics as PixiSmoothGraphics } from '@pixi/graphics-smooth'

type _MetronomePolygonProps = {
  polygon: GeoPolygon
  color: ColorSource
  fillOpacity: number
  lineWidth: number
  lineOpacity: number
}

export type MetronomePolygonProps = Omit<ISmoothGraphics, 'ref' | 'draw'> &
  _MetronomePolygonProps

const _MetronomePolygon: FunctionComponent<MetronomePolygonProps> = forwardRef<
  PixiSmoothGraphics,
  MetronomePolygonProps
>(function __MetronomePolygon(
  { polygon, color, fillOpacity, lineWidth, lineOpacity, ...graphicsProps },
  ref
) {
  const polygonKey = useMemo(() => JSON.stringify(polygon), [polygon])

  const redraw = useCallback<SmoothDraw>(
    (g) => {
      g.clear()
      g.beginFill(color, fillOpacity)
      g.lineStyle(lineWidth, color, lineOpacity)
      g.drawPolygon([...polygon.flatMap((point) => point)])
      g.endFill()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [polygonKey, color, fillOpacity, lineWidth, lineOpacity]
  )

  return (
    <SmoothGraphics
      draw={redraw}
      ref={ref as Ref<PixiSmoothGraphics>}
      {...graphicsProps}
    />
  )
})

export const MetronomePolygon = memo(_MetronomePolygon)
