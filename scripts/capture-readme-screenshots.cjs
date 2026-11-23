'use strict';
// Reproducible sample screenshots using synthetic data only. No user files.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

(async () => {
  const output = path.resolve('test-results/readme-screenshots');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const language of ['ja', 'en']) {
      for (const [width, height, mobile] of [[1440, 1000, false], [390, 844, true]]) {
        const context = await browser.newContext({
          viewport: { width, height }, locale: language,
          deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light'
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        try {
          await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
          await page.locator('#tournamentName').fill(language === 'ja' ? '週末ミニリーグ' : 'Weekend League');
          await page.locator('input[name="resultMode"][value="score"]').check();
          for (const name of (language === 'ja' ? ['佐藤', '青木', '伊藤', '田中'] : ['Alice', 'Ben', 'Chris', 'Dana'])) {
            await page.locator('#showParticipantAddButton').click();
            await page.locator('#participantName').fill(name);
            await page.locator('#participantForm button[type="submit"]').click();
          }
          await page.locator('#confirmParticipantsButton').click();
          await page.locator('#fixtureView').waitFor({ state: 'visible' });
          for (const [a,b] of [[3,1],[2,2]]) {
            await page.locator('#nextMatchButton').click();
            await page.locator('#scoreA').fill(String(a));
            await page.locator('#scoreB').fill(String(b));
            await page.locator('#scoreForm button[type="submit"]').click();
            await page.locator('#resultDialog').waitFor({ state: 'hidden' });
          }
          if (language !== await page.locator('html').getAttribute('lang')) await page.locator('#languageButton').click();
          await page.evaluate(async () => { await document.fonts.ready; scrollTo({top:0,left:0,behavior:'instant'}); });
          await page.waitForTimeout(170);
          if (errors.length) throw new Error(errors.join('; '));
          const filename = `${mobile ? 'screenshot-mobile' : 'screenshot'}${language === 'en' ? '-en' : ''}.png`;
          const png = await page.screenshot({ fullPage: false });
          fs.writeFileSync(path.join(output, filename), png);
          if (process.env.CAPTURE_README_BASE64 === '1') {
            const base64 = png.toString('base64');
            for (let offset = 0; offset < base64.length; offset += 4096) {
              const index = offset / 4096;
              console.log('README_IMAGE_PART:' + filename + ':' + index + ':' + base64.slice(offset,offset+4096));
            }
          }
          console.log('[OK] Current README screenshot: ' + filename + ' (' + png.length + ' bytes)');
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
