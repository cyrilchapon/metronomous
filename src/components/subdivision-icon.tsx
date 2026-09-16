import { FunctionComponent, useMemo } from 'react'

import eighthTripletNoteSvg from '../assets/note-eighth-triplet.svg?react'
import eighthNoteSvg from '../assets/note-eighth.svg?react'
import fourthNoteSvg from '../assets/note-fourth.svg?react'
import sixteenthTripletNoteSvg from '../assets/note-sixteenth-triplet.svg?react'
import sixteenthNoteSvg from '../assets/note-sixteenth.svg?react'
import { MetronomeSubdivision } from '../util/metronome'

const getSubdivisionSvg = (subdivision: MetronomeSubdivision) => {
  switch (subdivision) {
    case 1:
      return fourthNoteSvg
    case 2:
      return eighthNoteSvg
    case 3:
      return eighthTripletNoteSvg
    case 4:
      return sixteenthNoteSvg
    case 6:
      return sixteenthTripletNoteSvg
  }
}

export type SubdivisionIconProps = React.SVGProps<SVGSVGElement> & {
  subdivision: MetronomeSubdivision
}

export const SubdivisionIcon: FunctionComponent<SubdivisionIconProps> = ({
  subdivision,
  ...props
}) => {
  const IconSvg = useMemo(() => getSubdivisionSvg(subdivision), [subdivision])

  return <IconSvg {...props} />
}
