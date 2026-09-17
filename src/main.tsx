import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.tsx'
import { colorModeSettingAtom } from './state/global-settings'
import { store } from './state/store'
import { applyColorMode, resolveColorMode } from './style/color-mode'

// Before the first render, so that nothing *renders* — or reads the theme's
// CSS variables — against the wrong color mode. The setting is already the
// user's own here: persisted configs hydrate from `localStorage`
// synchronously, when their module is evaluated (see `persistedConfigAtom`).
//
// This is the authoritative application of the mode, but not the first one:
// the browser paints the page's background before any module runs, so
// `index.html` applies the same thing inline, from the same stored setting.
applyColorMode(resolveColorMode(store.get(colorModeSettingAtom)))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
