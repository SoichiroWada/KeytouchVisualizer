import type { EventKind, EventRecords } from '../../types/keyboard'
import { fingerLabels, getAssignment } from '../../data/fingerMapping'

export function EventInfo({ inputValue, events, lastCode }: { inputValue: string; events: EventRecords; lastCode: string | null }) {
  const assignment = lastCode ? getAssignment(lastCode) : null
  return (
    <section className="results" aria-label="Keyboard event results">
      <div className="text input-value" id="inputValue">inputValue: <span>{inputValue || '""'}</span></div>
      {(['keydown', 'keypress', 'keyup'] as EventKind[]).map((kind, eventIndex) => {
        const event = events[kind]
        return (
          <section key={kind} aria-label={kind} className="event-section">
            <div className="event-heading"><h2>{kind}</h2><span className={`event-indicator${event ? ' received' : ''}`}>{event ? 'received' : 'waiting'}</span></div>
            {(['key', 'keyCode', 'charCode', 'code'] as const).map((property, index) => (
              <div className="text" key={property} id={`message${eventIndex * 4 + index + 1}`}>
                <span className="property">event.{property}: </span>
                <span>{event === null ? '—' : event[property] === '' ? '""' : String(event[property])}</span>
              </div>
            ))}
          </section>
        )
      })}
      <div className="assignment-info">
        <div><span>Assigned Hand</span><strong>{assignment ? assignment.hand === 'left' ? '左手 / Left' : '右手 / Right' : '—'}</strong></div>
        <div><span>Assigned Finger</span><strong>{assignment ? fingerLabels[assignment.finger] : lastCode ? '未割り当て' : '—'}</strong></div>
      </div>
      <p className="event-note">— 未発火 / Not fired<br />keypressは互換性表示です。キーによっては発火しません。</p>
    </section>
  )
}
