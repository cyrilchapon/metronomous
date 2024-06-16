import { atom } from 'jotai'
import { EasingMass } from '../util/mass-easing'

export type ShapeMode = 'circle' | 'polygon'
export type CursorMode = 'mass' | 'subdivisions'

export type DisplaySettings = {
  shapeMode: ShapeMode
  cursorMass: EasingMass
  cursorMode: CursorMode
}

const initialDisplaySettings: DisplaySettings = {
  shapeMode: 'circle',
  cursorMass: 5,
  cursorMode: 'subdivisions',
}

export const displaySettingsAtom = atom<DisplaySettings>(initialDisplaySettings)
