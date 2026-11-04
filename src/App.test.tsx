import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { SETTINGS_KEY } from './hooks/useSettings'

function setup() {
  const view = render(<App />)
  const input = screen.getByRole('textbox')
  return { ...view, input }
}
function physical(type: 'keydown' | 'keypress' | 'keyup', target: EventTarget, code: string, key = 'a', keyCode = 65, charCode = 0, repeat = false) {
  act(() => { target.dispatchEvent(new KeyboardEvent(type, { bubbles: true, code, key, keyCode, charCode, repeat })) })
}
const keyElement = (code: string) => document.querySelector(`[data-code="${code}"]`)!

describe('Vue feature parity and React additions', () => {
  it('renders 109 JIS keys, transparent hands, original links, and focuses the input', () => {
    const { input } = setup()
    expect(document.querySelectorAll('[data-code]')).toHaveLength(109)
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('placeholder', 'CLICK THIS TEXT BOX')
    expect(screen.getByTestId('hands-overlay')).toHaveAttribute('fill', 'none')
    expect(document.querySelectorAll('[data-finger]')).toHaveLength(10)
    expect(screen.getByRole('link', { name: /UI Events/ })).toHaveAttribute('href', 'https://www.w3.org/TR/uievents-code/')
    expect(screen.getByRole('link', { name: /Key and Character/ })).toHaveAttribute('href', 'https://www.w3.org/2002/09/tests/keys.html')
    expect(screen.getByRole('link', { name: /Keyboard: keydown/ })).toHaveAttribute('href', 'https://javascript.info/keyboard-events')
  })

  it('switches to US 104 keys, persists layout, clears held keys and restores input focus', async () => {
    const { input } = setup()
    physical('keydown', input, 'KeyA')
    await userEvent.click(screen.getByRole('radio', { name: '英語 / English' }))
    expect(document.querySelectorAll('[data-code]')).toHaveLength(104)
    expect(document.querySelector('[data-code="IntlYen"]')).toBeNull()
    expect(keyElement('Backslash').querySelectorAll('tspan')[0]).toHaveTextContent('|')
    expect(keyElement('Backslash').querySelectorAll('tspan')[1]).toHaveTextContent('\\')
    expect(document.querySelectorAll('.keyboard-key.pressed')).toHaveLength(0)
    expect(input).toHaveFocus()
    expect(localStorage.getItem('keyboardLayout')).toBe('en')
  })

  it('independently displays all four native values for keydown, keypress and keyup', () => {
    const { input } = setup()
    physical('keydown', input, 'KeyA', 'a', 65, 0)
    physical('keypress', input, 'KeyA', 'a', 97, 97)
    physical('keyup', input, 'KeyA', 'a', 65, 0)
    for (const kind of ['keydown', 'keypress', 'keyup']) {
      const section = within(screen.getByRole('region', { name: kind }))
      expect(section.getByText('a')).toBeInTheDocument()
      expect(section.getByText('KeyA')).toBeInTheDocument()
      expect(section.getAllByText(kind === 'keypress' ? '97' : '65')).not.toHaveLength(0)
      if (kind !== 'keypress') expect(section.getByText('0')).toBeInTheDocument()
    }
    expect(screen.getByText('左手 / Left')).toBeInTheDocument()
    expect(screen.getByText('小指 / Pinky')).toBeInTheDocument()
  })

  it('distinguishes no keypress, numeric zero, and empty strings without synthesizing events', () => {
    const { input } = setup()
    physical('keydown', input, 'KeyA')
    physical('keypress', input, 'KeyA', 'a', 97, 97)
    physical('keydown', input, 'ShiftLeft', 'Shift', 16)
    expect(within(screen.getByRole('region', { name: 'keypress' })).getAllByText('—')).toHaveLength(4)
    physical('keyup', input, '', '', 0, 0)
    const up = within(screen.getByRole('region', { name: 'keyup' }))
    expect(up.getAllByText('""')).toHaveLength(2)
    expect(up.getAllByText('0')).toHaveLength(2)
  })

  it('updates typed input, preserves browser text editing and clears all associated state', async () => {
    const { input } = setup()
    await userEvent.type(input, 'test')
    expect(input).toHaveValue('test')
    expect(document.querySelector('#inputValue')).toHaveTextContent('inputValue: test')
    physical('keydown', input, 'KeyF', 'f')
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(document.querySelectorAll('.keyboard-key.pressed')).toHaveLength(0)
    for (const kind of ['keydown', 'keypress', 'keyup']) expect(within(screen.getByRole('region', { name: kind })).getByText('waiting')).toBeInTheDocument()
    expect(document.querySelectorAll('.finger.active')).toHaveLength(0)
  })

  it('does not record a stray Enter release after keyboard-activated Clear', () => {
    const { input } = setup()
    const clear = screen.getByRole('button', { name: 'Clear' })
    act(() => clear.focus())
    physical('keydown', clear, 'Enter', 'Enter', 13)
    fireEvent.click(clear)
    physical('keyup', input, 'Enter', 'Enter', 13)
    expect(within(screen.getByRole('region', { name: 'keyup' })).getByText('waiting')).toBeInTheDocument()
    physical('keydown', input, 'Enter', 'Enter', 13)
    physical('keyup', input, 'Enter', 'Enter', 13)
    expect(within(screen.getByRole('region', { name: 'keyup' })).getByText('received')).toBeInTheDocument()
  })

  it('highlights chords and left/right/numpad codes independently, ignoring repeated keydown for held state', () => {
    const { input } = setup()
    for (const code of ['ShiftLeft', 'ShiftRight', 'Digit1', 'Numpad1']) physical('keydown', input, code)
    physical('keydown', input, 'Numpad1', '1', 97, 0, true)
    expect(document.querySelectorAll('.keyboard-key.pressed')).toHaveLength(4)
    physical('keyup', input, 'ShiftLeft')
    physical('keyup', input, 'Numpad1')
    expect(keyElement('ShiftLeft')).toHaveAttribute('data-pressed', 'false')
    expect(keyElement('Numpad1')).toHaveAttribute('data-pressed', 'false')
    expect(keyElement('ShiftRight')).toHaveAttribute('data-pressed', 'true')
    expect(keyElement('Digit1')).toHaveAttribute('data-pressed', 'true')
  })

  it('moves independent fingers to exact key targets and restores the previous same-finger target', () => {
    const { input } = setup()
    physical('keydown', input, 'KeyF', 'f')
    physical('keydown', input, 'KeyT', 't')
    physical('keydown', input, 'KeyK', 'k')
    const left = document.querySelector('[data-finger="left-index"]')!
    const right = document.querySelector('[data-finger="right-middle"]')!
    expect(left).toHaveAttribute('data-target-code', 'KeyT')
    expect(left).toHaveAttribute('data-target-x', '274')
    expect(left).toHaveAttribute('data-target-y', '140')
    expect(right).toHaveAttribute('data-target-code', 'KeyK')
    physical('keyup', input, 'KeyT', 't')
    expect(left).toHaveAttribute('data-target-code', 'KeyF')
    physical('keyup', input, 'KeyF', 'f')
    expect(left).not.toHaveClass('active')
  })

  it('preserves Vue global highlights while event inspection stays scoped to the text box', () => {
    const { input } = setup()
    act(() => input.blur())
    physical('keydown', window, 'KeyA')
    expect(keyElement('KeyA')).toHaveClass('pressed')
    expect(within(screen.getByRole('region', { name: 'keydown' })).getByText('waiting')).toBeInTheDocument()
  })

  it('shows and resets the arrow hand pose without changing the six editing-key poses', () => {
    const { input } = setup()
    const right = document.querySelector('[data-hand="right"]')!
    const left = document.querySelector('[data-hand="left"]')!
    for (const code of ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight']) {
      physical('keydown', input, code, code)
      expect(right).toHaveAttribute('data-pose', 'arrows')
      expect(left).toHaveAttribute('data-pose', 'home')
      expect(keyElement(code)).toHaveClass('pressed')
      physical('keyup', input, code, code)
      expect(right).toHaveAttribute('data-pose', 'home')
    }
    for (const code of ['Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown']) {
      physical('keydown', input, code, code)
      expect(right).toHaveAttribute('data-pose', 'home')
      expect(document.querySelector('[data-finger="right-pinky"]')).toHaveAttribute('data-target-code', code)
      physical('keyup', input, code, code)
    }
    physical('keydown', input, 'ArrowDown', 'ArrowDown')
    fireEvent.click(screen.getByRole('button', { name: /Reset Hands/ }))
    expect(right).toHaveAttribute('data-pose', 'home')
    expect(document.querySelectorAll('.pressed, .finger.active')).toHaveLength(0)
    physical('keyup', input, 'ArrowDown', 'ArrowDown')
    physical('keydown', input, 'ArrowUp', 'ArrowUp')
    fireEvent(window, new Event('blur'))
    expect(right).toHaveAttribute('data-pose', 'home')
  })

  it('resets held keys on input blur, window blur and hidden documents', () => {
    const { input } = setup()
    physical('keydown', input, 'KeyA')
    act(() => input.blur())
    expect(keyElement('KeyA')).not.toHaveClass('pressed')
    physical('keydown', window, 'KeyA')
    fireEvent(window, new Event('blur'))
    expect(keyElement('KeyA')).not.toHaveClass('pressed')
    physical('keydown', window, 'KeyA')
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange'))
    expect(keyElement('KeyA')).not.toHaveClass('pressed')
    hidden.mockRestore()
  })

  it('handles IME compatibility warnings and composed text without fabricating keypress', () => {
    const { input } = setup()
    physical('keydown', input, 'KeyA', 'Process', 229)
    expect(screen.getByText('半角英数字モードで入力してください')).toBeInTheDocument()
    expect(screen.getByText('Please use half-width alphanumeric input.')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'keydown' })).getByText('waiting')).toBeInTheDocument()
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '日本語' } })
    fireEvent.compositionEnd(input)
    expect(input).toHaveValue('日本語')
    expect(document.querySelectorAll('.pressed')).toHaveLength(0)
    physical('keydown', input, 'ShiftLeft', 'Shift', 16)
    expect(screen.queryByText('半角英数字モードで入力してください')).toBeNull()
  })

  it('persists hands, opacity, speed and glow and restores them on remount', async () => {
    const { unmount } = setup()
    fireEvent.change(screen.getByRole('slider', { name: /Hand Opacity/ }), { target: { value: '32' } })
    expect(screen.getByTestId('hands-overlay')).toHaveAttribute('opacity', '0.32')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Animation Speed' }), 'fast')
    await userEvent.click(screen.getByRole('checkbox', { name: /Glow Effect/ }))
    expect(document.querySelector('.keyboard')).not.toHaveClass('glow-enabled')
    await userEvent.click(screen.getByRole('checkbox', { name: /Show Hands/ }))
    expect(screen.queryByTestId('hands-overlay')).toBeNull()
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY)!)).toMatchObject({ opacity: 32, speed: 'fast', showHands: false, glow: false })
    unmount()
    setup()
    expect(screen.getByRole('slider')).toHaveValue('32')
    expect(screen.getByRole('combobox')).toHaveValue('fast')
    expect(screen.getByRole('checkbox', { name: /Show Hands/ })).not.toBeChecked()
  })

  it('Reset Hands releases keys and returns fingers home while preserving input and event history', () => {
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'f' } })
    physical('keydown', input, 'KeyT', 't')
    fireEvent.click(screen.getByRole('button', { name: /Reset Hands/ }))
    expect(document.querySelectorAll('.pressed, .finger.active')).toHaveLength(0)
    expect(input).toHaveValue('f')
    expect(within(screen.getByRole('region', { name: 'keydown' })).getByText('KeyT')).toBeInTheDocument()
  })

  it('restores Vue saved layout and tolerates invalid or inaccessible storage', () => {
    localStorage.setItem('keyboardLayout', 'en')
    localStorage.setItem(SETTINGS_KEY, '{"opacity":500,"speed":"invalid"}')
    const { unmount } = setup()
    expect(screen.getByRole('radio', { name: '英語 / English' })).toBeChecked()
    expect(screen.getByRole('slider')).toHaveValue('100')
    expect(screen.getByRole('combobox')).toHaveValue('normal')
    unmount()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    setup()
    expect(screen.getByRole('radio', { name: '日本語 / Japanese' })).toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: /Show Hands/ }))
    expect(screen.queryByTestId('hands-overlay')).toBeNull()
  })

  it('removes native event listeners on unmount and re-focuses after pageshow', () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const { input, unmount } = setup()
    act(() => input.blur())
    fireEvent(window, new Event('pageshow'))
    expect(input).toHaveFocus()
    unmount()
    for (const kind of ['keydown', 'keypress', 'keyup', 'blur', 'pageshow']) expect(remove).toHaveBeenCalledWith(kind, expect.any(Function))
  })
})
