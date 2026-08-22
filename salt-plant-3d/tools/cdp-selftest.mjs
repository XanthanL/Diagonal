// CDP selftest runner: evaluates window.__diag on the running headless browser.
// Usage: node cdp-selftest.mjs <url>
const url = process.argv[2] || 'http://127.0.0.1:8765/index.html?selftest';
const PORT = 9222;

try {
  // create a new tab pointing at url
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!res.ok) throw new Error(`/json/new HTTP ${res.status}`);
  const tab = await res.json();
  console.error(`[cdp] tab ${tab.id} ${tab.url}`);
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
  await send('Runtime.enable');
  // wait for page load event
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
