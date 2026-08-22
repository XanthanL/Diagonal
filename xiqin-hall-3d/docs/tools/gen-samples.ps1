# 生成 T1 四张样例指导图（palette / roof-profile-guide / carving-roundel-sample / elevation-guide）
# 运行：pwsh -File gen-samples.ps1   （依赖 System.Drawing，仅 Windows）
# 规范依据：../02-voxel-style-guide.md §4/§6/§7
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$samplesDir = Join-Path $PSScriptRoot '..\samples'
New-Item -ItemType Directory -Force -Path $samplesDir | Out-Null

# ---------- 色板（02 §7，唯一来源） ----------
$script:PAL = [ordered]@{
  '瓦·暗垄'   = '#55565a'; '瓦·亮垄'   = '#6b6e6a'; '黑漆·主体' = '#211d1b'; '黑漆·受光' = '#332c28'
  '金·主体'   = '#c9a13b'; '金·高光'   = '#e0bd66'; '石青·彩画' = '#3f7076'; '石青·浅'   = '#57909a'
  '朱红·柱'   = '#a03828'; '朱红·受光' = '#b8503a'; '白灰墙'    = '#e6e1d6'; '白灰·暗'   = '#d8d2c4'
  '砂岩·亮'   = '#98938a'; '砂岩·暗'   = '#7e786e'; '栗木格栅'  = '#4a352a'; '栗木·受光' = '#5f4636'
  '木雕·金褐' = '#8f6f4e'; '水波·浅青' = '#b7d0cf'; '椽望暗层'  = '#2b2624'; '灰塑·亮'   = '#efe9dc'
}
$script:C = $script:PAL

$script:brushes = @{}
function Get-Brush([string]$hex) {
  if (-not $script:brushes.ContainsKey($hex)) {
    $script:brushes[$hex] = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($hex))
  }
  $script:brushes[$hex]
}
function New-F([single]$size, [switch]$bold, [string]$family = 'Microsoft YaHei UI') {
  $style = [System.Drawing.FontStyle]::Regular; if ($bold) { $style = [System.Drawing.FontStyle]::Bold }
  New-Object System.Drawing.Font($family, $size, $style)
}
function New-Bmp([int]$w, [int]$h, [string]$bg = '#ffffff') {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'None'; $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.Clear([System.Drawing.ColorTranslator]::FromHtml($bg))
  @{ Bmp = $bmp; G = $g }
}
function Save-Png($o, [string]$name) {
  $p = Join-Path $samplesDir $name
  $o.Bmp.Save($p, [System.Drawing.Imaging.ImageFormat]::Png)
  $o.G.Dispose(); $o.Bmp.Dispose()
  Write-Host ("  saved {0}  ({1} KB)" -f $name, [math]::Round((Get-Item $p).Length / 1KB))
}

# 体素矩形：体素坐标(y 向上) → 像素(oy 为体素 y=0 基线的像素 y)
function Vx($g, [int]$x, [int]$y, [int]$w, [int]$h, [string]$hex, [int]$s, [int]$ox, [int]$oy) {
  $g.FillRectangle((Get-Brush $hex), ($ox + $x * $s), ($oy - ($y + $h) * $s), ($w * $s), ($h * $s))
}
# 镜像版（立面总宽 W=160，绕 x=80 镜像）
function VxM($g, [int]$x, [int]$y, [int]$w, [int]$h, [string]$hex, [int]$s, [int]$ox, [int]$oy) {
  Vx $g (160 - $x - $w) $y $w $h $hex $s $ox $oy
}
# 屋面（底色 + 对齐全局网格的瓦垄条纹：每4格一个2格宽亮条）
function VxRoof($g, [int]$x, [int]$y, [int]$w, [int]$h, [int]$s, [int]$ox, [int]$oy) {
  Vx $g $x $y $w $h $script:C['瓦·暗垄'] $s $ox $oy
  $start = [int][Math]::Ceiling($x / 4.0) * 4
  for ($xx = $start; $xx -lt $x + $w; $xx += 4) {
    $a = [Math]::Max($xx, $x); $b = [Math]::Min($xx + 2, $x + $w)
    if ($b -gt $a) { Vx $g $a $y ($b - $a) $h $script:C['瓦·亮垄'] $s $ox $oy }
  }
}
function VxRoofM($g, [int]$x, [int]$y, [int]$w, [int]$h, [int]$s, [int]$ox, [int]$oy) {
  $xr = 160 - $x - $w
  VxRoof $g $xr $y $w $h $s $ox $oy
}
# 八边近似圆形团窠：外环描金 + 中心十字花
function VxRoundel($g, [single]$cx, [single]$cy, [single]$r, [int]$s, [int]$ox, [int]$oy) {
  $R = [int][Math]::Ceiling($r) + 1
  for ($dy = -$R; $dy -le $R; $dy++) {
    for ($dx = -$R; $dx -le $R; $dx++) {
      $ad = [Math]::Abs($dx); $ad2 = [Math]::Abs($dy)
      $d = [Math]::Sqrt(($dx * $dx) + ($dy * $dy))
      $hex = $null
      if (($d -le $r) -and ($d -ge $r - 2.2)) { $hex = $script:C['金·主体'] }
      elseif (($d -lt $r - 2.2) -and ($d -le 2.5)) { $hex = $script:C['金·高光'] }
      if ($hex) { Vx $g ([int]($cx + $dx)) ([int]($cy + $dy)) 1 1 $hex $s $ox $oy }
    }
  }
}
function Draw-Grid($g, [int]$s, [int]$ox, [int]$oy, [int]$maxX, [int]$maxY, [int]$step) {
  $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#18000000'))
  for ($x = 0; $x -le $maxX; $x += $step) { $g.DrawLine($pen, ($ox + $x * $s), $oy, ($ox + $x * $s), ($oy - $maxY * $s)) }
  for ($y = 0; $y -le $maxY; $y += $step) { $g.DrawLine($pen, $ox, ($oy - $y * $s), ($ox + $maxX * $s), ($oy - $y * $s)) }
  $pen.Dispose()
}
function T($g, [string]$txt, [single]$x, [single]$y, [System.Drawing.Font]$f, [string]$hex = '#333333') {
  $g.DrawString($txt, $f, (Get-Brush $hex), $x, $y)
}
function TC($g, [string]$txt, [single]$cx, [single]$y, [System.Drawing.Font]$f, [string]$hex = '#333333') {
  $sf = New-Object System.Drawing.StringFormat; $sf.Alignment = 'Center'
  $g.DrawString($txt, $f, (Get-Brush $hex), $cx, $y, $sf)
}

# ============================================================
# 图 1/4：palette.png
# ============================================================
Write-Host '[1/4] palette.png'
$o = New-Bmp 850 560
$fT = New-F 15 -bold; $fH = New-F 9 'Consolas'; $fN = New-F 9
T $o.G '西秦会馆大门 · 体素色板（全模型 ≤ 20 色）' 40 18 $fT '#1f1c1b'
T $o.G '来源：docs/02-voxel-style-guide.md §7 · 建模与代码共用此表' 40 46 (New-F 9) '#888888'
$names = @($script:PAL.Keys)
for ($i = 0; $i -lt $names.Count; $i++) {
  $cx = 40 + ($i % 5) * 155; $cy = 80 + [int][Math]::Floor($i / 5) * 115
  $hex = $script:PAL[$names[$i]]
  $o.G.FillRectangle((Get-Brush $hex), $cx, $cy, 130, 66)
  $o.G.DrawRectangle([System.Drawing.Pens]::Black, $cx, $cy, 130, 66)
  T $o.G $hex ($cx + 4) ($cy + 4) $fH '#ffffff'
  T $o.G ("{0:d2}" -f ($i + 1)) ($cx + 4) ($cy + 48) $fH '#ffffff'
  T $o.G $names[$i] $cx ($cy + 70) $fN '#333333'
}
Save-Png $o 'palette.png'

# ============================================================
# 图 2/4：roof-profile-guide.png（坡面举折 + 角部起翘）
# ============================================================
Write-Host '[2/4] roof-profile-guide.png'
$o = New-Bmp 980 430
$fT = New-F 14 -bold; $fP = New-F 10 -bold; $fA = New-F 9
T $o.G '屋顶体素化规则 · 02-voxel-style-guide.md §4 配图' 40 16 $fT '#1f1c1b'

# —— 面板 A：坡面举折阶梯 ——
$s = 12; $oxA = 80; $oyA = 320
Draw-Grid $o.G $s $oxA $oyA 40 20 5
VxRoof $o.G 2 2 8 3 $s $oxA $oyA                       # 檐口平出
VxRoof $o.G 10 5 6 2 $s $oxA $oyA                      # 下段
VxRoof $o.G 16 7 5 2 $s $oxA $oyA                      # 中段
VxRoof $o.G 21 9 4 2 $s $oxA $oyA
VxRoof $o.G 25 11 3 2 $s $oxA $oyA                     # 上段
VxRoof $o.G 28 13 8 3 $s $oxA $oyA                     # 正脊
Vx $o.G 28 16 8 1 $script:C['灰塑·亮'] $s $oxA $oyA    # 灰塑脊带
T $o.G '檐口平出 3~4 格' ($oxA + 0) ($oyA + 8) $fA '#666666'
T $o.G '下段 升2/收3' ($oxA + 9 * $s) ($oyA - 8.6 * $s) $fA '#666666'
T $o.G '中段 升2/收2' ($oxA + 15.2 * $s) ($oyA - 11 * $s) $fA '#666666'
T $o.G '上段 升2/收1' ($oxA + 21.5 * $s) ($oyA - 13.6 * $s) $fA '#666666'
T $o.G '正脊留平 + 灰塑 1~2 格' ($oxA + 27 * $s) ($oyA - 18.4 * $s) $fA '#666666'
TC $o.G '① 坡面 · 举折阶梯（剖面）' ($oxA + 20 * $s) ($oyA + 34) $fP '#1f1c1b'

# —— 面板 B：角部起翘（阶梯向上、向外）——
$s = 12; $oxB = 600; $oyB = 300
Draw-Grid $o.G $s $oxB $oyB 30 20 5
VxRoof $o.G 6 10 22 3 $s $oxB $oyB                     # 檐口
VxRoof $o.G 4 12 2 2 $s $oxB $oyB                      # 起翘三步（向上升）
VxRoof $o.G 2 14 2 2 $s $oxB $oyB
VxRoof $o.G 0 16 2 2 $s $oxB $oyB
Vx $o.G 0 13 2 2 $script:C['金·主体'] $s $oxB $oyB     # 风铃（悬于角尖下方，留1格空气）
T $o.G '每步：升1格 · 外移1格 × 3步；上层檐角步数递减 4→3→3→2' ($oxB - 20) ($oyB + 8) $fA '#666666'
T $o.G '角尖下挂风铃（间隔 1 格）' ($oxB - 20) ($oyB + 24) $fA '#666666'
TC $o.G '② 檐角 · 起翘与风铃（正视）' ($oxB + 14 * $s) ($oyB + 46) $fP '#1f1c1b'
Save-Png $o 'roof-profile-guide.png'

# ============================================================
# 图 3/4：carving-roundel-sample.png（团窠花板样例）
# ============================================================
Write-Host '[3/4] carving-roundel-sample.png'
$s = 13; $oxC = 60; $oyC = 470
$o = New-Bmp 500 540
$fT = New-F 14 -bold; $fA = New-F 9
T $o.G '团窠花板 · 体素样例（LOD-A 主模型精度）' 40 16 $fT '#1f1c1b'
Vx $o.G -2 -2 32 32 $script:C['栗木格栅'] $s $oxC $oyC          # 木框
for ($y = 0; $y -lt 28; $y++) {
  for ($x = 0; $x -lt 28; $x++) {
    $hex = if ((($x + $y) % 2) -eq 0) { '#211d1b' } else { '#26211f' }
    Vx $o.G $x $y 1 1 $hex $s $oxC $oyC
  }
}
VxRoundel $o.G 14 14 10.5 $s $oxC $oyC                      # 描金八边环 + 实心花心
# 四角回纹钩
foreach ($p in @(@(3, 3, 1, 1), @(24, 3, -1, 1), @(3, 24, 1, -1), @(24, 24, -1, -1))) {
  $bx = $p[0]; $by = $p[1]; $dx = $p[2]; $dy = $p[3]
  for ($k = 0; $k -lt 3; $k++) { Vx $o.G ($bx + $k * $dx) $by 1 1 $script:C['金·主体'] $s $oxC $oyC }
  for ($k = 0; $k -lt 3; $k++) { Vx $o.G $bx ($by + $k * $dy) 1 1 $script:C['金·主体'] $s $oxC $oyC }
}
T $o.G '构成：黑漆底(微棋盘格) · 描金八边环(r≈10) · 实心花心 · 四角回纹钩 · 栗木框' 40 492 $fA '#666666'
T $o.G '判定：缩至 25% 后仍可辨「黑底金团」；对应照片 reference/gate-front-01.jpg' 40 510 $fA '#999999'
Save-Png $o 'carving-roundel-sample.png'

# ============================================================
# 图 4/4：elevation-guide.png（大门立面体素参考）
# ============================================================
Write-Host '[4/4] elevation-guide.png'
$s = 5; $oxE = 40; $oyE = 660
$o = New-Bmp 880 810
$fT = New-F 15 -bold; $fS = New-F 8; $fL = New-F 9
T $o.G '武圣宫大门 · 体素立面参考图（1 vx = 0.2 m · 纵向层次示意）' 40 16 $fT '#1f1c1b'
T $o.G '依据 02-voxel-style-guide §3/§8 · 基准照片 reference/salt-museum-2009.jpg · 生成 tools/gen-samples.ps1' 40 46 $fS '#999999'

# ---- 台基 ----
Vx $o.G 0 0 160 4 $script:C['砂岩·亮'] $s $oxE $oyE
Vx $o.G 0 3 160 1 $script:C['砂岩·暗'] $s $oxE $oyE
Vx $o.G 66 0 28 1 $script:C['砂岩·暗'] $s $oxE $oyE
Vx $o.G 68 1 24 1 $script:C['砂岩·亮'] $s $oxE $oyE
Vx $o.G 70 2 20 1 $script:C['砂岩·暗'] $s $oxE $oyE
Vx $o.G 72 3 16 1 $script:C['砂岩·亮'] $s $oxE $oyE

# ---- 两翼廊庑（左 x0..28，右镜像）----
foreach ($m in @({ param($f, $a) & $f @a }, { })) { }  # 占位（镜像直接用 VxM）
Vx $o.G 0 5 28 13 $script:C['白灰墙'] $s $oxE $oyE
VxM $o.G 0 5 28 13 $script:C['白灰墙'] $s $oxE $oyE
Vx $o.G 4 8 20 8 $script:C['栗木格栅'] $s $oxE $oyE
VxM $o.G 4 8 20 8 $script:C['栗木格栅'] $s $oxE $oyE
foreach ($xx in @(4, 8, 12, 16, 20)) {
  Vx $o.G $xx 8 1 8 $script:C['栗木·受光'] $s $oxE $oyE; VxM $o.G $xx 8 1 8 $script:C['栗木·受光'] $s $oxE $oyE
}
foreach ($yy in @(8, 12, 16)) {
  Vx $o.G 4 $yy 20 1 $script:C['栗木·受光'] $s $oxE $oyE; VxM $o.G 4 $yy 20 1 $script:C['栗木·受光'] $s $oxE $oyE
}
VxRoof $o.G 0 18 30 3 $s $oxE $oyE;  VxRoofM $o.G 0 18 30 3 $s $oxE $oyE
VxRoof $o.G 22 21 8 2 $s $oxE $oyE;  VxRoofM $o.G 22 21 8 2 $s $oxE $oyE

# ---- 次间（左 x28..52，右镜像）----
Vx $o.G 28 5 24 19 $script:C['白灰墙'] $s $oxE $oyE; VxM $o.G 28 5 24 19 $script:C['白灰墙'] $s $oxE $oyE
Vx $o.G 34 8 12 13 $script:C['栗木格栅'] $s $oxE $oyE; VxM $o.G 34 8 12 13 $script:C['栗木格栅'] $s $oxE $oyE
foreach ($xx in @(34, 37, 40, 43)) {
  Vx $o.G $xx 8 1 13 $script:C['栗木·受光'] $s $oxE $oyE; VxM $o.G $xx 8 1 13 $script:C['栗木·受光'] $s $oxE $oyE
}
foreach ($yy in @(8, 12, 16, 20)) {
  Vx $o.G 34 $yy 12 1 $script:C['栗木·受光'] $s $oxE $oyE; VxM $o.G 34 $yy 12 1 $script:C['栗木·受光'] $s $oxE $oyE
}
VxRoof $o.G 24 24 32 3 $s $oxE $oyE; VxRoofM $o.G 24 24 32 3 $s $oxE $oyE
VxRoof $o.G 30 27 22 2 $s $oxE $oyE; VxRoofM $o.G 30 27 22 2 $s $oxE $oyE
VxRoof $o.G 36 29 16 2 $s $oxE $oyE; VxRoofM $o.G 36 29 16 2 $s $oxE $oyE
VxRoof $o.G 42 31 10 2 $s $oxE $oyE; VxRoofM $o.G 42 31 10 2 $s $oxE $oyE
VxRoof $o.G 22 27 2 2 $s $oxE $oyE;  VxRoofM $o.G 22 27 2 2 $s $oxE $oyE
VxRoof $o.G 20 29 2 2 $s $oxE $oyE;  VxRoofM $o.G 20 29 2 2 $s $oxE $oyE

# ---- 中央底层：白墙 / 大门 / 彩画带 / 大匾 / 红柱 ----
Vx $o.G 52 5 16 25 $script:C['白灰墙'] $s $oxE $oyE; Vx $o.G 92 5 16 25 $script:C['白灰墙'] $s $oxE $oyE
foreach ($xx in @(52, 67, 92, 107)) { Vx $o.G $xx 5 1 25 $script:C['栗木格栅'] $s $oxE $oyE }
Vx $o.G 68 5 24 17 $script:C['黑漆·主体'] $s $oxE $oyE
Vx $o.G 75 5 1 17 $script:C['栗木·受光'] $s $oxE $oyE; Vx $o.G 84 5 1 17 $script:C['栗木·受光'] $s $oxE $oyE
Vx $o.G 73 12 2 2 $script:C['金·高光'] $s $oxE $oyE; Vx $o.G 85 12 2 2 $script:C['金·高光'] $s $oxE $oyE
Vx $o.G 64 23 32 4 $script:C['石青·彩画'] $s $oxE $oyE
Vx $o.G 74 23 12 4 $script:C['金·高光'] $s $oxE $oyE; Vx $o.G 79 24 2 2 $script:C['石青·彩画'] $s $oxE $oyE
foreach ($fx in @(66, 70, 88, 92)) {
  Vx $o.G $fx 24 2 2 $script:C['白灰墙'] $s $oxE $oyE
  Vx $o.G ($fx + 1) 25 1 1 $script:C['金·主体'] $s $oxE $oyE
}
Vx $o.G 60 28 40 8 $script:C['黑漆·主体'] $s $oxE $oyE
Vx $o.G 60 35 40 1 $script:C['金·高光'] $s $oxE $oyE; Vx $o.G 60 28 40 1 $script:C['金·高光'] $s $oxE $oyE
for ($i = 0; $i -lt 9; $i++) { Vx $o.G (62 + $i * 4) 30 3 4 $script:C['金·主体'] $s $oxE $oyE }
Vx $o.G 54 5 4 25 $script:C['朱红·柱'] $s $oxE $oyE; VxM $o.G 54 5 4 25 $script:C['朱红·柱'] $s $oxE $oyE
Vx $o.G 53 4 6 2 $script:C['砂岩·暗'] $s $oxE $oyE;  VxM $o.G 53 4 6 2 $script:C['砂岩·暗'] $s $oxE $oyE

# ---- 石狮（左 xl=55，右镜像）----
function VxLion($g, [int]$xl, [int]$s, [int]$ox, [int]$oy) {
  Vx $g $xl 4 10 3 $script:C['砂岩·暗'] $s $ox $oy
  Vx $g ($xl + 1) 5 8 1 $script:C['砂岩·亮'] $s $ox $oy
  Vx $g ($xl + 2) 7 6 5 $script:C['砂岩·亮'] $s $ox $oy
  Vx $g ($xl + 2) 7 2 3 $script:C['砂岩·暗'] $s $ox $oy
  Vx $g ($xl + 3) 11 4 4 $script:C['砂岩·亮'] $s $ox $oy
  foreach ($d in @(@(3, 15), @(6, 15), @(4, 15), @(3, 12), @(6, 12))) {
    Vx $g ($xl + $d[0]) $d[1] 1 1 $script:C['砂岩·暗'] $s $ox $oy
  }
  Vx $g ($xl + 7) 9 1 2 $script:C['砂岩·暗'] $s $ox $oy
}
VxLion $o.G 55 $s $oxE $oyE; VxLion $o.G 95 $s $oxE $oyE

# ---- 中央塔 T1~T4 ----
# T1 檐
VxRoof $o.G 44 35 72 3 $s $oxE $oyE
VxRoof $o.G 50 38 60 2 $s $oxE $oyE; VxRoof $o.G 56 40 48 2 $s $oxE $oyE
VxRoof $o.G 62 42 36 2 $s $oxE $oyE; VxRoof $o.G 68 44 24 2 $s $oxE $oyE
Vx $o.G 68 46 24 1 $script:C['瓦·暗垄'] $s $oxE $oyE
VxRoof $o.G 42 38 2 2 $s $oxE $oyE; VxRoof $o.G 40 40 2 2 $s $oxE $oyE; VxRoof $o.G 38 42 2 2 $s $oxE $oyE
VxRoofM $o.G 42 38 2 2 $s $oxE $oyE; VxRoofM $o.G 40 40 2 2 $s $oxE $oyE; VxRoofM $o.G 38 42 2 2 $s $oxE $oyE
Vx $o.G 38 40 2 2 $script:C['金·主体'] $s $oxE $oyE; VxM $o.G 38 40 2 2 $script:C['金·主体'] $s $oxE $oyE
# T2 墙身 + 檐
Vx $o.G 62 47 36 14 $script:C['黑漆·主体'] $s $oxE $oyE
Vx $o.G 63 47 4 14 $script:C['朱红·柱'] $s $oxE $oyE; VxM $o.G 63 47 4 14 $script:C['朱红·柱'] $s $oxE $oyE
VxRoundel $o.G 71 54 4 $s $oxE $oyE; VxRoundel $o.G 80 54 5 $s $oxE $oyE; VxRoundel $o.G 89 54 4 $s $oxE $oyE
VxRoof $o.G 54 61 52 3 $s $oxE $oyE
VxRoof $o.G 60 64 40 2 $s $oxE $oyE; VxRoof $o.G 66 66 28 2 $s $oxE $oyE; VxRoof $o.G 72 68 16 2 $s $oxE $oyE
Vx $o.G 72 70 16 1 $script:C['瓦·暗垄'] $s $oxE $oyE
VxRoof $o.G 52 64 2 2 $s $oxE $oyE; VxRoof $o.G 50 66 2 2 $s $oxE $oyE
VxRoofM $o.G 52 64 2 2 $s $oxE $oyE; VxRoofM $o.G 50 66 2 2 $s $oxE $oyE
# T3 墙身 + 檐
Vx $o.G 68 71 24 14 $script:C['黑漆·主体'] $s $oxE $oyE
Vx $o.G 76 74 8 8 $script:C['栗木格栅'] $s $oxE $oyE
foreach ($xx in @(76, 79, 82)) { Vx $o.G $xx 74 1 8 $script:C['栗木·受光'] $s $oxE $oyE }
foreach ($yy in @(74, 77, 80)) { Vx $o.G 76 $yy 8 1 $script:C['栗木·受光'] $s $oxE $oyE }
VxRoundel $o.G 71 78 3 $s $oxE $oyE; VxRoundel $o.G 89 78 3 $s $oxE $oyE
VxRoof $o.G 60 85 40 3 $s $oxE $oyE
VxRoof $o.G 66 88 28 2 $s $oxE $oyE; VxRoof $o.G 72 90 16 2 $s $oxE $oyE
Vx $o.G 72 92 16 1 $script:C['瓦·暗垄'] $s $oxE $oyE
VxRoof $o.G 58 88 2 2 $s $oxE $oyE; VxRoof $o.G 56 90 2 2 $s $oxE $oyE
VxRoofM $o.G 58 88 2 2 $s $oxE $oyE; VxRoofM $o.G 56 90 2 2 $s $oxE $oyE
# T4 墙身 + 檐 + 脊
Vx $o.G 73 93 14 11 $script:C['黑漆·主体'] $s $oxE $oyE
Vx $o.G 74 93 2 11 $script:C['朱红·柱'] $s $oxE $oyE; VxM $o.G 74 93 2 11 $script:C['朱红·柱'] $s $oxE $oyE
VxRoundel $o.G 80 98 4 $s $oxE $oyE
VxRoof $o.G 67 104 26 3 $s $oxE $oyE
VxRoof $o.G 71 107 18 2 $s $oxE $oyE; VxRoof $o.G 75 109 10 2 $s $oxE $oyE
Vx $o.G 75 111 10 1 $script:C['瓦·暗垄'] $s $oxE $oyE
VxRoof $o.G 65 107 2 2 $s $oxE $oyE; VxRoofM $o.G 65 107 2 2 $s $oxE $oyE
Vx $o.G 73 112 14 2 $script:C['灰塑·亮'] $s $oxE $oyE
Vx $o.G 73 114 2 1 $script:C['灰塑·亮'] $s $oxE $oyE; VxM $o.G 73 114 2 1 $script:C['灰塑·亮'] $s $oxE $oyE
Vx $o.G 78 114 4 3 $script:C['灰塑·亮'] $s $oxE $oyE; Vx $o.G 79 117 2 1 $script:C['灰塑·亮'] $s $oxE $oyE

# ---- 网格与标注 ----
Draw-Grid $o.G $s $oxE $oyE 160 120 10
$fA = New-F 8
foreach ($mx in @(0, 40, 80, 120, 160)) {
  TC $o.G ("{0} m" -f ($mx * 0.2)) ($oxE + $mx * $s) ($oyE + 6) $fA '#999999'
}
foreach ($yy in @(0, 40, 80, 120)) { T $o.G ("{0}" -f $yy) ($oxE - 26) ($oyE - $yy * $s - 5) $fA '#bbbbbb' }

# ---- 图例 ----
$leg = @(
  @('瓦·暗垄', '瓦·亮垄'), @('黑漆·主体', '金·主体'), @('金·高光', '石青·彩画'),
  @('朱红·柱', '白灰墙'), @('灰塑·亮', '砂岩·亮'), @('砂岩·暗', '栗木格栅')
)
$ly = 700
for ($i = 0; $i -lt $leg.Count; $i++) {
  for ($j = 0; $j -lt $leg[$i].Count; $j++) {
    $nm = $leg[$i][$j]
    $cx = 40 + $i * 140 + $j * 68
    $o.G.FillRectangle((Get-Brush $script:PAL[$nm]), $cx, $ly, 14, 12)
    $o.G.DrawRectangle([System.Drawing.Pens]::Black, $cx, $ly, 14, 12)
    T $o.G $nm ($cx + 17) ($ly - 2) (New-F 8) '#555555'
  }
}
T $o.G '搭建顺序：台基→柱网门堂→石狮→T1檐→匾额墙身→T2~T4檐→脊饰→翘角风铃（详见 02 §8）' 40 726 $fS '#aaaaaa'
Save-Png $o 'elevation-guide.png'

Write-Host 'DONE.'
