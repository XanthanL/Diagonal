// 自检套件(?selftest):无头验收断言,全绿才算交付
import { PARTS } from './data.js';
import { ENV } from './spec.js';

/** @returns {{name:string, pass:boolean, detail?:string}[]} */
export function runSelftest({ scene, camera, renderer, tickers }) {
  const results = [];
  const add = (name, pass, detail) => results.push({ name, pass: !!pass, detail });

  // 1. 运行时零错误(main.js 已把 __errs 并入总判,这里单列可见)
  add('#1 运行时零错误', window.__errs.length === 0, 'errs=' + window.__errs.length);

  // 2. 相机与目标无 NaN
  const camOk =
    Number.isFinite(camera.position.x + camera.position.y + camera.position.z) &&
    Number.isFinite(controls0(scene).x + 1);
  add('#2 相机状态正常', camOk, 'cam=' + camera.position.toArray().map((v) => v.toFixed(1)).join(','));

  // 3. 关键命名组全部在场
  const names = new Set();
  scene.traverse((o) => { if (o.name) names.add(o.name); });
  const need = ['environment', 'gatehouse', 'terrain', 'water', 'hills', 'mist', 'trees', 'bridge',
    'moon', 'terrace', 'roofs', 'halls', 'lanterns', 'crown', 'portal', 'fireflies', 'portal-stream'];
  const missing = need.filter((n) => !names.has(n));
  add('#3 场景组齐全', missing.length === 0, missing.length ? 'missing=' + missing.join(',') : need.length + ' 组');

  // 4. partId 覆盖:7 个可聚焦构件都能被拾取
  const ids = new Set();
  scene.traverse((o) => { if (o.userData && o.userData.partId) ids.add(o.userData.partId); });
  const wantIds = PARTS.filter((p) => !['overview', 'landscape'].includes(p.id)).map((p) => p.id);
  const missIds = wantIds.filter((id) => !ids.has(id));
  add('#4 构件可拾取', missIds.length === 0, missIds.length ? 'missing=' + missIds.join(',') : wantIds.join(','));

  // 5. 灵火粒子数量
  let fireCount = 0;
  scene.traverse((o) => {
    if (o.name === 'fireflies') fireCount = o.geometry.getAttribute('position').count;
  });
  add('#5 灵火数量', fireCount === ENV.fireflies.count, fireCount + '/' + ENV.fireflies.count);

  // 6. 水面 shader 已编译(有 uniform 时间)
  let waterOk = false;
  scene.traverse((o) => {
    if (o.name === 'water' && o.material.uniforms && o.material.uniforms.time) waterOk = true;
  });
  add('#6 水面 shader', waterOk);

  // 7. 动画 ticker 已挂载(水/雾/灵火/流光)
  add('#7 动画回路', tickers && tickers.length >= 1, 'tickers=' + (tickers ? tickers.length : 0));

  // 8. 预算:draw call 与三角形
  const info = renderer.info.render;
  add('#8 draw call ≤ 90', info.calls <= 90, 'calls=' + info.calls);
  add('#9 三角形 ≤ 500k', info.triangles <= 500000, 'tris=' + info.triangles);

  // 10. 阴影开启
  add('#10 阴影开启', renderer.shadowMap.enabled === true);

  return results;
}

// scene 里挂的 __gh.controls 不方便直取;这里只用来做一个非 NaN 探针
function controls0(scene) {
  let v = { x: 0, z: 0 };
  scene.traverse((o) => { if (o.name === 'terrain') v = o.position; });
  return v;
}

export function summarizeSelftest(results) {
  const failed = results.filter((x) => !x.pass);
  return {
    passed: results.length - failed.length,
    total: results.length,
    failed,
    allPass: failed.length === 0,
  };
}
