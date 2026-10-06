import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist", "index.html");
if (!fs.existsSync(dist)) throw new Error("dist/index.html is required.");

function findBrowser() {
  const pf = process.env.ProgramFiles || "C:\\Program Files";
  const pfx86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const candidates = [
    path.join(pf, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(pfx86, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(pfx86, "Microsoft", "Edge", "Application", "msedge.exe")
  ];
  const found = candidates.find(candidate => fs.existsSync(candidate));
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

async function fetchJson(url, attempts = 50) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
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
  const pages = await fetchJson("http://127.0.0.1:" + debugPort + "/json/list");
  const page = pages.find(item => item.type === "page");
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
} finally {
  try { if (cdp) cdp.close(); } catch {}
  try { browser.kill(); } catch {}
  server.close();
  await sleep(500);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 150 }); } catch {}
}
