import {
  Controller,
  PickAnimated,
  SpringRef,
  SpringValues,
  UseSpringProps,
  useSprings,
} from 'react-spring'
import * as easings from '@juliendargelos/easings'
import { Metronome, MetronomeEvents } from '../util/metronome'
import { useEffect } from 'react'

type _DivisionSpringProps = {
  from: {
    opacity: number
    radius: number
  }
  to: {
    opacity: number
    radius: number
  }
}

export type DivisionSpringProps = UseSpringProps & _DivisionSpringProps

export const getTickingDotSpringProps = (
  values: _DivisionSpringProps
): DivisionSpringProps => ({
  ...values,
  immediate: true,
  config: (k) => ({
    duration: 500,
    easing:
      k === 'opacity'
        ? easings.cubic.out
        : k === 'radius'
          ? easings.quadratic.out
          : undefined,
  }),
})

export const getTickingCircleSpringProps = (
  values: _DivisionSpringProps
): DivisionSpringProps => ({
  ...values,
  immediate: true,
  config: (k) => ({
    duration: 500,
    easing:
      k === 'opacity'
        ? easings.cubic.out
        : k === 'radius'
          ? easings.quadratic.out
          : undefined,
  }),
})

export type GetSpringIndex<E extends keyof MetronomeEvents> = (
  ...ps: Parameters<MetronomeEvents[E]>
) => number

export const useMetronomeEventSpringEffect = <
  E extends keyof MetronomeEvents,
  Props extends UseSpringProps,
>(
  metronome: Metronome,
  event: E,
  springs: SpringValues<PickAnimated<Props>>[],
  springApi: SpringRef<PickAnimated<Props>>,
  getDivisionSpringIndex: GetSpringIndex<E>
) => {
  useEffect(() => {
    const unsubscribe = metronome.on(event, (...ps: unknown[]) => {
      const divisionSpringIndex = getDivisionSpringIndex(
        ...(ps as Parameters<MetronomeEvents[E]>)
      )

      springApi.set((index: number, ctrl: Controller<PickAnimated<Props>>) => {
        if (index !== divisionSpringIndex) {
          return {}
        }

        ctrl.each((v) => v.reset())
        return {}
      })

      void springApi.start()
    })

    return () => {
      unsubscribe()
    }
  }, [metronome, event, springs.length, springApi, getDivisionSpringIndex])
}

export const useMetronomeTickSprings = <
  E extends keyof MetronomeEvents,
  Props extends UseSpringProps,
>(
  metronome: Metronome,
  event: E,
  getDivisionSpringIndex: GetSpringIndex<E>,
  amount: number,
  getProps: (i: number, ctrl: Controller) => Props
) => {
  const tickingDotSpringsReturn = useSprings(amount, getProps, [
    amount,
    getProps,
  ]) as [SpringValues<PickAnimated<Props>>[], SpringRef<PickAnimated<Props>>]

  const [springs, springApi] = tickingDotSpringsReturn

  useMetronomeEventSpringEffect(
    metronome,
    event,
    springs,
    springApi,
    getDivisionSpringIndex
  )

  return tickingDotSpringsReturn
}
