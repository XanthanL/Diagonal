const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'Diagonal-content/categorized/ArchiveBox';
const TARGET_DIR = 'src/content/archive';

// 建立 ID 映射 (根据文件名关键词)
const idMap = {
  'Roamers': 'DIAGONAL-2024-HG01',
  '黑白之痕': 'DIAGONAL-2024-BW', // 分 01/02
  '鄂尔多斯': 'DIAGONAL-2024-AMR',
  '草海': 'DIAGONAL-2024-CH',
  '生命之盐': 'DIAGONAL-2024-ZG',
  '小盐人': 'DIAGONAL-2024-XYR'
};

if (!fs.existsSync(TARGET_DIR)) fs.mkdirSync(TARGET_DIR, { recursive: true });

fs.readdirSync(SOURCE_DIR).forEach(file => {
  if (!file.endsWith('.md')) return;

  let content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8');

  // 1. 移除无效的 JS 链接与公众号装饰
  content = content.replace(/\[.*\]\(javascript:void\(0\);\)/g, '');
  content = content.replace(/_ _ _ _ _ _/g, '');
  
  // 2. 移除文章顶部的编者荐语 (微信特有)
  content = content.replace(/编者荐语：[\s\S]*?作者.*/g, '');

  // 3. 压缩过多的连续空行 (超过2个改为1个)
  content = content.replace(/\n{3,}/g, '\n\n');

  // 4. 优化图片链接 (准备后续本地化)
  // 微信图片链接通常很长，我们可以在渲染层处理它们，或者在这里做标记
  
  // 5. 提取 Metadata (Front Matter)
  const title = file.replace('.md', '');
  let id = 'DIAGONAL-UNKNOWN';
  for (let key in idMap) {
    if (file.includes(key)) {
      id = idMap[key];
      // 处理特殊的分篇
      if (file.includes('一')) id += '01';
      else if (file.includes('二')) id += '02';
      break;
    }
  }

  const frontMatter = `---
id: "${id}"
title: "${title}"
category: "Archive"
---

`;

  fs.writeFileSync(path.join(TARGET_DIR, `${id}.md`), frontMatter + content);
  console.log(`Cleaned & Migrated: ${file} -> ${id}.md`);
});
