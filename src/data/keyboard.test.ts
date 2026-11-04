import { describe, expect, it } from 'vitest'
import { keyboardJP } from './keyboardJP'
import { keyboardUS } from './keyboardUS'
import { getAssignment } from './fingerMapping'
import { keyCenter, KEYBOARD_DISPLAY_WIDTH } from './keyboardGeometry'
import { resolveHandPose } from '../utils/handGeometry'
import vueFixtures from '../test/fixtures/vue-keyboards.json'

it.each([['en', keyboardUS], ['ja', keyboardJP]] as const)('preserves every original Vue %s key label, position and dimension except documented fixes', (layout, keys) => {
  const original = vueFixtures[layout].keys
  expect(keys.map(key => key.code)).toEqual(original.map(key => key.code))
  for (const fixture of original) {
    const key = keys.find(key => key.code === fixture.code)!
    const expected = { ...fixture }
    if (layout === 'ja' && fixture.code === 'Enter') expected.y = 116
    if (layout === 'en' && fixture.code === 'Backslash') expected.label = '|\\'
    expect(key).toMatchObject(expected)
  }
})

describe.each([['JIS', keyboardJP, 109], ['US', keyboardUS, 104]] as const)('%s physical layout', (_name, keys, count) => {
  it('contains distinct physical keys, all inside the case', () => {
    expect(keys).toHaveLength(count)
    expect(new Set(keys.map(key => key.code)).size).toBe(count)
    keys.forEach(key => {
      expect(key.x).toBeGreaterThanOrEqual(0)
      expect(key.x + key.width).toBeLessThanOrEqual(1000)
      expect(key.y + key.height).toBeLessThanOrEqual(330)
    })
  })
  it('places all eight home fingers at their physical key centers', () => {
    for (const hand of ['left', 'right'] as const) {
      const pose = resolveHandPose(hand, keys, new Set())
      expect(pose.fingers).toHaveLength(5)
      for (const finger of pose.fingers.filter(pose => pose.assignment.finger !== 'thumb')) {
        expect(finger.target).toEqual(keyCenter(keys.find(key => key.code === finger.code)!))
        expect(finger.active).toBe(false)
      }
    }
  })
  it('reaches the exact target for every assigned physical key', () => {
    for (const key of keys.filter(key => key.assignment)) {
      const pose = resolveHandPose(key.assignment!.hand, keys, new Set([key.code]))
      const finger = pose.fingers.find(finger => finger.assignment.finger === key.assignment!.finger)!
      expect(finger.target).toEqual(keyCenter(key))
      expect(finger.active).toBe(true)
    }
  })

  it.each([
    ['ArrowLeft', 'index'], ['ArrowUp', 'middle'], ['ArrowDown', 'middle'], ['ArrowRight', 'ring'],
  ] as const)('moves the whole right hand to the arrows and touches %s with the %s finger', (code, fingerName) => {
    const held = new Set([code])
    const pose = resolveHandPose('right', keys, held)
    expect(pose.arrows).toBe(true)
    expect(pose.numpad).toBe(false)
    for (const finger of pose.fingers) {
      expect(finger.base.x).toBeGreaterThan(650)
      expect(finger.base.x).toBeLessThan(900)
    }
    const finger = pose.fingers.find(finger => finger.assignment.finger === fingerName)!
    expect(finger.active).toBe(true)
    expect(finger.target).toEqual(keyCenter(keys.find(key => key.code === code)!))
    expect(resolveHandPose('left', keys, held)).toEqual(resolveHandPose('left', keys, new Set()))
    held.clear()
    expect(resolveHandPose('right', keys, held).arrows).toBe(false)
    expect(resolveHandPose('right', keys, held).fingers.find(finger => finger.assignment.finger === 'index')!.code).toBe('KeyJ')
  })

  it('keeps the arrow pose until all arrows are released and resolves up/down sharing a finger', () => {
    const held = new Set(['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'])
    const pose = () => resolveHandPose('right', keys, held)
    expect(pose().fingers.filter(finger => finger.active)).toHaveLength(3)
    expect(pose().fingers.find(finger => finger.assignment.finger === 'middle')!.code).toBe('ArrowDown')
    held.delete('ArrowDown')
    expect(pose().fingers.find(finger => finger.assignment.finger === 'middle')!.code).toBe('ArrowUp')
    held.delete('ArrowLeft')
    held.delete('ArrowUp')
    expect(pose().arrows).toBe(true)
    held.delete('ArrowRight')
    expect(pose()).toEqual(resolveHandPose('right', keys, new Set()))
  })

  it('preserves numpad priority and returns to held arrows when the numpad is released', () => {
    const held = new Set(['ArrowDown', 'Numpad5'])
    const numpad = resolveHandPose('right', keys, held)
    expect(numpad.numpad).toBe(true)
    expect(numpad.arrows).toBe(false)
    held.delete('Numpad5')
    const arrows = resolveHandPose('right', keys, held)
    expect(arrows.arrows).toBe(true)
    expect(arrows.numpad).toBe(false)
  })

  it.each(['Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown'])('keeps the original home palm and bases for %s', code => {
    const home = resolveHandPose('right', keys, new Set())
    const pose = resolveHandPose('right', keys, new Set([code]))
    expect(pose.arrows).toBe(false)
    expect(pose.numpad).toBe(false)
    expect(pose.palm).toBe(home.palm)
    expect(pose.fingers.map(finger => finger.base)).toEqual(home.fingers.map(finger => finger.base))
    expect(pose.fingers.find(finger => finger.assignment.finger === 'pinky')!.code).toBe(code)
  })
})

it('retains all JIS-specific keys and the original full-size key proportions', () => {
  for (const code of ['IntlYen', 'IntlRo', 'NonConvert', 'Convert', 'KanaMode']) {
    expect(keyboardJP.some(key => key.code === code)).toBe(true)
    expect(keyboardUS.some(key => key.code === code)).toBe(false)
  }
  expect(keyboardUS.find(key => key.code === 'Space')!.width).toBe(271)
  expect(keyboardJP.find(key => key.code === 'NumpadEnter')!.height).toBe(100)
  expect(KEYBOARD_DISPLAY_WIDTH).toBe(1100 * 1.1)
})

it('fixes the inherited JIS Enter/Backspace overlap', () => {
  const enter = keyboardJP.find(key => key.code === 'Enter')!
  const backspace = keyboardJP.find(key => key.code === 'Backspace')!
  expect(enter.y).toBeGreaterThanOrEqual(backspace.y + backspace.height)
  expect(enter.points).toBeDefined()
  expect(keyCenter(enter)).toEqual({ x: 645, y: 190 })
})

it.each([
  ['left', 'pinky', 'QAZ1'], ['left', 'ring', 'WSX2'], ['left', 'middle', 'EDC3'],
  ['left', 'index', 'RTFGVB45'], ['right', 'index', 'YUHJNM67'],
  ['right', 'middle', 'IK8'], ['right', 'ring', 'OL9'], ['right', 'pinky', 'P0'],
] as const)('maps %s %s touch typing keys', (hand, finger, characters) => {
  for (const character of characters) {
    const code = /[0-9]/.test(character) ? `Digit${character}` : `Key${character}`
    expect(getAssignment(code)).toEqual({ hand, finger })
  }
})

it('handles physical modifier sides and unknown/system keys explicitly', () => {
  expect(getAssignment('ShiftLeft')).toEqual({ hand: 'left', finger: 'pinky' })
  expect(getAssignment('ShiftRight')).toEqual({ hand: 'right', finger: 'pinky' })
  for (const code of ['Unidentified', '', 'Fn', 'F1', 'PrintScreen']) expect(getAssignment(code)).toBeNull()
})

it('resolves same-finger chords to the latest held target, then restores the earlier target', () => {
  const held = new Set(['KeyF', 'KeyT'])
  const target = () => resolveHandPose('left', keyboardUS, held).fingers.find(finger => finger.assignment.finger === 'index')!.code
  expect(target()).toBe('KeyT')
  held.delete('KeyT')
  expect(target()).toBe('KeyF')
  held.clear()
  expect(target()).toBe('KeyF')
})

it('uses a dedicated right-hand numpad pose and restores the typing pose', () => {
  const pose = resolveHandPose('right', keyboardUS, new Set(['Numpad5']))
  expect(pose.numpad).toBe(true)
  expect(pose.fingers.find(finger => finger.assignment.finger === 'middle')!.target).toEqual({ x: 889, y: 192 })
  expect(resolveHandPose('right', keyboardUS, new Set()).numpad).toBe(false)
})
