// CDP focused screenshot: loads page, clicks a nav item, waits for camera tween, saves PNG.
// Usage: node cdp-shot-nav.mjs <url> <navIndex> <outPng>
import { writeFileSync } from 'node:fs';
const url = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const navIndex = Number(process.argv[3] || 0);
const out = process.argv[4] || 'shot.png';
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
  // 必须在导航之前禁缓存：js/main.js 走 HTTP 缓存会让工具对上一版代码取证
  // （ES module URL 不带版本号，加 ?cb= 只破 HTML 自身的缓存）。
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.navigate', { url });
  await send('Runtime.enable');
  await new Promise((r) => setTimeout(r, 8000)); // initial load + first frames
  await send('Runtime.evaluate', { expression: `document.querySelectorAll('.nav-item')[${navIndex}].click()` });
  await new Promise((r) => setTimeout(r, 3500)); // camera tween 1.1s + settle
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
