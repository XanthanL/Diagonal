from bs4 import BeautifulSoup
import re
import copy

base_name = "开幕日回顾生命之盐自贡盐文化当代艺术展在自流井老街开幕"

files = [
    (r"e:\Code\Diagonal\src\content\archive\DIAGONAL-2026-OD1.html", "zh"),
    (r"e:\Code\Diagonal\src\content\archive\DIAGONAL-2026-OD1.en.html", "en"),
]


def set_img_num(fig, num):
    img = fig.find("img")
    if img:
        img["src"] = f"/images/archive/DIAGONAL-2026-OD1/{base_name}_{num}.jpg"


def prev_text(fig, limit=3):
    """获取 figure 前面最多 limit 个兄弟节点的文本"""
    texts = []
    prev = fig.find_previous_sibling()
    while prev and len(texts) < limit:
        texts.insert(0, prev.get_text(strip=True))
        prev = prev.find_previous_sibling()
    return "\n".join(texts)


def process_file(path, lang):
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    soup = BeautifulSoup(text, "html.parser")
    figures = soup.find_all("figure")

    # 用于计数“在地合作”下的图片
    local_coop_count = 0

    for fig in figures:
        fig_text = fig.get_text(strip=True)
        cap = fig.find("figcaption")
        cap_text = cap.get_text(strip=True) if cap else ""
        prev = prev_text(fig, 3)
        img = fig.find("img")
        alt = img.get("alt", "") if img else ""

        if lang == "zh":
            if "策展人孙晓鸣" in cap_text:
                set_img_num(fig, 6)
            elif "项目发起人彭玮雯" in cap_text:
                set_img_num(fig, 5)
            elif "Christian" in cap_text:
                set_img_num(fig, 40)
            elif "甜菜小组" in cap_text:
                set_img_num(fig, 44)
            elif "卢睿" in cap_text and "滋味" in cap_text:
                set_img_num(fig, 47)
            elif "彭玮雯" in cap_text and "开采" in cap_text:
                set_img_num(fig, 49)
            elif "刘圣阳" in cap_text:
                set_img_num(fig, 52)
            elif cap_text == "":
                # 根据前文判断
                if "项目成员" in prev or "策展团队" in prev or "驻留艺术家" in prev and "介绍了" in prev:
                    set_img_num(fig, 7)
                elif "驻留艺术家" in prev or "特邀艺术家" in prev:
                    set_img_num(fig, 4)
                elif "学术观察员" in prev or "城市观察员" in prev:
                    set_img_num(fig, 8)
                elif "布展团队" in prev:
                    set_img_num(fig, 9)
                elif "嘉宾发言" in prev:
                    set_img_num(fig, 3)
                elif "现场艺术" in prev or "室外" in prev or "公共空间" in prev:
                    set_img_num(fig, 50)
                elif "开幕日结束" in prev or "展览仍在继续发生" in prev:
                    set_img_num(fig, 54)
                elif "在地合作" in prev:
                    local_coop_count += 1
                    if local_coop_count == 1:
                        set_img_num(fig, 55)
                    else:
                        set_img_num(fig, 48)
                elif "楼道" in prev or "影像作品" in alt:
                    set_img_num(fig, 41)
        else:
            # 英文版规则
            if "Curator Kerribin" in cap_text or "Kerribin" in cap_text and "opening" in cap_text.lower():
                set_img_num(fig, 6)
            elif "Project initiator Vivienne Peng" in cap_text:
                set_img_num(fig, 5)
            elif "Christian" in cap_text:
                set_img_num(fig, 40)
            elif "Beetwise" in cap_text:
                set_img_num(fig, 44)
            elif "Lu Rui" in cap_text or "滋味" in cap_text:
                set_img_num(fig, 47)
            elif "Vivienne Peng" in cap_text and "Mining" in cap_text:
                set_img_num(fig, 49)
            elif "Liu Shengyang" in cap_text:
                set_img_num(fig, 52)
            elif cap_text == "":
                if "project members" in prev.lower() or "curatorial team" in prev.lower():
                    set_img_num(fig, 7)
                elif "resident artists" in prev.lower() or "invited artists" in prev.lower():
                    set_img_num(fig, 4)
                elif "academic observers" in prev.lower() or "urban observers" in prev.lower():
                    set_img_num(fig, 8)
                elif "installation team" in prev.lower():
                    set_img_num(fig, 9)
                elif "guest speeches" in prev.lower():
                    set_img_num(fig, 3)
                elif "live art" in prev.lower() or "outdoor" in prev.lower():
                    set_img_num(fig, 50)
                elif "opening day ended" in prev.lower() or "continues" in prev.lower():
                    set_img_num(fig, 54)
                elif "local cooperation" in prev.lower() or "cooperation" in prev.lower():
                    local_coop_count += 1
                    if local_coop_count == 1:
                        set_img_num(fig, 55)
                    else:
                        set_img_num(fig, 48)
                elif "corridor" in prev.lower() or "video works" in alt.lower():
                    set_img_num(fig, 41)

    with open(path, "w", encoding="utf-8") as f:
        f.write(str(soup))

    print(f"Updated {path}")


for path, lang in files:
    process_file(path, lang)
