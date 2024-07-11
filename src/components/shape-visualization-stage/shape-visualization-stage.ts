import { EasingFunction } from '@juliendargelos/easings'
import { ColorSource } from 'pixi.js'
import { GeoSquare } from '../../util/geometry'
import { ComponentProps, FunctionComponent } from 'react'
import { Stage } from '@pixi/react'

export type StageProps = ComponentProps<typeof Stage>
type _ShapeVisualizationShapeProps = {
  containerSquare: GeoSquare
  cursorEasing: EasingFunction
  lineWidth: number
  subdivisionDotRadius: number
  divisionDotRadius: number
  cursorDotRadius: number
  centerDotRadius: number
  flashSizeMultiplicator: number
  divisionDotFlashRadius: number
  subdivisionDotFlashRadius: number
  flashShapeOpacity: number
  flashShapeSubdivisionOpacity: number
  flashDivisionOpacity: number
  flashSubdivisionOpacity: number
  mainColor: ColorSource
  cursorColor: ColorSource
}

export type ShapeVisualizationShapeProps = StageProps &
  _ShapeVisualizationShapeProps

export type ShapeVisualizationType =
  FunctionComponent<ShapeVisualizationShapeProps>
