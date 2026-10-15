// 环境层:渐变天穹 / 起伏地坪 / 三重雾山 / 碧水 shader / 灵雾 / 松 / 石拱桥 / 月
import * as THREE from 'three';
import { C, WORLD, ENV } from '../spec.js';
import {
  emit, flushBin, glowTexture, grainTexture, mulberry, valueNoise2D, grainNormalTexture,
  rippleNormalTexture, waterColorTexture, cloudTexture, skyEnvironment,
} from './util.js';

// ---------- 天穹:玉青→纸暖 渐变球 ----------
function buildSky(cloudTex) {
  const geo = new THREE.SphereGeometry(420, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color(WORLD.sky.top) },
      mid: { value: new THREE.Color(WORLD.sky.mid) },
      bottom: { value: new THREE.Color(WORLD.sky.bottom) },
      sunDir: { value: new THREE.Vector3(...WORLD.sun.pos).normalize() },
      sunTint: { value: new THREE.Color(0xfff4d8) },
      clouds: { value: cloudTex || null },
      cloudAmt: { value: cloudTex ? 0.62 : 0.0 },
    },
    vertexShader: `
      varying vec3 vDir;
      varying vec2 vUv;
      void main() {
        vDir = normalize(position);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      varying vec3 vDir;
      varying vec2 vUv;
      uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
      uniform vec3 sunDir; uniform vec3 sunTint;
      uniform sampler2D clouds; uniform float cloudAmt;
      void main() {
        float h = clamp(vDir.y, -0.1, 1.0);
        // 蓝先到:pow<1 让 mid(已是天蓝)在较低仰角就主导,蔚蓝更早铺满画面
        vec3 col = mix(mid, top, pow(max(h, 0.0), 0.38));
        // ⚠ 地平暖白带必须收窄(原 0.075 → 0.045):它一宽,画面上半整片发白,
        //   天空就读成"没画完的白纸"。暖白只该贴着地平线一条。
        col = mix(bottom, col, smoothstep(-0.04, 0.045, h));
        // 日光:天空只朝太阳一侧泛暖白(与主光方向一致,而非整片均匀提亮)
        float sd = max(dot(normalize(vDir), sunDir), 0.0);
        // 云:低空成层、向上迅速稀薄;朝阳一侧吃光更暖
        vec2 cuv = vec2(vUv.x * 3.0, vUv.y * 5.0);
        float ca = texture2D(clouds, cuv).a;
        ca *= smoothstep(0.010, 0.13, h) * (1.0 - smoothstep(0.30, 0.86, h))
            * cloudAmt * (0.55 + 0.85 * sd);
        col = mix(col, mix(vec3(1.0), sunTint, 0.30), ca);
        col = mix(col, sunTint, pow(sd, 6.0) * 0.5);
        col += sunTint * pow(sd, 60.0) * 0.45;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.name = 'sky';
  return sky;
}

// ---------- 地坪:场心平整、水湾下凹、四缘缓缓隆起 ----------
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  const lift = Math.max(0, (r - 42) / 58) ** 1.7 * 6.0;           // 远处隆起,把视线托向山
  const und = Math.sin(x * 0.055 + 1.7) * Math.cos(z * 0.047) * 0.30
            + Math.sin(x * 0.021 - z * 0.03) * 0.42;              // 近处细起伏(轻)
  const flat = smoothstep(18, 34, r);                             // 场心(含踏道与石径)压平
  let h = lift + und * flat;
  // 水湾洼地:椭圆距离场,内部压到 -1.1 m;岸肩微抬收边
  const { cx, cz, rx, rz } = ENV.water;
  const d = Math.hypot((x - cx) / (rx * 1.1), (z - cz) / (rz * 1.34));
  const bowl = 1 - smoothstep(0.88, 1.06, d);
  h = h * (1 - bowl) + -1.1 * bowl;
  // 岸肩:水湾外一圈微微隆起。0.44 m 足以在噪声谷底也高过水位,岸线才落在水面范围内
  h += Math.exp(-(((d - 1.11) / 0.10) ** 2)) * 0.44 * (1 - bowl);
  /**
   * 园池凹盆(第二处洼地)。
   * ⚠ 是**减**不是**插值到常数**:河湾是"整片压到 -1.1 m",园池是在原地形上往下挖一个盆
   *   —— 原地形的起伏必须留着,不然池岸一圈会平得像水泥边。
   * ⚠ 过渡带取 0.55 ~ 1.0 归一化半径:**0.55 以内是平盆底**(不是锥形),
   *   锥底会让池心的水浅得看见泥。1.0 之外一概不动。
   */
  const pd = Math.hypot((x - ENV.pond.cx) / ENV.pond.rx, (z - ENV.pond.cz) / ENV.pond.rz);
  h -= ENV.pond.depth * (1 - smoothstep(0.55, 1.0, pd));
  return h;
}
/**
 * 接触暗部(假 AO):返回 0~1 的遮蔽强度,用来压暗地形顶点色 —— 零新增 mesh。
 * ⚠ falloff 必须 ≥ 地形顶点间距(terrain.r*2/100 ≈ 1.9 m):更小的晕根本落不到顶点上,
 *   渲染出来什么都看不见(这跟 salt-plant 的「用痕迹而不是构件」是同一条路)。
 */
function contactAO(x, z) {
  const A = ENV.ao;
  let a = 0;
  for (const s of A.rects) {
    const d = Math.max(Math.abs(x - s.x) - s.hx, Math.abs(z - s.z) - s.hz);  // 有向距离(内为负)
    a = Math.max(a, 1 - smoothstep(0, A.falloff, d));
  }
  for (const c of A.circles) {
    const d = Math.hypot(x - c.x, z - c.z) - c.r;
    a = Math.max(a, 1 - smoothstep(0, A.falloff, d));
  }
  return Math.min(1, a);
}
// 草地大尺度斑驳:一张 190 m 见方、13 格的无缝噪声(= 一块约 15 m)
const grassPatch = valueNoise2D(13, 8123);
function buildTerrain(mat) {
  // ⚠ seg 从 100 提到 140:格距由 1.9 m 降到 1.36 m。园池岸线的过渡带只有 ~7.9 m 宽,
  //   1.9 m 的格距在上面只落 4 个顶点 —— 岸线会读成"多边形",水面边缘是折线。
  const size = ENV.terrain.r * 2, seg = 140;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const cDeep = new THREE.Color(C.mossDeep), cMid = new THREE.Color(C.moss), cHigh = new THREE.Color(C.mossHigh);
  const tmpC = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const y = terrainHeight(x, z);
    p.setY(i, y);
    // 明度分层:低处深苔、台前中绿、远处提浅接山;再叠一点点横向笔触
    tmpC.copy(cDeep).lerp(cMid, smoothstep(-1.1, 1.8, y));
    tmpC.lerp(cHigh, smoothstep(3.5, 9.0, y));
    const streak = 0.5 + 0.5 * Math.sin(x * 0.021 + z * 0.017);
    // 大尺度斑块:草地不是一块均匀色板。正弦那两列周期是 300 m / 76 m,在 190 m 的地坪上
    // 几乎读不出来;改用 valueNoise(13 格 ≈ 15 m 一块),且噪声没有周期,不会复读。
    const patch = grassPatch(x / (ENV.terrain.r * 2) + 0.5, z / (ENV.terrain.r * 2) + 0.5);
    // ⚠ 只乘一个标量时,斑块只改明度、不改色相 —— 一大片草地仍是一块荧光绿板。
    //   让 patch 直接进**混色**:向阳的块偏黄绿(mossHigh)、背阴的块偏冷深(mossDeep),
    //   草地上才有"一块晒得发黄、一块还湿着"的层次。
    const pv = (patch - 0.5) * 2;                  // -1..1,以 0 为界
    if (pv > 0) tmpC.lerp(cHigh, pv * 0.34);
    else tmpC.lerp(cDeep, -pv * 0.26);
    // 接触暗部:构件落地处压暗,否则物体像「贴」在草地上
    const k = (0.94 + streak * 0.05) * (1 - contactAO(x, z) * ENV.ao.strength);
    col[i * 3] = tmpC.r * k; col[i * 3 + 1] = tmpC.g * k; col[i * 3 + 2] = tmpC.b * k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  m.name = 'terrain';
  return m;
}

// ---------- 雾山:heightfield 长卷,一山一色,山外有山 ----------
/**
 * 雾山:一条沿 x 起伏的山脊带 —— 平面躺平在 XZ,**y 才是高度**。
 * ⚠ 曾经的实现是"浮雕墙":平面留在 XY 不动、把起伏写进 z,法线朝 -z,而材质是 FrontSide
 *   → 相机在 +z 侧看到的是背面,整组山被背面剔除,一帧都没渲染过。
 * 现在:躺平 + 抬 y,法线朝上;从近缘 0 米爬到山脊,山脚自然埋进地坪。
 * FLOOR 取 5.0:地坪四缘的 lift 在 r=95 处正好是 5.16 m,山带的谷底接在这个高度上,
 *   地形边缘才不会露出一道 5 m 的断崖。
 */
const hillNoise = valueNoise2D(9, 4242);     // 沿 x 的低频扰动:让每座山峰各不相同
// 山体表面的斑驳(植被/岩土的深浅)。x/z 同除 w → 两轴世界格子相等,不会拉成横条。
const hillPatch = valueNoise2D(16, 6161);
// 山**面**的起伏(几何,不是颜色)。见 buildHill:没有它,正面坡是直纹面。
const faceNoise = valueNoise2D(20, 7331);
function buildHill({ w = 380, depth = 90, h, seg = 110, color, amp = 1, rot = 0 }) {
  const FLOOR = 5.0;
  const geo = new THREE.PlaneGeometry(w, depth, seg, 22);
  geo.rotateX(-Math.PI / 2);                      // 躺平:XZ 平面,y 竖直
  const p = geo.attributes.position;
  // ⚠ 必须是**三维**太阳方向。只取水平分量时,坡面的点积恒在 0 附近 —— 明暗项
  //   看起来写着、实际等于没有,这是山"平涂"的第二个原因。
  const sunDir = new THREE.Vector3(WORLD.sun.pos[0], WORLD.sun.pos[1], WORLD.sun.pos[2]).normalize();
  const ridgeAt = (x) => {
    const t = x / (w / 2);
    const end = Math.max(0.16, 1 - t * t);
    // 主峰群 + 次峰 + 细齿:三列正弦,峰谷互不重合 → 山脊线连绵,不是波浪板
    const r =
      0.50 + 0.50 * Math.sin(x * 0.0172 + 1.1) +
      0.28 * Math.sin(x * 0.0423 + 3.4) +
      0.09 * Math.sin(x * 0.1013 + 0.7);
    // ⚠ 纯正弦叠出来的山脊会周而复始地"复读";乘一层低频噪声,每座峰都不一样。
    //   ** 1.9 把圆滑的波顶压成尖峰:山必须"尖",圆顶只是个绿土包。
    const wob = 0.72 + 0.56 * hillNoise(((x / w + 0.5) % 1 + 1) % 1, 0.37);
    return Math.max(0, r) ** 1.9 * 0.58 * end * wob;
  };
  // 剖面:近缘 0 → 山脊 1 → 远缘 0。
  // ⚠ 必须"过脊则降":原来的 ramp 到顶后一路平推,渲染出来是一整片台地,
  //   完全没有山的后坡。
  const prof = (u) => Math.sin(Math.PI * Math.min(1, Math.max(0, u) * 1.35)) ** 0.85;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), zl = p.getZ(i);           // zl ∈ [-depth/2, +depth/2],+z 为近缘
    const u = (depth / 2 - zl) / depth;            // 0 近缘 → 1 远缘
    // ⚠ 原来 y 只依赖 x 与 u:正面坡是一张直纹面,法线处处相同,受光后就是一整块纯色。
    //   叠一层山面噪声,山才有坡、有沟、有明暗交界线。噪声按 w 归一(两轴同除 w),
    //   世界尺度上各向同性,不会拉成横条。
    const face = faceNoise(x / w + 0.5, zl / w + 0.5);
    p.setY(i, -1.2 + (FLOOR + ridgeAt(x) * amp * h) * prof(u)
      + (face - 0.5) * 2 * h * 0.15 * Math.pow(prof(u), 0.6));
  }
  if (rot) geo.rotateY(rot);                      // 先转几何再算法线,法线才是对的
  geo.computeVertexNormals();
  // 着色:高度明暗(山脚暗、山脊亮) + 坡向明暗(朝太阳的坡面亮)。
  // ⚠ 平涂的剪影没有体积 —— 这两项就是山的"体积"本身,不需要再多一个 mesh。
  const base = new THREE.Color(C[color]);
  const nrm = geo.attributes.normal;
  const colArr = new Float32Array(p.count * 3);
  const tmpC = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const ht = Math.min(1, Math.max(0, p.getY(i) / (h * 0.9)));
    const facing = nrm.getX(i) * sunDir.x + nrm.getY(i) * sunDir.y + nrm.getZ(i) * sunDir.z;
    // 坡度:陡面暗、缓面亮 —— 山脊与沟壑靠它区分,比单纯高度差有效得多。
    const slope = Math.min(1, Math.max(0, 1 - nrm.getY(i)));
    // ⚠ 0.70~1.00 这一档在 3.3 强度的平行光下会被直接平均掉 —— 山就成一张纯色剪纸。
    //   拉到 0.50~1.00 才立得起来;再叠一层几十米尺度的斑驳,否则整座山是一块色板。
    const mot = 0.88 + 0.24 * hillPatch(p.getX(i) / w + 0.5, p.getZ(i) / w + 0.5);
    tmpC.copy(base).multiplyScalar((0.60 + 0.40 * ht) * (1 + 0.35 * facing) * (1 - 0.30 * slope) * mot);
    colArr[i * 3] = tmpC.r; colArr[i * 3 + 1] = tmpC.g; colArr[i * 3 + 2] = tmpC.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true }));
}

/**
 * 岸线遮罩:按地形高度场烘焙 alphaMap(three 的 alphaMap 读 .g 通道)。
 * 三种做法对比:硬切椭圆(原版,岸线像刀切) < 仅按地形切 < **地形切 × 径向保底淡出**。
 * 径向那一层是保底:若某个角度的地形始终没高过水位,至少不会在平面边界上出现直角断口。
 */
const SHORE = ENV.water.shore;
const shoreNoise = valueNoise2D(7, 5150);
function waterShoreMask() {
  const { cx, cz, rx, rz, level } = ENV.water;
  const W = 512, H = 160;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    // 贴图 flipY=true → canvas 顶行对应 v=1;而 v 增大的方向是 -z(rotateX(-90°) 后的映射)
    const z = cz - (0.5 - (y + 0.5) / H) * 2 * rz;
    for (let x = 0; x < W; x++) {
      const wx = cx + ((x + 0.5) / W - 0.5) * 2 * rx;
      const h = terrainHeight(wx, z);
      // ⚠ 过渡带 0.8 m 时,水面在岸边是一圈半透明的亮弧 —— 近景直接读成"充气水床"。
      //   收到 0.28 m,水线才是水与岸的交线。
      const cut = 1 - smoothstep(level - 0.22, level + 0.06, h);
      // ⚠ 椭圆弧在这个尺度上几乎就是一条直线 —— 岸线的"刀切感"就是这么来的。
      //   给归一化半径叠一层噪声扰动,岸线才会像被水冲出来的。
      const rr = Math.hypot((wx - cx) / rx, (z - cz) / rz) *
        (1 + SHORE.warp * (shoreNoise((wx - cx) / rx * 0.5 + 0.5, (z - cz) / rz * 0.5 + 0.5) - 0.5) * 2);
      const rad = 1 - smoothstep(SHORE.fade, 1.0, rr);
      const a = cut * rad;
      const i = (y * W + x) * 4;
      img.data[i] = 255; img.data[i + 1] = Math.round(a * 255); img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
// ---------- 碧水:一块真的会映天、会接影、会吃雾的水面 ----------
// ⚠ 原先是一张裸 ShaderMaterial,于是同时缺三样东西:不接收阴影(桥的影子落不到水上)、
//   不吃雾(远处水面不与空气透视融合,所以读成一条"平带")、色彩空间要靠手写 include 兜。
//   改成「标准 PBR 材质 + 程序贴图」后,阴影 / 雾 / tone mapping / 菲涅耳反射全部由
//   three 原生走 —— 少一个坑,多四样东西。反射用天穹烘出的 envMap,是"真的映天"。
function buildWater(envMap) {
  const { cx, cz, rx, rz, level } = ENV.water;
  const geo = new THREE.CircleGeometry(1, 96);
  geo.rotateX(-Math.PI / 2);        // 先躺平到 XZ 面,再按椭圆拉伸
  geo.scale(rx, 1, rz);
  // ⚠ 法线已换成噪声(见 rippleNormalTexture):原来的正弦叠加会结成规则亮点阵。
  //   repeat 也不必再靠"密"去糊住格点 —— 噪声没有格点,放到 3.2 反而是几十厘米到
  //   两米的自然涌浪,而不是一片颤动的塑料膜。
  const rip = rippleNormalTexture(256, 11);
  // ⚠ repeat 必须补偿水湾的长宽比:CircleGeometry 的 uv 是正圆,而椭圆把 x 拉了 rx/rz = 4.2 倍。
  //   原 (3.2, 1.5) 让法线沿 x 缓、沿 z 陡 → 高光被拉成一道道平行长条纹(像丝绸不像水)。
  //   取 (8.4, 2.0):两轴的世界周期都 ≈10 m,扰动才是各向同性的。
  rip.repeat.set(8.4, 2.0);
  rip.anisotropy = 8;             // 同上:掠射角不设 anisotropy 会挑错 mip → 走样成条纹
  const mat = new THREE.MeshStandardMaterial({
    map: waterColorTexture(C.waterDeep, C.water, C.waterShore, rx / rz),
    color: 0xffffff,
    roughness: 0.17,                // 掠射角映天要脆;太镜像是塑料,太糊是胶
    metalness: 0.0,                 // 水是电介质:靠菲涅耳,不要用 metalness 硬凑反射
    // ⚠ 强度是实测出来的:0.6 → 反射只贡献十几级色阶 ≈ 看不见(平涂青绿板);
    //   2.4 → 整片泛灰白,像磨砂玻璃/冰面;6.0 → 全白。1.4 才既有映天又留得住水色。
    // ⚠ 0.85 在晴天正午把整片水映成"泳池青" —— 映天太满,水色被吃光。0.68 留得住水色。
    envMap: envMap || null, envMapIntensity: 0.68,
    // 法线给足,反射进来的天光才会被打碎成粼光 —— 这是"水"最直接的证据
    normalMap: rip, normalScale: new THREE.Vector2(0.36, 0.36),
    alphaMap: waterShoreMask(),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, level, cz);
  mesh.receiveShadow = true;        // 桥的影子要落在水上
  mesh.name = 'water';
  // repeat 小了 5 倍 → UV 漂移速度要按同比例收,否则水面会"流"得比河还快
  mesh.userData.tick = (t) => { rip.offset.set(t * 0.010, t * 0.021); };
  return mesh;
}

// ---------- 灵雾:大 soft sprite,慢漂 ----------
function buildMist(tex) {
  const group = new THREE.Group();
  group.name = 'mist';
  const items = [];
  const R = Math.random;
  for (let i = 0; i < ENV.mist.count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex, color: C.mist, transparent: true,
      opacity: 0.05 + R() * 0.05, depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    const sc = 26 + R() * 30;
    s.scale.set(sc, sc * (0.32 + R() * 0.18), 1);
    const side = i % 3 === 2 ? (R() - 0.5) * 90 : 0;
    s.position.set(side + (R() - 0.5) * 50, 3 + R() * 12, -14 - R() * 70);
    s.userData.phase = R() * Math.PI * 2;
    s.userData.speed = 0.4 + R() * 0.5;
    s.userData.baseX = s.position.x;
    group.add(s);
    items.push(s);
  }
  group.userData.tick = (t) => {
    for (const s of items) {
      s.position.x = s.userData.baseX + Math.sin(t * 0.05 * s.userData.speed + s.userData.phase) * 9;
      s.material.opacity = 0.06 + 0.04 * (0.5 + 0.5 * Math.sin(t * 0.12 + s.userData.phase * 2));
    }
  };
  return group;
}

// ---------- 松:一群三两棵,有主次;全部并桶 ----------
// mulberry 已移到 util.js(贴图烘焙与几何共用同一个确定性 PRNG)
// 松树材质必须模块级共享:若在 pine() 内 new,每棵树各持一套材质,
// emit/flushBin 的按材质并桶就失效,30+ 棵树 = 30+ draw call。
const PINE_MATS = {
  trunk: new THREE.MeshStandardMaterial({ color: C.chestnut, roughness: 0.95 }),
  leaf: new THREE.MeshStandardMaterial({ color: C.pine, roughness: 0.95 }),
  leafD: new THREE.MeshStandardMaterial({ color: C.pineDeep, roughness: 0.95 }),
  leafWarm: new THREE.MeshStandardMaterial({ color: 0x3d8f4d, roughness: 0.95 }),  // 向阳的暖绿
  cypress: new THREE.MeshStandardMaterial({ color: 0x26663a, roughness: 0.95 }),   // 柏:更深更窄
};
/**
 * 一层枝叶:把圆锥底面环做「半径扰动 + 边缘下垂」。
 * 三个规整圆锥叠起来一眼就是塑料圣诞树 —— 破绽在于剪影是完美直线、底面是完美圆。
 * 这里按角度加两列整数谐波(半径不匀)+ 让底环下垂(枝梢自然耷拉),剪影就活了。
 */
function pineTier(r, h, seg, ph, droop) {
  const geo = new THREE.ConeGeometry(r, h, seg, 1, false);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const rr = Math.hypot(x, z);
    const t = Math.max(0, -y / (h / 2));          // 0 锥尖 → 1 底环
    const sag = droop * t * t;                    // 只让底环下垂
    if (rr > 1e-4) {
      const a = Math.atan2(z, x);
      // 半径:多列整数谐波 → 剪影不再是完美圆
      const wob = 1 + 0.17 * Math.sin(a * 3 + ph) + 0.09 * Math.sin(a * 5 - ph * 1.7)
        + 0.05 * Math.sin(a * 8 + ph * 0.6);
      p.setX(i, x * wob); p.setZ(i, z * wob);
      // ⚠ 底环的 y 必须"参差":整圈等量下垂会做出一圈干净的帽檐,侧面看就是"叠盘子"。
      //   用谐波让一部分枝梢垂得低、一部分留得高,边缘才是针叶的锯口。
      const jag = 0.24 + 0.76 * (0.5 + 0.5 * Math.sin(a * 4 + ph * 2.3))
        * (0.62 + 0.38 * Math.sin(a * 7 - ph));
      p.setY(i, y - sag * jag);
    } else {
      p.setY(i, y);
    }
  }
  geo.computeVertexNormals();
  return geo;
}
function pine(h, leafA = PINE_MATS.leaf, seed = 0.5) {
  const g = new THREE.Group();
  const Rn = mulberry(Math.round(1000 + seed * 9973));
  const ph = Rn() * Math.PI * 2;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.024, h * 0.05, h * 0.46, 7), PINE_MATS.trunk);
  trunk.position.y = h * 0.23;
  g.add(trunk);
  // ⚠ 关键比例是「层高 / 层径」。原来 ch≈0.26h 而 r≈0.30h —— 每层都是又扁又宽的盘,
  //   侧面看就是一摞盘子。层高给到 0.36h、底径收到 0.235h,才是针叶锥的体感。
  //   顶层用 leafWarm:阳光落在树冠上,这是"晴天"最直接的证据。
  const N = 6;
  // 只有最下一层用暗色:每层都压一圈暗底会画出 6 道"分层蛋糕"的缝。
  const mats = [PINE_MATS.leafD, leafA, leafA, leafA, leafA, PINE_MATS.leafWarm];
  let y = h * 0.15, r = h * 0.235;
  for (let i = 0; i < N; i++) {
    const ch = h * (0.38 - i * 0.032) * (0.86 + Rn() * 0.26);
    const rr = r * (0.92 + Rn() * 0.20);
    const cone = new THREE.Mesh(pineTier(rr, ch, 12, ph + i * 1.1, ch * 0.18), mats[i]);
    // 每层微微偏心 + 各自转角 → 整棵树不是旋转体
    cone.position.set((Rn() - 0.5) * rr * 0.20, y + ch / 2, (Rn() - 0.5) * rr * 0.20);
    cone.rotation.y = Rn() * Math.PI * 2;
    g.add(cone);
    // 间距压到 0.36~0.44 层高:上层的锥底埋进下层里,底面那圈硬边才看不见
    y += ch * (0.36 + Rn() * 0.08);
    r *= 0.78 + Rn() * 0.05;
  }
  return g;
}
// 柏:两段窄锥叠成的塔柏(与松拉开剪影差异,免得满坡"复制粘贴")
function cypress(h) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.03, h * 0.045, h * 0.34, 6), PINE_MATS.trunk);
  trunk.position.y = h * 0.17;
  g.add(trunk);
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(h * 0.165, h * 0.74, 7), PINE_MATS.cypress);
  c1.position.y = h * 0.28 + h * 0.37;
  g.add(c1);
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(h * 0.108, h * 0.5, 7), PINE_MATS.cypress);
  c2.position.y = h * 0.69 + h * 0.25;
  g.add(c2);
  return g;
}
function buildTrees(terrainY) {
  const group = new THREE.Group();
  group.name = 'trees';
  const clusters = [
    { cx: -30, cz: 8, n: 3, base: 13 },
    { cx: 27, cz: 9, n: 2, base: 11 },
    { cx: -26, cz: -18, n: 2, base: 15 },
    { cx: 36, cz: -26, n: 1, base: 17 },
    // ⚠ 原本在 (8,-34) —— 那已经是园子的核心区,而且正好挡住园景机位。
    //   园林里不散养高松:移到西墙外,当作"墙外借来的树"。
    { cx: -42, cz: -34, n: 2, base: 12 },
    { cx: -34, cz: -4, n: 2, base: 14 },
  ];
  const R = mulberry(11);
  for (const c of clusters) {
    for (let i = 0; i < c.n; i++) {
      const h = c.base * (i === 0 ? 1 : 0.55 + R() * 0.3);
      const t = R() < 0.28 ? cypress(h * 1.05) : pine(h, R() < 0.35 ? PINE_MATS.leafWarm : PINE_MATS.leaf, R());
      t.position.set(c.cx + (R() - 0.5) * 6, terrainY(c.cx, c.cz) - 0.2, c.cz + (R() - 0.5) * 6);
      t.rotation.y = R() * Math.PI * 2;
      emit(t);
    }
  }
  flushBin(group);
  return group;
}

// ---------- 石拱桥:券洞 + 拱背 + 雁翅(跨水,唯一破对称处) ----------
function buildBridge() {
  const { cx, cz, w, span } = ENV.bridge;
  const group = new THREE.Group();
  group.name = 'bridge';
  // 与台基同一族冷青石 —— 桥在同一个画面里,石头不能有两种性格
  const stone = new THREE.MeshStandardMaterial({ map: grainTexture('#a9ada9', 18), roughness: 0.92 });
  const stoneD = new THREE.MeshStandardMaterial({ map: grainTexture('#8b8f8b', 22), roughness: 0.95 });
  const tmp = new THREE.Group();
  const half = span / 2;
  const deckY = 3.0;                                     // 桥面脊高(拱桥要有驼峰,平了读作堤坝)
  const camber = (t) => Math.sin(Math.PI * t) * deckY;   // t:0..1 沿桥长
  const archR = 3.8, archBase = -1.0;                    // 券洞半径 / 起拱线(没入水面下)
  // ⚠ 约束:archBase + archR(2.8) < deckY + 0.42(券顶不得溢出桥体轮廓,同拱门 bug)
  // 两片券脸墙:外轮廓走拱背线,挖一个半圆券洞
  for (const sx of [-1, 1]) {
    const s = new THREE.Shape();
    const N = 18;
    s.moveTo(-half, -1.8);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      s.lineTo(-half + span * t, camber(t) + 0.42);
    }
    s.lineTo(half, -1.8);
    s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-archR, archBase);
    // ⚠ clockwise=true 才走"上半圆"(PI→PI/2→0);false 会走水下下半圆,券洞等于没挖(曾出的 bug)
    hole.absarc(0, archBase, archR, Math.PI, 0, true);
    hole.lineTo(archR, archBase);
    hole.closePath();
    s.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false, curveSegments: 24 });
    geo.rotateY(Math.PI / 2);                            // Shape 在 x-y 面 → 转到 z-y 面,挤出沿 x
    const m = new THREE.Mesh(geo, stone);
    m.position.set(sx * (w / 2), 0, 0);
    tmp.add(m);
  }
  // 桥面石板 + 两侧望柱
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const zz = -half + span * t;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.26, span / 14 + 0.1), stoneD);
    slab.position.set(0, camber(t) + 0.55, zz);
    tmp.add(slab);
    // 石栏板:每一跨一根望柱 + 一块矮板。
    // 原先是 2 m 才一根细柱 + 一道笔直的横杆 —— 直杆架在拱背上必然两头悬空,
    // 读起来像铁丝网篱笆而不是石栏。
    // 望柱每 3 跨一根(每跨都放就成了城垛/齿轮),柱间一块整栏板
    if (i % 3 === 0) {
      for (const sx of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.68, 0.26), stoneD);
        post.position.set(sx * (w / 2 + 0.1), camber(t) + 0.86, zz);
        tmp.add(post);
        if (i < 14) {
          const tm = (i + 1.5) / 14;
          const mid = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, (span / 14) * 3 - 0.30), stoneD);
          mid.position.set(sx * (w / 2 + 0.1), camber(tm) + 0.84, zz + (span / 14) * 1.5);
          tmp.add(mid);
        }
      }
    }
  }
  // 两端雁翅(桥台)
  for (const e of [-1, 1]) {
    const ab = new THREE.Mesh(new THREE.BoxGeometry(w + 1.8, 2.2, 3.2), stoneD);
    ab.position.set(0, -1.0, e * (half + 1.2));
    tmp.add(ab);
  }
  tmp.position.set(cx, 0, cz);
  emit(tmp);
  flushBin(group);
  return group;
}

// ---------- 日轮:晴空里藏远山之后的一枚暖白太阳 + 晕 ----------
function buildSun(tex) {
  const g = new THREE.Group();
  g.name = 'sun';
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(ENV.sun.r, 40),
    new THREE.MeshBasicMaterial({ color: 0xfffdf0, transparent: true, opacity: 1.0, fog: false })
  );
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, color: 0xffeeb8, transparent: true, opacity: 0.42, fog: false, depthWrite: false,
  }));
  halo.scale.setScalar(ENV.sun.r * 6);
  g.add(halo, disc);
  g.position.set(...ENV.sun.pos);
  // 轮面朝世界原点:相机绕原点转,盘面就一直是正对镜头
  disc.lookAt(0, ENV.sun.pos[1], 0);
  return g;
}

// ---------- 装配 ----------
export function buildEnvironment({ renderer } = {}) {
  const group = new THREE.Group();
  group.name = 'environment';
  const glowTex = glowTexture();

  const skyMesh = buildSky(cloudTexture());
  group.add(skyMesh);

  // 草地贴图要"看得见":幅度提上来 + 两档噪声,否则一大片绿会被平均成一块色板
  // 草地贴图要"看得见":幅度提上来 + 两档噪声,否则一大片绿会被平均成一块色板。
  // 还要一张法线:没有微观起伏的话,再细的颜色贴图在平行光下也还是一张塑料片。
  // ⚠ 贴图里也不该有大斑块:repeat 11 时一个 0.30R 的径向斑 = 5 m 的深色圆斑,
  //   而且每 17 m 原样复读一遍 —— 草地读成"打过补丁的绒毯"。
  //   大尺度(10 m 量级)交给顶点色(见 buildTerrain 的 patch),贴图只留细颗粒。
  // ⚠ 草地贴图只留"细颗粒"。中频斑驳(mottle)在 repeat 下会排成一张网格 ——
  //   10 m 量级的大斑块交给顶点色(见 buildTerrain 的 patch),两者分工不能重叠。
  const gTex = grainTexture('#ffffff', 26, { blotch: 0, mottle: 0.05, mottleCells: 5, seed: 555 });
  gTex.repeat.set(22, 22);
  // ⚠ 原来的 13 格 × repeat 13 → 1.1 m 的起伏;在大片地面上掠射时正好落在
  //   走样最强的尺度上。改 26 格 × repeat 30(≈0.24 m 微起伏)+ 强度砍半,
  //   远处由 mip 自然抹平,近处只剩"草叶的绒感"。
  const gNrm = grainNormalTexture(256, 26, 1.2, 777);
  gNrm.repeat.set(30, 30);
  // ⚠ 法线图不设 anisotropy,地面在掠射角下挑错 mip,会走样成一道道平行摩尔纹 ——
  //   在草地这张图里表现为"被梳过的横纹",极易误判成贴图噪声或顶点色问题。
  gNrm.anisotropy = 8;
  const terrainMat = new THREE.MeshStandardMaterial({
    map: gTex, vertexColors: true, roughness: 1.0,
    normalMap: gNrm, normalScale: new THREE.Vector2(0.15, 0.15),
  });
  group.add(buildTerrain(terrainMat));

  const hills = new THREE.Group();
  hills.name = 'hills';
  for (const h of ENV.hills) {
    const m = buildHill({ w: h.w, depth: h.depth, h: h.h, seg: h.seg, color: h.color, amp: h.amp });
    m.position.z = h.z - h.depth / 2;             // 近缘落在 z + depth/2
    hills.add(m);
  }
  for (const s of ENV.sideHills) {
    const m = buildHill({ w: s.w, depth: s.depth, h: s.h, seg: s.seg, color: s.color, amp: s.amp, rot: s.rot });
    // 本地 +z 是"近缘":rot=+π/2 → 世界 +x;rot=-π/2 → 世界 -x
    m.position.x = s.x - (Math.sin(s.rot) > 0 ? 1 : -1) * s.depth / 2;
    hills.add(m);
  }
  group.add(hills);

  // 水面单独吃一张从天穹烘出来的环境贴图。不要挂 scene.environment —— 那会顺手改掉全场受光
  // ⚠ 天穹环境贴图**烘一次**(render target 不便宜),河与园池共用同一张。
  //   且只挂在水的材质上,不挂 scene.environment —— 那会顺手改掉全场的受光。
  const envMap = renderer ? skyEnvironment(renderer, skyMesh) : null;
  group.add(buildWater(envMap));
  group.add(buildMist(glowTex));
  const ty = (x, z) => terrainHeight(x, z);
  group.add(buildTrees(ty));
  group.add(buildBridge());
  group.add(buildSun(glowTex));

  group.userData.terrainHeight = terrainHeight;
  group.userData.envMap = envMap;
  return group;
}
