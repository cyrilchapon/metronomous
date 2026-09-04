import { extend } from '@pixi/react'
import { Container, Graphics } from 'pixi.js'

// @pixi/react v8 only knows how to render the PixiJS classes it has been
// told about (kept explicit so unused parts of PixiJS aren't bundled).
// Importing this module (once, from the visualization root) registers the
// `<pixiContainer>` / `<pixiGraphics>` JSX intrinsics used throughout
// `components/graphics`.
extend({ Container, Graphics })
