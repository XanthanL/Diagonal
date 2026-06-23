import os
import shutil
import re

src_dir = r'e:\Code\Diagonal\Diagonal-content\图片\参展艺术家介绍生命之盐自贡盐文化当代艺术展TheSaltofLifeContemporaryArtE'
dst_dir = r'e:\Code\Diagonal\public\images\archive\DIAGONAL-2026-ARTISTS'
cover_src = r'e:\Code\Diagonal\Diagonal-content\封面\参展艺术家介绍生命之盐自贡盐文化当代艺术展TheSaltofLifeContemporaryArtE.jpg'

# Clear destination except cover if exists
if os.path.exists(dst_dir):
    shutil.rmtree(dst_dir)
os.makedirs(dst_dir)

# Copy cover
shutil.copy(cover_src, os.path.join(dst_dir, 'cover.jpg'))

# Get all source images sorted by numeric suffix
files = [f for f in os.listdir(src_dir) if f.endswith('.jpg')]

def numeric_key(name):
    m = re.search(r'(\d+)\.jpg$', name)
    return int(m.group(1)) if m else 0

files.sort(key=numeric_key)

# Mapping from source numeric to destination number
# 0 is cover, skip
# 3 -> 01, 4 -> 02, 5 -> 03, 6 -> 04, ...
# User wants artists start at 04, so:
# src 6 -> 04 (52342)
# src 7 -> 05 (Liu Xinghao)
# src 8 -> 06 (Lulu)
# src 9 -> 07 (Xiaoyu)
# src 10 -> 08 (Christian)
# ... src n -> n - 2
mapping = {}
for f in files:
    num = numeric_key(f)
    if num == 0:
        continue
    if num >= 6:
        mapping[num] = f'{num - 2:02d}.jpg'
    else:
        # 3, 4, 5 -> keep as 01, 02, 03
        mapping[num] = f'{num - 2:02d}.jpg'

for f in files:
    num = numeric_key(f)
    if num == 0:
        continue
    src_path = os.path.join(src_dir, f)
    dst_name = mapping[num]
    dst_path = os.path.join(dst_dir, dst_name)
    shutil.copy(src_path, dst_path)
    print(f'{f} -> {dst_name}')

print('Done')
