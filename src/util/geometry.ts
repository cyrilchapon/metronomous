import { emptyArray } from "./array"

export type GeoPoint = [number, number]
export type GeoSegment = [GeoPoint, GeoPoint]
export type GeoPolygon = GeoPoint[]
export type GeoSquare = [GeoPoint, GeoPoint, GeoPoint, GeoPoint]
export type GeoTriangle = [GeoPoint, GeoPoint, GeoPoint]
export type GeoCircle = { center: GeoPoint, radius: number }

export const getLargestPossibleSquare = (
  width: number,
  height: number,
  padding: number
) => {
  const minSide = Math.min(width - padding, height - padding)
  const xPadding = (width - minSide) / 2
  const yPadding = (height - minSide) / 2

  const a1: GeoPoint = [xPadding, yPadding]
  const a2: GeoPoint = [xPadding + minSide, yPadding]
  const a3: GeoPoint = [xPadding + minSide, yPadding + minSide]
  const a4: GeoPoint = [xPadding, yPadding + minSide]

  const square: GeoSquare = [a1, a2, a3, a4]
  return square
}

export const boundShape = (square: GeoSquare, sides: number) => {
  if (sides <= 2) {
    throw new TypeError(`Cannot calculate a polygon of ${sides} sides < 2.`)
  }
  return boundPolygon(square, sides)
}

export const boundPolygon = (square: GeoSquare, sides: number): GeoPolygon => {
  const xs = square.map((p) => p[0])
  const ys = square.map((p) => p[1])

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const xCenter = minX + (maxX - minX) / 2
  const yCenter = minY + (maxY - minY) / 2

  // Dynamic radius to keep consistent height across shapes
  const baseDiameter = maxX - minX
  const diameter = baseDiameter * 0.85 // Safe size ratio
  const radiusFactor = sides % 2 === 0 ? 2 : 1 + Math.cos(Math.PI / sides)
  const radius = diameter / radiusFactor
  const step = (2 * Math.PI) / sides

  // Shift bottom after radius adjustment to keep top point aligned
  const shift = radius - diameter / 2

  const startAngle = -90 * (Math.PI / 180)

  const polygon = new Array(sides)
    .fill(null)
    .reduce<GeoPolygon>((acc, _v, side) => {
      const angleRad = side * step + startAngle
      const nextPoint: GeoPoint = [
        xCenter + radius * Math.cos(angleRad),
        yCenter + shift + radius * Math.sin(angleRad),
      ]
      return [...acc, nextPoint]
    }, [])

  return polygon
}

export const boundCircle = (square: GeoSquare): GeoCircle => {
  const xs = square.map((p) => p[0])
  const ys = square.map((p) => p[1])

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const xCenter = minX + (maxX - minX) / 2
  const yCenter = minY + (maxY - minY) / 2

  return {
    center: [xCenter, yCenter],
    radius: (maxX - xCenter) * 0.85 // Safe size ratio
  }
}

export const progressInRange = (
  [start, end]: [start: number, end: number],
  progress: number
) => start + (end - start) * progress

export const pointInSegment = (
  segment: [GeoPoint, GeoPoint],
  progress: number
): GeoPoint => {
  const [[xStart, yStart], [xEnd, yEnd]] = segment

  const x = progressInRange([xStart, xEnd], progress)
  const y = progressInRange([yStart, yEnd], progress)

  return [x, y]
}

export const getPolygonSegments = (polygon: GeoPolygon): GeoSegment[] =>
  polygon.map((v, i, p) => [
    v,
    p[(i + 1) % p.length]
  ])

export const getPolygonSegment = (
  polygon: GeoPolygon,
  segmentIndex: number
): [GeoPoint, GeoPoint] => [
  polygon[segmentIndex % polygon.length],
  polygon[(segmentIndex + 1) % polygon.length],
]

export const pointInPolygon = (
  polygon: GeoPolygon,
  progress: number,
  easing: (time: number) => number = (time) => time
): GeoPoint => {
  const divisionIndex = Math.floor(progress * polygon.length)
  const _progressInDivision =
    (progress - (1 / polygon.length) * divisionIndex) * polygon.length
  const progressInDivision = easing(_progressInDivision)

  const segment = getPolygonSegment(polygon, divisionIndex)

  const point = pointInSegment(segment, progressInDivision)

  return point
}

const progressToRadian = (progress: number): number => Math.PI * 2 * progress
const radianToProgress = (radian: number): number => radian / (Math.PI * 2)

export const pointInCircle = (
  circle: GeoCircle,
  progress: number
): GeoPoint => {
  const radianProgress = progressToRadian(progress)

  const point: GeoPoint = [
    circle.radius * Math.cos(radianProgress - (Math.PI / 2)) + circle.center[0],
    circle.radius * Math.sin(radianProgress - (Math.PI / 2)) + circle.center[1]
  ]

  return point
}

export const pointsInCircle = (
  circle: GeoCircle,
  subdivisions: number
): GeoPoint[] => {
  const subdivisionFactor = (1 / subdivisions)

  const points = emptyArray(subdivisions).map((_v, i) => {
    const progress = subdivisionFactor * i
    return pointInCircle(circle, progress)
  })

  return points
}

export const pointInCircleDivision = (
  circle: GeoCircle,
  divisions: number,
  divisionIndex: number,
  _progressInDivision: number,
  easing: (time: number) => number = (time) => time
): GeoPoint => {
  const progressInDivision = easing(_progressInDivision)

  const safeStartDivisionIndex = divisionIndex % (divisions + 1)
  const safeEndDivisionIndex = (divisionIndex + 1) % (divisions + 1)

  const startAngle = progressToRadian((1 / divisions) * safeStartDivisionIndex)
  const stopAngle = progressToRadian((1 / divisions) * safeEndDivisionIndex)

  const progressAngle = startAngle + (stopAngle - startAngle) * progressInDivision
  const progress = radianToProgress(progressAngle)

  const point = pointInCircle(circle, progress)

  return point
}
