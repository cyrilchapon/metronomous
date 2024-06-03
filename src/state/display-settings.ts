import { atom } from 'jotai'
import { EasingMass } from '../util/mass-easing'

export type DisplaySettings = {
  cursorMass: EasingMass
}



const initialDisplaySettings: DisplaySettings = {
  cursorMass: 5
}

export const displaySettingsAtom = atom<DisplaySettings>(initialDisplaySettings)
