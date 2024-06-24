import { useMemo } from 'react'

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
  MotionBlurredMetronomeDot,
} from '../graphics/metronome-dot'
import { ShapeVisualizationType } from './shape-visualization-stage'
import { Stage } from '@pixi/react'

export const CircleVisualizationCore: ShapeVisualizationType = ({
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

  const circle = useMemo(() => boundCircle(containerSquare), [containerSquare])

  const divisionPoints = useMemo(
    () => pointsInCircle(circle, signature),
    [circle, signature]
  )

  const subdivisionsPoints = useMemo(
    () =>
      subdivisions > 1
        ? divisionPoints.flatMap((_d, di) =>
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
    [
      circle,
      signature,
      divisionIndex,
      progressInDivision,
      cursorEasing,
    ]
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
      <MetronomeCircle
        circle={circle}
        color={mainColor}
        lineWidth={lineWidth}
      />

      {divisionPoints.map((point) => (
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
          offset: -2,
          kernelSize: cursorDotRadius,
        }}
      />
    </Stage>
  )
}
