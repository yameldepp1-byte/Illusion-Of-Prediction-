import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 8787);
const HISTORY_URL = process.env.WINGO_HISTORY_URL ||
  "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

let cache = { list: [], fetchedAt: 0, error: null };
const clients = new Set();

function normalize(item) {
  const number = Number.parseInt(item?.number, 10);
  const issue = String(item?.issueNumber ?? item?.issue ?? "");
  if (!issue || !Number.isFinite(number)) return null;
  return {
    issue,
    number,
    size: number >= 5 ? "BIG" : "SMALL",
    color: number === 0 || number === 5 ? "VIOLET" : (number % 2 ? "GREEN" : "RED")
  };
}

async function fetchHistory() {
  try {
    const r = await fetch(`${HISTORY_URL}${HISTORY_URL.includes("?") ? "&" : "?"}t=${Date.now()}`, {
      headers: { "accept": "application/json", "user-agent": "NebulaOracle/1.0" }
    });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const json = await r.json();
    const raw = json?.data?.list ?? json?.list ?? [];
    const list = raw.map(normalize).filter(Boolean);
    if (!list.length) throw new Error("upstream returned no normalized results");
    cache = { list, fetchedAt: Date.now(), error: null };
    broadcast({ type: "history", list, serverTime: Date.now() });
    return list;
  } catch (e) {
    cache.error = e.message;
    broadcast({ type: "error", message: e.message });
    return cache.list;
  }
}

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const ws of clients) if (ws.readyState === WebSocket.OPEN) ws.send(data);
}

app.get("/api/health", (_req, res) => res.json({
  ok: true,
  upstream: HISTORY_URL,
  cachedResults: cache.list.length,
  fetchedAt: cache.fetchedAt || null,
  error: cache.error
}));

app.get("/api/history", async (_req, res) => {
  if (!cache.list.length || Date.now() - cache.fetchedAt > 2500) await fetchHistory();
  res.json({ list: cache.list, fetchedAt: cache.fetchedAt, error: cache.error });
});

const server = app.listen(PORT, () => console.log(`Nebula API listening on :${PORT}`));
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", ws => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "history", list: cache.list, serverTime: Date.now() }));
  ws.on("close", () => clients.delete(ws));
  ws.on("error", () => clients.delete(ws));
});

// Optional upstream websocket bridge. The token is never shipped to the browser.
let upstream;
function connectUpstream() {
  const url = process.env.WS_URL;
  const token = process.env.WS_TOKEN;
  if (!url) return;
  try {
    const protocols = token ? [token] : undefined;
    upstream = new WebSocket(url, protocols);
    upstream.on("open", () => broadcast({ type: "upstream", connected: true }));
    upstream.on("message", data => {
      broadcast({ type: "upstream_message", data: data.toString() });
    });
    upstream.on("close", () => {
      broadcast({ type: "upstream", connected: false });
      setTimeout(connectUpstream, 5000);
    });
    upstream.on("error", () => {});
  } catch {}
}
connectUpstream();

fetchHistory();
setInterval(fetchHistory, 2000);
