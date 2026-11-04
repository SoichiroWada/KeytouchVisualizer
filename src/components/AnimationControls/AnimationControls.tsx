import type { AnimationSpeed, Settings } from '../../types/keyboard'

interface Props { settings: Settings; onChange: (patch: Partial<Settings>) => void; onReset: () => void }

export function AnimationControls({ settings, onChange, onReset }: Props) {
  return (
    <section className="animation-controls" aria-label="Hand animation settings">
      <div className="controls-title"><span className="outline-hand-icon" aria-hidden="true">✧</span><h2>Hand animation</h2><span>手指の表示設定</span></div>
      <div className="controls-grid">
        <label className="toggle-control"><span>Show Hands</span><input type="checkbox" checked={settings.showHands} onChange={event => onChange({ showHands: event.target.checked })} /><span className="switch-track" aria-hidden="true" /><small>{settings.showHands ? 'ON' : 'OFF'}</small></label>
        <label className="opacity-control" htmlFor="hand-opacity"><span>Hand Opacity <output>{settings.opacity}%</output></span><input id="hand-opacity" type="range" min="0" max="100" value={settings.opacity} onChange={event => onChange({ opacity: Number(event.target.value) })} /></label>
        <label className="speed-control"><span>Animation Speed</span><select value={settings.speed} onChange={event => onChange({ speed: event.target.value as AnimationSpeed })}><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select></label>
        <label className="toggle-control"><span>Glow Effect</span><input type="checkbox" checked={settings.glow} onChange={event => onChange({ glow: event.target.checked })} /><span className="switch-track" aria-hidden="true" /><small>{settings.glow ? 'ON' : 'OFF'}</small></label>
        <button type="button" className="reset-button" onClick={onReset}><span aria-hidden="true">↺</span> Reset Hands</button>
      </div>
      <p>指先はホームポジションから担当キーへ移動します。設定はこのブラウザに保存されます。</p>
    </section>
  )
}
