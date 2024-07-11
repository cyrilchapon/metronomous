import { RadialBlurFilter } from '@pixi/filter-radial-blur'
import { Container, withFilters } from '@pixi/react'
import { FXAAFilter } from '@pixi/filter-fxaa'

export const RadialBlurredContainer = withFilters(Container, {
  radialBlur: RadialBlurFilter,
  antialias: FXAAFilter
})
