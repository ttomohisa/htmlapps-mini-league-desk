const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../src/index.template.html'),'utf8');
test('phone footer and local-processing badge are hidden without hiding functional controls',()=>{
  assert.ok(html.includes('@media (max-width: 600px) { body > footer, .local-badge { display: none; }'));
  assert.match(html, /id="leagueBottomBar"/);
  assert.match(html, /id="languageButton"/);
  assert.match(html, /id="helpButton"/);
});
