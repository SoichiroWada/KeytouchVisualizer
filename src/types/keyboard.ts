export type Layout = 'ja' | 'en'
export type Hand = 'left' | 'right'
export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'
export interface Assignment { hand: Hand; finger: FingerName }
export interface Point { x: number; y: number }
export interface KeyDefinition extends Point {
  code: string
  label: string
  labelLines?: readonly string[]
  layout: Layout
  width: number
  height: number
  assignment: Assignment | null
  points?: string
  target?: Point
}
export interface KeyEventInfo {
  key: string
  code: string
  keyCode: number
  charCode: number
}
export type EventKind = 'keydown' | 'keypress' | 'keyup'
export type EventRecords = Record<EventKind, KeyEventInfo | null>
export type AnimationSpeed = 'slow' | 'normal' | 'fast'
export interface Settings {
  layout: Layout
  showHands: boolean
  opacity: number
  speed: AnimationSpeed
  glow: boolean
}
