import { useAtom } from 'jotai'
import {
  Circle,
  CircleDot,
  CircleDotDashed,
  Disc,
  GitCommitHorizontal,
  Minus,
  Pentagon,
  Radar,
  Waves,
} from 'lucide-react'
import { FunctionComponent } from 'react'
import {
  CursorMode,
  CursorMoveMode,
  FlashMode,
  ShapeDivisions,
  ShapeMode,
  cursorModes,
  cursorMoveModes,
  displaySettingsAtom,
  flashModes,
  shapeDivisions,
  shapeModes,
} from '../state/display-settings'
import { menuDrawerOpenAtom } from '../state/global-ui'
import {
  metronomeSignatureAtom,
  metronomeSubdivisionAtom,
} from '../state/metronome'
import { findLiteral, findLiterals } from '../util/array'
import { assertIsEasingMass, easingMasses } from '../util/mass-easing'
import { metronomeSignatures, metronomeSubdivisions } from '../util/metronome'
import { ColorModeToggleGroup } from './color-mode-toggle-group'
import { SubdivisionIcon } from './subdivision-icon'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const minMass = Math.min(...easingMasses)
const maxMass = Math.max(...easingMasses)

export type AppDrawerProps = Omit<
  React.ComponentProps<typeof Sheet>,
  'open' | 'onOpenChange'
>

export const AppDrawer: FunctionComponent<AppDrawerProps> = (props) => {
  const [menuDrawerOpen, setMenuDrawerOpen] = useAtom(menuDrawerOpenAtom)
  const [displaySettings, setDisplaySettings] = useAtom(displaySettingsAtom)
  const [metronomeSignature, setMetronomeSignature] = useAtom(
    metronomeSignatureAtom
  )
  const [metronomeSubdivision, setMetronomeSubdivision] = useAtom(
    metronomeSubdivisionAtom
  )

  const cursorEasingDisabled = displaySettings.cursorMoveMode !== 'eased'

  return (
    <Sheet open={menuDrawerOpen} onOpenChange={setMenuDrawerOpen} {...props}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Réglages</SheetTitle>
          <SheetDescription>
            Métronome, visualisation et apparence.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          <section className="flex flex-col gap-4">
            <h3 className="font-heading text-base font-medium">Métronome</h3>

            <div className="grid gap-2">
              <Label>Signature</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                size="sm"
                className="w-full"
                value={String(metronomeSignature)}
                onValueChange={(raw) => {
                  const value = findLiteral(metronomeSignatures, raw)
                  if (value == null) {
                    return
                  }
                  setMetronomeSignature(value)
                }}
              >
                {metronomeSignatures.map((signature) => (
                  <ToggleGroupItem
                    key={signature}
                    value={String(signature)}
                    className="flex-1"
                  >
                    {signature}/4
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="grid gap-2">
              <Label>Subdivisions</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                size="sm"
                className="w-full"
                value={String(metronomeSubdivision)}
                onValueChange={(raw) => {
                  const value = findLiteral(metronomeSubdivisions, raw)
                  if (value == null) {
                    return
                  }
                  setMetronomeSubdivision(value)
                }}
              >
                {metronomeSubdivisions.map((subdivision) => (
                  <ToggleGroupItem
                    key={subdivision}
                    value={String(subdivision)}
                    className="flex-1"
                    aria-label={`${subdivision} par temps`}
                  >
                    <SubdivisionIcon subdivision={subdivision} />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-4">
            <h3 className="font-heading text-base font-medium">Fond</h3>

            <div className="grid gap-2">
              <Label>Forme</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                size="sm"
                className="w-full"
                value={displaySettings.shapeMode}
                onValueChange={(raw) => {
                  const value = findLiteral<ShapeMode>(shapeModes, raw)
                  if (value == null) {
                    return
                  }
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    shapeMode: value,
                  }))
                }}
              >
                <ToggleGroupItem value="circle" className="flex-1">
                  <Circle />
                  Cercle
                </ToggleGroupItem>
                <ToggleGroupItem value="polygon" className="flex-1">
                  <Pentagon />
                  Polygone
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid gap-2">
              <Label>Subdivisions</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                size="sm"
                className="w-full"
                value={displaySettings.shapeSubdivisions}
                onValueChange={(raw) => {
                  const value = findLiteral<ShapeDivisions>(shapeDivisions, raw)
                  if (value == null) {
                    return
                  }
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    shapeSubdivisions: value,
                  }))
                }}
              >
                <ToggleGroupItem value="off" className="flex-1">
                  Off
                </ToggleGroupItem>
                <ToggleGroupItem value="divisions" className="flex-1">
                  <CircleDot />
                  Temps
                </ToggleGroupItem>
                <ToggleGroupItem value="subdivisions" className="flex-1">
                  <CircleDotDashed />
                  Toutes
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-4">
            <h3 className="font-heading text-base font-medium">Curseur</h3>

            <div className="grid gap-2">
              <Label>Mouvement</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                spacing={0}
                size="sm"
                className="w-full"
                value={displaySettings.cursorMoveMode}
                onValueChange={(raw) => {
                  const value = findLiteral<CursorMoveMode>(
                    cursorMoveModes,
                    raw
                  )
                  if (value == null) {
                    return
                  }
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    cursorMoveMode: value,
                  }))
                }}
              >
                <ToggleGroupItem value="eased" className="flex-1">
                  <Waves />
                  Inertiel
                </ToggleGroupItem>
                <ToggleGroupItem value="linear" className="flex-1">
                  <Minus />
                  Linéaire
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div
              className="group grid gap-2"
              data-disabled={cursorEasingDisabled || undefined}
            >
              <Label htmlFor="cursor-mass-input">Inertie</Label>
              <Slider
                id="cursor-mass-input"
                value={[displaySettings.cursorMass]}
                disabled={cursorEasingDisabled}
                min={minMass}
                max={maxMass}
                step={1}
                onValueChange={([value]) => {
                  assertIsEasingMass(value)

                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    cursorMass: value,
                  }))
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label>Modes de curseur</Label>
              <ToggleGroup
                type="multiple"
                variant="outline"
                spacing={0}
                size="sm"
                className="w-full"
                value={displaySettings.cursorMode}
                onValueChange={(raws) => {
                  const value = findLiterals<CursorMode>(cursorModes, raws)
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    cursorMode: value,
                  }))
                }}
              >
                <ToggleGroupItem value="dot" className="flex-1">
                  <Disc />
                  Point
                </ToggleGroupItem>
                <ToggleGroupItem value="line" className="flex-1">
                  <Radar />
                  Ligne
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-4">
            <h3 className="font-heading text-base font-medium">Flash</h3>

            <div className="grid gap-2">
              <Label>Modes de flash</Label>
              <ToggleGroup
                type="multiple"
                variant="outline"
                spacing={0}
                size="sm"
                className="w-full"
                value={displaySettings.flashMode}
                onValueChange={(raws) => {
                  const value = findLiterals<FlashMode>(flashModes, raws)
                  setDisplaySettings((prevState) => ({
                    ...prevState,
                    flashMode: value,
                  }))
                }}
              >
                <ToggleGroupItem value="shape" className="flex-1">
                  {displaySettings.shapeMode === 'circle' ? (
                    <Circle />
                  ) : (
                    <Pentagon />
                  )}
                  Forme
                </ToggleGroupItem>
                <ToggleGroupItem value="divisions" className="flex-1">
                  <GitCommitHorizontal />
                  Subdivisions
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </section>

          <Separator />

          <section className="grid gap-2">
            <Label>Mode de couleur</Label>
            <ColorModeToggleGroup size="sm" />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
