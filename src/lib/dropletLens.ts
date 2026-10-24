/**
 * 水滴透镜 DropletLens —— 全站指针 / 触控的着色器反馈层。
 *
 * 与上一版「墨脉」的分工差别：墨脉是在屏幕上留痕（会累积、会洇开、满屏都是），
 * 这一版是**一枚跟着指针走的玻璃水滴** —— 不留痕、不累积、不铺屏。
 * 指针在哪它就在哪，停下就收敛成一颗安静的圆珠。
 *
 * —— 为什么是水滴 / 透镜 ——
 * 全站是暖纸、墨、暗朱的文献调性。发光拖尾太躁，满屏墨痕太闹；而一枚压在纸上的
 * 水珠本身也是「物质」：它有厚度（表面张力那圈暖痕）、有边界（菲涅耳亮环）、
 * 有反光（左上角一枚镜面高光）。它不添加任何新母题，只是让指针落点有了重量。
 * 边界一律不取墨色 —— 在暖纸上那会读成一道描边，而不是一滴水。
 *
 * —— 为什么不做真折射 ——
 * canvas 覆盖在页面之上，**读不到它底下的页面像素**（没有 backdrop 采样这种东西，
 * html2canvas 之流太重且不实时）。所以真位移式折射做不到。这里的做法是：
 * 主体几乎全透明（alpha 0.045），只靠边缘的暗带 + 亮环 + 高光来「暗示」厚度，
 * 背景原样透出 —— 眼睛会自动把这读成玻璃。边缘那一丝 RGB 错位的色散镶边
 * 也是同理：不需要背景像素，就能给出「这是透明介质」的线索。
 *
 * —— 关于帧率 ——
 * 一切随时间的演化都写成 exp(-dt/tau) 或 速率×dt 的形式，**绝不写每帧常数**。
 * 否则 120Hz 屏上水滴会甩得更快、144Hz 上褪色更急，换台机器手感就变了。
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

uniform vec2  uRes;     // 画布像素尺寸（算抗锯齿宽度用）
uniform float uDark;    // 0 = 浅底（走湿痕）  1 = 深底（走粉笔）
uniform vec2  uDir;     // 速度方向单位向量
uniform float uSpeed;   // 归一化速度 0..1
uniform float uScale;   // 出现 / 消失 0..1
uniform float uPress;   // 按压脉冲 0..1
uniform float uNib;     // 悬停在可交互元素上 0..1

const vec3 CHALK = vec3(0.992, 0.968, 0.930);   // 暖白反光
// 暖纸上「被水浸过」的颜色：比纸暗一档，但带着明显的暖色相。
// 边界**不取墨色** —— 墨压在 #FAFAF8 上就是一道马克笔描边；水痕才是同一种语言。
// 亮度刻意压得很浅（实测最深处只比纸暗 13/255），可见度靠 R-B 的暖偏移撑起来：
// 边界读起来是「纸被浸湿了」，而不是「被描了一道灰边」。
const vec3 WET   = vec3(0.855, 0.792, 0.700);   // #DACA B3 湿痕
const vec3 WET2  = vec3(0.925, 0.878, 0.806);   // 更淡一档，给菲涅耳环与透镜本体

void main() {
  vec2 p = vUv * 2.0 - 1.0;

  // 旋转到速度方向：沿运动轴拉长、垂直轴收窄 —— 水滴被甩出去时的样子。
  // 只在移动时生效，停下就收敛回正圆（uSpeed → 0）。
  vec2 q = vec2(dot(p, uDir), dot(p, vec2(-uDir.y, uDir.x)));
  float e = uSpeed * 0.40;
  q.x /= (1.0 + e);
  q.y *= (1.0 + e * 0.55);

  float R = 0.56 * uScale * (1.0 - uPress * 0.12) * mix(1.0, 0.84, uNib);
  float aa = 2.5 / max(uRes.y, 1.0);
  float r = length(q) / R;

  // 剔除边界要留到菲涅耳环之外，否则环的外半圈会被 body 的硬边切掉
  float w = 0.085;   // 环宽：太窄会变成一条硬边线，就不是玻璃了
  if (r > 1.0 + w + 0.06) discard;

  float body = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, r);

  float core    = 1.0 - smoothstep(0.0, 0.92, r);          // 透镜本体

  // 表面张力：厚度阴影必须收在**环之内**就衰减干净。
  // 旧版它一路顶到 r=1，和菲涅耳环叠在一起，边界就成了实心的一圈 —— 那正是「黑边」。
  float tension = smoothstep(0.44, 0.90, r) * body * (1.0 - smoothstep(0.90, 1.04, r));

  // 菲涅耳细环，三条通道各错开一点点半径 —— 边缘那丝彩镶边是「透明介质」最经济的暗示。
  // 掠射角反射最强，所以最外缘本该是**亮**的：环取暖白，绝不用墨色去描边。
  float ringR = smoothstep(0.905, 1.005, r) * (1.0 - smoothstep(1.005, 1.005 + w, r));
  float ringG = smoothstep(0.911, 1.011, r) * (1.0 - smoothstep(1.011, 1.011 + w, r));
  float ringB = smoothstep(0.917, 1.017, r) * (1.0 - smoothstep(1.017, 1.017 + w, r));
  vec3  aRing = vec3(ringR, ringG, ringB) * mix(0.26, 0.32, uDark);

  // 高光必须在屏幕固定方向（光从左上），不能跟着拉伸旋转，否则会露馅
  vec2 sp = p / R;
  float spec  = (1.0 - smoothstep(0.0, 0.34, length(sp - vec2(-0.38, -0.44)))) * body;
  float spec2 = (1.0 - smoothstep(0.0, 0.26, length(sp - vec2( 0.32,  0.42)))) * body;

  // 边界两件套：浅底走「湿痕」（暖、比纸暗一点点，但绝不是黑），深底仍然走粉笔亮环。
  vec3  base  = mix(WET2, CHALK, uDark); // 透镜本体；浅底上暖白几乎不可见，靠它给一点存在感
  vec3  thick = mix(WET, CHALK, uDark);   // 厚度阴影
  vec3  edge  = mix(WET2, CHALK, uDark);  // 菲涅耳环
  float specA = mix(0.14, 0.50, uDark);   // 白纸上镜面高光本就看不见，物理正确

  // 累加成「颜色 × alpha」的预乘和
  vec3  acc = vec3(0.0);
  float a   = 0.0;

  float lensA = core * 0.060 * mix(1.0, 0.30, uDark);   // 透镜聚光：纸面上略提亮
  acc += base * lensA;   a += lensA;

  float tbA = tension * 0.12;                           // 表面张力：靠边越厚越暗（收在环内）
  acc += thick * tbA;    a += tbA;

  // 逐通道给 alpha，不能求和 —— 求和会让环的 alpha 直接翻三倍，边缘糊成一圈硬黑边。
  // 逐通道的副作用正是我们要的：哪条通道先到，那一条就先被染上湿痕，于是镶边显色。
  acc += edge * aRing;
  a   += max(max(aRing.r, aRing.g), aRing.b);

  float sA = spec * specA;
  acc += CHALK * sA;     a += sA;
  float s2A = spec2 * specA * 0.42;
  acc += CHALK * s2A;    a += s2A;

  a *= uScale;
  if (a <= 0.002) discard;

  gl_FragColor = vec4(acc, min(a, 0.92));
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("shader compile failed: " + log);
  }
  return sh;
}

/** 时间化的指数趋近：tau 是「收敛到 63% 所需秒数」。帧率无关，这是硬要求。 */
function approach(cur: number, target: number, dt: number, tau: number): number {
  return cur + (target - cur) * (1 - Math.exp(-dt / tau));
}

export interface DropletOptions {
  mobile?: boolean;
}

export class DropletLensEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private buf: WebGLBuffer;
  private u: Record<string, WebGLUniformLocation | null> = {};

  private mobile: boolean;
  private size = 200; // 画布 CSS 边长（正方形）
  private dpr = 1;

  // 位置：tx/ty 是指针目标，x/y 是渲染位置（弹簧跟随，几乎不滞后但保留一丝惯性）
  private tx = 0;
  private ty = 0;
  private x = 0;
  private y = 0;
  private px = 0;
  private py = 0;
  private vx = 0;
  private vy = 0;
  private dirX = 1;
  private dirY = 0;
  private seeded = false;

  private want = 0; // 该不该存在（0/1）
  private appear = 0; // 实际出现度 0..1
  private pressV = 0;
  private nib = 0;
  private nibT = 0;
  private dark = 0;
  private darkT = 0;

  private raf = 0;
  private running = false;
  private last = 0;
  private lastDraw = 0;
  private idle = 0;
  private releaseAt = 0; // 预约的淡出时刻（0 = 无预约）

  constructor(canvas: HTMLCanvasElement, opts: DropletOptions = {}) {
    this.canvas = canvas;
    this.mobile = !!opts.mobile;

    const gl = (canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    }) || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) throw new Error("WebGL unavailable");
    this.gl = gl;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error("program link failed: " + gl.getProgramInfoLog(prog));
    }
    this.prog = prog;
    gl.useProgram(prog);

    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    for (const n of ["uRes", "uDark", "uDir", "uSpeed", "uScale", "uPress", "uNib"]) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    // 预乘 alpha 的标准混合式
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    this.resize();
  }

  resize(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 水滴直径 ≈ 0.56 × size：桌面 ≈110px、移动 ≈95px。再大就从「一滴水」变成「一团」了。
    this.size = this.mobile ? 170 : 200;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const px = Math.round(this.size * this.dpr);
    if (this.canvas.width !== px || this.canvas.height !== px) {
      this.canvas.width = px;
      this.canvas.height = px;
    }
    this.canvas.style.width = this.size + "px";
    this.canvas.style.height = this.size + "px";
    this.gl.viewport(0, 0, px, px);
    void vw;
    void vh;
  }

  /** 指针移动：更新目标位置并唤醒 */
  move(_id: number, x: number, y: number): void {
    this.tx = x;
    this.ty = y;
    if (!this.seeded) {
      this.x = this.px = x;
      this.y = this.py = y;
      this.seeded = true;
    }
    this.want = 1;
    this.idle = 0;
    this.wake();
  }

  /** 按下：一次轻微的收缩脉冲（水滴被戳了一下） */
  press(_id: number): void {
    this.pressV = 1;
    this.want = 1;
    this.idle = 0;
    this.wake();
  }

  /**
   * 触屏抬手 / 指针被取消 / 指针离开窗口：预约淡出。
   *
   * 为什么默认要延迟而不是立刻消失：移动端只要手指一移动，Chrome 就会把这次触摸
   * 判成滚动手势并派发 pointercancel（实测事件序列就是
   * pointerdown → pointermove ×2 → pointercancel → pointerleave）。立刻消失的话
   * 触屏上等于「一动就没」，根本没有跟手可言。留一段余韵：水滴跟着手指走完那一小截，
   * 然后自己蒸发掉 —— 滚动页面时它本来也不该赖着。
   */
  release(_id: number, delayMs = 350): void {
    if (delayMs <= 0) {
      this.want = 0;
      this.releaseAt = 0;
    } else {
      // 取更晚的那个：pointercancel 之后浏览器还会补一个 pointerleave，
      // 若后者直接覆盖前者，较长的余韵会被悄悄砍短。
      const at = performance.now() + delayMs;
      this.releaseAt = Math.max(this.releaseAt, at);
    }
  }

  setNib(on: boolean): void {
    this.nibT = on ? 1 : 0;
  }

  setDark(d: boolean): void {
    this.darkT = d ? 1 : 0;
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
    // 停机必须清屏：rAF 停了以后最后一帧会永远留在屏幕上，
    // 而那时水滴只褪到渲染阈值附近而非归零 —— 不清就是一层擦不掉的脏斑。
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);

    const dt = Math.min(Math.max((now - this.last) / 1000, 1 / 240), 1 / 24);
    this.last = now;

    // 位置：tau 0.045s —— 几乎贴着指针走，但保留一点点惯性，甩动时才有「重量」
    this.px = this.x;
    this.py = this.y;
    this.x = approach(this.x, this.tx, dt, 0.045);
    this.y = approach(this.y, this.ty, dt, 0.045);

    // 速度（px/s），再做一层平滑，免得单帧抖动把形变抽成抽搐
    const rvx = (this.x - this.px) / dt;
    const rvy = (this.y - this.py) / dt;
    this.vx = approach(this.vx, rvx, dt, 0.09);
    this.vy = approach(this.vy, rvy, dt, 0.09);
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > 60) {
      this.dirX = this.vx / sp;
      this.dirY = this.vy / sp;
    }

    if (this.releaseAt && now >= this.releaseAt) {
      this.want = 0;
      this.releaseAt = 0;
    }

    this.appear = approach(this.appear, this.want, dt, this.want > 0.5 ? 0.10 : 0.22);
    this.pressV = approach(this.pressV, 0, dt, 0.12);
    this.nib = approach(this.nib, this.nibT, dt, 0.10);
    this.dark = approach(this.dark, this.darkT, dt, 0.14);

    // 静止一会儿后降到 ~10fps：水滴已收敛成不动的圆珠，低频完全看不出来，
    // 但能让浏览器真正闲下来。任何一次移动都会立刻把 idle 清零。
    this.idle += dt;
    const slow = this.idle > 3;
    if (slow && now - this.lastDraw < 100) return;
    this.lastDraw = now;

    // 完全淡出且不再需要 —— 停机，别白占一个 rAF
    if (this.appear < 0.004 && this.want < 0.5) {
      this.stop();
      return;
    }

    const gl = this.gl;
    const half = this.size / 2;
    this.canvas.style.transform = `translate3d(${this.x - half}px, ${this.y - half}px, 0)`;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);
    gl.uniform2f(this.u.uRes!, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uDark!, this.dark);
    gl.uniform2f(this.u.uDir!, this.dirX, this.dirY);
    gl.uniform1f(this.u.uSpeed!, Math.min(1, sp / 2400));
    gl.uniform1f(this.u.uScale!, this.appear);
    gl.uniform1f(this.u.uPress!, this.pressV);
    gl.uniform1f(this.u.uNib!, this.nib);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  dispose(): void {
    this.stop();
    const gl = this.gl;
    gl.deleteBuffer(this.buf);
    gl.deleteProgram(this.prog);
    // 彻底丢弃 GPU 侧资源。不用 loseContext：那会让同一块 canvas 在 StrictMode
    // 二次挂载时拿不到上下文。
  }
}
