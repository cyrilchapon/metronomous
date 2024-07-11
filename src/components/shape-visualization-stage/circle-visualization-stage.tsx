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

export const CircleVisualizationCore: ShapeVisualizationType = ({
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

  return (
    <Stage {...stageProps}>
      {displaySettings.flashMode === 'shape'
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

      {displaySettings.flashMode === 'shape' &&
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

      <MetronomeCircle
        {...circle}
        color={mainColor}
        fillOpacity={0.1}
        lineWidth={lineWidth}
        lineOpacity={0.5}
      />

      {displaySettings.shapeSubdivisions !== 'off'
        ? divisionPoints.map((point, pointIndex) => {
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
