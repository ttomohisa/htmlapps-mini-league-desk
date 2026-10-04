import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(root, "release-screenshots");
fs.mkdirSync(outputDir, { recursive: true });

function findBrowser() {
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const candidates = [
    path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe")
  ];
  const found = candidates.find(candidate => fs.existsSync(candidate));
  if (!found) throw new Error("Chrome or Edge was not found.");
  return found;
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

const server = http.createServer((request, response) => {
  try {
    const raw = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const relative = raw === "/" ? "dist/index.html" : raw.replace(/^\/+/, "");
    const file = path.resolve(root, relative);
    if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": contentType(file), "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
  } catch (error) {
    response.writeHead(500);
    response.end(String(error));
  }
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(8765, "127.0.0.1", resolve);
});

const debugPort = 9222;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mini-league-rc-chrome-"));
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

async function getJson(url, attempts = 50) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(200);
  }
  throw lastError || new Error("Timed out waiting for Chrome DevTools.");
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

function eventDocument(language) {
  const japanese = language === "ja";
  const names = japanese
    ? ["\u9752\u6728", "\u4f0a\u85e4", "\u4f50\u85e4", "\u7530\u4e2d"]
    : ["Alex", "Jordan", "Morgan", "Taylor"];
  return {
    format: "mini-league-desk",
    schemaVersion: 1,
    appVersion: "0.9.0",
    event: {
      id: "release-screenshot-" + language,
      name: japanese ? "\u79cb\u5b63\u30df\u30cb\u30ea\u30fc\u30b0" : "Autumn Mini League",
      phase: "fixtures",
      settings: { resultMode: "score", scoreDrawsAllowed: true },
      participants: names.map((name, index) => ({ id: "p" + (index + 1), name })),
      rounds: [
        { number: 1, byeParticipantId: null, matches: [
          { id:"m1", round:1, order:1, participantAId:"p1", participantBId:"p4", status:"completed", scoreA:3, scoreB:1, result:"win", winnerId:"p1" },
          { id:"m2", round:1, order:2, participantAId:"p2", participantBId:"p3", status:"completed", scoreA:2, scoreB:2, result:"draw", winnerId:null }
        ]},
        { number: 2, byeParticipantId: null, matches: [
          { id:"m3", round:2, order:3, participantAId:"p1", participantBId:"p3", status:"completed", scoreA:0, scoreB:2, result:"win", winnerId:"p3" },
          { id:"m4", round:2, order:4, participantAId:"p4", participantBId:"p2", status:"pending", scoreA:null, scoreB:null, result:null, winnerId:null }
        ]},
        { number: 3, byeParticipantId: null, matches: [
          { id:"m5", round:3, order:5, participantAId:"p1", participantBId:"p2", status:"pending", scoreA:null, scoreB:null, result:null, winnerId:null },
          { id:"m6", round:3, order:6, participantAId:"p3", participantBId:"p4", status:"pending", scoreA:null, scoreB:null, result:null, winnerId:null }
        ]}
      ],
      ui: { matchFilter: "all", participantFocusId: "p1", activePage: "progress" },
      createdAt: "2026-10-04T02:15:00.000Z",
      updatedAt: "2026-10-04T02:15:00.000Z"
    }
  };
}

let cdp;
try {
  const pages = await getJson("http://127.0.0.1:" + debugPort + "/json/list");
  const page = pages.find(item => item.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("Chrome page target was not found.");
  cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  async function capture({ name, language, width, height, mobile }) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
      screenWidth: width,
      screenHeight: height
    });
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 1 : 0 });
    await cdp.send("Page.navigate", { url: "http://127.0.0.1:8765/dist/index.html" });
    await sleep(800);

    const languageJson = JSON.stringify(language);
    const documentJson = JSON.stringify(eventDocument(language));
    await cdp.send("Runtime.evaluate", {
      expression:
        "localStorage.clear();" +
        "localStorage.setItem('mini-league-desk:language'," + languageJson + ");" +
        "localStorage.setItem('mini-league-desk:active-event:v1',JSON.stringify(" + documentJson + "));" +
        "location.reload();"
    });

    await sleep(6200);
    const metrics = await cdp.send("Runtime.evaluate", {
      expression: "({innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,lang:document.documentElement.lang,version:document.getElementById('versionBadge')?.textContent})",
      returnByValue: true
    });
    const value = metrics.result?.value || {};
    if (value.innerWidth !== width) throw new Error(name + ": expected innerWidth " + width + ", got " + value.innerWidth);
    if (value.scrollWidth > value.innerWidth + 1) throw new Error(name + ": horizontal overflow " + value.scrollWidth + " > " + value.innerWidth);
    if (value.lang !== language) throw new Error(name + ": expected lang " + language + ", got " + value.lang);
    if (value.version !== "v0.9.0") throw new Error(name + ": expected v0.9.0, got " + value.version);

    await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0,0)" });
    await sleep(100);
    const shot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
      clip: { x: 0, y: 0, width, height, scale: 1 }
    });
    fs.writeFileSync(path.join(outputDir, name), Buffer.from(shot.data, "base64"));
    console.log("[OK] " + name + " " + width + "x" + height + " scrollWidth=" + value.scrollWidth);
  }

  await capture({ name:"screenshot.png", language:"ja", width:1440, height:1000, mobile:false });
  await capture({ name:"screenshot-mobile.png", language:"ja", width:390, height:844, mobile:true });
  await capture({ name:"screenshot-en.png", language:"en", width:1440, height:1000, mobile:false });
  await capture({ name:"screenshot-mobile-en.png", language:"en", width:390, height:844, mobile:true });
} finally {
  try { cdp?.close(); } catch {}
  try { browser.kill(); } catch {}
  server.close();
  await sleep(800);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
}
