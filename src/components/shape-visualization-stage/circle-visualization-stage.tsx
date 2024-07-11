import { Fragment, useCallback, useMemo } from 'react'

import { Stage } from '@pixi/react'
import { useAtomValue } from 'jotai'
import { displaySettingsAtom } from '../../state/display-settings'
import {
  metronome,
  metronomeProgressAtom,
  metronomeStateAtom,
} from '../../state/metronome'
import { emptyArray } from '../../util/array'
import {
  GeoLine,
  boundCircle,
  getSquareCircle,
  pointInCircleDivision,
  pointsInCircle,
} from '../../util/geometry'
import { MetronomeCircle } from '../graphics/metronome-circle'
import {
  MetronomeDot,
  MotionBlurredMetronomeDot,
} from '../graphics/metronome-dot'
import { ShapeVisualizationType } from './shape-visualization-stage'
import {
  AnimatedMetronomeCircle,
  AnimatedMetronomeDot,
} from '../graphics/animated'
import {
  GetSpringIndex,
  getTickingCircleSpringProps,
  getTickingDotSpringProps,
  useMetronomeTickSprings,
} from '../../hooks/use-metronome-tick-springs'
import { MetronomeLine } from '../graphics/metronome-line'

export const CircleVisualizationCore: ShapeVisualizationType = ({
  containerSquare,
  cursorEasing,
  lineWidth,
  subdivisionDotRadius,
  divisionDotRadius,
  cursorDotRadius,
  centerDotRadius,
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
  const circle = useMemo(
    () => boundCircle(containerCircle, 0.85),
    [containerCircle]
  )

  const divisionPoints = useMemo(
    () => pointsInCircle(circle, signature),
    [circle, signature]
  )

  const subdivisionsPoints = useMemo(
    () =>
      subdivisions > 1
        ? divisionPoints.map((_d, di) =>
            emptyArray(subdivisions - 1).map((_v, i) => {
              const pointRatioInSegment = (1 / subdivisions) * (i + 1)
              return pointInCircleDivision(
                circle,
                signature,
                di,
                pointRatioInSegment
              )
            })
          )
        : [],
    [signature, circle, subdivisions, divisionPoints]
  )

  const cursorPoint = useMemo(
    () =>
      pointInCircleDivision(
        circle,
        signature,
        divisionIndex,
        progressInDivision,
        cursorEasing
      ),
    [circle, signature, divisionIndex, progressInDivision, cursorEasing]
  )

  const cursorLine = useMemo<GeoLine>(
    () => [containerCircle.center, cursorPoint],
    [containerCircle.center, cursorPoint]
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
          from: { opacity: flashShapeOpacity, radius: circle.radius },
          to: { opacity: 0, radius: circle.radius * flashSizeMultiplicator },
        }),
      [flashShapeOpacity, circle, flashSizeMultiplicator]
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
            radius: circle.radius,
          },
          to: { opacity: 0, radius: circle.radius * flashSizeMultiplicator },
        }),
      [flashShapeSubdivisionOpacity, circle, flashSizeMultiplicator]
    )
  )

  console.log(containerCircle.center)

  return (
    <Stage {...stageProps}>
      {/* Circle main divisions flashes */}
      {displaySettings.flashMode.includes('shape')
        ? divisionPoints.map((point, pointIndex) => {
            const shapeSpring = shapeSprings[pointIndex]

            return (
              <AnimatedMetronomeCircle
                key={`${point[0]}-${point[1]}`}
                center={circle.center}
                radius={shapeSpring.radius}
                color={cursorColor}
                fillOpacity={shapeSpring.opacity}
                lineWidth={0}
                lineOpacity={0}
              />
            )
          })
        : null}

      {/* Circle subdivisions flashes */}
      {displaySettings.flashMode.includes('shape') &&
      displaySettings.shapeSubdivisions === 'subdivisions'
        ? subdivisionsPoints.map((divisionPoints, _divisionIndex) =>
            divisionPoints.map((point, pointIndex) => {
              const _subdivisionIndex =
                _divisionIndex * subdivisions + pointIndex + 1

              const shapeSubdivisionSpring =
                shapeSubdivisionSprings[_subdivisionIndex]

              return (
                <AnimatedMetronomeCircle
                  key={`${point[0]}-${point[1]}`}
                  center={circle.center}
                  radius={shapeSubdivisionSpring.radius}
                  color={cursorColor}
                  fillOpacity={0}
                  lineWidth={lineWidth}
                  lineOpacity={shapeSubdivisionSpring.opacity}
                />
              )
            })
          )
        : null}

      {/* Background circle */}
      <MetronomeCircle
        center={circle.center}
        radius={circle.radius}
        color={mainColor}
        fillOpacity={0.1}
        lineWidth={lineWidth}
        lineOpacity={0.5}
      />

      {/* Main divisions */}
      {displaySettings.shapeSubdivisions !== 'off'
        ? divisionPoints.map((point, pointIndex) => {
            const divisionSpring = divisionSprings[pointIndex]

            return (
              <Fragment key={`${point[0]}-${point[1]}`}>
                {/* Flashes on main divisions */}
                {displaySettings.flashMode.includes('divisions') ? (
                  <AnimatedMetronomeDot
                    opacity={divisionSpring.opacity}
                    radius={divisionSpring.radius}
                    point={point}
                    color={cursorColor}
                  />
                ) : null}

                {/* Main divisions dot */}
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

      {/* Subdivisions */}
      {displaySettings.shapeSubdivisions === 'subdivisions' && subdivisions > 1
        ? subdivisionsPoints.map((divisionPoints, _divisionIndex) =>
            divisionPoints.map((point, pointIndex) => {
              const _subdivisionIndex =
                _divisionIndex * subdivisions + pointIndex + 1

              const subdivisionSpring = subdivisionSprings[_subdivisionIndex]

              return (
                <Fragment key={`${point[0]}-${point[1]}`}>
                  {/* Flashes on subdivisions */}
                  {displaySettings.flashMode.includes('divisions') ? (
                    <AnimatedMetronomeDot
                      opacity={subdivisionSpring.opacity}
                      radius={subdivisionSpring.radius}
                      point={point}
                      color={cursorColor}
                    />
                  ) : null}

                  {/* Subdivisions dot */}
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

      {/* Cursor line */}
      {displaySettings.cursorMode.includes('line') ? (
        <>
          {/* Cursor Line */}
          <MetronomeLine
            pointA={cursorLine[0]}
            pointB={cursorLine[1]}
            color={cursorColor}
            lineOpacity={1}
            lineWidth={lineWidth}
          />

          {/* Center dot */}
          <MetronomeDot
            point={containerCircle.center}
            color={cursorColor}
            radius={centerDotRadius}
            opacity={1}
          />
        </>
      ) : null}

      {/* Cursor dot */}
      {displaySettings.cursorMode.includes('dot') ? (
        <MotionBlurredMetronomeDot
          point={cursorPoint}
          color={cursorColor}
          radius={cursorDotRadius}
          opacity={1}
          running={running}
          speedFactor={2}
          speedTrigger={4}
          motionBlur={{
            offset: -2,
            kernelSize: 5,
          }}
        />
      ) : null}
    </Stage>
  )
}
