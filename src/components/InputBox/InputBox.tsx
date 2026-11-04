import type { RefObject } from 'react'

interface Props { inputRef: RefObject<HTMLInputElement | null>; value: string; onChange: (value: string) => void; onClear: () => void }

export function InputBox({ inputRef, value, onChange, onClear }: Props) {
  return (
    <div className="input-group">
      <label className="sr-only" htmlFor="textbox">キー入力テキスト / Keyboard input</label>
      <input ref={inputRef} id="textbox" autoFocus type="text" value={value} onChange={event => onChange(event.target.value)} placeholder="CLICK THIS TEXT BOX" autoComplete="off" autoCapitalize="off" spellCheck={false} aria-describedby="focus-hint" />
      <button type="button" id="button" onClick={onClear}>Clear</button>
    </div>
  )
}
