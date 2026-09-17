import './index.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.tsx'
import { colorModeSettingAtom } from './state/global-settings'
import { store } from './state/store'
import { applyColorMode, resolveColorMode } from './style/color-mode'

// Before the first render, so that nothing paints — or reads the theme's CSS
// variables — against the wrong color mode. The setting is already the
// user's own here: persisted configs hydrate from `localStorage`
// synchronously, when their module is evaluated (see `persistedConfigAtom`).
applyColorMode(resolveColorMode(store.get(colorModeSettingAtom)))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
