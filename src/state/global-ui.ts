import { atom } from 'jotai'
import { focusAtom } from 'jotai-optics'

/** Ephemeral, per-session interface state — nothing here is persisted. */
export type GlobalUI = {
  menuDrawerOpen: boolean
}

const initialGlobalUI: GlobalUI = {
  menuDrawerOpen: false,
}

export const globalUIAtom = atom<GlobalUI>(initialGlobalUI)
export const menuDrawerOpenAtom = focusAtom(globalUIAtom, (optic) =>
  optic.prop('menuDrawerOpen')
)
