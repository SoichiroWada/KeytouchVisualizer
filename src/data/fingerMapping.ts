import type { Assignment, FingerName, Hand } from '../types/keyboard'

const mapping = new Map<string, Assignment>()
function assign(hand: Hand, finger: FingerName, codes: string[]) {
  codes.forEach(code => mapping.set(code, { hand, finger }))
}
assign('left', 'pinky', ['KeyQ', 'KeyA', 'KeyZ', 'Digit1', 'Backquote', 'Tab', 'CapsLock', 'ShiftLeft', 'ControlLeft', 'MetaLeft'])
assign('left', 'ring', ['KeyW', 'KeyS', 'KeyX', 'Digit2'])
assign('left', 'middle', ['KeyE', 'KeyD', 'KeyC', 'Digit3'])
assign('left', 'index', ['KeyR', 'KeyT', 'KeyF', 'KeyG', 'KeyV', 'KeyB', 'Digit4', 'Digit5'])
assign('left', 'thumb', ['AltLeft', 'NonConvert'])
assign('right', 'index', ['KeyY', 'KeyU', 'KeyH', 'KeyJ', 'KeyN', 'KeyM', 'Digit6', 'Digit7', 'ArrowLeft', 'Numpad1', 'Numpad4', 'Numpad7', 'NumLock'])
assign('right', 'middle', ['KeyI', 'KeyK', 'Comma', 'Digit8', 'ArrowUp', 'ArrowDown', 'Numpad2', 'Numpad5', 'Numpad8', 'NumpadDivide'])
assign('right', 'ring', ['KeyO', 'KeyL', 'Period', 'Digit9', 'ArrowRight', 'Numpad3', 'Numpad6', 'Numpad9', 'NumpadMultiply', 'NumpadDecimal'])
assign('right', 'pinky', ['KeyP', 'Semicolon', 'Slash', 'Digit0', 'Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash', 'Quote', 'IntlYen', 'IntlRo', 'Backspace', 'Enter', 'ShiftRight', 'ControlRight', 'MetaRight', 'ContextMenu', 'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown', 'NumpadSubtract', 'NumpadAdd', 'NumpadEnter'])
assign('right', 'thumb', ['Space', 'AltRight', 'Convert', 'KanaMode', 'Numpad0'])

// Fn, function/system keys and unidentified codes have no universal typing finger.
export function getAssignment(code: string): Assignment | null {
  return mapping.get(code) ?? null
}

export const fingerLabels: Record<FingerName, string> = {
  thumb: '親指 / Thumb', index: '人差し指 / Index', middle: '中指 / Middle',
  ring: '薬指 / Ring', pinky: '小指 / Pinky',
}
