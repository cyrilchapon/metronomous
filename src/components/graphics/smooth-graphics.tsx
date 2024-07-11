import {
  Graphics,
  InteractionEvents,
  PixiComponent,
  applyDefaultProps,
} from '@pixi/react'
import { SmoothGraphics as PixiSmoothGraphics } from '@pixi/graphics-smooth'
import { DisplayObject as PixiDisplayObject } from '@pixi/display'
import {
  Point as PixiPoint,
  ObservablePoint as PixiObservablePoint,
} from '@pixi/math'
import { ComponentProps } from 'react'

export type IGraphics = ComponentProps<typeof Graphics>
export type Draw = NonNullable<IGraphics['draw']>

type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B

type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >
}[keyof T]

type P = 'position' | 'scale' | 'pivot' | 'anchor' | 'skew'

type PointLike =
  | PixiPoint
  | PixiObservablePoint
  | [number, number]
  | [number]
  | number
  | { x: number; y: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WithPointLike<T extends keyof any> = { [P in T]: PointLike }

// eslint-disable-next-line @typescript-eslint/ban-types
type Container<T extends PixiDisplayObject, U = {}> = Partial<
  Omit<T, 'children' | P | ReadonlyKeys<T> | keyof U> & WithPointLike<P>
> &
  U &
  InteractionEvents & { ref?: React.Ref<T> }

export type ISmoothGraphics = Container<
  PixiSmoothGraphics,
  {
    /**
     * Draw a smoothGraphic with imperative callback.
     *
     * @param {PixiSmoothGraphics} graphics - The smoothGraphics instance to draw on
     * @example
     *
     * draw={g => {
     *   g.beginFill(0xff0000);
     *   g.drawRect(0,0,100,100,true);
     *   g.endFill();
     * }}
     */
    draw?(graphics: PixiSmoothGraphics): void
  }
>
export type SmoothDraw = NonNullable<ISmoothGraphics['draw']>

export const SmoothGraphics = PixiComponent<
  ISmoothGraphics,
  PixiSmoothGraphics
>('SmoothMetronomeDot', {
  create: () => new PixiSmoothGraphics(),
  applyProps: (g, oldProps: ISmoothGraphics, newProps) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { draw: oldDraw, ...oldRestProps } = oldProps
    const { draw, ...newRestProps } = newProps

    let changed = applyDefaultProps(
      g,
      oldRestProps,
      newRestProps
    ) as unknown as boolean
    const drawChanged = oldDraw !== draw && typeof draw === 'function'

    if (drawChanged) {
      changed = true
      draw.call(g, g)
    }

    return changed as unknown as void
  },
})
