import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { runPngHeaderSmoke } from "./test-png-header-browser.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist", "index.html");
if (!fs.existsSync(dist)) throw new Error("dist/index.html is required.");

function findBrowser() {
  const pf = process.env.ProgramFiles || "C:\\Program Files";
  const pfx86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const candidates = [
    process.env.BROWSER_EXECUTABLE_PATH,
    path.join(pf, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(pfx86, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(pfx86, "Microsoft", "Edge", "Application", "msedge.exe")
  ];
  const found = candidates.find(candidate => candidate && fs.existsSync(candidate));
  if (!found) throw new Error("Chrome or Edge was not found.");
  return found;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  const relative = url.pathname === "/" ? "dist/index.html" : url.pathname.replace(/^\/+/, "");
  const file = path.resolve(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": file.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(file).pipe(response);
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(8766, "127.0.0.1", resolve);
});

const debugPort = 9223;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mini-league-drag-"));
const browser = spawn(findBrowser(), [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-debugging-port=" + debugPort,
  "--user-data-dir=" + profile,
  "about:blank"
], { stdio: "ignore" });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url, attempts = 50, ready = () => true) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const value = await response.json();
        if (ready(value)) return value;
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(200);
  }
  throw lastError || new Error("Timed out waiting for browser.");
}

class Cdp {
  constructor(url) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocket(url);
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", event => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message || "CDP error"));
      else pending.resolve(message.result || {});
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.nextId++;
    return await new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

let cdp;
try {
  const pages = await fetchJson("http://127.0.0.1:" + debugPort + "/json/list", 50, pages => pages.some(item => item.type === "page" && item.webSocketDebuggerUrl));
  const page = pages.find(item => item.type === "page" && item.webSocketDebuggerUrl);
  if (!page || !page.webSocketDebuggerUrl) throw new Error("Page target was not found.");

  cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1100,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send("Page.navigate", { url: "http://127.0.0.1:8766/dist/index.html" });
  await sleep(600);

  const documentValue = {
    format: "mini-league-desk",
    schemaVersion: 1,
    appVersion: "0.9.0",
    event: {
      id: "drag-smoke",
      name: "Drag Smoke",
      phase: "setup",
      settings: { resultMode: "winLoss", scoreDrawsAllowed: true },
      participants: [
        { id: "p1", name: "Alpha" },
        { id: "p2", name: "Bravo" },
        { id: "p3", name: "Charlie" }
      ],
      rounds: [],
      ui: {
        matchFilter: "all",
        matchView: "rounds",
        participantFocusId: "p1",
        activePage: "progress"
      },
      createdAt: "2026-10-06T00:00:00.000Z",
      updatedAt: "2026-10-06T00:00:00.000Z"
    }
  };

  const setupExpression =
    "localStorage.clear();" +
    "localStorage.setItem('mini-league-desk:language','en');" +
    "localStorage.setItem('mini-league-desk:active-event:v1',JSON.stringify(" +
    JSON.stringify(documentValue) +
    "));location.reload();";

  await cdp.send("Runtime.evaluate", { expression: setupExpression });
  await sleep(900);

  const geometry = await cdp.send("Runtime.evaluate", {
    expression:
      "(() => {" +
      "const items=[...document.querySelectorAll('.participant')];" +
      "const first=items[0]?.querySelector('.participant-drag-handle');" +
      "const third=items[2];" +
      "if(!first||!third)return null;" +
      "const h=first.getBoundingClientRect();" +
      "const t=third.getBoundingClientRect();" +
      "return {sx:h.left+h.width/2,sy:h.top+h.height/2,ex:t.left+Math.min(60,t.width/2),ey:t.bottom-6};" +
      "})()",
    returnByValue: true
  });

  const g = geometry.result && geometry.result.value;
  if (!g) throw new Error("Drag geometry was not available.");

  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: g.sx, y: g.sy });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: g.sx,
    y: g.sy,
    button: "left",
    buttons: 1,
    clickCount: 1
  });
  await sleep(80);

  for (let step = 1; step <= 8; step += 1) {
    const ratio = step / 8;
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: g.sx + (g.ex - g.sx) * ratio,
      y: g.sy + (g.ey - g.sy) * ratio,
      button: "left",
      buttons: 1
    });
    await sleep(35);
  }

  const during = await cdp.send("Runtime.evaluate", {
    expression:
      "({" +
      "ghost:document.querySelectorAll('.participant-drag-ghost').length," +
      "placeholder:document.querySelectorAll('.is-drag-placeholder').length," +
      "dragging:document.body.classList.contains('is-roster-dragging')" +
      "})",
    returnByValue: true
  });
  const duringValue = during.result && during.result.value;
  if (!duringValue || duringValue.ghost !== 1 || duringValue.placeholder !== 1 || duringValue.dragging !== true) {
    throw new Error("Drag visual state did not activate correctly: " + JSON.stringify(duringValue));
  }

  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: g.ex,
    y: g.ey,
    button: "left",
    buttons: 0,
    clickCount: 1
  });
  await sleep(500);

  const after = await cdp.send("Runtime.evaluate", {
    expression:
      "({" +
      "order:[...document.querySelectorAll('.participant-name')].map(node=>node.textContent.trim())," +
      "ghost:document.querySelectorAll('.participant-drag-ghost').length," +
      "placeholder:document.querySelectorAll('.is-drag-placeholder').length," +
      "dragging:document.body.classList.contains('is-roster-dragging')" +
      "})",
    returnByValue: true
  });

  const value = after.result && after.result.value;
  if (!value || JSON.stringify(value.order) !== JSON.stringify(["Bravo", "Charlie", "Alpha"])) {
    throw new Error("Drag did not reorder participants: " + JSON.stringify(value));
  }
  if (value.ghost !== 0 || value.placeholder !== 0 || value.dragging !== false) {
    throw new Error("Drag did not release cleanly: " + JSON.stringify(value));
  }


  const addState = await cdp.send("Runtime.evaluate", {
    expression:
      "(() => {" +
      "const button=document.getElementById('showParticipantAddButton');" +
      "const area=document.querySelector('.participant-add-area');" +
      "const bulk=document.getElementById('bulkDetails');" +
      "const rect=button.getBoundingClientRect();" +
      "return {height:rect.height,areaBorder:getComputedStyle(area).borderTopWidth,bulkBorder:getComputedStyle(bulk).borderTopWidth};" +
      "})()",
    returnByValue: true
  });
  const addMetrics = addState.result && addState.result.value;
  if (!addMetrics || addMetrics.height > 96 || addMetrics.height < 64) {
    throw new Error("Add participant card height is not compact: " + JSON.stringify(addMetrics));
  }
  if (addMetrics.areaBorder !== "0px" || addMetrics.bulkBorder !== "0px") {
    throw new Error("Unexpected participant-add separator: " + JSON.stringify(addMetrics));
  }

  await cdp.send("Runtime.evaluate", {
    expression: "document.getElementById('showParticipantAddButton').click()"
  });
  await sleep(120);

  const opened = await cdp.send("Runtime.evaluate", {
    expression:
      "(() => {" +
      "const button=document.getElementById('showParticipantAddButton');" +
      "const panel=document.getElementById('participantAddPanel');" +
      "return {buttonVisible:button.offsetParent!==null,panelHidden:panel.hidden};" +
      "})()",
    returnByValue: true
  });
  const openedValue = opened.result && opened.result.value;
  if (!openedValue || openedValue.buttonVisible !== false || openedValue.panelHidden !== false) {
    throw new Error("Single-add card was not replaced by the form: " + JSON.stringify(openedValue));
  }

  await cdp.send("Runtime.evaluate", {
    expression:
      "(() => {" +
      "const input=document.getElementById('participantName');" +
      "input.value='Delta';" +
      "input.dispatchEvent(new Event('input',{bubbles:true}));" +
      "document.getElementById('participantForm').requestSubmit();" +
      "})()"
  });
  await sleep(180);

  const added = await cdp.send("Runtime.evaluate", {
    expression:
      "(() => ({" +
      "count:document.querySelectorAll('.participant-name').length," +
      "buttonVisible:document.getElementById('showParticipantAddButton').offsetParent!==null," +
      "panelHidden:document.getElementById('participantAddPanel').hidden" +
      "}))()",
    returnByValue: true
  });
  const addedValue = added.result && added.result.value;
  if (!addedValue || addedValue.count !== 4 || addedValue.buttonVisible !== true || addedValue.panelHidden !== true) {
    throw new Error("Single-add form did not collapse after success: " + JSON.stringify(addedValue));
  }

  console.log("[OK] Browser participant drag and add UX smoke test passed.");

  const scoreDocument = {
    format: "mini-league-desk",
    schemaVersion: 1,
    appVersion: "0.9.0",
    event: {
      id: "matrix-score-smoke",
      name: "Matrix Score Smoke",
      phase: "fixtures",
      settings: { resultMode: "score", scoreDrawsAllowed: true },
      participants: [
        { id: "p1", name: "Alpha" },
        { id: "p2", name: "Bravo" },
        { id: "p3", name: "Charlie" }
      ],
      rounds: [
        {
          number: 1,
          byeParticipantId: "p1",
          matches: [
            { id: "m1", round: 1, order: 1, participantAId: "p2", participantBId: "p3", status: "completed", scoreA: 2, scoreB: 2, result: "draw", winnerId: null }
          ]
        },
        {
          number: 2,
          byeParticipantId: "p3",
          matches: [
            { id: "m2", round: 2, order: 2, participantAId: "p1", participantBId: "p2", status: "completed", scoreA: 3, scoreB: 1, result: "win", winnerId: "p1" }
          ]
        },
        {
          number: 3,
          byeParticipantId: "p2",
          matches: [
            { id: "m3", round: 3, order: 3, participantAId: "p3", participantBId: "p1", status: "pending", scoreA: null, scoreB: null, result: null, winnerId: null }
          ]
        }
      ],
      ui: { matchFilter: "all", matchView: "matrix", participantFocusId: "p1", activePage: "matches" },
      createdAt: "2026-10-06T00:00:00.000Z",
      updatedAt: "2026-10-06T00:00:00.000Z"
    }
  };

  await cdp.send("Runtime.evaluate", {
    expression:
      "localStorage.setItem('mini-league-desk:active-event:v1',JSON.stringify(" +
      JSON.stringify(scoreDocument) +
      "));location.reload();"
  });
  await sleep(900);

  const matrixState = await cdp.send("Runtime.evaluate", {
    expression:
      "(() => {" +
      "const read=(matchId,rowName)=>{" +
      "const buttons=[...document.querySelectorAll('[data-match-id=\\\"'+matchId+'\\\"]')];" +
      "const button=buttons.find(candidate=>candidate.closest('tr')?.querySelector('th')?.textContent.trim()===rowName);" +
      "return button?{symbol:button.querySelector('.matrix-result-symbol')?.textContent.trim()||'',score:button.querySelector('.matrix-result-score')?.textContent.trim()||''}:null;" +
      "};" +
      "return {" +
      "alphaBravo:read('m2','Alpha')," +
      "bravoAlpha:read('m2','Bravo')," +
      "bravoCharlie:read('m1','Bravo')," +
      "charlieBravo:read('m1','Charlie')," +
      "alphaCharlie:read('m3','Alpha')" +
      "};" +
      "})()",
    returnByValue: true
  });

  const matrixValue = matrixState.result && matrixState.result.value;
  const circle = "\u25CB";
  const cross = "\u00D7";
  const triangle = "\u25B3";
  if (!matrixValue ||
      matrixValue.alphaBravo?.symbol !== circle || matrixValue.alphaBravo?.score !== "3\u20131" ||
      matrixValue.bravoAlpha?.symbol !== cross || matrixValue.bravoAlpha?.score !== "1\u20133" ||
      matrixValue.bravoCharlie?.symbol !== triangle || matrixValue.bravoCharlie?.score !== "2\u20132" ||
      matrixValue.charlieBravo?.symbol !== triangle || matrixValue.charlieBravo?.score !== "2\u20132" ||
      matrixValue.alphaCharlie?.symbol !== "\u2014" || matrixValue.alphaCharlie?.score !== "") {
    throw new Error("Round-robin symbol/score display is incorrect: " + JSON.stringify(matrixValue));
  }

  console.log("[OK] Browser round-robin symbol and score smoke test passed.");


  const desktopOverview = await cdp.send("Runtime.evaluate", {
    expression:
      "(() => {" +
      "const hero=document.querySelector('.fixture-hero');" +
      "const styles=getComputedStyle(hero);" +
      "const details=hero.querySelector('.fixture-backup-details');" +
      "return {height:hero.getBoundingClientRect().height,border:styles.borderTopWidth," +
      "backupClosed:!details.open,toolbar:!!hero.querySelector('.fixture-overview-toolbar')};" +
      "})()",
    returnByValue: true
  });
  const desktopOverviewMetrics=desktopOverview.result?.value;
  if (!desktopOverviewMetrics || desktopOverviewMetrics.height > 185 ||
      desktopOverviewMetrics.border === "0px" || !desktopOverviewMetrics.backupClosed ||
      !desktopOverviewMetrics.toolbar) {
    throw new Error("Desktop overview is not compact: " + JSON.stringify(desktopOverviewMetrics));
  }
  console.log("[OK] Compact event overview retains one outer border and functional controls.");

  // Mobile bottom navigation: each selection must bring its own section just below
  // the sticky header, not leave the overview as the scroll destination.
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390, height: 780, deviceScaleFactor: 1, mobile: true
  });
  await sleep(200);

  const phoneOverview = await cdp.send("Runtime.evaluate", {
    expression: "(() => ({height:document.querySelector('.fixture-hero').getBoundingClientRect().height," +
      "overflow:document.documentElement.scrollWidth>window.innerWidth}))()",
    returnByValue:true
  });
  const phoneMetrics=phoneOverview.result?.value;
  if(!phoneMetrics || phoneMetrics.height > 245 || phoneMetrics.overflow) {
    throw new Error("Phone overview is too tall or overflows: " + JSON.stringify(phoneMetrics));
  }

  for (const [key, pageId] of [
    ["standings", "standingsPage"],
    ["matches", "matchesPage"],
    ["progress", "progressPage"],
    ["standings", "standingsPage"]
  ]) {
    await cdp.send("Runtime.evaluate", {
      expression: "document.querySelector('[data-mobile-key=\"" + key + "\"]').click()"
    });
    await sleep(240);
    const metrics = await cdp.send("Runtime.evaluate", {
      expression:
        "(() => {" +
        "const page=document.getElementById('" + pageId + "');" +
        "const rect=page.getBoundingClientRect();" +
        "return {top:rect.top,header:document.querySelector('.app-header').getBoundingClientRect().height," +
        "overview:document.querySelector('.fixture-hero').getBoundingClientRect().bottom," +
        "active:page.classList.contains('is-mobile-active')," +
        "current:document.querySelector('[data-mobile-key=\"" + key + "\"]').getAttribute('aria-current')," +
        "scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth};" +
        "})()",
      returnByValue: true
    });
    const m = metrics.result?.value;
    if (!m || !m.active || m.current !== "page" ||
        m.top < m.header - 3 || m.top > m.header + 28 ||
        m.overview > m.header + 1 ||
        m.scrollWidth > m.innerWidth) {
      throw new Error("Phone tab did not align the selected section: " + key + " " + JSON.stringify(m));
    }
  }
  console.log("[OK] Phone navigation scrolls to the selected section, not the overview.");


  // The active document created by an older app version must survive rename,
  // switching, reload, import, Undo, and deletion of an unrelated event.
  const renamed = await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "const key='mini-league-desk:active-event:v1';" +
      "const before=JSON.parse(localStorage.getItem(key));" +
      "document.getElementById('renameEventButton').click();" +
      "const field=document.getElementById('renameEventInput');" +
      "field.value='Renamed Original';" +
      "document.getElementById('renameEventForm').requestSubmit();" +
      "const after=JSON.parse(localStorage.getItem(key));" +
      "return {name:after.event.name,unchanged:JSON.stringify(before.event.rounds)===JSON.stringify(after.event.rounds)," +
      "completed:document.getElementById('fixtureCompletedCount').textContent," +
      "dialogClosed:!document.getElementById('renameEventDialog').open};" +
      "})()",
    returnByValue: true
  });
  const renamedValue = renamed.result?.value;
  if (!renamedValue || renamedValue.name !== "Renamed Original" ||
      !renamedValue.unchanged || renamedValue.completed !== "2" || !renamedValue.dialogClosed) {
    throw new Error("Renaming changed match data: " + JSON.stringify(renamedValue));
  }

  const archived = await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "document.getElementById('fixtureEventLibraryButton').click();" +
      "const shown=document.querySelectorAll('.event-library-row').length;" +
      "document.getElementById('createNewEventButton').click();" +
      "const library=JSON.parse(localStorage.getItem('mini-league-desk:archived-events:v1'));" +
      "return {shown,phase:!document.getElementById('setupView').hidden,active:localStorage.getItem('mini-league-desk:active-event:v1')," +
      "archived:library.events.map(doc=>({id:doc.event.id,done:doc.event.rounds.flatMap(r=>r.matches).filter(m=>m.status==='completed').length}))};" +
      "})()",
    returnByValue: true
  });
  const archivedValue = archived.result?.value;
  if (!archivedValue || archivedValue.shown !== 1 || !archivedValue.phase || archivedValue.active !== null ||
      archivedValue.archived.length !== 1 || archivedValue.archived[0].id !== "matrix-score-smoke" ||
      archivedValue.archived[0].done !== 2) {
    throw new Error("Current event was not safely archived: " + JSON.stringify(archivedValue));
  }

  const second = await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "const title=document.getElementById('tournamentName');" +
      "title.value='Second Event';title.dispatchEvent(new Event('input',{bubbles:true}));" +
      "for(const name of ['Delta','Echo','Foxtrot']) {" +
      "document.getElementById('showParticipantAddButton').click();" +
      "document.getElementById('participantName').value=name;" +
      "document.getElementById('participantForm').requestSubmit();" +
      "}" +
      "document.getElementById('confirmParticipantsButton').click();" +
      "const doc=JSON.parse(localStorage.getItem('mini-league-desk:active-event:v1'));" +
      "return {name:doc.event.name,id:doc.event.id,phase:doc.event.phase,people:doc.event.participants.length};" +
      "})()",
    returnByValue: true
  });
  const secondValue = second.result?.value;
  if (!secondValue || secondValue.name !== "Second Event" ||
      secondValue.id === "matrix-score-smoke" || secondValue.phase !== "fixtures" || secondValue.people !== 3) {
    throw new Error("Second event setup failed: " + JSON.stringify(secondValue));
  }

  const switchedBack = await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "document.getElementById('fixtureEventLibraryButton').click();" +
      "const rows=[...document.querySelectorAll('.event-library-row')];" +
      "const original=rows.find(row=>row.querySelector('.event-library-name')?.textContent==='Renamed Original');" +
      "const open=original?.querySelector('.event-library-actions .button:not(.danger-ghost)');" +
      "if(!open)return {error:'original not listed',names:rows.map(row=>row.textContent)};" +
      "open.click();" +
      "const doc=JSON.parse(localStorage.getItem('mini-league-desk:active-event:v1'));" +
      "const archives=JSON.parse(localStorage.getItem('mini-league-desk:archived-events:v1')).events;" +
      "return {id:doc.event.id,done:doc.event.rounds.flatMap(r=>r.matches).filter(m=>m.status==='completed').length," +
      "secondStored:archives.some(item=>item.event.id===" + JSON.stringify(secondValue.id) + ")};" +
      "})()",
    returnByValue: true
  });
  const switched = switchedBack.result?.value;
  if (!switched || switched.id !== "matrix-score-smoke" || switched.done !== 2 || !switched.secondStored) {
    throw new Error("Switching lost saved results: " + JSON.stringify(switched));
  }

  await cdp.send("Runtime.evaluate", { expression: "location.reload()" });
  await sleep(800);
  const reloaded = await cdp.send("Runtime.evaluate", {
    expression: "(() => ({id:JSON.parse(localStorage.getItem('mini-league-desk:active-event:v1')).event.id," +
      "archived:JSON.parse(localStorage.getItem('mini-league-desk:archived-events:v1')).events.length," +
      "completed:document.getElementById('fixtureCompletedCount').textContent}))()",
    returnByValue: true
  });
  const reloadValue = reloaded.result?.value;
  if (!reloadValue || reloadValue.id !== "matrix-score-smoke" ||
      reloadValue.archived !== 1 || reloadValue.completed !== "2") {
    throw new Error("Saved event not restored after reload: " + JSON.stringify(reloadValue));
  }


  // Switching must discard a previous event's Undo callback; it must not be
  // possible to apply a stale result Undo to a different tournament.
  const staleUndo = await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "window.__staleUndoApplied=false;" +
      "AppToast.show({message:'Stale action',actionLabel:'Undo',duration:30000," +
      "onAction:()=>{window.__staleUndoApplied=true;}});" +
      "document.getElementById('fixtureEventLibraryButton').click();" +
      "const row=[...document.querySelectorAll('.event-library-row')].find(item=>item.querySelector('.event-library-name')?.textContent==='Second Event');" +
      "const open=row?.querySelector('.event-library-actions .button:not(.danger-ghost)');" +
      "open?.click();" +
      "document.getElementById('appToastAction').click();" +
      "return {switched:document.getElementById('fixtureTitle')?.textContent==='Second Event'," +
      "toastOpen:document.getElementById('appToast').classList.contains('show')," +
      "staleApplied:window.__staleUndoApplied};" +
      "})()",
    returnByValue: true
  });
  const staleValue = staleUndo.result?.value;
  if (!staleValue || !staleValue.switched || staleValue.toastOpen || staleValue.staleApplied) {
    throw new Error("A previous event's Undo remained active after switching: " + JSON.stringify(staleValue));
  }
  await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "document.getElementById('fixtureEventLibraryButton').click();" +
      "const row=[...document.querySelectorAll('.event-library-row')].find(item=>item.querySelector('.event-library-name')?.textContent==='Renamed Original');" +
      "row?.querySelector('.event-library-actions .button:not(.danger-ghost)')?.click();" +
      "})()"
  });

  // Import must create a fresh event ID and provide Undo without overwriting either event.
  await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "const doc=localStorage.getItem('mini-league-desk:active-event:v1');" +
      "const input=document.getElementById('backupFileInput');" +
      "const transfer=new DataTransfer();" +
      "transfer.items.add(new File([doc], 'original.json',{type:'application/json'}));" +
      "input.files=transfer.files;" +
      "input.dispatchEvent(new Event('change',{bubbles:true}));" +
      "})()"
  });
  await sleep(400);
  const imported = await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "const doc=JSON.parse(localStorage.getItem('mini-league-desk:active-event:v1'));" +
      "const saved=JSON.parse(localStorage.getItem('mini-league-desk:archived-events:v1')).events;" +
      "return {id:doc.event.id,hasOriginal:saved.some(item=>item.event.id==='matrix-score-smoke')," +
      "hasSecond:saved.some(item=>item.event.name==='Second Event')," +
      "undoShown:!document.getElementById('appToastAction').hidden};" +
      "})()",
    returnByValue: true
  });
  const importedValue = imported.result?.value;
  if (!importedValue || importedValue.id === "matrix-score-smoke" ||
      !importedValue.hasOriginal || !importedValue.hasSecond || !importedValue.undoShown) {
    throw new Error("JSON import replaced or lost an event: " + JSON.stringify(importedValue));
  }
  await cdp.send("Runtime.evaluate", { expression: "document.getElementById('appToastAction').click()" });
  await sleep(220);
  const undoImport = await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "const active=JSON.parse(localStorage.getItem('mini-league-desk:active-event:v1'));" +
      "const archives=JSON.parse(localStorage.getItem('mini-league-desk:archived-events:v1')).events;" +
      "return {active:active.event.id,importStillSaved:archives.some(item=>item.event.id===" + JSON.stringify(importedValue.id) + ")," +
      "secondSaved:archives.some(item=>item.event.name==='Second Event')};" +
      "})()",
    returnByValue: true
  });
  const undoValue = undoImport.result?.value;
  if (!undoValue || undoValue.active !== "matrix-score-smoke" || undoValue.importStillSaved || !undoValue.secondSaved) {
    throw new Error("Import Undo lost event state: " + JSON.stringify(undoValue));
  }
  console.log("[OK] Legacy data, rename, new event, switching, reload and import Undo passed.");


  // A saved event can be deleted only after confirmation; the active event remains.
  const deletionStart = await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "document.getElementById('fixtureEventLibraryButton').click();" +
      "const row=[...document.querySelectorAll('.event-library-row')].find(item=>item.querySelector('.event-library-name')?.textContent==='Second Event');" +
      "row?.querySelector('.event-library-actions .danger-ghost')?.click();" +
      "return {rowFound:!!row,dialogOpen:document.getElementById('appConfirmDialog').open," +
      "modalDisplay:getComputedStyle(document.getElementById('eventLibraryDialog')).display};" +
      "})()",
    returnByValue: true
  });
  const deleting = deletionStart.result?.value;
  if (!deleting?.rowFound || !deleting.dialogOpen || deleting.modalDisplay !== "flex") {
    throw new Error("Saved event deletion confirmation missing: " + JSON.stringify(deleting));
  }
  await cdp.send("Runtime.evaluate", { expression: "document.getElementById('appConfirmCancel').click()" });
  await sleep(80);
  const afterCancel = await cdp.send("Runtime.evaluate", {
    expression: "JSON.parse(localStorage.getItem('mini-league-desk:archived-events:v1')).events.length",
    returnByValue: true
  });
  if (afterCancel.result?.value !== 1) throw new Error("Cancelling deletion changed the archive.");
  await cdp.send("Runtime.evaluate", {
    expression: "(() => {" +
      "const row=[...document.querySelectorAll('.event-library-row')].find(item=>item.querySelector('.event-library-name')?.textContent==='Second Event');" +
      "row.querySelector('.event-library-actions .danger-ghost').click();" +
      "})()"
  });
  await cdp.send("Runtime.evaluate", { expression: "document.getElementById('appConfirmOk').click()" });
  await sleep(120);
  const afterDelete = await cdp.send("Runtime.evaluate", {
    expression: "(() => ({active:JSON.parse(localStorage.getItem('mini-league-desk:active-event:v1')).event.id," +
      "archiveSize:JSON.parse(localStorage.getItem('mini-league-desk:archived-events:v1')).events.length," +
      "dialogOpen:document.getElementById('eventLibraryDialog').open}))()",
    returnByValue: true
  });
  const deleted = afterDelete.result?.value;
  if (!deleted || deleted.active !== "matrix-score-smoke" || deleted.archiveSize !== 0 || !deleted.dialogOpen) {
    throw new Error("Deleting an archived event affected the current event: " + JSON.stringify(deleted));
  }
  await cdp.send("Runtime.evaluate", { expression: "document.getElementById('closeEventLibraryButton').click()" });
  console.log("[OK] Event library confirmation, cancellation and deletion passed.");

  await runPngHeaderSmoke(cdp);

  // A malformed active key must be preserved exactly, including after UI renders.
  await cdp.send("Runtime.evaluate", {
    expression: "localStorage.setItem('mini-league-desk:active-event:v1','{broken-json:');location.reload();"
  });
  await sleep(900);
  const unreadable = await cdp.send("Runtime.evaluate", {
    expression:
      "(() => {" +
      "const saved=localStorage.getItem('mini-league-desk:active-event:v1');" +
      "const alert=document.getElementById('storageAlert');" +
      "document.getElementById('setupEventLibraryButton').click();" +
      "return {saved,warningVisible:!alert.hidden," +
      "newDisabled:document.getElementById('createNewEventButton').disabled," +
      "activeUnchanged:localStorage.getItem('mini-league-desk:active-event:v1')===saved};" +
      "})()",
    returnByValue:true
  });
  const invalidValue = unreadable.result?.value;
  if (!invalidValue || invalidValue.saved !== "{broken-json:" ||
      !invalidValue.warningVisible || !invalidValue.newDisabled || !invalidValue.activeUnchanged) {
    throw new Error("Corrupted local storage was discarded: " + JSON.stringify(invalidValue));
  }
  console.log("[OK] Corrupt persisted event remains intact and blocks unsafe writes.");


} finally {
  try { if (cdp) cdp.close(); } catch {}
  try { browser.kill(); } catch {}
  server.close();
  await sleep(500);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 150 }); } catch {}
}
