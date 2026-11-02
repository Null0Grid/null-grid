'use strict';
// NODE_GRID was renamed Null Grid (5.2.0). This fails if the old name turns up
// anywhere in the repo (file contents or file names), except the few places
// listed below that keep it on purpose.
//
//   node tests/rename.test.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OLD = /node[-_ ]?grid/i;
// Kept on purpose. Each entry: file, a pattern the line must match, and why.
const ALLOWED = [
  // carrying data over from before the rename (main.js "renamed" section), old loadout links, an old game
  // score, and the old Linux launcher (default browser) -- needed so updating loses nothing; never shown
  ['main.js', /LEGACY_NAME = 'NODE_GRID'|LEGACY_FLATPAK = 'dev\.nullgrid\.nodegrid'|renamed: NODE_GRID is now Null Grid|\['nodegrid-(ai|sim)', 'nullgrid-(ai|sim)'\]|nodegrid:\\\/\\\/|OLD_DESKTOP_ID = 'node-grid\.desktop'|launcher was node-grid\.desktop|'node-grid\.png'/, 'migration'],
  ['runner.js', /'nodegrid-runner-hi'/, 'migration'],
  ['package.json', /\.var\/app\/dev\.nullgrid\.nodegrid:ro/, 'migration: the old Flatpak\'s data'],
  ['tests/ui-defaultbrowser.test.js', /node-grid\.desktop/, 'migration test'],
  // the Null Search site (another repo) still calls the Drive bridge by its old name
  ['tab-preload.js', /exposeInMainWorld\('nodegridDrive'/, 'Null Search site'],
  ['tests/fixtures/search-site/results.html', /nodegridDrive/, 'Null Search site'],
  // the history of the rename itself, and of earlier versions' packaging (true for what they shipped)
  ['docs/HISTORY.md', /.*/, 'history'],
  // this test, and the test of updating from before the rename
  ['tests/rename.test.js', /.*/, 'this file'],
  ['tests/ui-rename.test.js', /.*/, 'migration test'],
];

const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)
  .filter((f) => !f.startsWith('node_modules/') && fs.existsSync(path.join(ROOT, f)));
const bad = [];
for (const f of files) {
  if (OLD.test(f)) bad.push(`${f}: file name`);
  let txt;
  const buf = fs.readFileSync(path.join(ROOT, f));
  if (buf.includes(0)) continue;                      // binary
  txt = buf.toString('utf8');
  txt.split('\n').forEach((line, i) => {
    if (!OLD.test(line)) return;
    if (ALLOWED.some(([af, re]) => af === f && re.test(line))) return;
    bad.push(`${f}:${i + 1}: ${line.trim().slice(0, 160)}`);
  });
}
// the shipped walkthrough video's text is drawn from walkthrough/src/tour.html (checked above)
if (bad.length) {
  console.log('[FAIL] the old name is still in ' + bad.length + ' place(s):\n  ' + bad.join('\n  '));
  console.log('RENAME TEST FAILED');
  process.exit(1);
}
console.log('[pass] no NODE_GRID / Node Grid / nodegrid / node-grid left (' + files.length + ' files checked, ' + ALLOWED.length + ' kept on purpose)');
console.log('ALL RENAME TESTS PASS');
