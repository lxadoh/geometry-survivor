Add-Type -AssemblyName System.Drawing

$size = 512
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

function Fill-Color($hex, $alpha) {
    $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
    $gg = [Convert]::ToInt32($hex.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
    if ($null -eq $alpha) { $alpha = 255 }
    return New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, $r, $gg, $b))
}

$bg = Fill-Color "0d1022" 255
$g.FillRectangle($bg, 0, 0, $size, $size)

$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(14, 255, 255, 255), 2)
foreach ($i in 64..7) {
    $v = $i * 64
    $g.DrawLine($gridPen, $v, 0, $v, $size)
    $g.DrawLine($gridPen, 0, $v, $size, $v)
}

function Draw-Triangle($cx, $cy, $r, $angle, $hex, $alpha) {
    $brush = Fill-Color $hex $alpha
    $pts = New-Object System.Drawing.PointF[] 3
    for ($k = 0; $k -lt 3; $k++) {
        $a = $angle + $k * (2 * [Math]::PI / 3)
        $pts[$k] = New-Object System.Drawing.PointF(($cx + $r * [Math]::Cos($a)), ($cy + $r * [Math]::Sin($a)))
    }
    $g.FillPolygon($brush, $pts)
}

function Draw-Gem($cx, $cy, $r, $hex, $alpha) {
    $brush = Fill-Color $hex $alpha
    $pts = New-Object System.Drawing.PointF[] 4
    $pts[0] = New-Object System.Drawing.PointF($cx, ($cy - $r))
    $pts[1] = New-Object System.Drawing.PointF(($cx + $r * 0.72), $cy)
    $pts[2] = New-Object System.Drawing.PointF($cx, ($cy + $r))
    $pts[3] = New-Object System.Drawing.PointF(($cx - $r * 0.72), $cy)
    $g.FillPolygon($brush, $pts)
}

# 玩家光晕
$g.FillEllipse((Fill-Color "78a0ff" 40), (256 - 118), (256 - 118), 236, 236)
$g.FillEllipse((Fill-Color "78a0ff" 60), (256 - 92), (256 - 92), 184, 184)

# 敌人（指向玩家方向）
$center = [Math]::PI
Draw-Triangle 130 132 62 ($center * 0.72) "ff5b4d" 255
Draw-Triangle 392 118 52 ($center * 1.32) "ff9a3d" 255
Draw-Triangle 132 384 48 ($center * 0.2) "ff5b4d" 200

# 坦克（红色方块）
$tankBrush = Fill-Color "d64545" 255
$g.FillRectangle($tankBrush, 350, 336, 92, 92)

# 宝石
Draw-Gem 108 300 26 "35d07f" 255
Draw-Gem 322 240 14 "35d07f" 170
Draw-Gem 240 108 12 "35d07f" 140

# 玩家（白圆 + 内核）
$g.FillEllipse((Fill-Color "ffffff" 255), (256 - 70), (256 - 70), 140, 140)
$g.FillEllipse((Fill-Color "dfe9ff" 255), (256 - 40), (256 - 40), 80, 80)
$g.FillEllipse((Fill-Color "ffffff" 255), (256 - 24), (256 - 24), 48, 48)

$g.Dispose()
$bmp.Save("icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "icon.png generated"
