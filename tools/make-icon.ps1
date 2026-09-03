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

# circular clip: transparent outside
$clip = New-Object System.Drawing.Drawing2D.GraphicsPath
$clip.AddEllipse(0, 0, $size, $size)
$g.SetClip($clip)

# layered circular background
$g.FillEllipse((Fill-Color "0d1022" 255), 0, 0, $size, $size)
$g.FillEllipse((Fill-Color "141b36" 255), 51, 51, 410, 410)
$g.FillEllipse((Fill-Color "1a2340" 255), 115, 115, 282, 282)

# grid lines
$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(14, 255, 255, 255), 2)
foreach ($i in 1..7) {
    $v = $i * 64
    $g.DrawLine($gridPen, $v, 0, $v, $size)
    $g.DrawLine($gridPen, 0, $v, $size, $v)
}

function Draw-Triangle($cx, $cy, $r, $hex, $alpha) {
    $angle = [Math]::Atan2(256 - $cy, 256 - $cx)
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

# player glow
$g.FillEllipse((Fill-Color "78a0ff" 40), (256 - 118), (256 - 118), 236, 236)
$g.FillEllipse((Fill-Color "78a0ff" 60), (256 - 92), (256 - 92), 184, 184)

# enemies, pointing at center
Draw-Triangle 150 148 56 "ff5b4d" 255
Draw-Triangle 366 158 46 "ff9a3d" 255
Draw-Triangle 146 352 42 "ff5b4d" 200

# tank: red square bottom-right
$g.FillRectangle((Fill-Color "d64545" 255), 316, 312, 82, 82)

# gems
Draw-Gem 256 62 22 "35d07f" 255
Draw-Gem 445 256 13 "35d07f" 170
Draw-Gem 70 262 11 "35d07f" 140

# player: white circle + core
$g.FillEllipse((Fill-Color "ffffff" 255), (256 - 70), (256 - 70), 140, 140)
$g.FillEllipse((Fill-Color "dfe9ff" 255), (256 - 40), (256 - 40), 80, 80)
$g.FillEllipse((Fill-Color "ffffff" 255), (256 - 24), (256 - 24), 48, 48)

# glowing ring border
$ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(150, 111, 211, 255), 9)
$g.DrawEllipse($ringPen, 8, 8, 496, 496)

$g.Dispose()
$bmp.Save("icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "icon.png (circular) generated"
