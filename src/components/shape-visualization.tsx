import { Box, BoxProps, useTheme } from '@mui/material'
import { FunctionComponent, useMemo, useRef, useState } from 'react'
import { useThrottledCallback } from 'use-debounce'
import useResizeObserver from 'use-resize-observer'

import { Easings } from '@juliendargelos/easings'
import { Stage } from '@pixi/react'
import { useAtomValue } from 'jotai'
import { displaySettingsAtom } from '../state/display-settings'
import { metronomeProgressAtom, metronomeStateAtom } from '../state/metronome'
import { emptyArray } from '../util/array'
import {
  boundShape,
  getLargestPossibleSquare,
  getPolygonSegment,
  getPolygonSegments,
  pointInSegment,
} from '../util/geometry'
import { massEasingIn } from '../util/mass-easing'
import { MetronomeDot } from './graphics/metronome-dot'
import { MetronomePolygon } from './graphics/metronome-shape'

export type ShapeVisualizationProps = BoxProps<'div'>

export const ShapeVisualization: FunctionComponent<ShapeVisualizationProps> = (
  props
) => {
  const boxRef = useRef<HTMLDivElement>(null)
  const [{ width, height }, setBoxSize] = useState<{
    width?: number
    height?: number
  }>({
    width: undefined,
    height: undefined,
  })

  const onBoxResize = useThrottledCallback(setBoxSize, 50, {
    leading: true,
    trailing: true,
  })

  useResizeObserver({
    ref: boxRef,
    onResize: onBoxResize,
    box: 'content-box',
  })

  return (
    <Box ref={boxRef} display="flex" {...props}>
      {width != null && height != null ? (
        <ShapeVisualizationCanvas
          width={width}
          height={height - 10}
          padding={100}
        />
      ) : null}
    </Box>
  )
}

type ShapeVisualizationCanvasProps = {
  width: number
  height: number
  padding: number
}
const ShapeVisualizationCanvas: FunctionComponent<
  ShapeVisualizationCanvasProps
> = ({ width, height, padding }) => {
  const { signature, subdivisions } = useAtomValue(metronomeStateAtom)
  const { divisionIndex, progressInDivision } = useAtomValue(metronomeProgressAtom)
  const { cursorMode, cursorMass } = useAtomValue(displaySettingsAtom)
  const theme = useTheme()

  const mainColor = theme.drawPalette.main
  const cursorColor = theme.drawPalette.cursor

  const largestPossibleSquare = useMemo(
    () => getLargestPossibleSquare(width - 2, height - 2, padding),
    [width, height, padding]
  )

  const polygon = useMemo(
    () => boundShape(largestPossibleSquare, signature),
    [largestPossibleSquare, signature]
  )

  const polygonSegments = useMemo(() => getPolygonSegments(polygon), [polygon])
  const subdivisionsPoints = useMemo(
    () =>
      subdivisions > 1
        ? polygonSegments.flatMap((segment) =>
            emptyArray(subdivisions - 1).map((_v, i) => {
              const pointRatioInSegment = (1 / subdivisions) * (i + 1)
              return pointInSegment(segment, pointRatioInSegment)
            })
          )
        : [],
    [polygonSegments, subdivisions]
  )

  const currentSegment = useMemo(
    () => getPolygonSegment(polygon, divisionIndex),
    [polygon, divisionIndex]
  )

  const progressInDivisionEasing = useMemo(
    () => (cursorMode === 'mass' ? massEasingIn(cursorMass) : Easings.linear),
    [cursorMode, cursorMass]
  )
  const easedProgressInDivision = useMemo(
    () => progressInDivisionEasing(progressInDivision),
    [progressInDivisionEasing, progressInDivision]
  )
  const cursorPoint = useMemo(
    () => pointInSegment(currentSegment, easedProgressInDivision),
    [currentSegment, easedProgressInDivision]
  )

  return (
    <Stage
      width={width}
      height={height}
      options={{ backgroundAlpha: 0, antialias: true }}
    >
      <MetronomePolygon polygon={polygon} color={mainColor} />

      {polygon.map((point) => (
        <MetronomeDot
          key={`${point[0]}-${point[1]}`}
          point={point}
          color={mainColor}
          radius={10}
        />
      ))}

      {cursorMode === 'subdivisions' && subdivisions > 1
        ? subdivisionsPoints.map((point) => (
            <MetronomeDot
              key={`${point[0]}-${point[1]}`}
              point={point}
              color={mainColor}
              radius={5}
            />
          ))
        : null}

      <MetronomeDot point={cursorPoint} color={cursorColor} radius={15} />
    </Stage>
  )
}
