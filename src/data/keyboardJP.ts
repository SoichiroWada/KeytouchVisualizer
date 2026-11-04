import type { KeyDefinition } from '../types/keyboard'
import { getAssignment } from './fingerMapping'

const keys: KeyDefinition[] = []
function add(code: string, label: string, x: number, y: number, width = 40, height = 48) {
  keys.push({ code, label, x, y, width, height, layout: 'ja', assignment: getAssignment(code) })
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
  ['Backquote', '半角/|全角'], ['Digit1', '! 1|ぬ'], ['Digit2', '” 2|ふ'],
  ['Digit3', '# 3|あ'], ['Digit4', '$ 4|う'], ['Digit5', '% 5|え'],
  ['Digit6', '& 6|お'], ['Digit7', "' 7|や"], ['Digit8', '( 8|ゆ'],
  ['Digit9', ') 9|よ'], ['Digit0', '0|わ'], ['Minus', '= -|ほ'],
  ['Equal', '~ ^|へ'], ['IntlYen', '｜ ¥|ー'], ['Backspace', 'BS']
])
row(116, [
  ['Tab', 'Tab', 1.5], ...['Qた', 'Wて', 'Eい', 'Rす', 'Tか', 'Yん', 'Uな', 'Iに', 'Oら', 'Pせ'].map<[string, string]>(s => [`Key${s[0]}`, `${s[0]}|${s.slice(1)}`]),
  ['BracketLeft', '` @|゛'], ['BracketRight', '{ [|゜']
])
add('Enter', 'Enter', 628, 116, 41, 100)
keys[keys.length - 1].points = '628,116 669,116 669,216 613,216 613,168 628,168'
keys[keys.length - 1].target = { x: 645, y: 190 }
row(168, [
  ['CapsLock', 'Caps|英数', 1.75], ...['Aち', 'Sと', 'Dし', 'Fは', 'Gき', 'Hく', 'Jま', 'Kの', 'Lり'].map<[string, string]>(s => [`Key${s[0]}`, `${s[0]}|${s.slice(1)}`]),
  ['Semicolon', '+ ;|れ'], ['Quote', '* :|け'], ['Backslash', '} ]|む']
])
row(220, [
  ['ShiftLeft', 'Shift', 2.25], ...['Zつ', 'Xさ', 'Cそ', 'Vひ', 'Bこ', 'Nみ', 'Mも'].map<[string, string]>(s => [`Key${s[0]}`, `${s[0]}|${s.slice(1)}`]),
  ['Comma', '< ,|ね'], ['Period', '> .|る'], ['Slash', '? /|め'], ['IntlRo', '_ \\|ろ'], ['ShiftRight', 'Shift', 1.75]
])
row(272, [
  ['ControlLeft', 'Ctrl', 1.25], ['MetaLeft', 'Win'], ['AltLeft', 'Alt'], ['NonConvert', '無変換', 1.25],
  ['Space', 'Space', 3.5], ['Convert', '変換', 1.25], ['KanaMode', 'カタカナ|ひらがな', 1.25],
  ['AltRight', 'Alt'], ['MetaRight', 'Win'], ['ContextMenu', 'Menu'], ['ControlRight', 'Ctrl', 1.5]
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


export const keyboardJP = keys
