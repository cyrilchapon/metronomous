import { atom } from 'jotai'
import { EasingMass } from '../util/mass-easing'

export type ShapeMode = 'circle' | 'polygon'
export type ShapeDisplay = 'full' | 'stroke' | 'off'
export type ShapeDivisions = 'divisions' | 'subdivisions' | 'off'
export type CursorMode = 'eased' | 'linear' | 'off'
export type FlashMode = 'divisions' | 'shape' | 'none'

export type DisplaySettings = {
  shapeMode: ShapeMode
  shapeDisplay: ShapeDisplay
  shapeSubdivisions: ShapeDivisions
  cursorMass: EasingMass
  cursorMode: CursorMode
  flashMode: FlashMode
}

const initialDisplaySettings: DisplaySettings = {
  shapeMode: 'circle',
  shapeDisplay: 'full',
  shapeSubdivisions: 'subdivisions',
  cursorMass: 5,
  cursorMode: 'linear',
  flashMode: 'divisions'
}

export const displaySettingsAtom = atom<DisplaySettings>(initialDisplaySettings)
