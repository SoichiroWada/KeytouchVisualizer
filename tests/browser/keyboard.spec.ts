import { expect, test } from '@playwright/test'

test('real native events, simultaneous modifiers, animated paths and Clear', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/')
  const input = page.getByRole('textbox')
  await expect(input).toBeFocused()
  await page.keyboard.down('ShiftLeft')
  await page.keyboard.down('KeyA')
  await expect(page.locator('[data-code="ShiftLeft"]')).toHaveClass(/pressed/)
  await expect(page.locator('[data-code="KeyA"]')).toHaveClass(/pressed/)
  await expect(page.getByRole('region', { name: 'keydown', exact: true })).toContainText('KeyA')
  await expect(page.getByRole('region', { name: 'keypress', exact: true })).toContainText('65')
  await page.keyboard.up('KeyA')
  await page.keyboard.up('ShiftLeft')
  await expect(page.locator('.keyboard-key.pressed')).toHaveCount(0)
  const finger = page.locator('[data-finger="left-index"]')
  const path = finger.locator('path').first()
  const homePath = await path.getAttribute('d')
  await page.keyboard.down('KeyT')
  await expect(finger).toHaveAttribute('data-target-code', 'KeyT')
  await expect(path).not.toHaveAttribute('d', homePath!)
  await page.screenshot({ path: 'test-results/typing-1920.png', fullPage: true })
  await page.keyboard.up('KeyT')
  await page.keyboard.type(' quick typing 123')
  await page.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(page.locator('.keyboard-key.pressed')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('keyboard-activated Clear has no stray release event', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox').fill('text')
  await page.getByRole('button', { name: 'Clear', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('textbox')).toBeFocused()
  await expect(page.getByRole('region', { name: 'keyup', exact: true })).toContainText('waiting')
})

for (const [width, height] of [[1920, 1080], [1600, 900], [1440, 900], [1366, 768], [390, 844]]) {
  test(`layout and SVG coordinate alignment at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.locator('[data-code]')).toHaveCount(109)
    await expect(page.getByTestId('hands-overlay')).toHaveAttribute('fill', 'none')
    const positions = await page.evaluate(() => {
      const key = document.querySelector('[data-code="KeyF"] rect') as SVGRectElement
      const finger = document.querySelector('[data-finger="left-index"]') as SVGGElement
      const matrix = key.getScreenCTM()!
      const point = new DOMPoint(Number(finger.dataset.targetX), Number(finger.dataset.targetY)).matrixTransform(matrix)
      const bounds = key.getBoundingClientRect()
      return { dx: Math.abs(point.x - (bounds.x + bounds.width / 2)), dy: Math.abs(point.y - (bounds.y + bounds.height / 2)) }
    })
    expect(positions.dx).toBeLessThan(.1)
    expect(positions.dy).toBeLessThan(.1)
    if (width === 1920) expect((await page.locator('.keyboard').boundingBox())!.width).toBeCloseTo(1210, 0)
    if (width === 390) {
      const scroll = page.locator('.keyboard-scroll')
      expect(await scroll.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
      await scroll.evaluate(element => { element.scrollLeft = element.scrollWidth })
      await expect(page.locator('[data-code="NumpadEnter"]')).toBeVisible()
    }
    await page.screenshot({ path: `test-results/layout-${width}.png`, fullPage: true })
  })
}

test('US/JIS switching and all persistent controls in a real browser', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: '英語 / English' }).check()
  await expect(page.locator('[data-code]')).toHaveCount(104)
  await page.screenshot({ path: 'test-results/us-layout.png', fullPage: true })
  await page.getByRole('combobox').selectOption('fast')
  await page.getByRole('slider').fill('40')
  await page.getByRole('checkbox', { name: /Glow Effect/ }).uncheck()
  await page.reload()
  await expect(page.getByRole('radio', { name: '英語 / English' })).toBeChecked()
  await expect(page.getByRole('slider')).toHaveValue('40')
  await expect(page.getByRole('combobox')).toHaveValue('fast')
  await expect(page.locator('.keyboard')).not.toHaveClass(/glow-enabled/)
  await page.getByRole('checkbox', { name: /Show Hands/ }).uncheck()
  await expect(page.getByTestId('hands-overlay')).toHaveCount(0)
})

test('reduced-motion preference preserves immediate finger targeting', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.keyboard.down('KeyT')
  await expect(page.locator('[data-finger="left-index"]')).toHaveAttribute('data-target-code', 'KeyT')
  await expect(page.locator('[data-code="KeyT"]')).toHaveClass(/pressed/)
  await page.keyboard.up('KeyT')
  await expect(page.locator('.finger.active')).toHaveCount(0)
})

test('rapid native typing and repeats leave no stuck keys or fingers', async ({ page }) => {
  await page.goto('/')
  const phrase = 'asdfjkl qwerty 1234567890 '
  const text = phrase.repeat(12)
  await page.keyboard.type(text, { delay: 0 })
  await expect(page.getByRole('textbox')).toHaveValue(text)
  await page.keyboard.down('KeyT')
  for (let i = 0; i < 30; i++) await page.keyboard.down('KeyT')
  await expect(page.locator('.keyboard-key.pressed')).toHaveCount(1)
  await expect(page.locator('.finger.active')).toHaveCount(1)
  await page.keyboard.up('KeyT')
  await expect(page.locator('.keyboard-key.pressed')).toHaveCount(0)
  await expect(page.locator('.finger.active')).toHaveCount(0)
})

for (const layout of ['ja', 'en'] as const) {
  test(`whole-hand arrow movement, chords and unchanged editing keys on ${layout}`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    if (layout === 'en') await page.getByRole('radio', { name: '英語 / English' }).check()
    const right = page.locator('[data-hand="right"]')
    const palm = right.locator('.palm')
    const leftPalm = page.locator('[data-hand="left"] .palm')
    const originalLeft = await leftPalm.getAttribute('d')
    const originalRight = await palm.getAttribute('d')
    for (const [code, finger] of [
      ['ArrowLeft', 'index'], ['ArrowUp', 'middle'], ['ArrowDown', 'middle'], ['ArrowRight', 'ring'],
    ]) {
      await page.keyboard.down(code)
      await expect(right).toHaveAttribute('data-pose', 'arrows')
      await expect(page.locator(`[data-code="${code}"]`)).toHaveClass(/pressed/)
      await expect(page.locator(`[data-finger="right-${finger}"]`)).toHaveAttribute('data-target-code', code)
      await expect.poll(() => palm.evaluate(element => (element as SVGPathElement).getBBox().x)).toBeGreaterThan(650)
      await expect(leftPalm).toHaveAttribute('d', originalLeft!)
      await page.keyboard.up(code)
      await expect(right).toHaveAttribute('data-pose', 'home')
    }
    await page.keyboard.down('ArrowLeft')
    await page.keyboard.down('ArrowUp')
    await page.keyboard.down('ArrowRight')
    await expect(page.locator('.keyboard-key.pressed')).toHaveCount(3)
    await expect(page.locator('.finger.active')).toHaveCount(3)
    await page.screenshot({ path: `test-results/arrow-chord-${layout}.png`, fullPage: true })
    await page.keyboard.up('ArrowLeft')
    await page.keyboard.up('ArrowUp')
    await expect(right).toHaveAttribute('data-pose', 'arrows')
    await page.keyboard.up('ArrowRight')
    await expect(palm).toHaveAttribute('d', originalRight!)
    for (const code of ['Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown']) {
      await page.keyboard.down(code)
      await expect(right).toHaveAttribute('data-pose', 'home')
      await expect(palm).toHaveAttribute('d', originalRight!)
      await expect(page.locator('[data-finger="right-pinky"]')).toHaveAttribute('data-target-code', code)
      await page.keyboard.up(code)
    }
  })
}
