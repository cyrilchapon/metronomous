import { Fragment, useCallback, useMemo } from 'react'

import { useAtomValue } from 'jotai'
import { displaySettingsAtom } from '../../state/display-settings'
import { metronome, metronomeStateAtom } from '../../state/metronome'
import { emptyArray } from '../../util/array'
import {
  GeoPoint,
  boundPolygon,
  getPolygonSegment,
  getPolygonSegments,
  getSquareCircle,
  pointInSegment,
} from '../../util/geometry'
import { MetronomeProgress } from '../../util/metronome'
import { MetronomeDot } from '../graphics/metronome-dot'
import { MetronomePolygon } from '../graphics/metronome-polygon'
import { ShapeVisualizationType } from './shape-visualization-stage'
import { Application } from '@pixi/react'
import { FlashDot } from '../graphics/flash-dot'
import { FlashPolygonShape } from '../graphics/flash-shape'
import { ShapeCursor } from '../graphics/shape-cursor'

const PADDED_RATIO = 0.85

export const PolygonVisualizationCore: ShapeVisualizationType = ({
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

  const polygon = useMemo(
    () => boundPolygon(containerCircle, signature, PADDED_RATIO),
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

  // The only per-frame computation left in the render path: turning a
  // progress snapshot into a point. `ShapeCursor` calls this itself, every
  // frame, from inside a `useTick` callback — it never runs as part of a
  // React render.
  const getPoint = useCallback(
    (progress: MetronomeProgress): GeoPoint => {
      const segment = getPolygonSegment(polygon, progress.divisionIndex)
      return pointInSegment(segment, cursorEasing(progress.progressInDivision))
    },
    [polygon, cursorEasing]
  )

  return (
    <Application {...stageProps}>
      {/* Polygon main divisions flash */}
      {displaySettings.flashMode.includes('shape')
        ? polygon.map((point, pointIndex) => (
            <FlashPolygonShape
              key={`${point[0]}-${point[1]}`}
              center={containerCircle.center}
              sides={signature}
              paddedRatio={PADDED_RATIO}
              color={cursorColor}
              fromOpacity={flashShapeOpacity}
              fromRadius={containerCircle.radius}
              toRadius={containerCircle.radius * flashSizeMultiplicator}
              metronome={metronome}
              event="tick"
              matches={(divisionIndex) => divisionIndex === pointIndex}
            />
          ))
        : null}

      {/* Polygon subdivisions flash */}
      {displaySettings.flashMode.includes('shape') &&
      displaySettings.shapeSubdivisions === 'subdivisions'
        ? subdivisionsPoints.map((divisionPoints, _divisionIndex) =>
            divisionPoints.map((point, pointIndex) => {
              const _subdivisionIndex =
                _divisionIndex * subdivisions + pointIndex + 1

              return (
                <FlashPolygonShape
                  key={`${point[0]}-${point[1]}`}
                  center={containerCircle.center}
                  sides={signature}
                  paddedRatio={PADDED_RATIO}
                  lineWidth={lineWidth}
                  color={cursorColor}
                  fromOpacity={flashShapeSubdivisionOpacity}
                  fromRadius={containerCircle.radius}
                  toRadius={containerCircle.radius * flashSizeMultiplicator}
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

      {/* Background polygon */}
      <MetronomePolygon
        polygon={polygon}
        color={mainColor}
        fillOpacity={0.1}
        lineWidth={lineWidth}
        lineOpacity={0.5}
      />

      {/* Main divisions */}
      {displaySettings.shapeSubdivisions !== 'off'
        ? polygon.map((point, pointIndex) => (
            <Fragment key={`${point[0]}-${point[1]}`}>
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
