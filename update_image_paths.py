import re

html_path = r'e:\Code\Diagonal\src\content\archive\DIAGONAL-2026-ARTISTS.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Mapping for old -> new image numbers (excluding 04, 05 which are already correct, and 03 logo)
mapping = {
    '06': '08',
    '07': '09',
    '08': '10',
    '09': '11',
    '11': '12',
    '12': '13',
    '13': '14',
    '14': '15',
    '15': '16',
    '16': '17',
    '17': '18',
    '18': '19',
    '19': '20',
    '20': '21',
    '21': '22',
    '22': '23',
    '23': '24',
    '24': '25',
    '25': '26',
    '26': '27',
    '27': '28',
    '28': '29',
    '29': '30',
    '30': '31',
    '31': '32',
}

# Replace image paths with larger numbers first to avoid partial replacements
for old, new in sorted(mapping.items(), key=lambda x: -int(x[0])):
    old_path = f'/images/archive/DIAGONAL-2026-ARTISTS/{old}.jpg'
    new_path = f'/images/archive/DIAGONAL-2026-ARTISTS/{new}.jpg'
    content = content.replace(old_path, new_path)

# Reduce image size from 260px to 200px for single artist images
content = content.replace('max-w-[260px]', 'max-w-[200px]')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
