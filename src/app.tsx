import { Provider as JotaiProvider, useAtom, useAtomValue } from 'jotai'
import { AppDrawer } from './components/app-drawer'
import { ControlBar } from './components/control-bar'
import { Navbar } from './components/navbar'
import { ShapeVisualization } from './components/shape-visualization'
import { useApplyColorMode } from './hooks/use-apply-color-mode'
import { showVisualizationAtom } from './state/global-settings'
import {
  updateMetronomeBpmEffect,
  updateMetronomeMutedEffect,
  updateMetronomeRunningEffect,
  updateMetronomeSignatureEffect,
  updateMetronomeSubdivisionEffect,
} from './state/metronome'
import { store } from './state/store'
// import { Debugger } from './components/debugger'

const App = () => {
  return (
    <JotaiProvider store={store}>
      <AppRoot />
    </JotaiProvider>
  )
}

const AppRoot = () => {
  useApplyColorMode()

  useAtom(updateMetronomeRunningEffect)
  useAtom(updateMetronomeBpmEffect)
  useAtom(updateMetronomeSignatureEffect)
  useAtom(updateMetronomeSubdivisionEffect)
  useAtom(updateMetronomeMutedEffect)

  const showVisualization = useAtomValue(showVisualizationAtom)

  return (
    <>
      <AppDrawer />

      <div className="flex h-full w-full flex-col">
        <div className="flex h-full flex-1 overflow-hidden">
          {showVisualization ? <ShapeVisualization /> : null}
        </div>

        <div className="mt-auto mb-6 flex justify-center">
          <ControlBar />
        </div>

        {/* <Debugger /> */}

        {/* Spacer for the fixed navbar below. */}
        <div className="h-14 shrink-0" />
        <Navbar />
      </div>
    </>
  )
}

export default App
