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
