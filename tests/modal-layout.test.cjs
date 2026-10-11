const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { gunzipSync } = require('node:zlib');

let html = fs.readFileSync(path.resolve(__dirname, '..', process.env.MINI_LEAGUE_DESK_SOURCE || 'src/index.template.html'), 'utf8');
const payload = html.match(/<script id="self-extract-payload"[^>]*>([A-Za-z0-9+/=\s]+)<\/script>/);
if (payload) html = gunzipSync(Buffer.from(payload[1], 'base64')).toString('utf8');

function declaration(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp('^\\s*' + escaped + '\\s*\\{([^}]*)\\}', 'm'))?.[1] || '';
}

function groupedDeclaration(selector) {
  const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  for (const [, selectors, body] of style.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.split(',').some(value => value.trim() === selector)) return body;
  }
  return '';
}

// These source contracts complement native wheel, focus, and geometry checks.
test('native modal root and body locks are scoped to an open modal', () => {
  assert.ok(/html:has\(dialog:modal\),\s*body:has\(dialog:modal\)\s*\{\s*overflow:\s*hidden;?\s*\}/.test(html),
    'Both document scrolling roots must lock only while a native modal is open.');
});

test('Help omits internal layout and focus audit prose', () => {
  const help = html.match(/<!-- APP:HELP:BEGIN -->([\s\S]*?)<!-- APP:HELP:END -->/)[1];
  assert.doesNotMatch(help, /data-i18n="helpModalScroll"/);
  assert.ok(!html.includes("helpModalScroll: 'ダイアログを開いている間は背景のスクロールが止まります。見出しは固定され、下の項目や操作へはダイアログ内をスクロールして進めます。'"));
  assert.ok(!html.includes("helpModalScroll: 'Background scrolling is paused while a dialog is open. Scroll inside it to reach lower fields and actions; the header stays visible.'"));
});

test('Help retains its bounded open-only shell and independent reading scroll', () => {
  const shell = declaration('#helpDialog[open]');
  assert.match(shell, /display:\s*flex/);
  assert.match(shell, /flex-direction:\s*column/);
  assert.match(shell, /max-height:\s*calc\(100dvh - 28px - env\(safe-area-inset-top\) - env\(safe-area-inset-bottom\)\)/);
  assert.match(declaration('.dialog-header'), /flex:\s*0 0 auto/);
  const body = declaration('.dialog-body');
  assert.match(body, /min-height:\s*0/);
  assert.match(body, /flex:\s*1 1 auto/);
  assert.match(body, /overflow:\s*auto/);
  assert.match(body, /overscroll-behavior:\s*contain/);
  assert.match(body, /env\(safe-area-inset-bottom\)/);
});

test('the existing decorative local-processing shield is retained', () => {
  const badge = html.match(/<div class="local-badge">([\s\S]*?)<\/div>/)[1];
  assert.match(badge, /aria-hidden="true"/);
  assert.match(badge, /d="M12 3 5 6v5c0 4\.6 2\.8 8 7 10 4\.2-2 7-5\.4 7-10V6z"/);
  assert.match(badge, /d="m9 12 2 2 4-5"/);
});

for (const [id, label, bodyId, finalAction] of [
  ['backupExportDialog', 'Backup', 'backupExportForm', 'data-i18n="backupDownload"'],
  ['exportDialog', 'Output', '', 'id="printEventButton"'],
  ['resultDialog', 'Result', '', 'id="cancelResultButton"']
]) {
  test(`${label} keeps its header visible and its final action inside the bounded scrolling body`, () => {
    const shell = groupedDeclaration(`#${id}[open]`);
    assert.match(shell, /display:\s*flex/);
    assert.match(shell, /flex-direction:\s*column/);
    assert.match(declaration('dialog'), /max-height:\s*min\(760px,calc\(100dvh - 28px\)\)/);
    assert.match(declaration('dialog'), /overflow:\s*hidden/);
    assert.match(declaration('.dialog-header'), /flex:\s*0 0 auto/);
    const body = declaration('.dialog-body');
    assert.match(body, /min-height:\s*0/);
    assert.match(body, /flex:\s*1 1 auto/);
    assert.match(body, /overflow:\s*auto/);
    assert.match(body, /overscroll-behavior:\s*contain/);
    const markup = html.match(new RegExp('<dialog[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)<\\/dialog>'))[1];
    const bodyStart = markup.indexOf(bodyId ? `id="${bodyId}"` : 'class="dialog-body"');
    assert.ok(bodyStart > 0 && markup.indexOf(finalAction) > bodyStart);
  });
}

test('Confirmation keeps its header visible and both decisions inside its scrolling body', () => {
  const shell = groupedDeclaration('#appConfirmDialog[open]');
  assert.match(shell, /display:\s*flex/);
  assert.match(shell, /flex-direction:\s*column/);
  assert.match(declaration('.app-confirm-header'), /flex:\s*0 0 auto/);
  const body = declaration('.app-confirm-body');
  assert.match(body, /min-height:\s*0/);
  assert.match(body, /flex:\s*1 1 auto/);
  assert.match(body, /overflow:\s*auto/);
  assert.match(body, /overscroll-behavior:\s*contain/);
  const markup = html.match(/<dialog[^>]*id="appConfirmDialog"[^>]*>([\s\S]*?)<\/dialog>/)[1];
  for (const action of ['appConfirmCancel', 'appConfirmOk']) {
    assert.ok(markup.indexOf(`id="${action}"`) > markup.indexOf('class="app-confirm-body"'));
  }
});
