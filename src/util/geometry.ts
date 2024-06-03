import { UnreachableCaseError } from './unreachable-case-error'

export type GeoPoint = [number, number]
export type GeoSegment = [GeoPoint, GeoPoint]
export type GeoPolygon = GeoPoint[]
export type GeoSquare = [GeoPoint, GeoPoint, GeoPoint, GeoPoint]
export type GeoTriangle = [GeoPoint, GeoPoint, GeoPoint]

export const largestPossibleSquare = (
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

export const boundShape = (square: GeoSquare, sides: 3 | 4 | 5 | 6) => {
  switch (sides) {
    case 3:
      return boundTriangle(square)
    case 4:
      return boundSquare(square)
    case 5:
    case 6:
      throw new Error(`Not implemented boundShape for ${sides} sides`)
    default:
      throw new UnreachableCaseError(sides)
  }
}

export const boundSquare = (square: GeoSquare): GeoSquare => {
  const xs = square.map((p) => p[0])
  const ys = square.map((p) => p[1])

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return [
    [minX, maxY],
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
  ]
}

export const boundTriangle = (square: GeoSquare): GeoTriangle => {
  const xs = square.map((p) => p[0])
  const ys = square.map((p) => p[1])

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const width = maxX - minX
  const height = maxY - minY

  const triangleHeight = width * Math.cos(Math.PI / 6)

  const rawTriangle: GeoTriangle = [
    [minX, maxY],
    [progressInRange([minX, maxX], 0.5), minY + (height - triangleHeight)],
    [maxX, maxY],
  ]

  const topOffset = (height - triangleHeight) / 2

  const centeredTriangle: GeoTriangle = rawTriangle.map<GeoPoint>((p) => [
    p[0],
    p[1] - topOffset,
  ]) as GeoTriangle

  return centeredTriangle
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
