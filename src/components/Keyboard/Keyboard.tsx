import type { KeyDefinition, Settings } from '../../types/keyboard'
import { KEYBOARD_DISPLAY_WIDTH, KEYBOARD_WIDTH, STAGE_HEIGHT } from '../../data/keyboardGeometry'
import { KeyboardKey } from './KeyboardKey'
import { HandsOverlay } from '../Hands/HandsOverlay'
import './Keyboard.css'

interface Props { keys: readonly KeyDefinition[]; pressed: ReadonlySet<string>; settings: Settings }

export function Keyboard({ keys, pressed, settings }: Props) {
  return (
    <section className="keyboard-panel" aria-label={settings.layout === 'ja' ? '日本語109キーボード' : '英語104キーボード'}>
      <div className="keyboard-heading">
        <h2>{settings.layout === 'ja' ? '日本語キーボード（109キー）' : '英語キーボード（US 104キー）'}</h2>
        <span className="pressed-count">{pressed.size} keys held</span>
      </div>
      <p>TEXTボックスをクリックしてからキーを押します。押したキーが光ります。同時押しにも対応しています。</p>
      <div className="keyboard-scroll" tabIndex={0} role="region" aria-label="キーボード表示。狭い画面では横にスクロールできます。">
        <svg className={`keyboard${settings.glow ? ' glow-enabled' : ''}`} style={{ maxWidth: KEYBOARD_DISPLAY_WIDTH }}
          viewBox={`0 0 ${KEYBOARD_WIDTH} ${settings.showHands ? STAGE_HEIGHT : 330}`} role="img"
          aria-label={`テンキー付き${settings.layout === 'ja' ? '日本語' : '英語'}キーボード。押したキーを緑色で表示します。`}>
          <rect className="keyboard-case" x="0" y="0" width="1000" height="330" rx="12" />
          {keys.map(key => <KeyboardKey key={key.code} definition={key} pressed={pressed.has(key.code)} />)}
          {settings.showHands && <HandsOverlay keys={keys} pressed={pressed} settings={settings} />}
        </svg>
      </div>
      <p className="keyboard-note">FnキーやPrintScreenなど、OSが受け取るキーは反応しない場合があります。</p>
    </section>
  )
}
