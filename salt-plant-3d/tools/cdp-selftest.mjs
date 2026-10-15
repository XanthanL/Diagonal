// CDP selftest runner: evaluates window.__diag on the running headless browser.
// Usage: node cdp-selftest.mjs <url>
//
// ⚠ 必须走「先开 about:blank、禁缓存、再 Page.navigate」这条路。
// 早期版本用 /json/new?<url> 直接带着地址开标签，页面的 ES module（js/main.js）
// 会走浏览器的 HTTP 缓存 —— 改了源码、同步了 public/，自检却对着**上一版代码**
// 报「通过」。2026-09-14 实测：三角面数原样报 54564，而真实产物是 54772
// （11 根绳由方柱 12 面改成 8 段圆柱 32 面，预期 +208），差了整整一轮改动。
// 现在 fetch 一个 about:blank 标签，Network.setCacheDisabled 之后再导航。
// 没有默认地址是**故意的**：以前默认写死 8765，地址不对时会静默探测到一个空页面，
// 只报 “no diag; probe=...” 而不说原因 —— 与「缓存跑到旧代码」的症状极易混淆，白查一轮。
// 现在缺参会直接报用法退出。
const url = process.argv[2];
if (!url) {
  console.error('用法: node tools/cdp-selftest.mjs <url>');
  console.error('例:   node tools/cdp-selftest.mjs "http://127.0.0.1:8766/salt-plant-3d/index.html?selftest&cb=$(date +%s)"');
  console.error('      （地址假与「缓存跑到旧代码」都会表现为没有 __diag，先确认服务与端口）');
  process.exit(2);
}
const PORT = 9222;

try {
  // 1) 开一个空标签（不带地址，避免第一次导航就吃到缓存）
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  if (!res.ok) throw new Error(`/json/new HTTP ${res.status}`);
  const tab = await res.json();
  console.error(`[cdp] tab ${tab.id}`);
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
  ws.onerror = (e) => console.error('[cdp] ws error', e.message || e);
  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Runtime.enable');
  // 2) 禁缓存之后再导航
  await send('Page.navigate', { url });
  console.error(`[cdp] -> ${url}`);
  await new Promise((r) => setTimeout(r, 6000)); // allow module load + init + selftest
  let got = '';
  for (let attempt = 0; attempt < 10 && !got; attempt++) {
    const { result } = await send('Runtime.evaluate', { expression: 'window.__diag ? JSON.stringify(window.__diag) : (window.__errs && window.__errs.length ? JSON.stringify({ errs: window.__errs }) : "")', returnByValue: true });
    if (result.value) got = result.value;
    else await new Promise((r) => setTimeout(r, 2000));
  }
  if (!got) {
    const probe = await send('Runtime.evaluate', { expression: 'JSON.stringify({ readyState: document.readyState, hasDiag: !!window.__diag, hasErrs: !!(window.__errs && window.__errs.length), title: document.title })', returnByValue: true });
    console.error('[cdp] no diag; probe=' + JSON.stringify(probe.result && probe.result.value));
  }
  console.log(got);
  await send('Page.close').catch(() => {});
  ws.close();
} catch (e) {
  console.error('[cdp] fatal:', e.stack || String(e));
  process.exit(1);
}
process.exit(0);
