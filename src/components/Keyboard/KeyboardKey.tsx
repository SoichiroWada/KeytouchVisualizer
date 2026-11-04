import { memo } from 'react'
import type { KeyDefinition } from '../../types/keyboard'
import { keyCenter } from '../../data/keyboardGeometry'

export const KeyboardKey = memo(function KeyboardKey({ definition: key, pressed }: { definition: KeyDefinition; pressed: boolean }) {
  const center = keyCenter(key)
  const lines = key.labelLines ?? key.label.split('|')
  return (
    <g data-code={key.code} data-pressed={pressed} className={`keyboard-key${pressed ? ' pressed' : ''}`}>
      <title>{key.code}</title>
      {key.points ? <polygon className="key-surface" points={key.points} /> : <rect className="key-surface" x={key.x} y={key.y} width={key.width} height={key.height} rx="4" />}
      <text x={center.x} y={center.y} textAnchor="middle" dominantBaseline="central">
        {lines.map((line, index) => <tspan key={index} x={center.x} dy={index === 0 ? (lines.length > 1 ? -8 : 0) : 17}>{line}</tspan>)}
      </text>
      {(key.code === 'KeyF' || key.code === 'KeyJ') && <path className="home-mark" d={`M ${center.x - 4} ${key.y + key.height - 6} h 8`} />}
    </g>
  )
})
