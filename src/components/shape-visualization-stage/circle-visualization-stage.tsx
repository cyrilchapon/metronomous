import { Fragment, useCallback, useMemo } from 'react'

import { Application } from '@pixi/react'
import { useAtomValue } from 'jotai'
import { displaySettingsAtom } from '../../state/display-settings'
import { metronome, metronomeStateAtom } from '../../state/metronome'
import { emptyArray } from '../../util/array'
import {
  GeoPoint,
  boundCircle,
  getSquareCircle,
  pointInCircleDivision,
  pointsInCircle,
} from '../../util/geometry'
import { MetronomeProgress } from '../../util/metronome'
import { MetronomeCircle } from '../graphics/metronome-circle'
import { MetronomeDot } from '../graphics/metronome-dot'
import { ShapeVisualizationType } from './shape-visualization-stage'
import { FlashDot } from '../graphics/flash-dot'
import { FlashCircleShape } from '../graphics/flash-shape'
import { ShapeCursor } from '../graphics/shape-cursor'

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

  // The only per-frame computation left in the render path: turning a
  // progress snapshot into a point. `ShapeCursor` calls this itself, every
  // frame, from inside a `useTick` callback — it never runs as part of a
  // React render.
  const getPoint = useCallback(
    (progress: MetronomeProgress): GeoPoint =>
      pointInCircleDivision(
        circle,
        signature,
        progress.divisionIndex,
        progress.progressInDivision,
        cursorEasing
      ),
    [circle, signature, cursorEasing]
  )

  return (
    <Application {...stageProps}>
      {/* Circle main divisions flashes */}
      {displaySettings.flashMode.includes('shape')
        ? divisionPoints.map((point, pointIndex) => (
            <FlashCircleShape
              key={`${point[0]}-${point[1]}`}
              center={circle.center}
              color={cursorColor}
              fromOpacity={flashShapeOpacity}
              fromRadius={circle.radius}
              toRadius={circle.radius * flashSizeMultiplicator}
              metronome={metronome}
              event="tick"
              matches={(divisionIndex) => divisionIndex === pointIndex}
            />
          ))
        : null}

      {/* Circle subdivisions flashes */}
      {displaySettings.flashMode.includes('shape') &&
      displaySettings.shapeSubdivisions === 'subdivisions'
        ? subdivisionsPoints.map((divisionPoints, _divisionIndex) =>
            divisionPoints.map((point, pointIndex) => {
              const _subdivisionIndex =
                _divisionIndex * subdivisions + pointIndex + 1

              return (
                <FlashCircleShape
                  key={`${point[0]}-${point[1]}`}
                  center={circle.center}
                  lineWidth={lineWidth}
                  color={cursorColor}
                  fromOpacity={flashShapeSubdivisionOpacity}
                  fromRadius={circle.radius}
                  toRadius={circle.radius * flashSizeMultiplicator}
                  metronome={metronome}
                  event="subdivisionOnlyTick"
                  matches={(subdivisionIndex, divisionIndex) =>
                    divisionIndex * subdivisions + subdivisionIndex ===
                    _subdivisionIndex
                  }
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
        ? divisionPoints.map((point, pointIndex) => (
            <Fragment key={`${point[0]}-${point[1]}`}>
              {/* Flashes on main divisions */}
              {displaySettings.flashMode.includes('divisions') ? (
                <FlashDot
                  point={point}
                  color={cursorColor}
                  fromOpacity={flashDivisionOpacity}
                  fromRadius={divisionDotRadius}
                  toRadius={divisionDotFlashRadius}
                  metronome={metronome}
                  event="tick"
                  matches={(divisionIndex) => divisionIndex === pointIndex}
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
          ))
        : null}

      {/* Subdivisions */}
      {displaySettings.shapeSubdivisions === 'subdivisions' && subdivisions > 1
        ? subdivisionsPoints.map((divisionPoints, _divisionIndex) =>
            divisionPoints.map((point, pointIndex) => {
              const _subdivisionIndex =
                _divisionIndex * subdivisions + pointIndex + 1

              return (
                <Fragment key={`${point[0]}-${point[1]}`}>
                  {/* Flashes on subdivisions */}
                  {displaySettings.flashMode.includes('divisions') ? (
                    <FlashDot
                      point={point}
                      color={cursorColor}
                      fromOpacity={flashSubdivisionOpacity}
                      fromRadius={subdivisionDotRadius}
                      toRadius={subdivisionDotFlashRadius}
                      metronome={metronome}
                      event="subdivisionOnlyTick"
                      matches={(subdivisionIndex, divisionIndex) =>
                        divisionIndex * subdivisions + subdivisionIndex ===
                        _subdivisionIndex
                      }
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

      {/* Center dot, shown together with the cursor line */}
      {displaySettings.cursorMode.includes('line') ? (
        <MetronomeDot
          point={containerCircle.center}
          color={cursorColor}
          radius={centerDotRadius}
          opacity={1}
        />
      ) : null}

      {/* Cursor (dot + line), fully imperative/per-frame */}
      <ShapeCursor
        metronome={metronome}
        running={running}
        getPoint={getPoint}
        centerPoint={containerCircle.center}
        showDot={displaySettings.cursorMode.includes('dot')}
        showLine={displaySettings.cursorMode.includes('line')}
        color={cursorColor}
        dotRadius={cursorDotRadius}
        lineWidth={lineWidth}
        speedFactor={2}
        speedTrigger={4}
        motionBlurOffset={-2}
        motionBlurKernelSize={5}
      />
    </Application>
  )
}
