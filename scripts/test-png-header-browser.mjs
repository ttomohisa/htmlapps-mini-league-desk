// Uses the existing CI browser session and the built app's real PNG export.
// No production test hooks, runtime dependency, or additional browser is added.
export async function runPngHeaderSmoke(cdp) {
  const scorePairs = [
    { a: 'p2', b: 'p3', sa: 5, sb: 1, winner: 'p2', bye: 'p1' },
    { a: 'p1', b: 'p3', sa: 1, sb: 3, winner: 'p3', bye: 'p2' },
    { a: 'p1', b: 'p2', sa: 2, sb: 0, winner: 'p1', bye: 'p3' }
  ];
  for (const language of ['en', 'ja']) {
    for (const [resultMode, scoreDrawsAllowed] of [['winLoss', false], ['winDrawLoss', true], ['score', true], ['score', false]]) {
      const scoreBased = resultMode === 'score';
      const eventName = `PNG ${language} ${resultMode} ${scoreDrawsAllowed ? 'draws' : 'no-draws'}`;
      const documentValue = {
        format: 'mini-league-desk', schemaVersion: 1, appVersion: '1.0.1',
        event: {
          id: 'png-heading-smoke', name: eventName, phase: 'fixtures',
          settings: { resultMode, scoreDrawsAllowed },
          participants: [{ id: 'p1', name: 'Alpha' }, { id: 'p2', name: 'Beta' }, { id: 'p3', name: 'Gamma' }],
          rounds: scorePairs.map((p, i) => ({ number: i + 1, byeParticipantId: p.bye, matches: [{
            id: `m${i + 1}`, round: i + 1, order: i + 1, participantAId: p.a, participantBId: p.b,
            status: 'completed', scoreA: scoreBased ? p.sa : null, scoreB: scoreBased ? p.sb : null,
            result: 'win', winnerId: p.winner
          }] })),
          ui: { matchFilter: 'all', matchView: 'matrix', participantFocusId: 'p1', activePage: 'standings' },
          createdAt: '2026-10-08T00:00:00.000Z', updatedAt: '2026-10-08T00:00:00.000Z'
        }
      };
      await cdp.send('Runtime.evaluate', { expression: `localStorage.setItem('mini-league-desk:language',${JSON.stringify(language)});localStorage.setItem('mini-league-desk:active-event:v1',${JSON.stringify(JSON.stringify(documentValue))});location.reload();` });
      // Wait for the new document's app state, not an arbitrary rendering delay.
      let ready = false;
      for (let i = 0; i < 50; i += 1) {
        try {
          const r = await cdp.send('Runtime.evaluate', { expression: `document.documentElement.lang===${JSON.stringify(language)} && document.body.textContent.includes(${JSON.stringify(eventName)}) && Boolean(document.querySelector('#openExportButton'))`, returnByValue: true });
          if (r.result?.value === true) { ready = true; break; }
        } catch {}
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!ready) throw new Error(`PNG fixture did not load: ${language}/${resultMode}`);
      const result = await cdp.send('Runtime.evaluate', {
        awaitPromise: true, returnByValue: true,
        expression: `(async () => {
          const calls=[]; const originalFill=CanvasRenderingContext2D.prototype.fillText;
          const originalUrl=URL.createObjectURL; let pngBlob;
          CanvasRenderingContext2D.prototype.fillText=function(text,x,y,maxWidth){
            const m=this.measureText(String(text));
            const scale=maxWidth===undefined?1:Math.min(1,maxWidth/m.width);
            let inkRight=null;
            if(x===720&&y===217){
              const inkCanvas=document.createElement('canvas');inkCanvas.width=this.canvas.width;inkCanvas.height=this.canvas.height;
              const ink=inkCanvas.getContext('2d');ink.font=this.font;ink.textBaseline=this.textBaseline;ink.textAlign=this.textAlign;
              originalFill.apply(ink,arguments);
              const pixels=ink.getImageData(0,0,inkCanvas.width,inkCanvas.height).data;
              inkRight=0;
              for(let i=3;i<pixels.length;i+=4)if(pixels[i])inkRight=Math.max(inkRight,((i-3)/4)%inkCanvas.width+1);
            }
            calls.push({text:String(text),x,y,maxWidth:maxWidth??null,right:x+m.actualBoundingBoxRight*scale,inkRight});
            return originalFill.apply(this,arguments);
          };
          URL.createObjectURL=function(blob){if(blob.type==='image/png')pngBlob=blob;return originalUrl.call(this,blob);};
          try {
            document.querySelector('#openExportButton').click();
            document.querySelector('#exportStandingsPngButton').click();
            for(let i=0;i<100&&!pngBlob;i++)await new Promise(r=>setTimeout(r,50));
            if(!pngBlob)throw new Error('PNG was not produced');
            const bitmap=await createImageBitmap(pngBlob);
            const dimensions=[bitmap.width,bitmap.height];bitmap.close();
            return {dimensions,bytes:pngBlob.size,calls};
          } finally {CanvasRenderingContext2D.prototype.fillText=originalFill;URL.createObjectURL=originalUrl;}
        })()`
      });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      const value = result.result?.value;
      if (!value || value.dimensions.join('x') !== '1200x546' || value.bytes < 1000) throw new Error('PNG dimensions/encoding changed');
      const heading = value.calls.find(c => c.x === 720 && c.y === 217);
      const expectedHeading = language === 'en'
        ? (resultMode === 'winLoss' || (scoreBased && !scoreDrawsAllowed) ? 'Wins-Losses' : 'Wins-Draws-Losses')
        : (resultMode === 'winLoss' || (scoreBased && !scoreDrawsAllowed) ? '\u52dd-\u6557' : '\u52dd-\u5206-\u6557');
      if (!heading || heading.text !== expectedHeading || heading.right > (scoreBased ? 880 : 1050) + 0.01 || heading.inkRight <= 720 || heading.inkRight > (scoreBased ? 880 : 1050)) throw new Error(`PNG record heading overlaps its column: ${JSON.stringify(heading)}`);
      const drawnNames = value.calls.filter(c => c.x === 160 && c.y !== 217).map(c => c.text);
      if (drawnNames.join(',') !== (scoreBased ? 'Beta,Alpha,Gamma' : 'Alpha,Beta,Gamma')) throw new Error('PNG participant order changed');
      const points = value.calls.filter(c => c.x === 1120).map(c => c.text);
      if (points.join(',') !== (resultMode === 'winLoss' ? '1,1,1' : '3,3,3')) throw new Error('PNG points changed');
      const differences = value.calls.filter(c => c.x === 900 && c.y !== 217).map(c => c.text);
      if (differences.join(',') !== (scoreBased ? '+2,0,-2' : '')) throw new Error('PNG score differences changed');
      console.log(`[OK] PNG record heading fits: ${language}/${resultMode}/draws=${scoreDrawsAllowed}`);
    }
  }
}
