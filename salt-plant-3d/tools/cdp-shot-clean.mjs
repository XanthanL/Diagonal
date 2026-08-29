// CDP screenshot: loads url, waits for render, saves viewport PNG.
// Usage: node cdp-shot.mjs <url> <outPng> [waitMs]
import { writeFileSync } from 'node:fs';
const url = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const out = process.argv[3] || 'shot.png';
const waitMs = Number(process.argv[4] || 9000);
const PORT = 9222;

try {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const tab = await res.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  }
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  };
  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Emulation.setScrollbarsHidden', { hidden: true }).catch(() => {});
  await new Promise((r) => setTimeout(r, waitMs));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  if (!shot || !shot.data) {
    console.error('[cdp] capture response:', JSON.stringify(shot).slice(0, 400));
    process.exit(1);
  }
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log('saved', out);
  await send('Page.close').catch(() => {});
  ws.close();
} catch (e) {
  console.error('[cdp] fatal:', e.stack || String(e));
  process.exit(1);
}
process.exit(0);