import { Easings } from '@juliendargelos/easings'
import { Box, BoxProps, useTheme } from '@mui/material'
import { useAtomValue } from 'jotai'
import { FunctionComponent, useMemo, useRef, useState } from 'react'
import { useThrottledCallback } from 'use-debounce'
import useResizeObserver from 'use-resize-observer'
import { displaySettingsAtom } from '../state/display-settings'
import { getLargestPossibleSquare } from '../util/geometry'
import { massEasingIn } from '../util/mass-easing'
import { CircleVisualizationCore } from './shape-visualization-stage/circle-visualization-stage'
import { PolygonVisualizationCore } from './shape-visualization-stage/polygon-visualization-stage'
import { ShapeVisualizationType } from './shape-visualization-stage/shape-visualization-stage'

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
        <_ShapeVisualization width={width} height={height - 10} padding={100} />
      ) : null}
    </Box>
  )
}

type _ShapeVisualizationProps = {
  width: number
  height: number
  padding: number
}

const _ShapeVisualization: FunctionComponent<_ShapeVisualizationProps> = ({
  width,
  height,
  padding,
}) => {
  const { shapeMode } = useAtomValue(displaySettingsAtom)

  const { cursorMoveMode, cursorMass } = useAtomValue(displaySettingsAtom)
  const theme = useTheme()

  const backColor = theme.drawPalette.back
  const mainColor = theme.drawPalette.main
  const cursorColor = theme.drawPalette.cursor

  const largestPossibleSquare = useMemo(
    () => getLargestPossibleSquare(width - 2, height - 2, padding),
    [width, height, padding]
  )

  const cursorEasing = useMemo(
    () => (cursorMoveMode === 'eased' ? massEasingIn(cursorMass) : Easings.linear),
    [cursorMoveMode, cursorMass]
  )

  const baseSquareSide = useMemo(
    () => largestPossibleSquare[1][0] - largestPossibleSquare[0][0],
    [largestPossibleSquare]
  )
  const lineWidth = useMemo(() => baseSquareSide / 100, [baseSquareSide])
  const subdivisionDotRadius = useMemo(
    () => baseSquareSide / 80,
    [baseSquareSide]
  )
  const divisionDotRadius = useMemo(() => baseSquareSide / 50, [baseSquareSide])
  const cursorDotRadius = useMemo(() => baseSquareSide / 50, [baseSquareSide])
  const centerDotRadius = useMemo(() => baseSquareSide / 80, [baseSquareSide])
  const flashDivisionRadiusMultiplicator = useMemo(() => baseSquareSide / 5, [baseSquareSide])
  const flashSubdivisionRadiusMultiplicator = useMemo(() => baseSquareSide / 10, [baseSquareSide])
  const flashSizeMultiplicator = useMemo(() => 1.8, [])

  const VisualizationCoreComponent = useMemo<ShapeVisualizationType>(
    () =>
      shapeMode === 'polygon'
        ? PolygonVisualizationCore
        : CircleVisualizationCore,
    [shapeMode]
  )

  return (
    <VisualizationCoreComponent
      containerSquare={largestPossibleSquare}
      cursorEasing={cursorEasing}
      cursorDotRadius={cursorDotRadius}
      centerDotRadius={centerDotRadius}
      divisionDotRadius={divisionDotRadius}
      subdivisionDotRadius={subdivisionDotRadius}
      flashSizeMultiplicator={flashSizeMultiplicator}
      divisionDotFlashRadius={flashDivisionRadiusMultiplicator}
      subdivisionDotFlashRadius={flashSubdivisionRadiusMultiplicator}
      flashShapeOpacity={0.9}
      flashShapeSubdivisionOpacity={0.2}
      flashDivisionOpacity={0.9}
      flashSubdivisionOpacity={0.5}
      lineWidth={lineWidth}
      mainColor={mainColor}
      cursorColor={cursorColor}
      // Native Stage props
      width={width}
      height={height}
      options={{
        backgroundColor: backColor,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio,
      }}
      raf={false}
    />
  )
}
