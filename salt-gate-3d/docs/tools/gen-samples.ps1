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
# 同心圆宝相花团窠：黑漆方框 + 描金外框 + 3 层金环 + 中心花心 + 4 向十字花蕊 + 4 角回纹钩
# 用途：T2 中央大匾上方 / T4 中央主团窠（与照片「多层金环 + 十字」吻合）
function VxRoundelConcentric($g, [int]$cx, [int]$cy, [int]$w, [int]$h, [int]$r, [int]$s, [int]$ox, [int]$oy) {
  $x0 = $cx - [int]($w / 2); $y0 = $cy - [int]($h / 2)
  # 黑漆底 + 描金外框（4 边 1 格）
  Vx $g $x0 $y0 $w $h $script:C['黑漆·主体'] $s $ox $oy
  Vx $g $x0 $y0 $w 1 $script:C['金·主体'] $s $ox $oy
  Vx $g $x0 ($y0 + $h - 1) $w 1 $script:C['金·主体'] $s $ox $oy
  Vx $g $x0 ($y0 + 1) 1 ($h - 2) $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + $w - 1) ($y0 + 1) 1 ($h - 2) $script:C['金·主体'] $s $ox $oy
  # 3 层金环（外/中/内 交替 金·主体 / 金·高光 / 金·主体）
  $R = $r + 1
  for ($dy = -$R; $dy -le $R; $dy++) {
    for ($dx = -$R; $dx -le $R; $dx++) {
      $d = [Math]::Sqrt([double]($dx * $dx + $dy * $dy))
      $hex = $null
      if (($d -le $r) -and ($d -gt $r - 1.2)) { $hex = $script:C['金·主体'] }
      elseif (($d -le $r - 1.2) -and ($d -gt $r - 2.4)) { $hex = $script:C['金·高光'] }
      elseif (($d -le $r - 2.4) -and ($d -gt $r - 3.2)) { $hex = $script:C['金·主体'] }
      elseif (($d -le 1.0) -and ($d -gt 0)) { $hex = $script:C['金·高光'] }
      if ($hex) { Vx $g ($cx + $dx) ($cy + $dy) 1 1 $hex $s $ox $oy }
    }
  }
  # 4 向十字花蕊（金色短划，半径 r-3 处 4 个点）
  if ($r -ge 4) {
    Vx $g ($cx - 3) $cy 1 1 $script:C['金·高光'] $s $ox $oy
    Vx $g ($cx + 3) $cy 1 1 $script:C['金·高光'] $s $ox $oy
    Vx $g $cx ($cy - 3) 1 1 $script:C['金·高光'] $s $ox $oy
    Vx $g $cx ($cy + 3) 1 1 $script:C['金·高光'] $s $ox $oy
  }
  # 4 角回纹钩（2 格 L 形）
  $hc = 2
  Vx $g ($x0 + 1) ($y0 + 1) $hc 1 $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + 1) ($y0 + 1) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + $w - 1 - $hc) ($y0 + 1) $hc 1 $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + $w - 2) ($y0 + 1) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + 1) ($y0 + $h - 2) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + 1) ($y0 + $h - 1 - $hc) $hc 1 $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + $w - 2) ($y0 + $h - 2) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + $w - 1 - $hc) ($y0 + $h - 1 - $hc) $hc 1 $script:C['金·主体'] $s $ox $oy
}
# 菱形花卉团窠花板：黑漆方框 + 描金外框 + 大金色菱花（外接菱形）+ 中心深色圆 + 5 瓣金花心 + 4 角回纹钩
# 用途：T2/T3 翼侧主花板（与照片「黑底大金菱花」最吻合）
function VxRoundelDiamond($g, [int]$cx, [int]$cy, [int]$w, [int]$h, [int]$s, [int]$ox, [int]$oy) {
  $x0 = $cx - [int]($w / 2); $y0 = $cy - [int]($h / 2)
  $x1 = $x0 + $w - 1; $y1 = $y0 + $h - 1
  # 黑漆底
  Vx $g $x0 $y0 $w $h $script:C['黑漆·主体'] $s $ox $oy
  # 描金外框（4 边 1 格）
  Vx $g $x0 $y0 $w 1 $script:C['金·主体'] $s $ox $oy
  Vx $g $x0 $y1 $w 1 $script:C['金·主体'] $s $ox $oy
  Vx $g $x0 ($y0 + 1) 1 ($h - 2) $script:C['金·主体'] $s $ox $oy
  Vx $g $x1 ($y0 + 1) 1 ($h - 2) $script:C['金·主体'] $s $ox $oy
  # 大金色菱花（外接菱形，每行按 |y-cx_y|/h 比例收宽）
  $inset = 2
  $xL = $x0 + $inset; $xR = $x1 - $inset
  $yT = $y0 + $inset; $yB = $y1 - $inset
  $halfW = [int](($xR - $xL) / 2); $halfH = [int](($yB - $yT) / 2)
  for ($y = $yT; $y -le $yB; $y++) {
    $ratio = if ($halfH -gt 0) { 1.0 - [Math]::Abs([double]($y - $cy) / $halfH) } else { 1.0 }
    if ($ratio -lt 0) { $ratio = 0 }
    $rowHalf = [int][Math]::Floor($halfW * $ratio)
    if ($rowHalf -ge 0) {
      Vx $g ($cx - $rowHalf) $y (2 * $rowHalf + 1) 1 $script:C['金·主体'] $s $ox $oy
    }
  }
  # 中心深色圆（菱花中心挖空，露黑漆底）
  $rC = [int][Math]::Min($w, $h) / 5
  if ($rC -ge 1) {
    for ($dy = -$rC; $dy -le $rC; $dy++) {
      for ($dx = -$rC; $dx -le $rC; $dx++) {
        if ($dx * $dx + $dy * $dy -le $rC * $rC) {
          Vx $g ($cx + $dx) ($cy + $dy) 1 1 $script:C['黑漆·主体'] $s $ox $oy
        }
      }
    }
  }
  # 5 瓣金花心（中心 1 + 4 向短划）
  Vx $g $cx $cy 1 1 $script:C['金·高光'] $s $ox $oy
  Vx $g ($cx - 1) $cy 1 1 $script:C['金·高光'] $s $ox $oy
  Vx $g ($cx + 1) $cy 1 1 $script:C['金·高光'] $s $ox $oy
  Vx $g $cx ($cy - 1) 1 1 $script:C['金·高光'] $s $ox $oy
  Vx $g $cx ($cy + 1) 1 1 $script:C['金·高光'] $s $ox $oy
  # 4 角回纹钩
  $hc = 2
  Vx $g ($x0 + 1) ($y0 + 1) $hc 1 $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + 1) ($y0 + 1) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + $w - 1 - $hc) ($y0 + 1) $hc 1 $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + $w - 2) ($y0 + 1) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + 1) ($y0 + $h - 2) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + 1) ($y0 + $h - 1 - $hc) $hc 1 $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + $w - 2) ($y0 + $h - 2) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + $w - 1 - $hc) ($y0 + $h - 1 - $hc) $hc 1 $script:C['金·主体'] $s $ox $oy
}
# 矩形花卉条：黑漆方框 + 描金外框 + 联珠纹（一排金点）+ 中心小菱形
# 用途：T3 翼侧小方板 / 上下层之间装饰带（与照片「联珠纹小方板」吻合）
function VxPanelBead($g, [int]$x, [int]$y, [int]$w, [int]$h, [int]$s, [int]$ox, [int]$oy) {
  $x1 = $x + $w - 1; $y1 = $y + $h - 1
  # 黑漆底 + 描金外框
  Vx $g $x $y $w $h $script:C['黑漆·主体'] $s $ox $oy
  Vx $g $x $y $w 1 $script:C['金·主体'] $s $ox $oy
  Vx $g $x $y1 $w 1 $script:C['金·主体'] $s $ox $oy
  Vx $g $x $y 1 $h $script:C['金·主体'] $s $ox $oy
  Vx $g $x1 $y 1 $h $script:C['金·主体'] $s $ox $oy
  # 联珠纹：上 1 行 + 下 1 行小金点
  for ($xx = $x + 1; $xx -lt $x1; $xx++) {
    Vx $g $xx ($y + 1) 1 1 $script:C['金·主体'] $s $ox $oy
    Vx $g $xx ($y1 - 1) 1 1 $script:C['金·主体'] $s $ox $oy
  }
  # 中心小菱形（高度 ≥ 4 才画）
  if ($h -ge 4) {
    $cx = $x + [int]($w / 2); $cy = $y + [int]($h / 2)
    $dH = [int]($h / 4)
    for ($dy = -$dH; $dy -le $dH; $dy++) {
      $halfRow = $dH - [Math]::Abs($dy)
      if ($halfRow -ge 0) {
        Vx $g ($cx - $halfRow) ($cy + $dy) (2 * $halfRow + 1) 1 $script:C['金·高光'] $s $ox $oy
      }
    }
  }
}
# 弯曲檐口（中央平、两端按幂函数平滑升起；厚度沿弧段全程连续收分至 1——是"主体逐渐向外延伸变细"，不是到角端才变薄）
# $cx=中轴, $halfW=半宽, $flat=中央平段半宽, $y0=中央顶缘基线, $thick=中央厚度, $rise=角端总升起
function VxCurvedEave($g, [int]$cx, [int]$halfW, [int]$flat, [int]$y0, [int]$thick, [int]$rise, [int]$s, [int]$ox, [int]$oy) {
  $prevTop = -999
  for ($x = $cx - $halfW; $x -le $cx + $halfW; $x++) {
    $dx = [Math]::Abs($x - $cx)
    if ($dx -le $flat) { $u = [double]0 } else { $u = [double]($dx - $flat) / [double]($halfW - $flat) }
    $topY = $y0 + [int][Math]::Round($rise * $u * $u)
    $h = [Math]::Max(1, [int][Math]::Round($thick * (1 - $u)))   # 厚度随 u 线性收分：thick → 1
    if ($topY -gt $prevTop) { $h = [Math]::Max($h, $topY - $prevTop + 1) }  # 上升段保证与前列行区间相交（4 连通）
    $prevTop = $topY
    VxRoof $g $x ($topY - $h + 1) 1 $h $s $ox $oy
  }
}
# 翘角凤头（檐带弧端的上翘弧钩：坡度先缓后陡、全程 4 连通，不是 45° 斜杆）
# $dir='L' 左角 / 'R' 右角；$rise 须与同层 VxCurvedEave/VxEaveBand 一致
function VxEaveTip($g, [int]$cx, [int]$halfW, [int]$flat, [int]$y0, [string]$dir, [int]$rise, [int]$s, [int]$ox, [int]$oy) {
  $sign = if ($dir -eq 'L') { -1 } else { 1 }
  $cornerX = $cx + $sign * $halfW
  $topY = $y0 + $rise
  # 三段渐进上翘：每段与相邻段共享一行（4 连通），顶缘 +1 → +3 → +4，先缓后陡再回勾
  VxRoof $g ($cornerX + $sign) $topY 1 2 $s $ox $oy                                   # rows topY..+1
  VxRoof $g ($cornerX + $sign * 2) ($topY + 1) 1 3 $s $ox $oy                         # rows +1..+3
  Vx $g ($cornerX + $sign * 3) ($topY + 3) 1 2 $script:C['金·主体'] $s $ox $oy        # rows +3..+4 金尖
}
# 檐带（本层主结构）：花板嵌于檐带正中——上下均有檐体包裹；两端沿弧线延伸、厚度全程连续收分成翘角
# $y0=中央顶缘基线, $bandH=中央檐带厚；花板由调用方画在带内（cy = y0 - floor(bandH/2)）
function VxEaveBand($g, [int]$cx, [int]$halfW, [int]$flat, [int]$y0, [int]$bandH, [int]$rise, [int]$s, [int]$ox, [int]$oy) {
  $prevTop = -999
  for ($x = $cx - $halfW; $x -le $cx + $halfW; $x++) {
    $dx = [Math]::Abs($x - $cx)
    if ($dx -le $flat) { $u = [double]0 } else { $u = [double]($dx - $flat) / [double]($halfW - $flat) }
    $topY = $y0 + [int][Math]::Round($rise * $u * $u)
    $h = [Math]::Max(1, [int][Math]::Round($bandH * (1 - $u)))   # 带厚随 u 连续收分：bandH → 1
    if ($topY -gt $prevTop) { $h = [Math]::Max($h, $topY - $prevTop + 1) }  # 上升段保证与前列行区间相交（4 连通）
    $prevTop = $topY
    VxRoof $g $x ($topY - $h + 1) 1 $h $s $ox $oy
  }
}
# 团窠花板 + 两侧小翼角（与主檐同语汇：短檐身 + 2 段弧形上扬 + 金尖，使图案被两侧屋檐"包裹"）
# 左侧小翼角：xFlank=面板左缘外 1 格，向左外伸 2 段弧形，向上收分
# 右侧对称
function VxPanelWithEaves($g, [int]$cx, [int]$cy, [int]$w, [int]$h, [int]$s, [int]$ox, [int]$oy) {
  # 1) 面板本体
  VxPanelSym $g $cx $cy $w $h $s $ox $oy
  # 2) 两侧小翼角：垂直短柱（瓦垄色）+ 2 段弧形上扬 + 金尖
  $yMid = $cy                                              # 小翼角 soffit 基线
  foreach ($dir in @('L', 'R')) {
    $sign = if ($dir -eq 'L') { -1 } else { 1 }
    $xFlank = $cx + $sign * ($w / 2 + 1)                   # 紧贴面板外缘 1 格
    # 垂直短柱：1 宽 × 2 高（瓦垄色），作为小翼角的"檐身"
    VxRoof $g $xFlank ($yMid - 1) 1 2 $s $ox $oy
    # 2 段弧形上扬：每段 1 宽 × 2 高，soffit 逐段 +1
    for ($k = 1; $k -le 2; $k++) {
      $x = $xFlank + $sign * $k
      $bottom = $yMid + 1 + ($k - 1)
      VxRoof $g $x $bottom 1 2 $s $ox $oy
    }
    # 小凤头金尖
    Vx $g ($xFlank + $sign * 2) ($yMid + 3) 1 1 $script:C['金·主体'] $s $ox $oy
  }
}
# 中心对称团窠花板（任意 w×h；外金框 + 内金框 + 中心菱形 + 5 瓣花心 + 四角回纹钩，全程 D4 对称）
# 用途：T4 正方形 / T3 竖矩形 / T2 横矩形（按 w,h 决定形状）
function VxPanelSym($g, [int]$cx, [int]$cy, [int]$w, [int]$h, [int]$s, [int]$ox, [int]$oy) {
  $x0 = $cx - [int]($w / 2); $x1 = $x0 + $w - 1
  $y0 = $cy - [int]($h / 2); $y1 = $y0 + $h - 1
  Vx $g $x0 $y0 $w $h $script:C['黑漆·主体'] $s $ox $oy                 # 黑漆底
  Vx $g $x0 $y0 $w 1 $script:C['金·主体'] $s $ox $oy                    # 外框
  Vx $g $x0 $y1 $w 1 $script:C['金·主体'] $s $ox $oy
  Vx $g $x0 ($y0 + 1) 1 ($h - 2) $script:C['金·主体'] $s $ox $oy
  Vx $g $x1 ($y0 + 1) 1 ($h - 2) $script:C['金·主体'] $s $ox $oy
  $ix0 = $x0 + 2; $ix1 = $x1 - 2; $iy0 = $y0 + 2; $iy1 = $y1 - 2        # 内金框
  if ($ix1 -ge $ix0 -and $iy1 -ge $iy0) {
    Vx $g $ix0 $iy0 ($ix1 - $ix0 + 1) 1 $script:C['金·高光'] $s $ox $oy
    Vx $g $ix0 $iy1 ($ix1 - $ix0 + 1) 1 $script:C['金·高光'] $s $ox $oy
    Vx $g $ix0 ($iy0 + 1) 1 ($iy1 - $iy0 - 1) $script:C['金·高光'] $s $ox $oy
    Vx $g $ix1 ($iy0 + 1) 1 ($iy1 - $iy0 - 1) $script:C['金·高光'] $s $ox $oy
  }
  $ax0 = $x0 + 3; $ax1 = $x1 - 3; $ay0 = $y0 + 3; $ay1 = $y1 - 3         # 中心菱形
  $halfW = [int](($ax1 - $ax0) / 2); $halfH = [int](($ay1 - $ay0) / 2)
  if ($halfW -ge 0 -and $halfH -ge 0) {
    for ($y = $ay0; $y -le $ay1; $y++) {
      $ry = if ($halfH -gt 0) { [Math]::Abs([double]($y - $cy) / $halfH) } else { 0 }
      if ($ry -gt 1) { continue }
      $rowHalf = [int][Math]::Floor($halfW * (1 - $ry))
      if ($rowHalf -ge 0) { Vx $g ($cx - $rowHalf) $y (2 * $rowHalf + 1) 1 $script:C['金·主体'] $s $ox $oy }
    }
  }
  Vx $g $cx $cy 1 1 $script:C['金·高光'] $s $ox $oy                      # 5 瓣花心
  Vx $g ($cx - 1) $cy 1 1 $script:C['金·高光'] $s $ox $oy
  Vx $g ($cx + 1) $cy 1 1 $script:C['金·高光'] $s $ox $oy
  Vx $g $cx ($cy - 1) 1 1 $script:C['金·高光'] $s $ox $oy
  Vx $g $cx ($cy + 1) 1 1 $script:C['金·高光'] $s $ox $oy
  $hc = 2                                                            # 四角回纹钩（点对称）
  Vx $g ($x0 + 1) ($y0 + 1) $hc 1 $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + 1) ($y0 + 1) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x1 - $hc + 1) ($y0 + 1) $hc 1 $script:C['金·主体'] $s $ox $oy
  Vx $g $x1 ($y0 + 1) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + 1) ($y1 - $hc + 1) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x0 + 1) $y1 $hc 1 $script:C['金·主体'] $s $ox $oy
  Vx $g $x1 ($y1 - $hc + 1) 1 $hc $script:C['金·主体'] $s $ox $oy
  Vx $g ($x1 - $hc + 1) $y1 $hc 1 $script:C['金·主体'] $s $ox $oy
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

# —— 面板 B：角部起翘（平滑弧，中央平、两端升起至翘角，soffit 同步升起收薄）——
$s = 12; $oxB = 600; $oyB = 300
Draw-Grid $o.G $s $oxB $oyB 30 20 5
# 弯曲檐口示意（cx=15, halfW=13, flat=7, y0=10, thick=3, rise=6）
VxCurvedEave $o.G 15 13 7 10 3 6 $s $oxB $oyB
# 弧形上扬细尖凤头（3 段 1×2 翼片向外延伸 + 金尖）
VxEaveTip $o.G 15 13 7 10 'L' 6 $s $oxB $oyB
T $o.G '中央平 · 两端按弧线平滑升起至翘角（soffit 同步升·收薄·无风铃）' ($oxB - 20) ($oyB + 8) $fA '#666666'
T $o.G '弧形凤头：3 段 1×2 翼片 soffit 逐段 +1 + 金尖' ($oxB - 20) ($oyB + 24) $fA '#666666'
TC $o.G '② 檐角 · 平滑起翘（正视）' ($oxB + 14 * $s) ($oyB + 46) $fP '#1f1c1b'
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
T $o.G '依据 02-voxel-style-guide §3/§8 · 基准照片 reference/{salt-museum-2009, front}.jpg · 生成 tools/gen-samples.ps1' 40 46 $fS '#999999'

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
# 翼檐边梁（x4..5, y8..17）：把檩条连成整体并搭接到翼檐口（y18），消除悬空
VxRoof $o.G 4 8 2 10 $s $oxE $oyE; VxRoofM $o.G 4 8 2 10 $s $oxE $oyE
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
VxRoof $o.G 22 26 2 3 $s $oxE $oyE;  VxRoofM $o.G 22 26 2 3 $s $oxE $oyE
VxRoof $o.G 20 28 2 3 $s $oxE $oyE;  VxRoofM $o.G 20 28 2 3 $s $oxE $oyE

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

# ---- 中央塔 T1~T4（2026-08-23 按 front.jpg 复校：apex 由 ~30° 调到 ~60°）----
# 设计原则：
#   · 整体加宽 T1~T4 檐底 + 墙身（特别是 T3/T4 原版过窄）
#   · 宝顶做立体阶梯（3 段收分），不再是一根针
#   · 每层墙顶加 2 格高斗栱带（黑漆底 + 金点 2×2）
#   · T2 中央加大匾（黑漆描金），T3 中央格栅放大，T4 单大团窠
# 坐标系：x∈[0,160] 总面宽，y 向上，镜像轴 x=80

# ====== T1 墙身（含斗栱带，y=33..35） + 1st 檐（y=35..47）======
# 墙身：x=24..136（112 宽），位于次间 + 中央门堂之上
Vx $o.G 24 33 112 2 $script:C['黑漆·主体'] $s $oxE $oyE                          # 斗栱带 2 格
foreach ($xx in @(28, 36, 44, 52, 60, 68, 76, 84, 92, 100, 108, 116, 124, 132)) {
  Vx $o.G $xx 33 2 2 $script:C['金·主体'] $s $oxE $oyE                           # 斗栱金点
}
# 1st 檐带：无花板，纯檐体（rows 35..46 中央，紧贴斗栱带；两端弧线上扬、厚度全程收分成翘角）
VxEaveBand $o.G 80 56 34 46 12 5 $s $oxE $oyE
VxEaveTip $o.G 80 56 34 46 'L' 5 $s $oxE $oyE
VxEaveTip $o.G 80 56 34 46 'R' 5 $s $oxE $oyE

# ====== T2 层：矮墙身（y=47..49） + 2nd 檐带（rows 50..61 中央，花板嵌于带中央）======
# 矮墙身（黑漆，承接下层与檐带）
Vx $o.G 48 47 64 3 $script:C['黑漆·主体'] $s $oxE $oyE
# 2nd 檐带：中央 rows 50..61；两端弧线上扬、厚度连续收分成翘角
VxEaveBand $o.G 80 44 30 61 12 6 $s $oxE $oyE
VxEaveTip $o.G 80 44 30 61 'L' 6 $s $oxE $oyE
VxEaveTip $o.G 80 44 30 61 'R' 6 $s $oxE $oyE
# 花板嵌于檐带正中（bandH=12 → cy=55；上下各留 ≥2 行檐体）
# 中央大匾（黑漆描金，24×7 横矩形）
Vx $o.G 68 52 24 7 $script:C['黑漆·主体'] $s $oxE $oyE
Vx $o.G 68 52 24 1 $script:C['金·高光'] $s $oxE $oyE                              # 匾顶金线
Vx $o.G 68 58 24 1 $script:C['金·高光'] $s $oxE $oyE                              # 匾底金线
for ($i = 0; $i -lt 9; $i++) {                                                    # 9 字位金色短划
  Vx $o.G (70 + $i * 2) 54 1 3 $script:C['金·主体'] $s $oxE $oyE
}
# 左右团窠（12×7 横矩形中心对称花板；T2 = 横矩形主题）
VxPanelSym $o.G 58 55 12 7 $s $oxE $oyE
VxPanelSym $o.G 102 55 12 7 $s $oxE $oyE

# ====== T3 层：墙身（y=62..73，承接 T2 檐带顶、托起 3rd 檐带——消除层间悬空） ======
Vx $o.G 52 62 56 12 $script:C['黑漆·主体'] $s $oxE $oyE
# 3rd 檐带：中央 rows 73..85；两端弧线上扬、厚度连续收分成翘角
VxEaveBand $o.G 80 38 26 85 13 5 $s $oxE $oyE
VxEaveTip $o.G 80 38 26 85 'L' 5 $s $oxE $oyE
VxEaveTip $o.G 80 38 26 85 'R' 5 $s $oxE $oyE
# 花板嵌于檐带正中（bandH=13 → cy=79；上下各留 ≥2 行檐体）
# 中央团窠（8×9 竖矩形中心对称花板；T3 = 竖矩形主题）
VxPanelSym $o.G 80 79 8 9 $s $oxE $oyE
# 左右团窠（6×7 竖向小中心对称花板，与中央呼应）
VxPanelSym $o.G 57 79 6 7 $s $oxE $oyE
VxPanelSym $o.G 103 79 6 7 $s $oxE $oyE

# ====== T4 层：墙身（y=86..93，承接 T3 檐带顶、托起 4th 檐带——消除层间悬空） ======
Vx $o.G 58 86 44 8 $script:C['黑漆·主体'] $s $oxE $oyE
# 4th 檐带：中央 rows 93..107；两端弧线上扬、厚度连续收分成翘角
VxEaveBand $o.G 80 30 20 107 15 5 $s $oxE $oyE
VxEaveTip $o.G 80 30 20 107 'L' 5 $s $oxE $oyE
VxEaveTip $o.G 80 30 20 107 'R' 5 $s $oxE $oyE
# 花板嵌于檐带正中（bandH=15 → cy=101，PS [int] 圆整后 rows 95..105；上下各留 2 行檐体）
# 中央大团窠（11×11 正方形中心对称花板；T4 = 正方形主题）
VxPanelSym $o.G 80 101 11 11 $s $oxE $oyE

# ====== 顶：灰塑正脊 + 鸱吻 + 立体宝顶（y=108..118）======
# 顶柱（黑漆，衔接 T4 檐带顶缘 y=107 与正脊 y=112）
Vx $o.G 72 108 16 4 $script:C['黑漆·主体'] $s $oxE $oyE
# 灰塑正脊（浅亮色，2 格高）
Vx $o.G 56 112 48 2 $script:C['灰塑·亮'] $s $oxE $oyE
# 鸱吻（脊两端阶梯收头，4 宽 × 3 高）
foreach ($side in @('L', 'R')) {
  $xs = if ($side -eq 'L') { 56 } else { 96 }
  $xm = if ($side -eq 'L') { 138 } else { 18 }  # mirror
  Vx $o.G $xs 114 4 1 $script:C['灰塑·亮'] $s $oxE $oyE
  Vx $o.G ($xs + 1) 115 2 1 $script:C['灰塑·亮'] $s $oxE $oyE
}
# 立体宝顶：3 段阶梯收分（16 → 12 → 8 → 4 宽）
Vx $o.G 72 114 16 1 $script:C['灰塑·亮'] $s $oxE $oyE
Vx $o.G 74 115 12 1 $script:C['灰塑·亮'] $s $oxE $oyE
Vx $o.G 76 116 8  1 $script:C['灰塑·亮'] $s $oxE $oyE
Vx $o.G 78 117 4  1 $script:C['灰塑·亮'] $s $oxE $oyE
# 宝顶基座（黑漆柱顶 + 金色嵌片）
Vx $o.G 70 112 20 2 $script:C['黑漆·主体'] $s $oxE $oyE
foreach ($xx in @(72, 78, 84, 90)) { Vx $o.G $xx 112 2 1 $script:C['金·高光'] $s $oxE $oyE }

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
T $o.G '搭建顺序：台基→柱网门堂→石狮→T1檐→匾额墙身→T2~T4檐→脊饰→翘角凤头（详见 02 §8）' 40 726 $fS '#aaaaaa'
Save-Png $o 'elevation-guide.png'

Write-Host 'DONE.'
