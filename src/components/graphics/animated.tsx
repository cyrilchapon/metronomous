// import { applyDefaultProps } from '@pixi/react'
import { MetronomeDot } from './metronome-dot'
import { AnimatedComponent } from 'react-spring'
import { createHost } from '@react-spring/animated'
import { MetronomeCircle } from './metronome-circle'
import { MetronomePolygon } from './metronome-polygon'

const host = createHost(
  {
    MetronomeDot: MetronomeDot,
    MetronomeCircle: MetronomeCircle,
    MetronomePolygon: MetronomePolygon,
  },
  {}
)

const AnimatedMetronomeDot = host.animated
  .MetronomeDot as unknown as AnimatedComponent<typeof MetronomeDot>

const AnimatedMetronomeCircle = host.animated
  .MetronomeCircle as unknown as AnimatedComponent<typeof MetronomeCircle>

const AnimatedMetronomePolygon = host.animated
  .MetronomePolygon as unknown as AnimatedComponent<typeof MetronomePolygon>

export {
  AnimatedMetronomeDot,
  AnimatedMetronomeCircle,
  AnimatedMetronomePolygon,
}
