import { memo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { KeyDefinition, Settings } from '../../types/keyboard'
import { resolveHandPose } from '../../utils/handGeometry'
import { Finger } from './Finger'
import './Hands.css'

interface Props { keys: readonly KeyDefinition[]; pressed: ReadonlySet<string>; settings: Settings }
const speeds = { slow: .22, normal: .105, fast: .045 }

export const HandsOverlay = memo(function HandsOverlay({ keys, pressed, settings }: Props) {
  const reducedMotion = useReducedMotion()
  const duration = reducedMotion ? 0 : speeds[settings.speed]
  return (
    <g className={`hands-overlay${settings.glow ? ' with-glow' : ''}`} fill="none"
      opacity={settings.opacity / 100} aria-hidden="true" data-testid="hands-overlay">
      {(['left', 'right'] as const).map(hand => {
        const pose = resolveHandPose(hand, keys, pressed)
        return (
          <g key={hand} data-hand={hand} data-pose={pose.numpad ? 'numpad' : pose.arrows ? 'arrows' : 'home'}>
            <motion.path className="palm" initial={false} animate={{ d: pose.palm }} transition={{ duration }} />
            {pose.fingers.map(finger => <Finger key={finger.assignment.finger} pose={finger} duration={duration} />)}
            <motion.text className="hand-label" initial={false} animate={{ attrX: hand === 'left' ? 177 : pose.numpad ? 915 : pose.arrows ? 800 : 463 }} transition={{ duration }} y="375" textAnchor="middle">{hand === 'left' ? 'LEFT' : 'RIGHT'}</motion.text>
          </g>
        )
      })}
    </g>
  )
})
