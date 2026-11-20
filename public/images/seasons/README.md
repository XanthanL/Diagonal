# 四季素材目录

每个季节目录放 9 张图，文件名严格按 `docs/SEASONS-IMAGE-GUIDE.md` 第 2 节。生成规范、提示词、色卡都在那份文档里。

```
summer/ | autumn/ | winter/
├── paper-grain_tile.png            不透明 RGB，2400×2400 无缝纸纹
├── press-1_2x3.png                 透明 RGBA，上扬枝（右下→左上）
├── press-2_2x3.png                 透明 RGBA，垂落枝（左上→右下）
├── press-3_2x3.png                 透明 RGBA，横斜枝（左下→右上）
├── press-rule_4x1.png              透明 RGBA，横向压花带 2800×700
├── plate-specimen_4x5.png          透明 RGBA，拱窗单株标本 4:5
├── hero-botanical-portrait_3x4.png 透明 RGBA，竖幅扉页 3:4（左上留字标区）
├── seal_1x1.png                    透明 RGBA，双线圆环印章，环内空白
└── hero-botanical.jpg              不透明 RGB，桌面横幅题图 1920×974（左侧留字标区）
```

流程：把图放进对应目录 → 跑 `npm run seasons:assets -- <季节>` 生成站点 WebP → 改 `src/lib/seasons.ts` 里该季的 `assetPaths` 指向 `/images/seasons/<季节>/...` 并把 `stub` 设为 false → 同步改 `src/app/seasons.css` 的 `--season-*` → `node scripts/check-seasons.js` 校验两处一致 → 构建。

图未到位时三季的 `assetPaths` 都复用春图（stub=true），切换只换色板不换图，不会 404。
