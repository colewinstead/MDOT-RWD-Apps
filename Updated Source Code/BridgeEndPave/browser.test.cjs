'use strict';
// Developer check: uses an existing Playwright and Chrome installation.
const {chromium} = require('playwright');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const engine = require('./calculations.js');

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
    page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
    page.on('request', request => {if (/^https?:/.test(request.url())) network.push(request.url());});
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      if (dialog.type() === 'confirm' && !acceptReplacement) dialog.dismiss(); else dialog.accept();
    });
    const open = async project => {
      await page.locator('#open-file').setInputFiles({name: 'comparison.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(project))});
      await page.waitForFunction(() => document.querySelector('#open-file').value === '');
    };
    const download = async id => {
      const [file] = await Promise.all([page.waitForEvent('download'), page.locator(id).click()]);
      return fs.readFile(await file.path(), 'utf8');
    };
    const value = id => page.locator(id).textContent().then(text => Number(text.replace(/,/g, '').trim()));
    const end = (drawing, railHeight, extra = {}) => ({id: '1', station: '100+00', drawing, railHeight, w1: 12, w2: 12, skew: 0, pavementThickness: ['BE-1', 'SDBE-1'].includes(drawing) ? 12 : 9, roadwayPavement: 'asphalt', groovingIncluded: true, ...extra});
    await page.goto(pathToFileURL(html).href);
    assert.equal(await page.locator('#drawing option').count(), 5);
    assert.equal(await page.locator('#drawing').inputValue(), 'SDBE-1A');
    assert.equal(await page.locator('#grooving-included').isChecked(), false);
    assert.equal(await value('#pavement'), 126.48);
    assert.equal(await value('#grooving'), 0);
    for (const id of ['plan-diagram', 'width-diagram', 'section-diagram', 'rail-diagram']) assert.equal(await page.locator(`#${id} title`).count(), 1);
    await page.screenshot({path: path.join(evidence, 'browser-default.png'), fullPage: true});
    const v1 = {schema: 'bridge-end-pave-project-v1', projectNumber: 'OLD PROJECT', county: 'Test county', preparedBy: 'QA', date: '2026-11-14', ends: [{id: 'original', station: '100+00', w1: 30, w2: 25, skew: 10, railHeight: 32}]};
    await open(v1);
    assert.equal(await page.locator('#drawing').inputValue(), 'LEGACY');
    assert.equal(await value('#pavement'), 126.48);
    assert.equal(await value('#expansion-joint'), 58.73);
    assert.equal(await value('#grooving'), 123.33);
    assert.equal(await page.locator('#grooving-included').isChecked(), true);
    const migrated = JSON.parse(await download('#save-project'));
    assert.equal(migrated.schema, 'bridge-end-pave-project-v2');
    assert.equal(migrated.ends[0].drawing, 'LEGACY');
    assert.equal(migrated.projectNumber, v1.projectNumber);
    const project = {...migrated, projectNumber: 'SYNTHETIC ALL-DRAWING QA'};
    // Independent zero-skew fixtures: paving, grooving, bridge joint, bridge-plan seal.
    const cases = [
      ['LEGACY',0,55.56,55.56,25,0], ['LEGACY',32,57.59,54.44,26.83,0], ['LEGACY',42,57.78,54.44,27,0],
      ['BE-1',33.5,57.59,0,0,0], ['BE-1',43.5,57.78,0,0,0],
      ['BE-2',33.5,57.59,0,26.83,0], ['BE-2',43.5,57.78,0,27,0],
      ['SDBE-1A',32,57.59,54.44,26.83,0], ['SDBE-1A',42,57.78,54.44,27,0],
      ['SDBE-1',37.5,56.11,8,0,24], ['SDBE-1',43.5,56.30,8,0,24]
    ];
    for (const [drawing, rail, pavement, grooving, bridgeJoint, seal] of cases) {
      await open({...project, ends: [end(drawing, rail)]});
      assert.equal(await value('#pavement'), pavement, `${drawing}/${rail}: paving`);
      assert.equal(await value('#grooving'), grooving, `${drawing}/${rail}: grooving`);
      assert.equal(await value('#bridge-expansion-joint'), bridgeJoint, `${drawing}/${rail}: bridge joint`);
      assert.equal(await value('#bridge-joint-seal'), seal, `${drawing}/${rail}: bridge seal`);
      assert.equal(await value('#roadway-expansion-joint'), 0);
      assert.equal(await value('#rail-length'), rail ? 20 : 0);
      const available = await page.locator('#rail-height option').evaluateAll(options => options.map(option => Number(option.value)));
      assert.deepEqual(available, engine.drawings.find(item => item.id === drawing).railHeights);
      if (drawing !== 'LEGACY' && rail === available[0]) await page.locator('#result-content').screenshot({path:path.join(evidence,`browser-${drawing}.png`)});
      if (drawing !== 'LEGACY') {
        await page.locator('#roadway-pavement').selectOption('concrete');
        assert.equal(await value('#roadway-expansion-joint'), drawing === 'SDBE-1' ? 24 : 25);
      }
      await page.locator('#grooving-included').uncheck();
      assert.equal(await value('#grooving'), 0);
    }
    await page.locator('#drawing').selectOption('SDBE-1A');
    await page.locator('#rail-height').selectOption('32');
    await page.locator('#pavement-thickness').selectOption('12');
    const beforeThickness = await value('#pavement');
    await page.locator('#pavement-thickness').selectOption('9');
    assert.equal(await value('#pavement'), beforeThickness);
    await page.locator('#station').fill('KEEP-FAMILY-CHANGE');
    await page.locator('#drawing').selectOption('BE-1');
    assert.equal(await page.locator('#station').inputValue(), 'KEEP-FAMILY-CHANGE');
    assert.equal(await page.locator('#pavement-thickness').inputValue(), '12');
    assert.equal(await page.locator('#rail-height').inputValue(), '33.5');
    const mixed = {...project, ends: cases.map(([drawing, rail], i) => end(drawing, rail, {id: String(i+1), station: `${100+i}+00`, skew: 45, roadwayPavement: 'concrete'}))};
    await open(mixed);
    assert.equal(await page.locator('#schedule-rows tr').count(), cases.length);
    const expected = engine.totals(mixed.ends.map(engine.calculate));
    const totalText = await page.locator('#schedule-total').textContent();
    for (const key of ['pavement','grooving','bridgeExpansionJoint','roadwayExpansionJoint','bridgeJointSeal','railLength']) assert.ok(totalText.replace(/,/g, '').includes(expected[key].toFixed(2)), `${key} total missing`);
    const railsText = await page.locator('#rail-totals').textContent();
    for (const height of [32,33.5,37.5,42,43.5]) assert.ok(railsText.includes(String(height)));
    const detailText = await page.locator('#rail-detail-totals').textContent();
    assert.ok(detailText.includes('BER-2'));
    assert.ok(detailText.includes('SDBER-2'));
    const report = await download('#export-text');
    for (const drawing of ['BE-1','BE-2','SDBE-1','SDBE-1A']) assert.ok(report.includes(drawing));
    assert.ok(report.includes(expected.pavement.toFixed(2)));
    assert.ok(report.includes('BER-2') && report.includes('SDBER-2'));
    const saved = JSON.parse(await download('#save-project'));
    assert.deepEqual(saved.ends, mixed.ends);
    await page.locator('#end-id').fill('edited');
    assert.equal(await page.locator('#schedule-rows tr').count(), cases.length);
    assert.equal(await page.locator('#schedule-total').textContent(), totalText);
    await page.locator('#w1').fill('');
    assert.equal(await page.locator('#result-content').isVisible(), false);
    for (const id of ['#save-project','#export-text','#print-report']) assert.equal(await page.locator(id).isDisabled(), true);
    assert.equal((await page.locator('#schedule-total').textContent()).trim(), '');
    await page.locator('#w1').fill('12');
    await page.locator('#add-end').click();
    assert.equal(await page.locator('#end-select option').count(), cases.length+1);
    await page.locator('#remove-end').click();
    assert.equal(await page.locator('#end-select option').count(), cases.length);
    await page.locator('#station').fill('PRESERVE MY EDITS');
    const badProjects = [
      {...saved, ends: [{...saved.ends[0], w1: true}]}, {...saved, ends: [end('BE-1',32)]},
      {...saved, ends: [end('SDBE-1',37.5,{pavementThickness:9})]},
      {...saved, ends: [end('SDBE-1A',32,{groovingIncluded:'yes'})]},
      {...saved, ends: [end('SDBE-1A',32,{roadwayPavement:'gravel'})]},
      {...saved, date:'2026-02-30'}, {...saved, schema:'wrong'}, {...saved, ends:[]},
      {...saved, ends: [end('SDBE-1A',32,{w1:1e14})]},
      {...saved, ends: Array.from({length:201},()=>end('SDBE-1A',32))}
    ];
    for (const bad of badProjects) {
      const count = dialogs.length;
      await open(bad);
      assert.equal(dialogs.length, count+1);
      assert.equal(await page.locator('#station').inputValue(), 'PRESERVE MY EDITS');
    }
    acceptReplacement = false;
    await open(v1);
    assert.equal(await page.locator('#station').inputValue(), 'PRESERVE MY EDITS');
    acceptReplacement = true;
    await open(saved);
    // The HTML alone must contain and display every inspected reference sheet.
    await page.locator('#source-sheet').evaluate(select => select.closest('details').open = true);
    const sheets = await page.locator('#source-sheet option').evaluateAll(options => options.map(option => option.value));
    assert.equal(sheets.length, 12);
    for (const sheet of sheets) {
      await page.locator('#source-sheet').selectOption(sheet);
      await page.waitForFunction(() => {const image=document.querySelector('#source-image'); return image.complete && image.naturalWidth>0;});
      assert.ok((await page.locator('#source-image').getAttribute('src')).startsWith('data:image/png;base64,'));
      assert.ok((await page.locator('#source-caption').textContent()).includes(sheet));
    }
    await page.locator('#source-sheet').evaluate(select => select.closest('details').open = false);
    await page.screenshot({path:path.join(evidence,'browser-desktop.png'),fullPage:true});
    await page.emulateMedia({colorScheme:'dark'});
    await page.screenshot({path:path.join(evidence,'browser-dark.png'),fullPage:true});
    await page.emulateMedia({colorScheme:'light'});
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:path.join(evidence,'browser-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1080});
    await open({...saved, projectNumber:'<script>window.injected=true</script>', ends:saved.ends.map(record=>({...record,station:'<img src=x onerror=window.injected=true>'}))});
    assert.equal(await page.evaluate(()=>window.injected),undefined);
    assert.equal(await page.locator('#report img').count(),0);
    assert.ok((await page.locator('#report').textContent()).includes('<script>window.injected=true</script>'));
    await open(saved);
    await page.pdf({path:path.join(evidence,'report-sample.pdf'),format:'Letter',printBackground:true,preferCSSPageSize:true});
    // Git may check out the standalone HTML with Windows line endings; CSP must still work.
    await fs.writeFile(html,(await fs.readFile(html,'utf8')).replace(/\r?\n/g,'\r\n'));
    const windowsPage = await browser.newPage();
    windowsPage.on('pageerror',error=>errors.push(error.message));
    windowsPage.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await windowsPage.goto(pathToFileURL(html).href+'?crlf');
    assert.equal(await windowsPage.locator('#pavement').textContent(),'126.48');
    assert.equal(await windowsPage.locator('#source-sheet option').count(),12);
    await windowsPage.close();
    assert.deepEqual(network,[]);
    assert.deepEqual(errors,[]);
    console.log('PASS: isolated file:// with LF/CRLF; all 11 family/rail combinations; independent fixtures; roadway/grooving choices; v1 migration/v2 round-trip; mixed totals and exports; invalid/cancelled imports preserve edits; all 12 embedded sheets; SVGs/light/dark/mobile; no network or browser errors.');
  } finally {
    await browser.close();
    assert.equal(path.dirname(isolated),os.tmpdir());
    assert.ok(path.basename(isolated).startsWith('bridge-end-standalone-'));
    await fs.rm(isolated,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
