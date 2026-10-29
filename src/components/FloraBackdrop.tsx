/**
 * 相册详情页的专属背景：把相册自己的照片变成底光。
 *
 * 只有 ATLAS-HZ（Xanthan摄影作品）用。这一辑是 2022 年 4 月杭州校园的花，
 * 而默认的「黑底 + 品牌红」是给工业遗址档案做的，压在这批照片上太硬。
 *
 * 做法不是找花瓣素材来贴，而是拿相册自己的三张照片虚焦到只剩颜色 —— 但它们必须是
 * **先裁到花本身再虚焦**。整张直接虚焦的话，红色会被四周虚化的叶子吃成土黄
 * （实测：山茶整图虚焦 #7d6843 土黄，裁到主花再虚焦 #a7393b 正红，饱和度 46%→66%）。
 * 形态散掉以后它们读起来是「光」而不是「图」。
 *
 * 三条约束：
 * 1. 这层只在页面开头露脸（mask 向下淡出到透明）：往下是照片墙，
 *    背景继续有颜色会和照片互相染脏，看照片的时候底色要干净。
 * 2. mix-blend-screen 让它真的是光 —— 重叠处会亮起来，而不是互相盖掉。
 * 3. 只留三种颜色。晚樱那层试过，柔粉在这么暗的底上只能读出一片脏灰
 *    （裁出来的平均色 #806f6f，饱和度 13%），叠上去是糊不是光，砍掉。
 */
export function FloraBackdrop() {
  const layers = [
    {
      // 山茶：饱和正红，主光。bbox 是拿原图按红色连通域量出来的，不是目测
      id: "camellia",
      src: "https://res.cloudinary.com/de0wfewt8/image/upload/c_crop,x_1379,y_260,w_1610,h_1620/w_480,e_blur:1200/v1792908147/1_r3dorv.jpg",
      className: "flora-bloom-1",
    },
    {
      // 木绣球：苔绿。这张整图本来就是叶子的绿（#77904a），不必裁
      id: "viburnum",
      src: "https://res.cloudinary.com/de0wfewt8/image/upload/w_480,e_blur:1200/v1792908155/4_zmmknq.jpg",
      className: "flora-bloom-2",
    },
    {
      // 红花檵木：赭红偏玫。竖幅，裁中间那丛
      id: "fringeflower",
      src: "https://res.cloudinary.com/de0wfewt8/image/upload/c_crop,x_140,y_1400,w_1856,h_1820/w_420,e_blur:1400/v1792908166/10_xjzaxl.jpg",
      className: "flora-bloom-3",
    },
  ];

  return (
    <>
      <div
        aria-hidden="true"
        className="flora-field pointer-events-none absolute inset-x-0 top-0 -z-10 h-[170vh] overflow-hidden"
      >
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`flora-bloom ${layer.className}`}
            style={{ backgroundImage: `url(${layer.src})` }}
          />
        ))}
        {/* 底边收口：让「有光」到「纯净」的过渡不被看成一条断层 */}
        <div className="flora-field-fade" />
      </div>
      {/* 纸纤维。大块的纯色暗底会发「塑料感」，加一层几乎看不见的噪点，
          暗部就有了材质，像标本册的纸而不是显示器上的黑。
          在 -z-10：照片本身在它上面，取样不会有半点污染。 */}
      <div aria-hidden="true" className="flora-grain" />
    </>
  );
}
