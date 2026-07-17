from bs4 import BeautifulSoup
import re

BASE = "e:/Code/Diagonal/src/content/archive"
NAME = "开幕日回顾生命之盐自贡盐文化当代艺术展在自流井老街开幕"

# 基于视觉核对后的二次修正：index -> 新的图片编号
# 两个 HTML 文件结构一致，共用同一套顺序
fixes = {
    4: 14,   # 驻留艺术家与特邀艺术家团队：观众席 -> 书店中庭大合影
    5: 30,   # 学术观察员与城市观察员：个人致辞 -> 展厅人群
    7: 9,    # 嘉宾发言现场：展厅人群 -> 嘉宾致辞现场
    12: 19,  # 展览导览现场：李勇政作品本体 -> 策展人讲解现场
    14: 17,  # 杨茜作品：策展人讲解 -> 摄影作品墙
    16: 21,  # 李勇政《釜溪河》：策展人讲解 -> 作品本体
    23: 27,  # 甜菜小组《自贡照相馆》：照片墙 -> 照相装置现场
    30: 48,  # 52342小组《醒不来》：橙色织物 -> 楼道线装置
    44: 3,   # 展览信息：海报 -> 完整信息海报
    45: 55,  # 展览信息图：完整海报 -> 海报
}

def update_file(path):
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    imgs = soup.find_all("img")

    changed = []
    for idx, img in enumerate(imgs):
        if idx not in fixes:
            continue
        new_num = fixes[idx]
        old_src = img["src"]
        new_src = re.sub(r"_\d+\.jpg$", f"_{new_num}.jpg", old_src)
        if new_src != old_src:
            img["src"] = new_src
            changed.append((idx, old_src, new_src))

    with open(path, "w", encoding="utf-8") as f:
        f.write(str(soup))

    return changed

for lang in ["", ".en"]:
    path = f"{BASE}/DIAGONAL-2026-OD1{lang}.html"
    changed = update_file(path)
    print(f"\n{path}")
    for idx, old, new in changed:
        print(f"  [{idx}] {old.split('/')[-1]} -> {new.split('/')[-1]}")
