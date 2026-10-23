const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../src/index.template.html'),'utf8');
test('phone informational footer only',()=>assert.ok(html.includes('@media (max-width: 600px) { body > footer { display: none; } }')));
