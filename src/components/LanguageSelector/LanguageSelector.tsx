import type { Layout } from '../../types/keyboard'

export function LanguageSelector({ layout, onChange }: { layout: Layout; onChange: (layout: Layout) => void }) {
  return (
    <div className="layout-switch" role="radiogroup" aria-label="キーボード配列 / Keyboard layout">
      {([['ja', '日本語 / Japanese'], ['en', '英語 / English']] as const).map(([value, label]) => (
        <label key={value} className={layout === value ? 'selected' : ''}><input type="radio" name="layout" value={value} checked={layout === value} onChange={() => onChange(value)} />{label}</label>
      ))}
    </div>
  )
}
