import { useRef, useState } from 'react'
import { Keyboard } from './components/Keyboard/Keyboard'
import { EventInfo } from './components/EventInfo/EventInfo'
import { AnimationControls } from './components/AnimationControls/AnimationControls'
import { InputBox } from './components/InputBox/InputBox'
import { LanguageSelector } from './components/LanguageSelector/LanguageSelector'
import { keyboardJP } from './data/keyboardJP'
import { keyboardUS } from './data/keyboardUS'
import { useSettings } from './hooks/useSettings'
import { useKeyboardEvents } from './hooks/useKeyboardEvents'
import './App.css'

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  const { settings, updateSettings } = useSettings()
  const keyboard = useKeyboardEvents(inputRef)
  function clear() {
    setInputValue('')
    keyboard.clear()
    inputRef.current?.focus()
  }
  return (
    <main className="app">
      <header>
        <h1>Keytouch Visualizer</h1>
        <div className="toolbar">
          <LanguageSelector layout={settings.layout} onChange={layout => { keyboard.resetHands(); updateSettings({ layout }); inputRef.current?.focus() }} />
          <InputBox inputRef={inputRef} value={inputValue} onChange={setInputValue} onClear={clear} />
        </div>
        <p id="focus-hint" className="focus-hint"><span className="focus-dot" />入力欄にフォーカスしてタイピング / Focus the text box to inspect events</p>
      </header>
      {keyboard.imeWarning && <div className="alert" role="status"><div id="alertJ">半角英数字モードで入力してください</div><div id="alertE">Please use half-width alphanumeric input.</div></div>}
      <div className="tester-layout">
        <div className="keyboard-column">
          <Keyboard keys={settings.layout === 'ja' ? keyboardJP : keyboardUS} pressed={keyboard.pressed} settings={settings} />
          <AnimationControls settings={settings} onChange={updateSettings} onReset={keyboard.resetHands} />
        </div>
        <EventInfo inputValue={inputValue} events={keyboard.events} lastCode={keyboard.lastCode} />
      </div>
      <footer>
        <div className="reference-links" id="url">
          <a href="https://www.w3.org/2002/09/tests/keys.html" target="_blank" rel="noopener noreferrer">Key and Character Codes vs. Event Types <span aria-hidden="true">↗</span></a>
          <a href="https://www.w3.org/TR/uievents-code/" target="_blank" rel="noopener noreferrer">UI Events KeyboardEvent code Values <span aria-hidden="true">↗</span></a>
          <a href="https://javascript.info/keyboard-events" target="_blank" rel="noopener noreferrer">Keyboard: keydown and keyup <span aria-hidden="true">↗</span></a>
        </div>
        <span className="footer-caption">Keycode Finderから、指の動きまで。</span>
      </footer>
    </main>
  )
}
