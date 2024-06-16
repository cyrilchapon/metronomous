import { GeoPoint } from '../util/geometry'
import { useMemo } from 'react'
import { Point } from 'pixi.js'
import { usePrevious } from 'react-use'

export const useMotionSpeedPoint = (
  running: boolean,
  point: GeoPoint,
  factor: number
) => {
  const previousRunning = usePrevious(running) ?? false
  const previousPoint = usePrevious(point) as GeoPoint | null

  const xSpeed = useMemo(
    () =>
      running && previousRunning && previousPoint != null
        ? Math.round((point[0] - previousPoint[0]) * 100) / 100
        : 0,
    [point, previousPoint, running, previousRunning]
  )
  const ySpeed = useMemo(
    () =>
      running && previousRunning && previousPoint != null
        ? Math.round((point[1] - previousPoint[1]) * 100) / 100
        : 0,
    [point, previousPoint, running, previousRunning]
  )

  const motionSpeed = useMemo(
    () => new Point(xSpeed * factor, ySpeed * factor),
    [factor, xSpeed, ySpeed]
  )

  return motionSpeed
}
