import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist", "index.html");
const outDir = path.join(root, "release-screenshots");
if (!fs.existsSync(dist)) throw new Error("dist/index.html is required.");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

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
    response.writeHead(404); response.end("Not found"); return;
  }
  response.writeHead(200, {
    "Content-Type": file.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(file).pipe(response);
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(8767, "127.0.0.1", resolve);
});

const debugPort = 9224;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mini-league-release-shots-"));
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
    } catch (error) { lastError = error; }
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
  close() { this.socket.close(); }
}

function releaseDocument(language) {
  const japanese = language === "ja";
  const participants = (japanese ? ["佐藤", "青木", "伊藤", "田中"] : ["Alex", "Blake", "Casey", "Drew"])
    .map((name, index) => ({ id: "p" + (index + 1), name }));
  return {
    format: "mini-league-desk",
    schemaVersion: 1,
    appVersion: "1.0.0",
    event: {
      id: "release-screenshot",
      name: japanese ? "秋季ミニリーグ" : "Autumn Mini League",
      phase: "fixtures",
      settings: { resultMode: "score", scoreDrawsAllowed: true },
      participants,
      rounds: [
        { number: 1, byeParticipantId: null, matches: [
          { id: "m1", round: 1, order: 1, participantAId: "p1", participantBId: "p4", status: "completed", scoreA: 3, scoreB: 1, result: "win", winnerId: "p1" },
          { id: "m2", round: 1, order: 2, participantAId: "p2", participantBId: "p3", status: "completed", scoreA: 2, scoreB: 2, result: "draw", winnerId: null }
        ]},
        { number: 2, byeParticipantId: null, matches: [
          { id: "m3", round: 2, order: 3, participantAId: "p1", participantBId: "p3", status: "completed", scoreA: 1, scoreB: 3, result: "win", winnerId: "p3" },
          { id: "m4", round: 2, order: 4, participantAId: "p4", participantBId: "p2", status: "pending", scoreA: null, scoreB: null, result: null, winnerId: null }
        ]},
        { number: 3, byeParticipantId: null, matches: [
          { id: "m5", round: 3, order: 5, participantAId: "p1", participantBId: "p2", status: "pending", scoreA: null, scoreB: null, result: null, winnerId: null },
          { id: "m6", round: 3, order: 6, participantAId: "p3", participantBId: "p4", status: "pending", scoreA: null, scoreB: null, result: null, winnerId: null }
        ]}
      ],
      ui: { matchFilter: "all", matchView: "matrix", participantFocusId: "p1", activePage: "matches" },
      createdAt: "2026-10-06T00:00:00.000Z",
      updatedAt: "2026-10-06T00:00:00.000Z"
    }
  };
}

async function evaluate(cdp, expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (response.exceptionDetails) throw new Error("Runtime evaluation failed: " + JSON.stringify(response.exceptionDetails));
  return response.result && response.result.value;
}

async function setViewport(cdp, width, height, mobile) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await sleep(250);
}

async function capture(cdp, filename) {
  const shot = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
  fs.writeFileSync(path.join(outDir, filename), Buffer.from(shot.data, "base64"));
}

let cdp;
try {
  const pages = await fetchJson("http://127.0.0.1:" + debugPort + "/json/list");
  const page = pages.find(item => item.type === "page");
  if (!page || !page.webSocketDebuggerUrl) throw new Error("Page target was not found.");
  cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Page.navigate", { url: "http://127.0.0.1:8767/dist/index.html" });
  await sleep(700);

  for (const language of ["ja", "en"]) {
    const documentValue = releaseDocument(language);
    await evaluate(cdp,
      "localStorage.clear();" +
      "localStorage.setItem('mini-league-desk:language'," + JSON.stringify(language) + ");" +
      "localStorage.setItem('mini-league-desk:active-event:v1',JSON.stringify(" + JSON.stringify(documentValue) + "));" +
      "location.reload();"
    );
    await sleep(5800);

    const expectedLocal = language === "ja" ? "完全ローカル処理" : "Fully local processing";
    const markers = await evaluate(cdp,
      "({version:document.getElementById('versionBadge')?.textContent.trim()," +
      "local:document.querySelector('[data-i18n=\\\"localBadge\\\"]')?.textContent.trim()," +
      "matrix:document.querySelectorAll('.round-robin-matrix').length})"
    );
    if (!markers || markers.version !== "v1.0.0" || markers.local !== expectedLocal || markers.matrix !== 1) {
      throw new Error("Release screenshot state is incorrect: " + JSON.stringify(markers));
    }

    await setViewport(cdp, 1440, 1000, false);
    await evaluate(cdp,
      "document.querySelector('[data-league-section=\\\"matchesPage\\\"]')?.click();" +
      "document.querySelector('[data-match-view=\\\"matrix\\\"]')?.click();" +
      "requestAnimationFrame(()=>{const page=document.getElementById('matchesPage');window.scrollTo(0,Math.max(0,(page?.offsetTop||0)-78));});"
    );
    await sleep(350);
    await capture(cdp, language === "ja" ? "screenshot.png" : "screenshot-en.png");

    await setViewport(cdp, 390, 844, true);
    await evaluate(cdp,
      "document.querySelector('[data-league-section=\\\"progressPage\\\"]')?.click();" +
      "requestAnimationFrame(()=>{const page=document.getElementById('progressPage');window.scrollTo(0,Math.max(0,(page?.offsetTop||0)-70));});"
    );
    await sleep(350);
    const mobileWidth = await evaluate(cdp, "({innerWidth,scrollWidth:document.documentElement.scrollWidth})");
    if (!mobileWidth || mobileWidth.innerWidth !== 390 || mobileWidth.scrollWidth !== 390) {
      throw new Error("Mobile screenshot has page-level horizontal overflow: " + JSON.stringify(mobileWidth));
    }
    await capture(cdp, language === "ja" ? "screenshot-mobile.png" : "screenshot-mobile-en.png");
  }

  for (const name of ["screenshot.png", "screenshot-en.png", "screenshot-mobile.png", "screenshot-mobile-en.png"]) {
    const file = path.join(outDir, name);
    if (!fs.existsSync(file) || fs.statSync(file).size < 20000) throw new Error("Screenshot missing or unexpectedly small: " + name);
  }
  console.log("[OK] Captured v1.0.0 Japanese/English desktop and mobile release screenshots.");
} finally {
  try { if (cdp) cdp.close(); } catch {}
  try { browser.kill(); } catch {}
  server.close();
  await sleep(500);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 150 }); } catch {}
}
