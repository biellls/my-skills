#!/usr/bin/env node
// Standalone real-browser regression: starts and stops its own temporary workspace.
// PLAYWRIGHT_MODULE and CHROME_PATH override the local smoke-test installation.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/tmp/sketchpad-playwright/node_modules/playwright');
const { createServer } = require('./server');

(async () => {
  const data = await fs.mkdtemp(path.join(os.tmpdir(), 'sketchpad-regression-'));
  const runtime = await createServer({ data, port: 0 });
  let browser;
  try {
    const url = `http://127.0.0.1:${runtime.address.port}`;
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const getScene = async () => (await (await page.request.get(`${url}/api/scene`)).json());
    await page.goto(url);
    const iframe = page.locator('.artifact-card iframe');
    await iframe.waitFor();
    assert.equal(await iframe.getAttribute('sandbox'), 'allow-scripts');
    const frame = page.frameLocator('.artifact-card iframe');
    await frame.locator('#idea-question').waitFor();
    const isolation = await frame.locator('body').evaluate(() => { try { return Boolean(parent.document.body); } catch { return false; } });
    assert.equal(isolation, false, 'artifact must not read or manipulate the privileged shell');
    const width = await frame.locator('main').evaluate(el => el.getBoundingClientRect().width);
    assert.ok(width > 400, `sandboxed artifact should stay readable, got ${width}px`);
    await frame.locator('#idea-question').selectText();
    await frame.locator('#idea-question').dispatchEvent('mouseup');
    await page.getByText('Selected:', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Comment on selected passage' }).click();
    await page.locator('textarea').fill('A real anchored browser comment');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByText('A real anchored browser comment', { exact: true }).waitFor();
    await page.locator('textarea').fill('Keep this unfinished thought');
    await page.reload();
    await page.waitForFunction(() => document.querySelector('textarea')?.value === 'Keep this unfinished thought');
    await page.locator('textarea').fill('');

    // Closing the progressive-disclosure editor must not reset its scene to initialData.
    const initial = await getScene();
    await page.getByRole('button', { name: 'Open diagram editor' }).click();
    const canvas = page.locator('.excalidraw-container canvas').last();
    await canvas.waitFor();
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    await page.mouse.click(box.x + 500, box.y + 300);
    await page.keyboard.press('r');
    await page.mouse.move(box.x + 520, box.y + 320);
    await page.mouse.down(); await page.mouse.move(box.x + 700, box.y + 400); await page.mouse.up();
    await page.getByText('unsaved edit', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Close editor' }).click();
    await page.getByRole('button', { name: 'Open diagram editor' }).click();
    await page.getByRole('button', { name: 'Save diagram + preview' }).click();
    await page.getByText('The diagram and its preview are up to date.', { exact: false }).waitFor();
    const saved = await getScene();
    assert.ok(saved.scene.elements.length > initial.scene.elements.length, 'close/reopen must preserve the new drawing');
    assert.equal(saved.revision, 1);
    const png = await page.request.get(`${url}/api/scene/preview.png`);
    assert.equal(png.status(), 200);
    assert.deepEqual((await png.body()).subarray(0, 8), Buffer.from([137,80,78,71,13,10,26,10]));
    await page.reload();
    await page.getByRole('button', { name: 'Open diagram editor' }).click();
    await page.getByRole('button', { name: 'Save diagram + preview' }).click();
    await page.getByText('The diagram and its preview are up to date.', { exact: false }).waitFor();
    assert.deepEqual((await getScene()).scene.elements.map(e => e.id), saved.scene.elements.map(e => e.id));

    // A failed PNG upload must not strand the editor on an old scene revision.
    await page.route('**/api/scene/preview?*', route => route.fulfill({ status: 503, body: 'preview unavailable' }));
    await page.getByRole('button', { name: 'Save diagram + preview' }).click();
    await page.getByText('but preview failed', { exact: false }).waitFor();
    assert.equal((await getScene()).revision, 3);
    await page.unroute('**/api/scene/preview?*');
    await page.getByRole('button', { name: 'Save diagram + preview' }).click();
    await page.getByText('The diagram and its preview are up to date.', { exact: false }).waitFor();
    assert.equal((await getScene()).revision, 4);
    await page.getByRole('button', { name: 'Close editor' }).click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: process.env.SKETCHPAD_SCREENSHOT || '/tmp/sketchpad-parent-verified.png' });

    // Newly authored HTML gets the bridge automatically, not only the bundled demo.
    const replacement = '<!doctype html><h1 id="new-question">A different idea</h1><p>Custom HTML without a built-in SDK.</p>';
    const updated = await page.request.put(`${url}/api/artifact`, { data: { baseRevision: 0, html: replacement } });
    assert.equal(updated.status(), 200);
    await frame.locator('#new-question').waitFor();
    await frame.locator('#new-question').selectText();
    await frame.locator('#new-question').dispatchEvent('mouseup');
    await page.getByText('Selected: “A different idea”', { exact: false }).waitFor();
    assert.equal(await fs.readFile(path.join(data, 'artifact.html'), 'utf8'), replacement, 'preview bridge must not mutate source HTML');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ sandboxIsolation: true, readableArtifact: true, realSelectionBridge: true, unsavedCloseReopen: true, saveReloadPreservesElements: true, draftRecovery: true, previewFailureRecovery: true, png: true, arbitraryHtmlSelection: true }));
  } finally {
    await browser?.close();
    runtime.server.closeAllConnections();
    await new Promise(resolve => runtime.server.close(resolve));
    await fs.rm(data, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
