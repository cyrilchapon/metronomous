import { atom } from 'jotai'
import { EasingMass } from '../util/mass-easing'

export type ShapeMode = 'circle' | 'polygon'
export type ShapeDisplay = 'full' | 'stroke' | 'off'
export type ShapeDivisions = 'divisions' | 'subdivisions' | 'off'
export type CursorMoveMode = 'eased' | 'linear'
export type CursorMode = 'dot' | 'line'
export type FlashMode = 'divisions' | 'shape'

export type DisplaySettings = {
  shapeMode: ShapeMode
  shapeDisplay: ShapeDisplay
  shapeSubdivisions: ShapeDivisions
  cursorMass: EasingMass
  cursorMoveMode: CursorMoveMode
  cursorMode: CursorMode[]
  flashMode: FlashMode[]
  showVisualization: boolean
}

const initialDisplaySettings: DisplaySettings = {
  shapeMode: 'circle',
  shapeDisplay: 'full',
  shapeSubdivisions: 'subdivisions',
  cursorMass: 5,
  cursorMoveMode: 'linear',
  cursorMode: ['dot'],
  flashMode: ['divisions'],
  showVisualization: true,
}

export const displaySettingsAtom = atom<DisplaySettings>(initialDisplaySettings)
