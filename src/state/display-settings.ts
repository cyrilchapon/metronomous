import { atom } from 'jotai'
import { EasingMass } from '../util/mass-easing'

export type CursorMode = 'mass' | 'subdivisions'

export type DisplaySettings = {
  cursorMass: EasingMass
  cursorMode: CursorMode
}

const initialDisplaySettings: DisplaySettings = {
  cursorMass: 5,
  cursorMode: 'mass',
}

export const displaySettingsAtom = atom<DisplaySettings>(initialDisplaySettings)
