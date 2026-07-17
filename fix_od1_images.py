import re
import os

base_name = "开幕日回顾生命之盐自贡盐文化当代艺术展在自流井老街开幕"

# Mapping: current image number -> new image number for specific article positions.
# We identify each occurrence by the full src path containing the old number,
# replace with a temporary token, then replace tokens with final paths to avoid
# chained replacements.
mapping = {
    # 开幕式致辞部分：基于高分辨率原图重新核对后的修正
    4: 5,   # 项目发起人彭玮雯致辞 → 米色外套女士手持话筒致辞
    5: 7,   # 策展人介绍团队 → 策展人手持话筒介绍身旁两位女士
    7: 8,   # 学术观察员与城市观察员 → 观众席全景
    8: 9,   # 布展团队 → 光头黑衣男士现场致辞/鼓掌场景

    # Christian / 甜菜小组：原 #24/#25 为兰雅杰《灯会》霓虹局部，
    # 调换至更匹配的照片墙/装置现场
    24: 40, # Christian《Periods》→ 观众围绕窗边装置观看的现场
    25: 44, # 甜菜小组《自贡照相馆》→ 墙上照片/蓝晒布墙

    # 楼道、现场艺术与结尾部分：进一步对齐文字与画面
    40: 47, # 卢睿《滋味》→ 楼梯上的行为现场
    41: 50, # 现场艺术现场 → 户外广场拉绳/行为现场
    45: 3,  # 在地合作空间与机构 → 展览海报（含合作方信息）
    46: 55, # 在地合作空间与机构 → 展览海报另一版本
}

files = [
    r"e:\Code\Diagonal\src\content\archive\DIAGONAL-2026-OD1.html",
    r"e:\Code\Diagonal\src\content\archive\DIAGONAL-2026-OD1.en.html",
]

for fp in files:
    with open(fp, "r", encoding="utf-8") as f:
        text = f.read()

    # Step 1: replace old paths with temporary tokens
    for old, new in mapping.items():
        old_path = f"/images/archive/DIAGONAL-2026-OD1/{base_name}_{old}.jpg"
        token = f"__OD1_IMG_{old:03d}__"
        text = text.replace(old_path, token)

    # Step 2: replace tokens with new paths
    for old, new in mapping.items():
        token = f"__OD1_IMG_{old:03d}__"
        new_path = f"/images/archive/DIAGONAL-2026-OD1/{base_name}_{new}.jpg"
        text = text.replace(token, new_path)

    with open(fp, "w", encoding="utf-8") as f:
        f.write(text)

    print(f"Updated {fp}")
