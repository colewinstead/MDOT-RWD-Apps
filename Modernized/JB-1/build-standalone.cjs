'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/\r\n/g, '\n');
const css = read('styles.css');
const scripts = [read('calculations.js'), read('app.js')];
assert.ok(!/<\/style/i.test(css), 'Stylesheet must not contain a closing style tag.');
for (const script of scripts) assert.ok(!/<\/script/i.test(script), 'JavaScript must not contain a closing script tag.');
const hash = content => `'sha256-${crypto.createHash('sha256').update(content).digest('base64')}'`;
const policy = `default-src 'none'; script-src ${scripts.map(hash).join(' ')}; style-src ${hash(css)}; img-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
let html = read('index.html')
  .replace(/(<meta http-equiv="Content-Security-Policy" content=")[^"]*(">)/, (_, start, end) => start + policy + end)
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>${css}</style>`)
  .replace(/\s*<script src="(?:calculations|app)\.js" defer><\/script>/g, '')
  .replace('</body>', () => scripts.map(script => `<script>${script}</script>`).join('\n') + '\n</body>');

// The deliverable must contain every runtime asset and permit exactly those inline bytes.
assert.equal((html.match(/<style>/g) || []).length, 1);
assert.equal((html.match(/<script>/g) || []).length, 2);
assert.ok(!/\b(?:src|href)="(?!#|data:)[^"]+"/.test(html), 'Standalone HTML still references another file.');
assert.ok(html.includes(`style-src ${hash(css)}`));
for (const script of scripts) assert.ok(html.includes(hash(script)));
const output = path.join(__dirname, '..', '..', 'JB.html');
fs.writeFileSync(output, html);
console.log(`Built ${output} (${Buffer.byteLength(html)} bytes; no companion files).`);
