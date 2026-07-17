from PIL import Image, ImageDraw, ImageFont
import os
import glob

base_dir = r"e:\Code\Diagonal\public\images\archive\DIAGONAL-2026-OD1"
output_dir = r"e:\Code\Diagonal\temp"
os.makedirs(output_dir, exist_ok=True)

files = sorted(glob.glob(os.path.join(base_dir, "*.jpg")),
               key=lambda x: int(os.path.basename(x).split("_")[-1].split(".")[0]))

def make_sheet(file_batch, idx):
    thumb_w, thumb_h = 320, 240
    cols = 4
    rows = (len(file_batch) + cols - 1) // cols
    sheet_w = cols * thumb_w
    sheet_h = rows * (thumb_h + 30) + 40
    sheet = Image.new("RGB", (sheet_w, sheet_h), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except Exception:
        font = ImageFont.load_default()

    for i, fp in enumerate(file_batch):
        col = i % cols
        row = i // cols
        x = col * thumb_w
        y = row * (thumb_h + 30) + 40
        try:
            img = Image.open(fp)
            img.thumbnail((thumb_w - 20, thumb_h - 20))
            paste_x = x + (thumb_w - img.width) // 2
            paste_y = y + (thumb_h - img.height) // 2
            sheet.paste(img, (paste_x, paste_y))
        except Exception as e:
            draw.rectangle([x+10, y+10, x+thumb_w-10, y+thumb_h-10], outline="red", width=2)
        num = os.path.basename(fp).split("_")[-1].split(".")[0]
        draw.text((x + 10, y + thumb_h + 5), f"#{num}", fill="black", font=font)

    out_path = os.path.join(output_dir, f"contact_sheet_{idx}.jpg")
    sheet.save(out_path, quality=85, optimize=True)
    print(f"Saved {out_path} ({len(file_batch)} images)")

batch_size = 16
for idx, start in enumerate(range(0, len(files), batch_size)):
    make_sheet(files[start:start+batch_size], idx)
