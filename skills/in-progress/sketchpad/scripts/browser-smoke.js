#!/usr/bin/env node
// Optional visual smoke test. Install Playwright outside this skill first:
// npm --prefix /tmp/sketchpad-playwright install playwright
const { chromium } = require('/tmp/sketchpad-playwright/node_modules/playwright');
const url = process.env.SKETCHPAD_URL || 'http://127.0.0.1:4317';
const output = process.env.SKETCHPAD_SCREENSHOT || '/tmp/sketchpad-browser.png';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url); await page.locator('.excalidraw-container').waitFor();
  const frame = page.frames().find((candidate) => candidate.url().includes('/artifact'));
  await frame.locator('#idea-question').selectText();
  await frame.evaluate(() => { const selection = getSelection(); parent.postMessage({ type: 'sketchpad-selection', anchor: { kind: 'html', id: 'idea-question', quote: selection.toString() } }, '*'); });
  const commentDialog = page.waitForEvent('dialog').then((dialog) => dialog.accept('Human anchored note'));
  await page.getByRole('button', { name: 'Comment on selection' }).click(); await commentDialog;
  await page.locator('textarea').fill('A question from the browser'); await page.getByRole('button', { name: 'Send message', exact: true }).click({ force: true });
  await page.evaluate(() => fetch('/api/proposals', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ author: 'agent', message: '**Proposal:** keep the sketch.\n\n**Reason:** it makes the trade-off concrete.', anchor: { kind: 'diagram', id: 'question' } }) }));
  await page.waitForTimeout(1700); if (!await page.getByText('A question from the browser').isVisible()) throw new Error('browser message did not appear'); if (!await page.getByText('Proposal:', { exact: false }).first().isVisible()) throw new Error('agent proposal did not appear');
  const canvas = page.locator('.excalidraw-container canvas').last(); const box = await canvas.boundingBox(); await page.mouse.click(box.x + 500, box.y + 300); await page.keyboard.press('r'); await page.mouse.move(box.x + 520, box.y + 320); await page.mouse.down(); await page.mouse.move(box.x + 700, box.y + 400); await page.mouse.up();
  await page.getByRole('button', { name: 'Save scene + PNG preview' }).click({ force: true }); await page.waitForTimeout(500); const preview = await page.request.get(`${url}/api/scene/preview.png`); if (!preview.ok()) throw new Error('official PNG preview was not saved');
  await page.screenshot({ path: output, fullPage: true }); await page.reload(); await page.locator('.excalidraw-container').waitFor();
  if (errors.length) throw new Error(`browser errors: ${errors.join('; ')}`);
  console.log(JSON.stringify({ mounted: true, comment: true, proposal: true, editedAndReloaded: true, officialPng: true, screenshot: output })); await browser.close();
})().catch((error) => { console.error(error.message); process.exit(1); });
