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
