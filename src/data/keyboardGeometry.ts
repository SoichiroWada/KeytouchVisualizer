import type { KeyDefinition, Point } from '../types/keyboard'

export const KEYBOARD_WIDTH = 1000
export const KEYBOARD_HEIGHT = 330
export const KEYBOARD_DISPLAY_WIDTH = 1210 // Vue: 1100px × 1.10
export const STAGE_HEIGHT = 400

export function keyCenter(key: KeyDefinition): Point {
  return key.target ?? { x: key.x + key.width / 2, y: key.y + key.height / 2 }
}
