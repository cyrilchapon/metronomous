export type GeoPoint = [number, number]
export type GeoSegment = [GeoPoint, GeoPoint]
export type GeoPolygon = GeoPoint[]
export type GeoSquare = [GeoPoint, GeoPoint, GeoPoint, GeoPoint]
export type GeoTriangle = [GeoPoint, GeoPoint, GeoPoint]

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

export const boundLosange = (square: GeoSquare): GeoSquare => {
  const xs = square.map((p) => p[0])
  const ys = square.map((p) => p[1])

  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const halfX = minX + (maxX - minX) / 2
  const halfY = minY + (maxY - minY) / 2

  return [
    [halfX, minY],
    [maxX, halfY],
    [halfX, maxY],
    [minX, halfY],
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
    [progressInRange([minX, maxX], 0.5), minY + (height - triangleHeight)],
    [maxX, maxY],
    [minX, maxY],
  ]

  const topOffset = (height - triangleHeight) / 2

  const centeredTriangle: GeoTriangle = rawTriangle.map<GeoPoint>((p) => [
    p[0],
    p[1] - topOffset,
  ]) as GeoTriangle

  return centeredTriangle
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
