import { SvgIcon, SvgIconProps } from '@mui/material'
import { MetronomeSubdivision } from '../state/metronome'
import { FunctionComponent, useMemo } from 'react'

import fourthNoteSvg from '../assets/note-fourth.svg?react'
import eighthNoteSvg from '../assets/note-eighth.svg?react'
import sixteenthNoteSvg from '../assets/note-sixteenth.svg?react'
import eighthTripletNoteSvg from '../assets/note-eighth-triplet.svg?react'
import sixteenthTripletNoteSvg from '../assets/note-sixteenth-triplet.svg?react'

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

type SubdivisionIconProps = SvgIconProps & {
  subdivision: MetronomeSubdivision
}

export const SubdivisionIcon: FunctionComponent<SubdivisionIconProps> = ({
  subdivision,
  ...props
}) => {
  const iconSvg = useMemo(() => getSubdivisionSvg(subdivision), [subdivision])

  return (
    <SvgIcon {...props} component={iconSvg} inheritViewBox fontSize='medium' />
  )
}
