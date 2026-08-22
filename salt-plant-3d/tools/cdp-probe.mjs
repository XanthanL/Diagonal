// CDP diagnostic probe: subscribes to console/exception/log events, then navigates,
// dumps collected events plus window.__diag / #diag textContent.
// Usage: node cdp-probe.mjs <url>
const url = process.argv[2] || 'http://127.0.0.1:8765/index.html?selftest';
const PORT = 9222;

try {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  const tab = await res.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
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
    } else if (msg.method) {
      events.push(msg);
    }
  };
  await new Promise((r) => (ws.onopen = r));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');
  await new Promise((r) => setTimeout(r, 300));
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 9000));

  const { result } = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
        readyState: document.readyState,
        diagText: (document.getElementById('diag') || {}).textContent || '',
        hasDiag: !!window.__diag,
        errs: window.__errs || null,
      })`,
    returnByValue: true,
  });
  console.log('PAGE:', result.value);
  const interesting = events.filter((m) =>
    ['Runtime.consoleAPICalled', 'Runtime.exceptionThrown', 'Log.entryAdded'].includes(m.method));
  for (const m of interesting) {
    if (m.method === 'Runtime.consoleAPICalled') {
      const args = (m.params.args || []).map((a) => a.value !== undefined ? JSON.stringify(a.value) : (a.description || a.type)).join(' ');
      console.log(`[console.${m.params.type}] ${args}`);
    } else if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      console.log(`[exception] ${d.text} ${d.exception && d.exception.description ? d.exception.description : ''}`);
    } else {
      console.log(`[log.${m.params.entry.level}] ${m.params.entry.source}: ${m.params.entry.text} ${m.params.entry.url || ''}`);
    }
  }
  if (!interesting.length) console.log('[no console/exception/log events captured]');
  await send('Page.close').catch(() => {});
  ws.close();
} catch (e) {
  console.error('[cdp] fatal:', e.stack || String(e));
  process.exit(1);
}
process.exit(0);
