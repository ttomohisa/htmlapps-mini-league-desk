'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname, '../src/index.template.html'), 'utf8');
function extract(name) {
  const start = source.indexOf('      function ' + name + '(');
  assert.ok(start >= 0, 'Missing function: ' + name);
  const end = source.indexOf('\n      }', start);
  assert.ok(end > start, 'Missing end: ' + name);
  return source.slice(start, end + '\n      }'.length);
}
const signature = new Function(extract('eventDataSignature') + 'return eventDataSignature;')();
const pairKey = new Function(extract('matrixPairKey') + 'return matrixPairKey;')();
const localDateStamp = new Function(extract('localDateStamp') + 'return localDateStamp;')();
function doc(status, ui = 'progress', date = '2026-11-20') {
  return JSON.stringify({format:'mini-league-desk',schemaVersion:1,event:{
    id:'event',name:'League',phase:'fixtures',settings:{resultMode:'winLoss',scoreDrawsAllowed:true},
    participants:[{id:'a',name:'A'},{id:'b',name:'B'}],
    rounds:[{number:1,matches:[{id:'m',status}]}],
    ui:{activePage:ui},createdAt:'2026-11-20',updatedAt:date
  }});
}
test('event signature ignores UI-only saves but detects changed results', () => {
  assert.equal(signature(doc('pending')), signature(doc('pending', 'standings', '2026-11-21')));
  assert.notEqual(signature(doc('pending')), signature(doc('completed')));
});
test('serialized participant pairs avoid delimiter collisions', () => {
  assert.notEqual(pairKey('a','b|c'), pairKey('a|b','c'));
  assert.equal(pairKey('a','b'), pairKey('b','a'));
});
test('local filenames use device calendar date', () => {
  assert.equal(localDateStamp({getFullYear:()=>2026,getMonth:()=>10,getDate:()=>21}), '2026-11-21');
  assert.equal((source.match(/const date = localDateStamp\(\);/g) || []).length, 2);
});
function harness(initial) {
  const code = [
    "let stored=initial,lastStoredEventRaw=initial,storageConflict=false,persistenceFailed=false,persistenceWarningShown=false,persistenceReady=true,failWrite=false,writes=0;",
    "const storageKeys={event:'e'};",
    "function readStorage(){return stored;} function writeStorage(k,v){if(failWrite)return false;stored=v;writes++;return true;} function removeStorage(){stored=null;return true;}",
    "function meaningfulEventState(){return true;} function buildEventDocument(){return nextDoc;} function showToast(){} function translate(k){return k;} function refreshStorageAlert(){} function markStorageConflict(){storageConflict=true;}",
    extract('eventDataSignature'), extract('hasCurrentStoredEvent'), extract('persistEvent'),
    "return {persistEvent,setStore:v=>stored=v,setFail:v=>failWrite=v,snapshot:()=>({stored,writes,storageConflict,persistenceFailed})};"
  ].join('\n');
  return new Function('initial','nextDoc',code)(initial, JSON.parse(doc('completed')));
}
test('a stale tab does not overwrite another tab result', () => {
  const h = harness(doc('pending')); h.setStore(doc('completed'));
  assert.equal(h.persistEvent(), false);
  assert.equal(h.snapshot().stored, doc('completed'));
  assert.equal(h.snapshot().writes, 0);
  assert.equal(h.snapshot().storageConflict, true);
});
test('navigation changes in another tab do not block saves', () => {
  const h = harness(doc('pending')); h.setStore(doc('pending','matches','2026-11-21'));
  assert.equal(h.persistEvent(), true);
  assert.equal(h.snapshot().storageConflict, false);
});
test('failed saves keep warning state until a successful write', () => {
  const h = harness(doc('pending')); h.setFail(true);
  assert.equal(h.persistEvent(), false); assert.equal(h.snapshot().persistenceFailed,true);
  h.setFail(false);
  assert.equal(h.persistEvent(), true); assert.equal(h.snapshot().persistenceFailed,false);
});
test('round-robin validation supports unusual imported string IDs', () => {
  const generated = new Function("let count=0;function createId(){return 'm'+(++count)}" + extract('generateRoundRobin') + extract('validateRoundRobin') + 'return {generateRoundRobin,validateRoundRobin};')();
  for (let n=3;n<=64;n++) {
    const people=Array.from({length:n},(_,i)=>({id:'p'+i,name:'P'+i}));
    assert.equal(generated.validateRoundRobin(generated.generateRoundRobin(people),people),true,'count '+n);
  }
  const people=['a','b|c','a|b','c'].map(id=>({id,name:id}));
  assert.equal(generated.validateRoundRobin(generated.generateRoundRobin(people),people),true);
});
test('warning UI and Unicode name validation are present', () => {
  assert.match(source, /id="storageAlert" role="alert"/);
  assert.match(source, /window\.addEventListener\('storage'/);
  assert.doesNotMatch(source, /id="participantName"[^>]*maxlength="80"/);
  assert.doesNotMatch(source, /input\.maxLength\s*=\s*80/);
  assert.match(source, /ctx\.fillText\(translate\('csvScoreFor'\), 990, 217, 60\)/);
});

test('a reset can discard unsaved work even if local storage is unavailable', () => {
  const code = [
    'let storageConflict=false,lastStoredEventRaw=null,persistenceFailed=true,persistenceWarningShown=true;',
    'function hasCurrentStoredEvent(){return true;} function refreshStorageAlert(){} function removeStorage(){throw new Error("must not call storage");}',
    extract('clearPersistedEvent'),
    'return {reset:clearPersistedEvent,status:()=>({persistenceFailed,persistenceWarningShown})};'
  ].join('\n');
  const guard = new Function(code)();
  assert.equal(guard.reset(), true);
  assert.equal(guard.status().persistenceFailed, false);
});

test('compact intro, backup disclosure and smartphone layout contracts', () => {
  assert.doesNotMatch(source, /id="heroTitle"/);
  assert.match(source, /id="pageIntro" class="page-intro"/);
  assert.match(source, /\$\('#pageIntro'\)\.hidden = inEvent/);
  assert.equal((source.match(/<details class="backup-details/g) || []).length, 2);
  assert.equal((source.match(/<summary data-i18n="backupDetails">/g) || []).length, 2);
  for (const id of ['setupExportBackupButton','setupImportBackupButton','exportBackupButton','importBackupButton']) {
    assert.match(source, new RegExp('id="' + id + '"'));
  }
  for (const removed of ['tournamentNameNote','fixtureLead','progressLead','standingsEmpty','matrixHelp']) {
    assert.doesNotMatch(source, new RegExp('data-i18n="' + removed + '"'));
  }
  assert.match(source, /class="fixture-save-status"/);
  assert.match(source, /body > footer, \.local-badge \{ display: none; \}/);
  assert.match(source, /\.brand-name \{ font-size: 15px; line-height: 1\.5; padding-bottom: 3px; \}/);
});

test('validated main build creates tag and GitHub Release once', () => {
  const workflow = fs.readFileSync(path.resolve(__dirname, '../.github/workflows/deploy-pages.yml'), 'utf8');
  assert.match(workflow, /  release:\n    name: Publish versioned GitHub Release\n    needs: build/);
  assert.match(workflow, /if: github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /gh release view "\$RELEASE_TAG"/);
  assert.match(workflow, /gh release create "\$RELEASE_TAG"/);
  assert.match(workflow, /dist\/index\.self-extract\.html/);
});

test('visual hierarchy uses cards only for the main sections', () => {
  const start=source.indexOf('/* Visual hierarchy: section containers are cards; their contents are open lists. */');
  assert.ok(start >= 0, 'Missing visual hierarchy style group');
  const end=source.indexOf('@media print', start);
  const css=source.slice(start, end);
  for (const selector of ['.panel, .league-page, .ready-view', '.result-mode-card', '.participant',
    '.fixture-hero', '.round-card', '.match-row', '.standing-row', '.next-match-card',
    '.next-match-button', '.participant-match-panel', '.opponent-group']) {
    assert.ok(css.includes(selector), 'Missing flattened visual treatment: '+selector);
  }
  assert.match(css, /\.next-match-card, \.completion-card[\s\S]*?background: #eaf4ee/);
  assert.match(css, /\.participant\.is-drag-placeholder[\s\S]*?border: 1px dashed/);
  assert.match(css, /\.match-row[\s\S]*?border-bottom: 1px solid var\(--line\)/);
});

test('event overview keeps one clear outer boundary without nested stat cards', () => {
  const visual = source.split('/* Visual hierarchy: section containers are cards; their contents are open lists. */')[1];
  assert.ok(visual);
  const overview = visual.match(/\.fixture-hero\s*\{([^}]+)\}/);
  assert.ok(overview, 'Missing event overview style');
  assert.match(overview[1], /border: 1px solid var\(--line\)/);
  assert.match(overview[1], /background: var\(--surface\)/);
  assert.match(overview[1], /border-radius: 14px/);
  const stats = visual.match(/\.fixture-stat, \.progress-stat\s*\{([^}]+)\}/);
  assert.ok(stats);
  assert.match(stats[1], /background: transparent/);
  assert.match(visual, /@media \(max-width: 380px\)[\s\S]*?\.fixture-hero \{ padding: 15px 12px; \}/);
});


test('quiet secondary actions and real mobile-page scroll target', () => {
  for (const id of ['backToEditButton','openExportButton','shuffleButton',
    'viewPendingButton','viewFinalStandingsButton','completionExportButton']) {
    assert.match(source, new RegExp('class="button text-link" id="' + id + '"'));
  }
  assert.match(source, /id="confirmParticipantsButton" type="button"/);
  assert.match(source, /const page = document\.getElementById\(button\.dataset\.mobilePageTarget\)/);
  assert.match(source, /page\.getBoundingClientRect\(\)\.top \+ window\.scrollY - headerHeight - 12/);
  assert.doesNotMatch(source, /pageTopTarget: 'fixtureView'/);
  assert.match(source, /min-height: calc\(100dvh - var\(--header-height\) - var\(--app-mobile-bottom-bar-height\) \+ 8px\)/);
  assert.match(source, /\.fixture-actions\.data-actions \.button\.text-link\s*\{\s*width: auto/);
});
