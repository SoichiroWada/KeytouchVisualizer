import type { KeyDefinition } from '../types/keyboard'
import { getAssignment } from './fingerMapping'

const keys: KeyDefinition[] = []
function add(code: string, label: string, x: number, y: number, width = 40, height = 48) {
  keys.push({ code, label, x, y, width, height, layout: 'en', assignment: getAssignment(code) })
}
function row(y: number, entries: [string, string, number?][]) {
  let x = 12
  for (const [code, label, units = 1] of entries) {
    add(code, label, x, y, units * 44 - 4)
    x += units * 44
  }
}
add('Escape', 'Esc', 12, 12, 40, 36)
for (let i = 1; i <= 12; i++) add(`F${i}`, `F${i}`, 100 + (i - 1) * 44 + Math.floor((i - 1) / 4) * 20, 12, 40, 36)
row(64, [
  ['Backquote', '~|`'], ['Digit1', '!|1'], ['Digit2', '@|2'], ['Digit3', '#|3'],
  ['Digit4', '$|4'], ['Digit5', '%|5'], ['Digit6', '^|6'], ['Digit7', '&|7'],
  ['Digit8', '*|8'], ['Digit9', '(|9'], ['Digit0', ')|0'], ['Minus', '_|-'],
  ['Equal', '+|='], ['Backspace', 'Backspace', 2]
])
row(116, [
  ['Tab', 'Tab', 1.5], ...'QWERTYUIOP'.split('').map<[string, string]>(c => [`Key${c}`, c]),
  ['BracketLeft', '{|['], ['BracketRight', '}|]'], ['Backslash', '|\\', 1.5]
])
// The vertical bar is a glyph here, rather than the legacy line delimiter.
keys.find(key => key.code === 'Backslash')!.labelLines = ['|', '\\']
row(168, [
  ['CapsLock', 'Caps Lock', 1.75], ...'ASDFGHJKL'.split('').map<[string, string]>(c => [`Key${c}`, c]),
  ['Semicolon', ':|;'], ['Quote', '"|\''], ['Enter', 'Enter', 2.25]
])
row(220, [
  ['ShiftLeft', 'Shift', 2.25], ...'ZXCVBNM'.split('').map<[string, string]>(c => [`Key${c}`, c]),
  ['Comma', '<|,'], ['Period', '>|.'], ['Slash', '?|/'], ['ShiftRight', 'Shift', 2.75]
])
row(272, [
  ['ControlLeft', 'Ctrl', 1.25], ['MetaLeft', 'Win', 1.25], ['AltLeft', 'Alt', 1.25],
  ['Space', 'Space', 6.25], ['AltRight', 'Alt', 1.25], ['MetaRight', 'Win', 1.25],
  ['ContextMenu', 'Menu', 1.25], ['ControlRight', 'Ctrl', 1.25]
])
for (const [i, code, label] of [[0, 'PrintScreen', 'Print|Screen'], [1, 'ScrollLock', 'Scroll|Lock'], [2, 'Pause', 'Pause']] as [number, string, string][]) add(code, label, 690 + i * 44, 12, 40, 36)
for (const [i, code, label] of [[0, 'Insert', 'Insert'], [1, 'Home', 'Home'], [2, 'PageUp', 'Page|Up'], [3, 'Delete', 'Delete'], [4, 'End', 'End'], [5, 'PageDown', 'Page|Down']] as [number, string, string][]) add(code, label, 690 + (i % 3) * 44, 64 + Math.floor(i / 3) * 52)
add('ArrowUp', '↑', 734, 220)
add('ArrowLeft', '←', 690, 272)
add('ArrowDown', '↓', 734, 272)
add('ArrowRight', '→', 778, 272)
for (const [i, code, label] of [[0, 'NumLock', 'Num|Lock'], [1, 'NumpadDivide', '/'], [2, 'NumpadMultiply', '*'], [3, 'NumpadSubtract', '-']] as [number, string, string][]) add(code, label, 828 + i * 42, 64, 38)
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
  const n = 7 - r * 3 + c
  add(`Numpad${n}`, `${n}`, 828 + c * 42, 116 + r * 52, 38)
}
add('NumpadAdd', '+', 954, 116, 38, 100)
add('NumpadEnter', 'Enter', 954, 220, 38, 100)
add('Numpad0', '0', 828, 272, 80)
add('NumpadDecimal', '.', 912, 272, 38)


export const keyboardUS = keys
