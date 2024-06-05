import { Box, BoxProps } from '@mui/material'
import {
  FunctionComponent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import useResizeObserver from 'use-resize-observer'
import { useThrottledCallback } from 'use-debounce'

import { Graphics as _Graphics } from 'pixi.js'
import { Stage, Graphics } from '@pixi/react'
import {
  largestPossibleSquare as _largestPossibleSquare,
  boundShape,
  getPolygonSegment,
  pointInSegment,
} from '../util/geometry'
import { useAtomValue } from 'jotai'
import { metronomeSignatureAtom, metronomeTempoAtom } from '../state/metronome'
import { displaySettingsAtom } from '../state/display-settings'
import { massEasingIn } from '../util/mass-easing'
import { Easings } from '@juliendargelos/easings'

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
        <ShapeVisualizationInternal
          width={width}
          height={height - 10}
          padding={100}
        />
      ) : null}
    </Box>
  )
}

type ShapeVisualizationInternalProps = {
  width: number
  height: number
  padding: number
}
const ShapeVisualizationInternal: FunctionComponent<
  ShapeVisualizationInternalProps
> = ({ width, height, padding }) => {
  const signature = useAtomValue(metronomeSignatureAtom)
  const { divisionIndex, progressInDivision } = useAtomValue(metronomeTempoAtom)

  const largestPossibleSquare = useMemo(
    () => _largestPossibleSquare(width - 2, height - 2, padding),
    [width, height, padding]
  )

  const polygon = useMemo(
    () => boundShape(largestPossibleSquare, signature),
    [largestPossibleSquare, signature]
  )

  const drawShape = useCallback(
    (g: _Graphics) => {
      g.clear()
      g.beginFill(0xff3300, 0.1)
      g.lineStyle(4, 0xff3300, 0.5)
      g.drawPolygon([...polygon.flatMap((a) => a)])
      g.endFill()
    },
    [polygon]
  )

  const drawDivisions = useCallback(
    (g: _Graphics) => {
      g.clear()
      g.beginFill(0xff3300, 1)
      polygon.forEach(([x, y]) => {
        g.drawCircle(x, y, 10)
      })
      g.endFill()
    },
    [polygon]
  )

  const drawCursor = useCallback((g: _Graphics) => {
    g.clear()
    g.beginFill(0xffffff, 1)
    g.drawCircle(0, 0, 15)
    g.endFill()
  }, [])

  const currentSegment = useMemo(
    () => getPolygonSegment(polygon, divisionIndex),
    [polygon, divisionIndex]
  )

  const { cursorMode, cursorMass } = useAtomValue(displaySettingsAtom)
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
      <Graphics draw={drawShape} />
      <Graphics draw={drawDivisions} />
      <Graphics x={cursorPoint[0]} y={cursorPoint[1]} draw={drawCursor} />
    </Stage>
  )
}
