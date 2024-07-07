import { Fragment, useMemo } from 'react'

import { Stage } from '@pixi/react'
import { useAtomValue } from 'jotai'
import { displaySettingsAtom } from '../../state/display-settings'
import {
  metronomeProgressAtom,
  metronomeStateAtom,
} from '../../state/metronome'
import { emptyArray } from '../../util/array'
import {
  boundCircle,
  pointInCircleDivision,
  pointsInCircle,
} from '../../util/geometry'
import { MetronomeCircle } from '../graphics/metronome-circle'
import {
  MetronomeDot,
  MetronomePulsatingDot,
  MotionBlurredMetronomeDot,
} from '../graphics/metronome-dot'
import { ShapeVisualizationType } from './shape-visualization-stage'
import * as easings from '@juliendargelos/easings'

export const CircleVisualizationCore: ShapeVisualizationType = ({
  containerSquare,
  cursorEasing,
  lineWidth,
  subdivisionDotRadius,
  divisionDotRadius,
  cursorDotRadius,
  divisionDotFlashRadius,
  subdivisionDotFlashRadius,
  flashOpacity,
  mainColor,
  cursorColor,
  ...stageProps
}) => {
  const { running, signature, subdivisions } = useAtomValue(metronomeStateAtom)
  const {
    divisionIndex,
    progressInDivision,
    subdivisionIndex,
    progressInSubdivision,
  } = useAtomValue(metronomeProgressAtom)
  const { cursorMode, flashMode } = useAtomValue(displaySettingsAtom)

  const circle = useMemo(() => boundCircle(containerSquare), [containerSquare])

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

  return (
    <Stage {...stageProps}>
      <MetronomeCircle
        circle={circle}
        color={mainColor}
        lineWidth={lineWidth}
      />

      {divisionPoints.map((point, pointIndex) => (
        <Fragment key={`${point[0]}-${point[1]}`}>
          {flashMode === 'divisions' ? (
            <MetronomePulsatingDot
              point={point}
              color={cursorColor}
              minRadius={divisionDotRadius}
              maxRadius={divisionDotFlashRadius}
              radiusEasing={easings.quintic.out}
              minOpacity={0}
              maxOpacity={flashOpacity}
              opacityEasing={easings.quintic.in}
              progress={progressInDivision}
              active={divisionIndex === pointIndex}
            />
          ) : null}

          <MetronomeDot
            point={point}
            color={mainColor}
            radius={divisionDotRadius}
            opacity={1}
          />
        </Fragment>
      ))}

      {cursorMode === 'subdivisions' && subdivisions > 1
        ? subdivisionsPoints.map((divisionPoints, _divisionIndex) =>
            divisionPoints.map((point, pointIndex) => {
              const _subdivisionIndex =
                _divisionIndex * subdivisions + pointIndex + 1

              return (
                <Fragment key={`${point[0]}-${point[1]}`}>
                  {flashMode === 'divisions' ? (
                    <MetronomePulsatingDot
                      point={point}
                      color={cursorColor}
                      minRadius={subdivisionDotRadius}
                      maxRadius={subdivisionDotFlashRadius}
                      radiusEasing={easings.quintic.out}
                      minOpacity={0}
                      maxOpacity={flashOpacity}
                      opacityEasing={easings.quintic.in}
                      progress={progressInSubdivision}
                      active={subdivisionIndex === _subdivisionIndex}
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
    </Stage>
  )
}
