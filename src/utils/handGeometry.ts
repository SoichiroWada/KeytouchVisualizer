import type { Assignment, FingerName, Hand, KeyDefinition, Point } from '../types/keyboard'
import { keyCenter } from '../data/keyboardGeometry'

export const fingers: FingerName[] = ['pinky', 'ring', 'middle', 'index', 'thumb']
const homeCodes: Record<Hand, Record<FingerName, string>> = {
  left: { pinky: 'KeyA', ring: 'KeyS', middle: 'KeyD', index: 'KeyF', thumb: 'Space' },
  right: { pinky: 'Semicolon', ring: 'KeyL', middle: 'KeyK', index: 'KeyJ', thumb: 'Space' },
}
const numpadHomes: Record<FingerName, string> = {
  index: 'Numpad4', middle: 'Numpad5', ring: 'Numpad6', pinky: 'NumpadEnter', thumb: 'Numpad0',
}

export interface FingerPose {
  assignment: Assignment
  base: Point
  home: Point
  target: Point
  active: boolean
  code: string
}
export interface HandPose { fingers: FingerPose[]; palm: string; numpad: boolean }

export function resolveHandPose(hand: Hand, keys: readonly KeyDefinition[], pressed: ReadonlySet<string>): HandPose {
  const byCode = new Map(keys.map(key => [key.code, key]))
  const active = [...pressed].map(code => byCode.get(code)).filter((key): key is KeyDefinition => !!key)
  const numpad = hand === 'right' && active.some(key => key.code.startsWith('Numpad') || key.code === 'NumLock')
  const indexHome = keyCenter(byCode.get(numpad ? numpadHomes.index : homeCodes[hand].index)!)
  const baseHeights: Record<FingerName, number> = { pinky: 260, ring: 279, middle: 286, index: 278, thumb: 324 }
  const poses = fingers.map(finger => {
    const homeCode = numpad ? numpadHomes[finger] : homeCodes[hand][finger]
    const home = { ...keyCenter(byCode.get(homeCode)!) }
    if (finger === 'thumb' && !numpad) {
      home.x += hand === 'left' ? -34 : 34
      home.y += 3
    }
    const base = finger === 'thumb'
      ? { x: indexHome.x + (hand === 'left' ? 12 : -12), y: 324 }
      : { x: home.x, y: numpad ? 286 : baseHeights[finger] }
    // One anatomical finger cannot occupy two keys. Most recent held key wins;
    // releasing it restores the previous held target without losing highlights.
    const key = [...active].reverse().find(key => key.assignment?.hand === hand && key.assignment.finger === finger)
    return { assignment: { hand, finger }, base, home, target: key ? keyCenter(key) : home, active: !!key, code: key?.code ?? homeCode }
  })
  const index = poses.find(pose => pose.assignment.finger === 'index')!.base
  const pinky = poses.find(pose => pose.assignment.finger === 'pinky')!.base
  const thumb = poses.find(pose => pose.assignment.finger === 'thumb')!.base
  const left = hand === 'left'
  const direction = left ? 1 : -1
  const outer = pinky.x - 8 * direction
  const inner = index.x + 8 * direction
  const orderedBases = poses.filter(pose => pose.assignment.finger !== 'thumb').map(pose => pose.base).sort((a, b) => a.x - b.x)
  const webs = orderedBases.slice(0, -1).map((base, i) => {
    const next = orderedBases[i + 1]
    return `M ${base.x + 8} ${base.y} Q ${(base.x + next.x) / 2} ${Math.max(base.y, next.y) + 10} ${next.x - 8} ${next.y}`
  }).join(' ')
  const palm = `M ${outer} ${pinky.y} C ${outer - 2 * direction} 310 ${outer + 12 * direction} 338 ${outer + 30 * direction} 355 L ${outer + 30 * direction} 385 M ${outer + 105 * direction} 385 L ${outer + 105 * direction} 355 Q ${thumb.x + 10 * direction} 346 ${thumb.x + 10 * direction} 324 M ${thumb.x - 10 * direction} 324 Q ${inner - 3 * direction} 304 ${inner} ${index.y} ${webs}`
  return { fingers: poses, palm, numpad }
}

// Same command topology at every pose lets Motion interpolate every joint.
export function fingerPaths(base: Point, target: Point, active: boolean, thumb: boolean) {
  const radius = thumb ? 10 : 8
  const dx = target.x - base.x
  const dy = target.y - base.y
  const bend = active ? 8 : 0
  const joint = { x: base.x + dx * .48, y: base.y + dy * .48 + bend }
  const upper = { x: base.x + dx * .8, y: base.y + dy * .8 + bend * .4 }
  const outline = `M ${base.x - radius} ${base.y} C ${joint.x - radius} ${joint.y} ${upper.x - radius} ${upper.y} ${target.x - radius} ${target.y} C ${target.x - radius} ${target.y - 13} ${target.x + radius} ${target.y - 13} ${target.x + radius} ${target.y} C ${upper.x + radius} ${upper.y} ${joint.x + radius} ${joint.y} ${base.x + radius} ${base.y}`
  const crease = `M ${joint.x - radius * .55} ${joint.y} Q ${joint.x} ${joint.y - 3} ${joint.x + radius * .55} ${joint.y} M ${upper.x - radius * .5} ${upper.y} Q ${upper.x} ${upper.y - 2} ${upper.x + radius * .5} ${upper.y}`
  return { outline, crease }
}
