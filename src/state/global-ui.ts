import { atom } from 'jotai'
import { focusAtom } from 'jotai-optics'

export type GlobalUI = {
  menuDrawerOpen: boolean
}

const initialGlobalUI: GlobalUI = {
  menuDrawerOpen: false,
}

export const globalSettingsAtom = atom<GlobalUI>(initialGlobalUI)
export const menuDrawerOpenAtom = focusAtom(globalSettingsAtom, (optic) =>
  optic.prop('menuDrawerOpen')
)
