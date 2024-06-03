import { Box } from '@mui/material'
import { useState } from 'react'
import { KnobHeadless } from 'react-knob-headless'

export const Knob = () => {
  const [value, changeValue] = useState(30)

  return (
    <Box width={100} height={100} bgcolor="red">
      <KnobHeadless
        valueRaw={value}
        valueMin={0}
        valueMax={50}
        aria-label="hey"
        dragSensitivity={0.006}
        valueRawRoundFn={Math.round}
        valueRawDisplayFn={(v) => `${v}`}
        onValueRawChange={changeValue}
      >
        <Box bgcolor="green">hey</Box>
      </KnobHeadless>
    </Box>
  )
}
