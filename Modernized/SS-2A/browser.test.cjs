'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
(async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ss2a-'));
 await fs.copyFile(path.join(__dirname,'../SS-2A.html'),path.join(dir,'SS-2A.html'));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1080},acceptDownloads:true}),errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});page.on('dialog',d=>d.accept());
  await page.goto(pathToFileURL(path.join(dir,'SS-2A.html')).href);
  assert.equal(await page.locator('#concrete').textContent(),'2.614');
  assert.equal(await page.locator('#steel').textContent(),'218.745');
  await page.locator('#project-number').fill('SYNTHETIC SS-2A QA');
  await page.screenshot({path:path.join(__dirname,'evidence/browser-desktop.png'),fullPage:true});
  await page.locator('#height').fill('-1');assert.ok(await page.locator('#print-report').isDisabled());
  await page.locator('#height').fill('4');await page.locator('#add-inlet').click();
  await page.locator('#length').selectOption('10');await page.locator('#pavement').selectOption('true');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save-project').click()]);
  const data=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(data.inlets.length,2);
  await page.locator('#width').fill('7');
  await page.locator('#open-file').setInputFiles({name:'saved.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await page.waitForFunction(()=>document.querySelector('#file-status').textContent.startsWith('Opened'));
  assert.equal(await page.locator('#inlet-select option').count(),2);
  await page.locator('#open-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...data,inlets:[{...data.inlets[0],width:true}]}))});
  await page.waitForTimeout(100);assert.equal(await page.locator('#inlet-select option').count(),2);
  await page.locator('#project-number').fill('<script>window.injected=true</script>');
  assert.equal(await page.evaluate(()=>window.injected),undefined);
  await page.locator('#project-number').fill('SYNTHETIC SS-2A QA');
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(__dirname,'evidence/browser-mobile.png')});
  await page.locator('#results-heading').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'evidence/browser-mobile-results.png')});
  await page.pdf({path:path.join(__dirname,'evidence/report-sample.pdf'),format:'Letter',printBackground:true});
  assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
  console.log('PASS: isolated file load, calculation, validation, multi-inlet save/reopen, mobile, PDF, no network/page errors.');
 }finally{await browser.close();await fs.rm(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
