import { useMemo } from 'react'

import { useAtomValue } from 'jotai'
import { displaySettingsAtom } from '../../state/display-settings'
import {
  metronomeProgressAtom,
  metronomeStateAtom,
} from '../../state/metronome'
import { emptyArray } from '../../util/array'
import {
  boundShape,
  getPolygonSegment,
  getPolygonSegments,
  pointInSegment,
} from '../../util/geometry'
import {
  MetronomeDot,
  MotionBlurredMetronomeDot,
} from '../graphics/metronome-dot'
import { MetronomePolygon } from '../graphics/metronome-shape'
import { ShapeVisualizationType } from './shape-visualization-stage'
import { Stage } from '@pixi/react'

export const PolygonVisualizationCore: ShapeVisualizationType = ({
  containerSquare,
  width,
  height,
  cursorEasing,
  lineWidth,
  subdivisionDotRadius,
  divisionDotRadius,
  cursorDotRadius,
  mainColor,
  cursorColor,
}) => {
  const { running, signature, subdivisions } = useAtomValue(metronomeStateAtom)
  const { divisionIndex, progressInDivision } = useAtomValue(
    metronomeProgressAtom
  )
  const { cursorMode } = useAtomValue(displaySettingsAtom)

  const polygon = useMemo(
    () => boundShape(containerSquare, signature),
    [containerSquare, signature]
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

  const easedProgressInDivision = useMemo(
    () => cursorEasing(progressInDivision),
    [cursorEasing, progressInDivision]
  )

  const cursorPoint = useMemo(
    () => pointInSegment(currentSegment, easedProgressInDivision),
    [currentSegment, easedProgressInDivision]
  )

  return (
    <Stage
      width={width}
      height={height}
      options={{
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio,
      }}
    >
      <MetronomePolygon
        polygon={polygon}
        color={mainColor}
        lineWidth={lineWidth}
      />

      {polygon.map((point) => (
        <MetronomeDot
          key={`${point[0]}-${point[1]}`}
          point={point}
          color={mainColor}
          radius={divisionDotRadius}
        />
      ))}

      {cursorMode === 'subdivisions' && subdivisions > 1
        ? subdivisionsPoints.map((point) => (
            <MetronomeDot
              key={`${point[0]}-${point[1]}`}
              point={point}
              color={mainColor}
              radius={subdivisionDotRadius}
            />
          ))
        : null}

      <MotionBlurredMetronomeDot
        point={cursorPoint}
        color={cursorColor}
        radius={cursorDotRadius}
        running={running}
        speedFactor={3}
        speedTrigger={3}
        motionBlur={{
          offset: -5,
          kernelSize: cursorDotRadius,
        }}
      />
    </Stage>
  )
}
