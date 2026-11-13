'use strict';
// Developer check: uses an existing Playwright and Chrome installation.
const {chromium} = require('playwright');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');

(async () => {
  const isolated = await fs.mkdtemp(path.join(os.tmpdir(), 'bridge-end-standalone-'));
  const evidence = path.join(__dirname, 'evidence');
  const html = path.join(isolated, 'BridgeEndPave.html');
  await fs.copyFile(path.join(__dirname, '../../BridgeEndPave.html'), html);
  const chrome = process.env.CHROME_PATH || (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  const browser = await chromium.launch({executablePath: chrome, headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1080}, acceptDownloads: true});
    const errors = [], network = [], dialogs = [];
    let acceptReplacement = true;
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      if (dialog.type() === 'confirm' && !acceptReplacement) dialog.dismiss();
      else dialog.accept();
    });
    const open = async project => {
      await page.locator('#open-file').setInputFiles({name: 'comparison.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(project))});
      await page.waitForFunction(() => document.querySelector('#open-file').value === '');
    };
    const download = async id => {
      const [file] = await Promise.all([page.waitForEvent('download'), page.locator(id).click()]);
      return fs.readFile(await file.path(), 'utf8');
    };
    await page.goto(pathToFileURL(html).href);
    assert.equal(await page.locator('#pavement').textContent(), '126.48');
    assert.equal(await page.locator('#expansion-joint').textContent(), '58.73');
    assert.equal(await page.locator('#grooving').textContent(), '123.33');
    assert.equal(await page.locator('#rail32').textContent(), '20.00');
    assert.equal(await page.locator('#plan-diagram title').count(), 1);
    assert.equal(await page.locator('#width-diagram title').count(), 1);
    assert.equal(await page.locator('#section-diagram title').count(), 1);
    await page.screenshot({path: path.join(evidence, 'browser-default.png'), fullPage: true});

    await page.locator('#project-number').fill('SYNTHETIC BE-1 QA');
    await page.locator('#station').fill('100+00.00');
    const saved = JSON.parse(await download('#save-project'));
    assert.equal(saved.schema, 'bridge-end-pave-project-v1');
    assert.equal(saved.ends.length, 1);
    assert.equal(saved.ends[0].station, '100+00.00');
    await page.locator('#w1').fill('');
    assert.equal(await page.locator('#result-content').isVisible(), false);
    for (const id of ['#save-project', '#export-text', '#print-report']) assert.equal(await page.locator(id).isDisabled(), true);
    assert.ok(!(await page.locator('#schedule-total').textContent()).includes('126.48'));
    await page.locator('#w1').fill('30');
    await page.locator('#skew').fill('-1');
    assert.equal(await page.locator('#input-error').isVisible(), true);
    await page.locator('#skew').fill('45');
    assert.match(await page.locator('#geometry-mode').textContent(), /10/);
    await page.locator('#add-end').click();
    assert.equal(await page.locator('#end-select option').count(), 2);
    await page.locator('#remove-end').click();
    assert.equal(await page.locator('#end-select option').count(), 1);
    await open(saved);
    assert.equal(await page.locator('#skew').inputValue(), '10');
    assert.equal(await page.locator('#pavement').textContent(), '126.48');

    const project = {...saved, date: '2026-11-12', ends: [0,32,42].map((railHeight, i) => ({id: String(i+1), station: `${100+i}+00`, w1: 12, w2: 12, skew: 45, railHeight}))};
    await open(project);
    assert.equal(await page.locator('#schedule-rows tr').count(), 3);
    const totals = await page.locator('#schedule-total').textContent();
    for (const value of ['197.08', '111.49', '190.61']) assert.ok(totals.includes(value), totals);
    await page.locator('#end-select').selectOption('1');
    assert.equal(await page.locator('#pavement').textContent(), '67.08');
    await page.locator('#end-select').selectOption('2');
    assert.equal(await page.locator('#pavement').textContent(), '67.50');
    assert.equal(await page.locator('#rail42').textContent(), '20.00');

    // A bad import and a cancelled replacement must leave current user data intact.
    await page.locator('#station').fill('KEEP-MY-EDITS');
    const invalid = [
      {...project, ends: [{...project.ends[0], w1: true}]},
      {...project, date: '2026-02-30'},
      {...project, ends: []},
      {...project, schema: 'wrong-format'},
      {...project, ends: [{...project.ends[0], railHeight: 31}]},
      {...project, ends: [{...project.ends[0], w1: 1e14}]},
      {...project, ends: Array.from({length: 201}, () => project.ends[0])}
    ];
    for (const bad of invalid) {
      const count = dialogs.length;
      await open(bad);
      assert.equal(dialogs.length, count + 1);
      assert.equal(await page.locator('#station').inputValue(), 'KEEP-MY-EDITS');
      assert.equal(await page.locator('#schedule-rows tr').count(), 3);
    }
    acceptReplacement = false;
    await open(saved);
    assert.equal(await page.locator('#station').inputValue(), 'KEEP-MY-EDITS');
    acceptReplacement = true;
    await open(project);
    await page.locator('#end-id').fill('edited');
    assert.equal(await page.locator('#schedule-rows tr').count(), 3);
    assert.equal(await page.locator('#schedule-total').textContent(), totals);
    const report = await download('#export-text');
    assert.match(report, /197\.08/);
    assert.match(report, /111\.49/);
    assert.match(report, /190\.61/);
    const reopened = JSON.parse(await download('#save-project'));
    assert.equal(reopened.ends.length, 3);
    await open(reopened);

    await page.screenshot({path: path.join(evidence, 'browser-desktop.png'), fullPage: true});
    await page.emulateMedia({colorScheme: 'dark'});
    await page.screenshot({path: path.join(evidence, 'browser-dark.png'), fullPage: true});
    await page.emulateMedia({colorScheme: 'light'});
    await page.setViewportSize({width: 390, height: 844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({path: path.join(evidence, 'browser-mobile.png'), fullPage: true});
    await page.setViewportSize({width: 1440, height: 1080});

    const escaped = {...project, projectNumber: '<script>window.injected=true</script>', ends: project.ends.map(end => ({...end, station: '<img src=x onerror=window.injected=true>'}))};
    await open(escaped);
    assert.equal(await page.evaluate(() => window.injected), undefined);
    assert.equal(await page.locator('#report img').count(), 0);
    assert.ok((await page.locator('#report').textContent()).includes(escaped.projectNumber));
    await open({...project, ends: Array.from({length: 12}, (_, i) => ({...project.ends[i % 3], id: String(i+1)}))});
    await page.pdf({path: path.join(evidence, 'report-sample.pdf'), format: 'Letter', printBackground: true, preferCSSPageSize: true});
    assert.equal(await page.locator('#schedule-rows tr').count(), 12);
    assert.deepEqual(network, []);
    assert.deepEqual(errors, []);
    console.log('PASS: isolated file://, legacy sample, all rails/clamp, live validation, edit without double counting, JSON round-trip, rejected/cancelled imports preserve work, text export, SVG accessibility, responsive light/dark, escaped labels, 12-end PDF, no network or browser errors.');
  } finally {
    await browser.close();
    // Only remove the task-created temporary folder after checking its exact parent/prefix.
    assert.equal(path.dirname(isolated), os.tmpdir());
    assert.ok(path.basename(isolated).startsWith('bridge-end-standalone-'));
    await fs.rm(isolated, {recursive: true, force: true});
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
