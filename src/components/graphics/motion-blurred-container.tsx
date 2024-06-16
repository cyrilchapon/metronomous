import { MotionBlurFilter } from '@pixi/filter-motion-blur'
import { Container, withFilters } from '@pixi/react'
import { FXAAFilter } from '@pixi/filter-fxaa'

export const MotionBlurredContainer = withFilters(Container, {
  motionBlur: MotionBlurFilter,
  antialias: FXAAFilter
})
