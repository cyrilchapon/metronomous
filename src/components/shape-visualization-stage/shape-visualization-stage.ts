import { EasingFunction } from '@juliendargelos/easings'
import { ColorSource } from 'pixi.js'
import { GeoSquare } from '../../util/geometry'
import { FunctionComponent } from 'react'
import { PropsOf } from '@emotion/react'
import { Stage } from '@pixi/react'

export type StageProps = PropsOf<typeof Stage>
type _ShapeVisualizationShapeProps = {
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

export type ShapeVisualizationShapeProps = StageProps & _ShapeVisualizationShapeProps

export type ShapeVisualizationType = FunctionComponent<ShapeVisualizationShapeProps>
