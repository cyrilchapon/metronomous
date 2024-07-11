import { Fragment, useCallback, useMemo } from 'react'

import { useAtomValue } from 'jotai'
import { displaySettingsAtom } from '../../state/display-settings'
import {
  metronome,
  metronomeProgressAtom,
  metronomeStateAtom,
} from '../../state/metronome'
import { emptyArray } from '../../util/array'
import {
  boundPolygon,
  getPolygonSegment,
  getPolygonSegments,
  getSquareCircle,
  pointInSegment,
} from '../../util/geometry'
import {
  MetronomeDot,
  MotionBlurredMetronomeDot,
} from '../graphics/metronome-dot'
import { MetronomePolygon } from '../graphics/metronome-polygon'
import { ShapeVisualizationType } from './shape-visualization-stage'
import { Stage } from '@pixi/react'
import {
  AnimatedMetronomeDot,
  AnimatedMetronomePolygon,
} from '../graphics/animated'
import {
  GetSpringIndex,
  getTickingCircleSpringProps,
  getTickingDotSpringProps,
  useMetronomeTickSprings,
} from '../../hooks/use-metronome-tick-springs'
import { memoize } from 'lodash-es'

const memoizedBoundPolygon = memoize(
  boundPolygon,
  (circle, sides, paddedRatio) =>
    `r${circle.radius}c${circle.center[0]}.${circle.center[1]}s${sides}x${paddedRatio}`
)

export const PolygonVisualizationCore: ShapeVisualizationType = ({
  containerSquare,
  cursorEasing,
  lineWidth,
  subdivisionDotRadius,
  divisionDotRadius,
  cursorDotRadius,
  flashSizeMultiplicator,
  divisionDotFlashRadius,
  subdivisionDotFlashRadius,
  flashShapeOpacity,
  flashShapeSubdivisionOpacity,
  flashDivisionOpacity,
  flashSubdivisionOpacity,
  mainColor,
  cursorColor,
  ...stageProps
}) => {
  const { running, signature, subdivisions } = useAtomValue(metronomeStateAtom)
  const { divisionIndex, progressInDivision } = useAtomValue(
    metronomeProgressAtom
  )
  const displaySettings = useAtomValue(displaySettingsAtom)

  const containerCircle = useMemo(
    () => getSquareCircle(containerSquare),
    [containerSquare]
  )

  const polygon = useMemo(
    () => boundPolygon(containerCircle, signature, 0.85),
    [containerCircle, signature]
  )

  const polygonSegments = useMemo(() => getPolygonSegments(polygon), [polygon])
  const subdivisionsPoints = useMemo(
    () =>
      subdivisions > 1
        ? polygonSegments.map((segment) =>
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

  const [divisionSprings] = useMetronomeTickSprings(
    metronome,
    'tick',
    useCallback<GetSpringIndex<'tick'>>((divisionIndex) => divisionIndex, []),
    signature,
    useCallback(
      () =>
        getTickingDotSpringProps({
          from: { opacity: flashDivisionOpacity, radius: divisionDotRadius },
          to: { opacity: 0, radius: divisionDotFlashRadius },
        }),
      [flashDivisionOpacity, divisionDotRadius, divisionDotFlashRadius]
    )
  )

  const [subdivisionSprings] = useMetronomeTickSprings(
    metronome,
    'subdivisionOnlyTick',
    useCallback<GetSpringIndex<'subdivisionOnlyTick'>>(
      (subdivisionIndex, divisionIndex) =>
        divisionIndex * subdivisions + subdivisionIndex,
      [subdivisions]
    ),
    subdivisions * signature,
    useCallback(
      () =>
        getTickingDotSpringProps({
          from: {
            opacity: flashSubdivisionOpacity,
            radius: subdivisionDotRadius,
          },
          to: { opacity: 0, radius: subdivisionDotFlashRadius },
        }),
      [flashSubdivisionOpacity, subdivisionDotRadius, subdivisionDotFlashRadius]
    )
  )

  const [shapeSprings] = useMetronomeTickSprings(
    metronome,
    'tick',
    useCallback<GetSpringIndex<'tick'>>((divisionIndex) => divisionIndex, []),
    signature,
    useCallback(
      () =>
        getTickingCircleSpringProps({
          from: { opacity: flashShapeOpacity, radius: containerCircle.radius },
          to: {
            opacity: 0,
            radius: containerCircle.radius * flashSizeMultiplicator,
          },
        }),
      [flashShapeOpacity, containerCircle, flashSizeMultiplicator]
    )
  )

  const [shapeSubdivisionSprings] = useMetronomeTickSprings(
    metronome,
    'subdivisionOnlyTick',
    useCallback<GetSpringIndex<'subdivisionOnlyTick'>>(
      (divisionIndex) => divisionIndex,
      []
    ),
    subdivisions * signature,
    useCallback(
      () =>
        getTickingCircleSpringProps({
          from: {
            opacity: flashShapeSubdivisionOpacity,
            radius: containerCircle.radius,
          },
          to: {
            opacity: 0,
            radius: containerCircle.radius * flashSizeMultiplicator,
          },
        }),
      [flashShapeSubdivisionOpacity, containerCircle, flashSizeMultiplicator]
    )
  )

  const shapePolygonSprings = useMemo(
    () =>
      shapeSprings.map((shapeSpring) =>
        shapeSpring.radius.to((r) =>
          memoizedBoundPolygon(
            {
              center: containerCircle.center,
              radius: r,
            },
            signature,
            0.85
          )
        )
      ),
    [shapeSprings, signature, containerCircle.center]
  )

  const shapeSubdivisionsPolygonSprings = useMemo(
    () =>
      shapeSubdivisionSprings.map((shapeSubdivisionSpring) =>
        shapeSubdivisionSpring.radius.to((r) =>
          memoizedBoundPolygon(
            {
              center: containerCircle.center,
              radius: r,
            },
            signature,
            0.85
          )
        )
      ),
    [shapeSubdivisionSprings, signature, containerCircle.center]
  )

  return (
    <Stage {...stageProps}>
      {displaySettings.flashMode === 'shape'
        ? polygon.map((point, pointIndex) => {
            const shapePolygonSpring = shapePolygonSprings[pointIndex]
            const shapeSpring = shapeSprings[pointIndex]

            return (
              <AnimatedMetronomePolygon
                key={`${point[0]}-${point[1]}`}
                polygon={shapePolygonSpring.get()}
                color={cursorColor}
                fillOpacity={shapeSpring.opacity}
                lineWidth={0}
                lineOpacity={0}
              />
            )
          })
        : null}

      {displaySettings.flashMode === 'shape' &&
      displaySettings.shapeSubdivisions === 'subdivisions'
        ? subdivisionsPoints.map((divisionPoints, _divisionIndex) =>
            divisionPoints.map((point, pointIndex) => {
              const _subdivisionIndex =
                _divisionIndex * subdivisions + pointIndex + 1

              const shapeSubdivisionPolygonSpring =
                shapeSubdivisionsPolygonSprings[_subdivisionIndex]
              const shapeSubdivisionSpring =
                shapeSubdivisionSprings[_subdivisionIndex]

              return (
                <AnimatedMetronomePolygon
                  key={`${point[0]}-${point[1]}`}
                  polygon={shapeSubdivisionPolygonSpring.get()}
                  color={cursorColor}
                  fillOpacity={0}
                  lineWidth={lineWidth}
                  lineOpacity={shapeSubdivisionSpring.opacity}
                />
              )
            })
          )
        : null}

      <MetronomePolygon
        polygon={polygon}
        color={mainColor}
        fillOpacity={0.1}
        lineWidth={lineWidth}
        lineOpacity={0.5}
      />

      {displaySettings.shapeSubdivisions !== 'off'
        ? polygon.map((point, pointIndex) => {
            const divisionSpring = divisionSprings[pointIndex]

            return (
              <Fragment key={`${point[0]}-${point[1]}`}>
                {displaySettings.flashMode === 'divisions' ? (
                  <AnimatedMetronomeDot
                    opacity={divisionSpring.opacity}
                    radius={divisionSpring.radius}
                    point={point}
                    color={cursorColor}
                  />
                ) : null}

                <MetronomeDot
                  point={point}
                  color={mainColor}
                  radius={divisionDotRadius}
                  opacity={1}
                />
              </Fragment>
            )
          })
        : null}

      {displaySettings.shapeSubdivisions === 'subdivisions' && subdivisions > 1
        ? subdivisionsPoints.map((divisionPoints, _divisionIndex) =>
            divisionPoints.map((point, pointIndex) => {
              const _subdivisionIndex =
                _divisionIndex * subdivisions + pointIndex + 1

              const subdivisionSpring = subdivisionSprings[_subdivisionIndex]

              return (
                <Fragment key={`${point[0]}-${point[1]}`}>
                  {displaySettings.flashMode === 'divisions' ? (
                    <AnimatedMetronomeDot
                      opacity={subdivisionSpring.opacity}
                      radius={subdivisionSpring.radius}
                      point={point}
                      color={cursorColor}
                    />
                  ) : null}

                  <MetronomeDot
                    point={point}
                    color={mainColor}
                    radius={subdivisionDotRadius}
                    opacity={1}
                  />
                </Fragment>
              )
            })
          )
        : null}

      {displaySettings.cursorMode !== 'off' ? (
        <MotionBlurredMetronomeDot
          point={cursorPoint}
          color={cursorColor}
          radius={cursorDotRadius}
          opacity={1}
          running={running}
          speedFactor={3}
          speedTrigger={3}
          motionBlur={{
            offset: -2,
            kernelSize: cursorDotRadius,
          }}
        />
      ) : null}
    </Stage>
  )
}
