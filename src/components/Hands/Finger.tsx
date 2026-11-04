import { memo } from 'react'
import { motion } from 'motion/react'
import type { FingerPose } from '../../utils/handGeometry'
import { fingerPaths } from '../../utils/handGeometry'

interface Props { pose: FingerPose; duration: number }

export const Finger = memo(function Finger({ pose, duration }: Props) {
  const { outline, crease } = fingerPaths(pose.base, pose.target, pose.active, pose.assignment.finger === 'thumb')
  const transition = { duration, ease: [.2, .7, .2, 1] as const }
  return (
    <g className={`finger${pose.active ? ' active' : ''}`}
      data-finger={`${pose.assignment.hand}-${pose.assignment.finger}`}
      data-target-code={pose.code} data-target-x={pose.target.x} data-target-y={pose.target.y}>
      <motion.path initial={false} animate={{ d: outline }} transition={transition} />
      <motion.path className="finger-crease" initial={false} animate={{ d: crease }} transition={transition} />
    </g>
  )
})
