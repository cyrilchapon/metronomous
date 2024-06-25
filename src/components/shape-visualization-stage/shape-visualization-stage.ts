import { EasingFunction } from '@juliendargelos/easings'
import { ColorSource } from 'pixi.js'
import { GeoSquare } from '../../util/geometry'
import { FunctionComponent } from 'react'

export type ShapeVisualizationShapeProps = {
  width: number,
  height: number,
  containerSquare: GeoSquare
  cursorEasing: EasingFunction
  lineWidth: number
  subdivisionDotRadius: number
  divisionDotRadius: number
  cursorDotRadius: number
  divisionDotFlashRadius: number
  subdivisionDotFlashRadius: number
  flashOpacity: number
  mainColor: ColorSource
  cursorColor: ColorSource
}

export type ShapeVisualizationType = FunctionComponent<ShapeVisualizationShapeProps>
