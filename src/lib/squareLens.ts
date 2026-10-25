/**
 * 方形取样框 SquareLens —— 图集照片上的指针透镜。
 *
 * 与全站那枚水滴的分工：水滴是**跟随指针的一滴介质**（圆的、放大背后的真实文字）；
 * 这一层是**压在照片上的取景框**（方的、框内换一张同批次的底片）。
 * 两者不共存于同一处 —— 水滴跟手，取样框只在照片内出现。
 *
 * —— 为什么框内是另一张照片 ——
 * 「放大同一张」和已有的水滴透镜重复了。档案语义下更有意思的是取样：
 * 框住的那块区域里，露出的是同一批次里的**下一张底片** —— 翻检档案时
 * 一张张掀过去的感觉。所以这里根本不需要「真折射」，两张纹理都是真实的。
 *
 * —— 方形为什么不会被拉长 ——
 * 直接在 uv 上画方框，宽高比一变方框就变成长方形。所以先把 uv 换算成
 * 「以画布短边为基准」的坐标 q：短边方向恒为 [-0.5, 0.5]，方框在 q 里是正的，
 * 回到 uv 就永远还是正方形。
 *
 * —— 关于帧率 ——
 * 一切随时间演化都写成 速率×dt / exp(-dt/tau)，绝不写每帧常数。
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uOutside;   // 框外：就是照片本身（与底下那张 <img> 同一张）
uniform sampler2D uInside;    // 框内：同批次的下一张底片
uniform vec2  uPlane;         // 画布像素尺寸（device px）
uniform vec2  uTexOut;
uniform vec2  uTexIn;
uniform vec2  uPointer;       // 指针，vUv 空间（v 向上）
uniform float uBox;           // 方框半边长（单位：短边的一半）
uniform float uEnter;         // 出现度 0..1
uniform float uTime;          // 秒
uniform float uLens;          // 透镜畸变强度
uniform float uChroma;        // 径向 RGB 偏移强度
uniform float uWave;          // 框外的波 / 抖动强度
uniform float uGrain;         // 颗粒强度

// cover：纹理按比例铺满画布，多出来的裁掉 —— 与 CSS object-fit:cover 同一套规则
vec2 coverUv(vec2 uv, vec2 tex) {
  float pa = uPlane.x / uPlane.y;
  float ta = tex.x / tex.y;
  vec2 s = pa > ta ? vec2(1.0, ta / pa) : vec2(pa / ta, 1.0);
  return (uv - 0.5) * s + 0.5;
}

// 伪随机（Nikita Miropolskiy / Shadertoy）
vec3 random3(vec2 c) {
  float j = 4096.0 * sin(dot(c, vec2(17.0, 59.4)));
  vec3 r;
  r.z = fract(512.0 * j);
  j *= 0.125;
  r.x = fract(512.0 * j);
  j *= 0.125;
  r.y = fract(512.0 * j);
  return r - 0.5;
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  float m  = min(uPlane.x, uPlane.y);
  vec2  q  = (vUv - 0.5) * uPlane / m;      // 以短边为基准 → 方框永不被拉成长方
  vec2  pq = (uPointer - 0.5) * uPlane / m;

  // 出现 = 方框从中心扩开，不是整块淡入
  float boxH = uBox * uEnter;
  vec2  d  = abs(q - pq) - vec2(boxH);
  float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  float aa = 1.2 / m;
  float mask = 1.0 - smoothstep(-aa, aa, sd);
  float ring = 1.0 - smoothstep(0.0, aa * 1.6, abs(sd));

  // —— 框外：正弦波 + 伪随机抖动 ——
  // 只作用在框外，且随 uEnter 淡入；底片乳剂那样的躁动，够了就别再加
  vec2 uvW = vUv;
  float w1 = sin((vUv.y + uTime * 0.09) * 26.0);
  float w2 = sin((vUv.x - uTime * 0.06) * 19.0);
  vec2  rn = random3(floor(vUv * uPlane / 4.0) + floor(uTime * 10.0)).xy;
  uvW += (vec2(w1, w2) * 0.0022 + rn * 0.0015) * uWave * (1.0 - mask) * uEnter;

  // —— 框内：透镜畸变 + 向边缘增强的 RGB 偏移 ——
  vec2  lp = (q - pq) / max(boxH, 1e-4);    // 框内归一化到 [-1,1]
  float r  = length(lp);
  // 采样点向中心收 = 放大；乘 r² 是让它只在边缘弯，中心保持清楚
  vec2  qL  = pq + lp * (1.0 - uLens * 0.42 * r * r) * boxH;
  vec2  uvL = qL * m / uPlane + 0.5;

  // 色散必须向边缘增强：中心那点偏移只会让字发虚，边缘才是「镜头」的语言
  float edge = smoothstep(0.10, 1.0, max(abs(lp.x), abs(lp.y)));
  vec2  dir  = lp / max(r, 1e-4);
  vec2  co   = dir * uChroma * 0.028 * edge;

  vec3 cOut = texture2D(uOutside, coverUv(uvW, uTexOut)).rgb;
  vec3 cIn;
  cIn.r = texture2D(uInside, coverUv(uvL + co, uTexIn)).r;
  cIn.g = texture2D(uInside, coverUv(uvL, uTexIn)).g;
  cIn.b = texture2D(uInside, coverUv(uvL - co, uTexIn)).b;

  vec3 col = mix(cOut, cIn, mask);

  float g = hash12(vUv * uPlane + floor(uTime * 24.0)) - 0.5;
  col += g * uGrain * (0.08 + 0.14 * mask);

  // 取样框：一道极细的暖白线。取样得让人看见框在哪儿，
  // 但绝不能是墨色 —— 暖底暗底上那都会读成 UI 描边
  col = mix(col, vec3(0.97, 0.95, 0.92), ring * 0.42 * uEnter);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/** 纹理上限（2 的幂）：1024 足够取样框看，也让 mipmap 有得用 */
const POT_MAX = 1024;

const pow2Near = (n: number) => 2 ** Math.round(Math.log2(Math.max(1, n)));

/** 位置弹簧：dt 无关的指数逼近，换帧率手感不变 */
function approach(cur: number, target: number, dt: number, tau: number): number {
  return target + (cur - target) * Math.exp(-dt / tau);
}

interface TexRec {
  tex: WebGLTexture;
  w: number;
  h: number;
}

export class SquareLensEngine {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private buf: WebGLBuffer;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private texCache = new Map<string, TexRec>();

  private out: TexRec | null = null;
  private in: TexRec | null = null;

  private w = 1;
  private h = 1;
  private dpr = 1;
  /** 方框半边长（单位：画布短边的一半）。全屏视图里画布更大，框要相对放大才读得清 */
  private boxHalf = 0.2;

  /**
   * 强度参数。刻意偏保守：上一版全屏效果被判「眼花缭乱」，问题在幅度不在结构。
   * 手机全屏时框只占一两百像素，色散和畸变按桌面那套给就成了彩虹噪点，所以另给一档更克制的值。
   */
  private tuning = { lens: 0.55, chroma: 0.7, wave: 0.35, grain: 0.35 };

  /** 指针目标 / 当前（画布内归一化，v 向上） */
  private tx = 0.5;
  private ty = 0.5;
  private x = 0.5;
  private y = 0.5;
  private seeded = false;

  private enter = 0;
  private want = 0;
  private running = false;
  private raf = 0;
  private last = 0;
  private t0 = performance.now();
  private idle = 0;
  private lastDraw = 0;

  /** 每帧把出现度交给外层的 canvas —— 淡入淡出与着色器同源，才不会各走各的 */
  onEnter: ((e: number) => void) | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = (canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    }) || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) throw new Error("WebGL 不可用");
    this.gl = gl;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = vs && fs ? gl.createProgram() : null;
    if (!vs || !fs || !prog) throw new Error("着色器编译失败");
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("着色器链接失败");
    this.prog = prog;
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    const buf = gl.createBuffer();
    if (!buf) throw new Error("缓冲区创建失败");
    this.buf = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    // 一个覆盖全屏的大三角形，比两个三角形的 quad 少一个顶点也少一次边判断
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const n of [
      "uOutside", "uInside", "uPlane", "uTexOut", "uTexIn",
      "uPointer", "uBox", "uEnter", "uTime", "uLens", "uChroma", "uWave", "uGrain",
    ]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  /** 画布换成另一张照片时重设尺寸（CSS px） */
  setSize(cssW: number, cssH: number): void {
    this.w = Math.max(1, cssW);
    this.h = Math.max(1, cssH);
    const px = Math.round(this.w * this.dpr);
    const py = Math.round(this.h * this.dpr);
    if (this.canvas.width !== px || this.canvas.height !== py) {
      this.canvas.width = px;
      this.canvas.height = py;
    }
    this.gl.viewport(0, 0, px, py);
  }

  /**
   * 换纹理。返回 false = 这一层用不了（多半是跨域图片污染了画布），
   * 外层据此退回纯 <img>，页面不受影响。
   */
  setSource(outside: HTMLImageElement, inside: HTMLImageElement): boolean {
    const a = this.tex(outside);
    const b = this.tex(inside);
    if (!a || !b) return false;
    this.out = a;
    this.in = b;
    // 纹理到位之前 show() 来过的话，循环会因为「没纹理」停下而再也不动 ——
    // 表现是画布已在页面上、透明度却永远 0。这里补一次唤醒。
    if (this.want > 0.5) this.wake();
    return true;
  }

  /**
   * 上传纹理。图集里来回悬停会反复命中同一批图，所以按 src 缓存 ——
   * 否则每次 hover 都要重新 texImage2D 一张上千像素的图。
   */
  private tex(img: HTMLImageElement): TexRec | null {
    const key = img.src;
    const hit = this.texCache.get(key);
    if (hit) return hit;

    const gl = this.gl;
    const t = gl.createTexture();
    if (!t) return null;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    /**
     * 先把图缩进一块 2 的幂画布，再上传。
     *
     * 不是为了省显存 —— 是为了能开 mipmap。取样框里那张「下一张底片」是
     * **缩小**着看的（框只一两百像素），WebGL1 里非 2 的幂纹理不能带 mipmap，
     * 缩小时就只有 LINEAR 一路走样：密一点的画面直接碎成一片彩色噪点。
     * 桌面那档看起来还凑合，手机把框放大之后就成了彩虹糊。
     */
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    let rec: TexRec | null = null;
    try {
      const scale = Math.min(1, POT_MAX / Math.max(sw, sh));
      const pw = Math.min(POT_MAX, pow2Near(sw * scale));
      const ph = Math.min(POT_MAX, pow2Near(sh * scale));
      const cv = document.createElement("canvas");
      cv.width = pw;
      cv.height = ph;
      const ctx = cv.getContext("2d");
      if (!ctx) throw new Error("2d context 不可用");
      // cover：保比例铺满画布，多出来的居中裁掉 —— 与着色器的 coverUv 同一套规则
      const s = Math.max(pw / sw, ph / sh);
      const dw = sw * s;
      const dh = sh * s;
      ctx.drawImage(img, (pw - dw) / 2, (ph - dh) / 2, dw, dh);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      rec = { tex: t, w: pw, h: ph };
    } catch {
      // 跨域污染：画进 canvas 会污染它，texImage2D 抛 SecurityError。
      // 这一层就此放弃，别连累页面
      gl.deleteTexture(t);
      return null;
    }
    this.texCache.set(key, rec);
    return rec;
  }

  /**
   * 方框大小。默认 0.2（短边的 40%）。
   *
   * 手机上那张 2.16:1 的全景只有 166px 高，0.2 的框算出来才 66px ——
   * 框里那张「下一张底片」根本认不出来，只剩一团彩边。所以全屏视图里
   * 放到 0.28，框大一圈，取样才成立。命中判定必须用同一个值。
   */
  setBox(half: number): void {
    this.boxHalf = half;
  }

  /** 覆盖强度参数（只给传进来的那几项） */
  setTuning(t: Partial<{ lens: number; chroma: number; wave: number; grain: number }>): void {
    this.tuning = { ...this.tuning, ...t };
  }

  /** 指针移动（画布内归一化，y 已由调用方翻到 v 向上） */
  move(nx: number, ny: number): void {
    this.tx = nx;
    this.ty = ny;
    if (!this.seeded) {
      this.x = nx;
      this.y = ny;
      this.seeded = true;
    }
    this.idle = 0;
    this.wake();
  }

  show(): void {
    this.want = 1;
    this.wake();
  }

  /**
   * 让下一次 move 直接落位，不要用弹簧飞过去。
   *
   * 换照片时旧的归一化坐标属于**上一张图**，平滑插值会让它从上一张的位置
   * 横穿过来 —— 那是错的位移，不是惯性。
   */
  jump(): void {
    this.seeded = false;
  }

  hide(): void {
    this.want = 0;
    this.wake();
  }

  wake(): void {
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    }
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.enter = 0;
    if (this.onEnter) this.onEnter(0);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    // 续帧必须在最前：下面任何一条提前 return（省电降频、纹理没就位）都不能把循环断掉
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(Math.max((now - this.last) / 1000, 1 / 240), 1 / 24);
    this.last = now;

    // tau 0.06s：方框比水滴大一圈，跟得太紧会显得神经质，留一丁点滞后
    this.x = approach(this.x, this.tx, dt, 0.06);
    this.y = approach(this.y, this.ty, dt, 0.06);

    this.enter = approach(this.enter, this.want, dt, this.want > 0.5 ? 0.11 : 0.20);
    if (this.onEnter) this.onEnter(this.enter);

    // 完全淡出就没必要再画了
    if (this.enter < 0.004 && this.want < 0.5) {
      this.stop();
      return;
    }

    // 指针停住不动一会儿后降到 ~12fps：波和颗粒是慢变量，低频看不出来，
    // 但能让浏览器真正闲下来
    this.idle += dt;
    if (this.idle > 2.5 && now - this.lastDraw < 80) return;
    this.lastDraw = now;

    const gl = this.gl;
    if (!this.out || !this.in) {
      this.stop();
      return;
    }

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.out.tex);
    gl.uniform1i(this.u.uOutside!, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.in.tex);
    gl.uniform1i(this.u.uInside!, 1);

    gl.uniform2f(this.u.uPlane!, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.u.uTexOut!, this.out.w, this.out.h);
    gl.uniform2f(this.u.uTexIn!, this.in.w, this.in.h);
    gl.uniform2f(this.u.uPointer!, this.x, this.y);
    gl.uniform1f(this.u.uBox!, this.boxHalf);
    gl.uniform1f(this.u.uEnter!, this.enter);
    gl.uniform1f(this.u.uTime!, (now - this.t0) / 1000);
    gl.uniform1f(this.u.uLens!, this.tuning.lens);
    gl.uniform1f(this.u.uChroma!, this.tuning.chroma);
    gl.uniform1f(this.u.uWave!, this.tuning.wave);
    gl.uniform1f(this.u.uGrain!, this.tuning.grain);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    void this.w;
    void this.h;
  };

  dispose(): void {
    this.stop();
    const gl = this.gl;
    gl.deleteBuffer(this.buf);
    gl.deleteProgram(this.prog);
    this.texCache.forEach((r) => gl.deleteTexture(r.tex));
    this.texCache.clear();
  }
}

/**
 * 带 CORS 地预载一张图。
 *
 * 注意必须**单独加载一份**：页面上那张 <img> 没有 crossOrigin，
 * 直接拿它当纹理会污染画布。所以这里用一个不同的宽度（不同 URL → 独立缓存条目）
 * 重新发起一次带 CORS 的请求。跨域失败就返回 null，由调用方静默降级。
 */
export function loadCors(src: string, attempt = 0): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.decoding = "async";
    im.onload = () => resolve(im);
    im.onerror = () => {
      // 失败一次多半是网络抖动。**必须**重试：这一层没有兜底画面，
      // 直接放弃就等于用户点了半天什么也没出现
      if (attempt < 1) {
        setTimeout(() => {
          void loadCors(src, attempt + 1).then(resolve);
        }, 260);
      } else {
        resolve(null);
      }
    };
    im.src = src;
  });
}
