import { atom } from 'jotai'
import { EasingMass } from '../util/mass-easing'

export const shapeModes = ['circle', 'polygon'] as const
export type ShapeMode = (typeof shapeModes)[number]

export const shapeDisplays = ['full', 'stroke', 'off'] as const
export type ShapeDisplay = (typeof shapeDisplays)[number]

export const shapeDivisions = ['divisions', 'subdivisions', 'off'] as const
export type ShapeDivisions = (typeof shapeDivisions)[number]

export const cursorMoveModes = ['eased', 'linear'] as const
export type CursorMoveMode = (typeof cursorMoveModes)[number]

export const cursorModes = ['dot', 'line'] as const
export type CursorMode = (typeof cursorModes)[number]

export const flashModes = ['divisions', 'shape'] as const
export type FlashMode = (typeof flashModes)[number]

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
