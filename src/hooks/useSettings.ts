import { useState } from 'react'
import type { Settings } from '../types/keyboard'

export const SETTINGS_KEY = 'keytouch-settings-v1'
const defaults: Settings = { layout: 'ja', showHands: true, opacity: 65, speed: 'normal', glow: true }

function readSettings(): Settings {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')
    const value = saved && typeof saved === 'object' ? saved as Partial<Settings> : {}
    const legacy = localStorage.getItem('keyboardLayout')
    return {
      layout: value.layout === 'en' || value.layout === 'ja' ? value.layout : legacy === 'en' ? 'en' : 'ja',
      showHands: typeof value.showHands === 'boolean' ? value.showHands : defaults.showHands,
      opacity: typeof value.opacity === 'number' && Number.isFinite(value.opacity) ? Math.max(0, Math.min(100, value.opacity)) : defaults.opacity,
      speed: value.speed === 'slow' || value.speed === 'fast' ? value.speed : 'normal',
      glow: typeof value.glow === 'boolean' ? value.glow : defaults.glow,
    }
  } catch { return defaults }
}

export function useSettings() {
  const [settings, setSettings] = useState(readSettings)
  function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      localStorage.setItem('keyboardLayout', next.layout)
    } catch { /* Private browsing / storage quota must not interrupt typing. */ }
  }
  return { settings, updateSettings }
}
