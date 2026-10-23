/**
 * DIAGONAL · 墨脉 InkField
 *
 * 全站指针/触控的着色器反馈层。GPU 侧是一条两级管线：
 *
 *   更新 pass（半分辨率、ping-pong FBO）→ 一张「墨场」贴图，RGB 三通道
 *     R = ink   墨量，衰减慢，决定排线密度与线宽
 *     G = wet   湿度，衰减快，决定渗流强度与排线歪斜量
 *     B = burst 戳印，按下瞬间注入，只在点按后有值
 *   渲染 pass（画布分辨率）→ 把墨场翻成 45° 排线
 *
 * —— 为什么是「墨」而不是「光」——
 * 全站底色是暖纸 #FAFAF8、墨 #1A1A1A、暗朱 #B33A2A，讲的是「文献感 / 物质性」。
 * 一个发光的鼠标拖尾会把这套调性直接打碎；而"毛笔走过留下一道会干的墨痕"——
 * 慢笔浓、快笔淡、停下会洇、洇完会干——恰好是同一种语言。
 * 排线取 45°，与 hero 字标、nav-drawer-edge、pt-rule 的斜线母题同源。
 *
 * —— 为什么不捕获页面像素 ——
 * 想要折射/位移就得把 DOM 画进纹理（html2canvas 级别的重活，每帧不可用）。
 * 这里反过来做：着色结果就是一层**落在页面上的墨**，普通 alpha 合成。
 * 代价是不知道背景明暗，所以由外部采样"指针下方堆叠里第一个不透明背景"得到
 * uDark，在墨（浅底）与粉笔（深底）两套色板间插值 —— /atlas 整页黑底、
 * 首页那块深色卡片都能正常显影。
 */

type GL = WebGLRenderingContext | WebGL2RenderingContext;

/** 同时参与运算的指针上限（鼠标 + 触屏多指）。着色器里的循环上界必须与它一致 */
const MAX_POINTERS = 3;

const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  // y 翻转：让 vUv 与 CSS 屏幕坐标同向（左上 0,0 / 右下 1,1）。
  // 指针坐标、滚动位移、笔迹线段全都在这个空间里算，省掉一整类上下颠倒的 bug。
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const NOISE = `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
`;

const UPDATE_FRAG = `${PRECISION}
varying vec2 vUv;

uniform sampler2D uPrev;
uniform vec2  uTexel;        // 1/场分辨率：四邻域采样步长
uniform vec2  uAspectScale;  // (w/h, 1)：把 uv 拉成各向同性，笔尖才是圆的
uniform vec2  uFrom[${MAX_POINTERS}];
uniform vec2  uTo[${MAX_POINTERS}];
uniform vec2  uVel[${MAX_POINTERS}];
uniform float uStr[${MAX_POINTERS}];
uniform float uBurst[${MAX_POINTERS}];
uniform float uRadius;
uniform float uTime;
uniform float uDt;
uniform float uScrollShift;

${NOISE}

/* 由 value noise 求 curl：天然无散度，只搬运墨、不凭空增减墨的总量。
   直接把 noise 当速度场会让画面出现明显的"汇聚点/消失点"，不能那么用。 */
vec2 curl2(vec2 p) {
  float e = 0.12;
  float n1 = vnoise(p + vec2(0.0, e));
  float n2 = vnoise(p - vec2(0.0, e));
  float n3 = vnoise(p + vec2(e, 0.0));
  float n4 = vnoise(p - vec2(e, 0.0));
  return vec2(n1 - n2, n4 - n3) / (2.0 * e);
}

/* 点到线段的距离：指针一帧可能跨过上百像素，只描本次位置的圆点会断成一串珠，
   必须按「上一帧位置 → 本帧位置」的线段来描，才是连续的笔画。 */
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = vUv * uAspectScale;

  // 纸纤维里的自主渗流：始终存在但极慢，只负责让静止的墨迹继续"呼吸"
  vec2 vel = curl2(p * 5.0 + uTime * 0.05) * 0.016;

  float inj = 0.0;
  float burInj = 0.0;
  for (int i = 0; i < ${MAX_POINTERS}; i++) {
    if (uStr[i] <= 0.0 && uBurst[i] <= 0.0) continue;
    vec2 b = uTo[i] * uAspectScale;
    vec2 a = uFrom[i] * uAspectScale;
    // 拖曳只作用在笔尖附近，否则整屏的墨都会被指针方向推着一起跑
    float near = exp(-dot(p - b, p - b) / max(uRadius * uRadius * 4.0, 1e-5));
    vel += uVel[i] * near * 0.55;
    float d = sdSeg(p, a, b);
    inj += smoothstep(uRadius, uRadius * 0.15, d) * uStr[i];
    burInj += smoothstep(uRadius * 1.6, 0.0, d) * uBurst[i];
  }

  // 反向采样 = 沿速度场搬运。滚动那一项：向下滚动时内容上行，
  // 原先位于下方 (y+Δ) 的像素移到了 y，故取 +shift。
  vec2 back = vUv + vec2(0.0, uScrollShift) - vel * uDt;

  vec4 prev = texture2D(uPrev, back);
  float up = texture2D(uPrev, back + vec2(0.0, uTexel.y)).r;
  float dn = texture2D(uPrev, back - vec2(0.0, uTexel.y)).r;
  float lf = texture2D(uPrev, back + vec2(uTexel.x, 0.0)).r;
  float rt = texture2D(uPrev, back - vec2(uTexel.x, 0.0)).r;

  /* 三个衰减全部写成 exp(-dt/τ)，不能写每帧常数 —— 每帧常数意味着
     120Hz 屏上墨干得快一倍、掉帧时又赖着不走，同一段轨迹在不同机器上
     留下完全不同的痕迹。τ 由原先 60fps 下的每帧系数反推：
       ink  0.9825/帧 → τ=0.944s（≈4.8s 干透，与 LINGER_MS 对齐）
       wet  0.935 /帧 → τ=0.248s
       bur  0.900 /帧 → τ=0.158s
     扩散同理换成 dt 表达（原每帧 0.22 ≈ 1-e^{-13·dt}）。 */
  float spread = clamp(prev.g * (1.0 - exp(-uDt * 13.0)), 0.0, 1.0);
  float blurred = (up + dn + lf + rt) * 0.25;
  float ink = mix(prev.r * exp(-uDt / 0.944), blurred, spread);
  // 加法但 saturate：反复涂抹同一处会逼近 1 而不会溢出成一片死黑
  ink = min(1.0, ink + inj * (1.0 - ink * 0.82));

  float wet = min(1.0, prev.g * exp(-uDt / 0.248) + inj * 1.15);
  float bur = min(1.0, prev.b * exp(-uDt / 0.158) + burInj * 1.40);

  gl_FragColor = vec4(ink, wet, bur, 1.0);
}
`;

const RENDER_FRAG = `${PRECISION}
varying vec2 vUv;

uniform sampler2D uField;
uniform vec2  uAspectScale;
uniform float uDark;     // 0 = 浅底（墨） 1 = 深底（粉笔）
uniform float uNib;      // 1 = 悬停在可交互元素上，改用细笔尖
uniform float uOpacity;

${NOISE}

const float ANG = 0.70710678;  // cos/sin(45°)

void main() {
  vec3 f = texture2D(uField, vUv).rgb;
  float ink = f.r;
  float wet = f.g;
  float bur = f.b;
  if (ink < 0.006 && bur < 0.006) discard;

  vec2 p = vUv * uAspectScale;
  // 主排线 45°，交叉排线反向 45° —— 后者只在墨极重处出现，
  // 于是「反复涂同一处」自然长出品牌的对角线交叉，而不是单纯变黑。
  vec2 r1 = vec2(p.x * ANG - p.y * ANG, p.x * ANG + p.y * ANG);
  vec2 r2 = vec2(p.x * ANG + p.y * ANG, -p.x * ANG + p.y * ANG);

  float jit = hash21(floor(p * 90.0)) - 0.5;
  float wob = hash21(floor(p * 260.0) + 11.0) - 0.5;

  float density = mix(34.0, 52.0, uNib);
  float phase  = r1.y * density + jit * wet * 2.2 + wet * 1.1;
  float tri    = abs(fract(phase) - 0.5) * 2.0;
  float lw     = clamp(ink * 1.55 - 0.10, 0.0, 1.0) * mix(0.72, 0.95, ink);
  float line1  = 1.0 - smoothstep(0.0, max(lw, 0.0015), tri);

  float phase2 = r2.y * density * 0.72 + wob * wet * 2.6;
  float tri2   = abs(fract(phase2) - 0.5) * 2.0;
  float lw2    = clamp(ink * 1.55 - 0.66, 0.0, 1.0) * 0.62;
  float line2  = 1.0 - smoothstep(0.0, max(lw2, 0.0015), tri2);

  float mask = max(line1, line2) * clamp(ink * 1.45, 0.0, 1.0);
  // 戳印：把局部压实成一小片，再撒几点飞白，读作"笔尖顿了一下"
  float speck = step(0.82, hash21(floor(p * 120.0) + 7.0)) * bur * 0.55;
  mask = clamp(mask + bur * 0.30 + speck, 0.0, 1.0);

  float heavy = clamp((ink - 0.45) / 0.55, 0.0, 1.0);
  vec3 inkCol   = vec3(0.102, 0.102, 0.102);   // #1A1A1A
  vec3 redCol   = vec3(0.702, 0.227, 0.165);   // #B33A2A
  vec3 chalk    = vec3(0.980, 0.965, 0.930);
  vec3 chalkHot = vec3(1.000, 0.760, 0.680);
  vec3 col = mix(mix(inkCol, redCol, heavy * 0.80),
                 mix(chalk, chalkHot, heavy * 0.85), uDark);
  col = mix(col, uDark > 0.5 ? chalkHot : redCol, clamp(bur * 0.50, 0.0, 1.0));

  float a = mask * uOpacity;
  if (a < 0.004) discard;
  // 画布按 premultipliedAlpha 创建，这里必须自己预乘，否则描边处会浮出亮边
  gl_FragColor = vec4(col * a, a);
}
`;

interface Slot {
  id: number;
  x: number;
  y: number;
  /** 上一帧已处理到的位置：与 x/y 构成本帧要描的那段笔迹 */
  lx: number;
  ly: number;
  lastMove: number;
  burst: number;
  /** 本帧刚加入时置 true：先把 bx/by 拉到当前位置，避免从旧坐标跨屏甩出一条直线 */
  fresh: boolean;
}

const UPDATE_UNIFORMS = [
  "uPrev", "uTexel", "uAspectScale", "uFrom", "uTo", "uVel", "uStr", "uBurst",
  "uRadius", "uTime", "uDt", "uScrollShift",
] as const;
const RENDER_UNIFORMS = ["uField", "uAspectScale", "uDark", "uNib", "uOpacity"] as const;

export class InkFieldEngine {
  private canvas: HTMLCanvasElement;
  private gl: GL;
  private quad: WebGLBuffer;
  private progUpdate: WebGLProgram;
  private progRender: WebGLProgram;
  private uUpdate = new Map<string, WebGLUniformLocation | null>();
  private uRender = new Map<string, WebGLUniformLocation | null>();

  private tex: WebGLTexture[] = [];
  private fbo: WebGLFramebuffer[] = [];
  private src = 0;
  private fw = 0;
  private fh = 0;
  private cssW = 1;
  private cssH = 1;

  // 每帧要上传的 uniform 数组：提前分配，避免逐帧 new Float32Array 造成 GC 抖动
  private bufFrom = new Float32Array(MAX_POINTERS * 2);
  private bufTo = new Float32Array(MAX_POINTERS * 2);
  private bufVel = new Float32Array(MAX_POINTERS * 2);
  private bufStr = new Float32Array(MAX_POINTERS);
  private bufBurst = new Float32Array(MAX_POINTERS);

  private slots: Slot[] = [];
  private scrollAccum = 0;
  private lastInject = 0;

  private raf = 0;
  private running = false;
  private disposed = false;
  private ctxLost = false;
  private lastTime = 0;
  private time = 0;

  private nibTarget = 0;
  private nib = 0;
  private darkTarget = 0;
  private dark = 0;
  private opacity: number;
  private radius: number;
  private resizeTimer = 0;

  constructor(canvas: HTMLCanvasElement, opts: { mobile?: boolean } = {}) {
    this.canvas = canvas;
    const attrs: WebGLContextAttributes = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
      desynchronized: true,
    };
    const gl =
      (canvas.getContext("webgl2", attrs) as WebGL2RenderingContext | null) ||
      (canvas.getContext("webgl", attrs) as WebGLRenderingContext | null);
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;

    this.opacity = opts.mobile ? 0.72 : 0.92;
    // 单位是「视口高度」而非像素：宽屏窄屏上手感一致。
    // 移动端原本给 0.075 —— 390×844 竖屏上笔尖直径 126px，三分之一个屏宽，太糙，
    // 实测一笔下去覆盖 15% 屏幕。收到 0.060（直径 ~101px）后仍在手指遮挡范围内，
    // 又能看出是笔触而不是一团糊。（2026-10-23 实测调整）
    this.radius = opts.mobile ? 0.06 : 0.055;

    // 一张盖满视口的大三角形：比两个三角形少一次 draw 且不用索引缓冲
    const buf = gl.createBuffer();
    if (!buf) throw new Error("createBuffer failed");
    this.quad = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    this.progUpdate = this.build(VERT, UPDATE_FRAG);
    this.progRender = this.build(VERT, RENDER_FRAG);
    for (const n of UPDATE_UNIFORMS) this.uUpdate.set(n, gl.getUniformLocation(this.progUpdate, n));
    for (const n of RENDER_UNIFORMS) this.uRender.set(n, gl.getUniformLocation(this.progRender, n));

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    this.resize();
    window.addEventListener("resize", this.onResize);
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
  }

  // ───────────────────────────────────────────────────────── 资源

  private build(vs: string, fs: string): WebGLProgram {
    const gl = this.gl;
    const prog = gl.createProgram();
    if (!prog) throw new Error("createProgram failed");
    const v = this.compile(gl.VERTEX_SHADER, vs);
    const f = this.compile(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error("link failed: " + gl.getProgramInfoLog(prog));
    }
    gl.deleteShader(v);
    gl.deleteShader(f);
    return prog;
  }

  private compile(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const sh = gl.createShader(type);
    if (!sh) throw new Error("createShader failed");
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      throw new Error("compile failed: " + gl.getShaderInfoLog(sh));
    }
    return sh;
  }

  private ensureTargets() {
    if (this.tex.length === 2) return;
    const gl = this.gl;
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture();
      if (!t) continue;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.fw, this.fh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const f = gl.createFramebuffer();
      if (!f) continue;
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      this.tex.push(t);
      this.fbo.push(f);
    }
    this.clearField();
  }

  private releaseTargets() {
    const gl = this.gl;
    this.tex.forEach((t) => gl.deleteTexture(t));
    this.fbo.forEach((f) => gl.deleteFramebuffer(f));
    this.tex = [];
    this.fbo = [];
  }

  private clearField() {
    const gl = this.gl;
    for (const f of this.fbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.viewport(0, 0, this.fw, this.fh);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // ───────────────────────────────────────────────────────── 尺寸

  resize = () => {
    if (this.disposed || this.ctxLost) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.cssW = w;
    this.cssH = h;
    // DPR 封到 1.5：再往上只是白白多填几百万像素，画面分辨不出差别
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));

    // 墨场取画布的一半分辨率，长边再封顶 640。
    // 效果是软的，分辨率再高只是重复这些像素；省下来的才是真正的性能余量。
    let fw = Math.max(2, Math.round(this.canvas.width * 0.5));
    let fh = Math.max(2, Math.round(this.canvas.height * 0.5));
    const long = Math.max(fw, fh);
    if (long > 640) {
      const k = 640 / long;
      fw = Math.max(2, Math.round(fw * k));
      fh = Math.max(2, Math.round(fh * k));
    }
    if (fw === this.fw && fh === this.fh && this.tex.length === 2) return;
    this.fw = fw;
    this.fh = fh;
    this.releaseTargets();
    this.ensureTargets();
  };

  private onResize = () => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(this.resize, 140);
  };

  // ───────────────────────────────────────────────────────── 外部输入

  /** 指针移动。id 稳定即可：鼠标固定一个，触屏每根手指一个 */
  move(id: number, clientX: number, clientY: number) {
    const x = clientX / this.cssW;
    const y = clientY / this.cssH;
    const now = performance.now();
    const s = this.slots.find((v) => v.id === id);
    if (s) {
      s.x = x;
      s.y = y;
      s.lastMove = now;
    } else if (this.slots.length < MAX_POINTERS) {
      this.slots.push({ id, x, y, lx: x, ly: y, lastMove: now, burst: 0, fresh: true });
    }
    this.wake();
  }

  release(id: number) {
    const i = this.slots.findIndex((v) => v.id === id);
    if (i >= 0) this.slots.splice(i, 1);
    this.wake();
  }

  /** 按下：注入一枚戳印。调用方需先 move() 给到位置，否则无从落笔 */
  press(id: number) {
    const s = this.slots.find((v) => v.id === id);
    if (!s) return;
    s.burst = 1;
    this.wake();
  }

  /** 页面滚动：墨跟着内容一起被拖走 */
  scroll(dyPx: number) {
    this.scrollAccum += dyPx / Math.max(1, this.cssH);
    this.wake();
  }

  setNib(on: boolean) {
    this.nibTarget = on ? 1 : 0;
  }

  setDark(dark: boolean) {
    this.darkTarget = dark ? 1 : 0;
  }

  // ───────────────────────────────────────────────────────── 循环

  wake() {
    this.lastInject = performance.now();
    if (this.running || this.disposed || this.ctxLost) return;
    this.running = true;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.step);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    // 停机时必须把画布抹干净。rAF 一停，最后一帧就永远留在屏幕上 ——
    // 而那时墨只是褪到了渲染阈值附近而非归零，留着就是一层擦不掉的脏膜。
    // 顺带把墨场也清掉：下次唤醒从一张干净的纸开始，不会闪出上一轮的残迹。
    if (this.ctxLost) return;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.clearField();
  }

  /**
   * 停机阈值 = 墨迹彻底干透所需的时间。
   * 更新 pass 里 ink 每帧 ×0.9825，跌破渲染阈值 0.006 需要
   * ln(0.006)/ln(0.9825) ≈ 289 帧 ≈ 4.8s。放得太长才是真正的浪费。
   */
  private static readonly LINGER_MS = 4900;

  private step = (now: number) => {
    if (!this.running || this.disposed || this.ctxLost) return;
    // 夹到 [1/240, 1/24]：标签页切回来时的超大 dt 会把整场墨一次性推飞
    const dt = Math.min(Math.max((now - this.lastTime) / 1000, 1 / 240), 1 / 24);
    this.lastTime = now;
    this.time += dt;

    this.draw(dt, now);

    const quiet = this.slots.every((s) => s.burst <= 0.001 && now - s.lastMove > 450);
    if (quiet && now - this.lastInject > InkFieldEngine.LINGER_MS) {
      this.stop();
      return;
    }
    this.raf = requestAnimationFrame(this.step);
  };

  private draw(dt: number, now: number) {
    const gl = this.gl;
    const from = this.bufFrom;
    const to = this.bufTo;
    const vel = this.bufVel;
    const str = this.bufStr;
    const burst = this.bufBurst;

    /* 注入量必须写成「每秒速率 × dt」，不能是每帧常数 —— 帧率决定了每帧注入几次，
       每帧常数意味着 120Hz 屏比 60Hz 深一倍、掉帧时又稀薄。
       60fps 下 dt*60 ≡ 1，所以这里挂上之后观感与原先的调参完全一致。
       dt 已被夹到 ≤1/24，故 fpsNorm 上限 2.5，不会因单帧过长而糊成一片。 */
    const fpsNorm = Math.min(dt * 60, 3);

    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (s.fresh) {
        s.lx = s.x;
        s.ly = s.y;
        s.fresh = false;
      }
      const dx = s.x - s.lx;
      const dy = s.y - s.ly;
      const invDt = 1 / Math.max(dt, 1e-4);
      const rest = Math.exp(-(now - s.lastMove) / 300);
      // 慢笔浓、快笔淡 —— 与真实毛笔同一条规律；再叠一个停笔后的快速收笔
      const speed = Math.hypot(dx, dy) * invDt;
      const str0 = 0.55 * (0.35 + 0.75 * Math.min(1, speed / 1.6)) * rest * fpsNorm;

      from[i * 2] = s.lx;
      from[i * 2 + 1] = s.ly;
      to[i * 2] = s.x;
      to[i * 2 + 1] = s.y;
      vel[i * 2] = dx * invDt;
      vel[i * 2 + 1] = dy * invDt;
      str[i] = str0;
      // 戳印同理要按速率给。s.burst 自身已按 exp(-dt/0.12) 随时间衰减，
      // 再乘 fpsNorm 后「每帧注入量 ∝ dt」，总积分就与帧率无关了。
      burst[i] = s.burst * fpsNorm;

      if (str0 > 0.002 || s.burst > 0.002) this.lastInject = now;
      s.burst *= Math.exp(-dt / 0.12);
      s.lx = s.x;
      s.ly = s.y;
    }

    this.nib += (this.nibTarget - this.nib) * (1 - Math.exp(-dt / 0.18));
    this.dark += (this.darkTarget - this.dark) * (1 - Math.exp(-dt / 0.25));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // —— 更新 pass ——
    gl.useProgram(this.progUpdate);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[1 - this.src]);
    gl.viewport(0, 0, this.fw, this.fh);
    gl.disable(gl.BLEND);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[this.src]);
    gl.uniform1i(this.uUpdate.get("uPrev")!, 0);
    gl.uniform2f(this.uUpdate.get("uTexel")!, 1 / this.fw, 1 / this.fh);
    gl.uniform2f(this.uUpdate.get("uAspectScale")!, this.cssW / Math.max(1, this.cssH), 1);
    gl.uniform2fv(this.uUpdate.get("uFrom")!, from);
    gl.uniform2fv(this.uUpdate.get("uTo")!, to);
    gl.uniform2fv(this.uUpdate.get("uVel")!, vel);
    gl.uniform1fv(this.uUpdate.get("uStr")!, str);
    gl.uniform1fv(this.uUpdate.get("uBurst")!, burst);
    gl.uniform1f(this.uUpdate.get("uRadius")!, this.radius);
    gl.uniform1f(this.uUpdate.get("uTime")!, this.time);
    gl.uniform1f(this.uUpdate.get("uDt")!, dt);
    gl.uniform1f(this.uUpdate.get("uScrollShift")!, this.scrollAccum);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.scrollAccum = 0;
    this.src = 1 - this.src;

    // —— 渲染 pass ——
    gl.useProgram(this.progRender);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.enable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[this.src]);
    gl.uniform1i(this.uRender.get("uField")!, 0);
    gl.uniform2f(this.uRender.get("uAspectScale")!, this.cssW / Math.max(1, this.cssH), 1);
    gl.uniform1f(this.uRender.get("uDark")!, this.dark);
    gl.uniform1f(this.uRender.get("uNib")!, this.nib);
    gl.uniform1f(this.uRender.get("uOpacity")!, this.opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // ───────────────────────────────────────────────────────── 生命周期

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.ctxLost = true;
    this.stop();
  };

  private onContextRestored = () => {
    if (this.disposed) return;
    this.ctxLost = false;
    this.releaseTargets();
    this.resize();
    this.wake();
  };

  dispose() {
    this.disposed = true;
    this.stop();
    window.clearTimeout(this.resizeTimer);
    window.removeEventListener("resize", this.onResize);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    const gl = this.gl;
    this.releaseTargets();
    gl.deleteBuffer(this.quad);
    gl.deleteProgram(this.progUpdate);
    gl.deleteProgram(this.progRender);
    // 刻意不调 WEBGL_lose_context：dev 下 StrictMode 会把 effect 跑两遍，
    // 同一个 canvas 上第二次 getContext 拿到的仍是那个已 lost 的上下文。
  }
}
