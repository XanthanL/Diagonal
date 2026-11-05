/**
 * Hero 字标背后的对角基准线（AXIS / 45°）。
 *
 * —— 设计约定（动参数前先读这段）——
 * 旧版是五层渐变叠出的「立体灰斜条」：光晕 + 体积渐变 + 高光脊 + 两根伴随线，
 * 而且渲染在文字之上，像贴在字上的一道塑料划痕。这里整体重做为制图语言：
 *
 * 1. 线是「穿过字标」而不是「压在字上」。组件必须是 h1 的第一个子元素，
 *    两行字标带 relative z-10 —— 黑色笔画会把线切断，线从字缝里继续走。
 * 2. 全部几何关系只由 .hero-axis 上的一次 rotate(-45deg) 提供：线水平、
 *    刻度竖直、控制点是方块，旋转后自然得到 45° 主轴、垂直于轴的刻度和菱形点。
 *    不要给子元素再写各自的 rotate。
 * 3. 颜色只用 --foreground / --diagonal-red / --background，档案风与草木风
 *    共用同一份几何，各自取自己的墨、红、纸色。
 * 4. 只有一根 1px 硬边发丝线（两端渐隐）+ 一枚控制点 + 两根刻度。
 *    不加阴影、模糊、体积渐变——精度本身就是质感。
 *
 * 45° 的 "/" 方向是站名的轴：东北—西南（胡焕庸线），也是原先的母题方向。
 */
export function HeroAxis() {
  return (
    <span aria-hidden="true" className="hero-axis">
      <span className="hero-axis-line" />
      <span className="hero-axis-tick" data-side="left" />
      <span className="hero-axis-tick" data-side="right" />
      <span className="hero-axis-node" />
    </span>
  );
}
