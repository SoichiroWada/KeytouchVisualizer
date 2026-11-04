import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { EventKind, EventRecords, KeyEventInfo } from '../types/keyboard'

const emptyEvents = (): EventRecords => ({ keydown: null, keypress: null, keyup: null })
const snapshot = (event: KeyboardEvent): KeyEventInfo => ({
  key: event.key, code: event.code, keyCode: event.keyCode, charCode: event.charCode,
})

export function useKeyboardEvents(inputRef: RefObject<HTMLInputElement | null>) {
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set())
  const pressedRef = useRef(new Set<string>())
  const ignoredReleases = useRef(new Set<string>())
  const composing = useRef(false)
  const [events, setEvents] = useState<EventRecords>(emptyEvents)
  const [imeWarning, setImeWarning] = useState(false)
  const [lastCode, setLastCode] = useState<string | null>(null)

  const resetHands = useCallback(() => {
    ignoredReleases.current = new Set([...ignoredReleases.current, ...pressedRef.current])
    pressedRef.current.clear()
    setPressed(new Set())
  }, [])

  const clear = useCallback(() => {
    resetHands()
    // A keyboard-activated Clear can restore focus before Space/Enter keyup.
    ignoredReleases.current.add('Space')
    ignoredReleases.current.add('Enter')
    composing.current = false
    setEvents(emptyEvents())
    setImeWarning(false)
    setLastCode(null)
  }, [resetHands])

  useEffect(() => {
    const input = inputRef.current
    function record(kind: EventKind, event: KeyboardEvent) {
      setEvents(previous => ({ ...previous, [kind]: snapshot(event) }))
    }
    function keydown(event: KeyboardEvent) {
      if (!event.repeat) ignoredReleases.current.delete(event.code)
      if (event.code && !pressedRef.current.has(event.code)) {
        pressedRef.current.add(event.code)
        setPressed(new Set(pressedRef.current))
      }
      if (event.target !== input) return
      // A previous character's keypress must not masquerade as this key's event.
      setEvents(previous => ({ ...previous, keypress: null }))
      const isIme = event.isComposing || composing.current || event.keyCode === 229
      setImeWarning(isIme)
      if (!isIme) record('keydown', event)
      setLastCode(event.code || null)
    }
    function keypress(event: KeyboardEvent) {
      if (event.target === input) record('keypress', event)
    }
    function keyup(event: KeyboardEvent) {
      if (pressedRef.current.delete(event.code)) setPressed(new Set(pressedRef.current))
      const ignore = ignoredReleases.current.delete(event.code)
      if (event.target === input && !ignore) record('keyup', event)
    }
    function hidden() { if (document.hidden) resetHands() }
    function focusTextbox() { input?.focus() }
    function compositionStart() { composing.current = true; setImeWarning(true) }
    function compositionEnd() { composing.current = false; resetHands() }
    function blur() { composing.current = false; resetHands() }

    window.addEventListener('keydown', keydown)
    window.addEventListener('keypress', keypress)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', blur)
    window.addEventListener('pageshow', focusTextbox)
    document.addEventListener('visibilitychange', hidden)
    input?.addEventListener('blur', blur)
    input?.addEventListener('compositionstart', compositionStart)
    input?.addEventListener('compositionend', compositionEnd)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keypress', keypress)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', blur)
      window.removeEventListener('pageshow', focusTextbox)
      document.removeEventListener('visibilitychange', hidden)
      input?.removeEventListener('blur', blur)
      input?.removeEventListener('compositionstart', compositionStart)
      input?.removeEventListener('compositionend', compositionEnd)
    }
  }, [inputRef, resetHands])

  return { pressed, events, imeWarning, lastCode, resetHands, clear }
}
