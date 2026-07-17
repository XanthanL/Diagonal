from bs4 import BeautifulSoup
import re

base_name = "开幕日回顾生命之盐自贡盐文化当代艺术展在自流井老街开幕"
base_path = f"/images/archive/DIAGONAL-2026-OD1/{base_name}"

# 按 <img> 在 HTML 中出现的顺序，目标图片编号
# 中英文文章结构一致，共用同一套顺序
target_nums = [
    4,   # 0  开幕现场
    6,   # 1  策展人孙晓鸣致辞 / Curator Kerribin addressing
    5,   # 2  项目发起人彭玮雯致辞 / Project initiator Vivienne Peng addressing
    7,   # 3  策展人介绍团队 / Curator introducing the team
    8,   # 4  驻留艺术家与特邀艺术家团队 / Resident and invited artists team
    9,   # 5  学术观察员与城市观察员 / Academic observers and urban observers
    54,  # 6  布展团队 / Installation team
    30,  # 7  嘉宾发言现场 / Guest speeches scene
    10,  # 8  黄羽女士 / Director Huang Yu
    11,  # 9  邓绍宏教授 / Professor Tim Deng
    12,  # 10 倪卫华先生 / Ni Weihua
    13,  # 11 胡绍中先生 / Hu Shaozhong
    21,  # 12 展览导览现场 / Guided tour scene
    15,  # 13 书店36号馆文献展 / Bookshop Hall 36 documentary exhibition
    16,  # 14 杨茜作品 / Yang Qian work
    18,  # 15 Matt Parker《Slow Records》
    19,  # 16 李勇政《釜溪河》 / Li Yongzheng Fuxi River
    20,  # 17 王梓楠作品 / JINAN work
    28,  # 18 Yuxuan《无二》部分一
    23,  # 19 导览进入2号馆 / Guided tour entering Venue 2
    22,  # 20 李娟《盐素》 / Li Juan Salt Element
    25,  # 21 兰雅杰《灯会》 / Lannie Lantern Festival
    40,  # 22 Christian《Periods》
    44,  # 23 甜菜小组《自贡照相馆》 / Beetwise Zigong Photo Studio
    26,  # 24 Yuxuan《无二》部分二
    29,  # 25 盆栽《三重目》 / Bonsai Peng Triple Eye
    31,  # 26 彭思崴《数字文献档案系统》 / Peng Siwei Digital Documentary Archive System
    32,  # 27 Jinglin《千阳 The SUNs》
    33,  # 28 杨川威《真空制盐模型》 / Yang Chuanwei Vacuum Salt-Making Model
    34,  # 29 胡炜钊 & 李增钰 / Hu Weizhao and Li Zengyu
    35,  # 30 52342小组《醒不来》 / Group 52342 Can't Wake Up
    39,  # 31 虫子声《观山不山看盐不盐》 / InsectSound
    38,  # 32 关杰夫《0.345克记忆》 / Guan Jeff
    36,  # 33 林俐颖《青菜叶子》 / Lin Liying
    42,  # 34 马一鸣《连接》 / Ma Yiming Connection
    41,  # 35 楼道影像作品 / Corridor video works
    45,  # 36 Seem《无言对话》 / Seem Wordless Dialogue
    46,  # 37 彭玮雯《小盐人》 / Vivienne Peng Little Salt Man
    47,  # 38 卢睿《滋味》 / Lu Rui Flavour
    50,  # 39 现场艺术现场 / Live art scene
    49,  # 40 彭玮雯现场《开采》 / Vivienne Peng live Mining
    52,  # 41 刘圣阳现场《境》 / Liu Shengyang live Realm
    54,  # 42 开幕日结束 / End of opening day
    55,  # 43 在地合作空间与机构 / Local partner spaces
    55,  # 44 展览信息 / Exhibition Information
    3,   # 45 展览信息图 / Exhibition Information Image
]

files = [
    r"e:\Code\Diagonal\src\content\archive\DIAGONAL-2026-OD1.html",
    r"e:\Code\Diagonal\src\content\archive\DIAGONAL-2026-OD1.en.html",
]

for fp in files:
    with open(fp, "r", encoding="utf-8") as f:
        text = f.read()

    soup = BeautifulSoup(text, "html.parser")
    imgs = soup.find_all("img")

    if len(imgs) != len(target_nums):
        print(f"Warning: {fp} has {len(imgs)} images but mapping has {len(target_nums)} entries")

    for idx, img in enumerate(imgs):
        if idx >= len(target_nums):
            break
        num = target_nums[idx]
        new_src = f"{base_path}_{num}.jpg"
        img["src"] = new_src

    # 保留原始格式化输出
    with open(fp, "w", encoding="utf-8") as f:
        f.write(str(soup))

    print(f"Updated {fp} ({len(imgs)} images)")
