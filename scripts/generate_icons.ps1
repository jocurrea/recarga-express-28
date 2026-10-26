Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Sunai\.gemini\antigravity-ide\brain\2407e8f2-b39b-4c7e-a0b0-eeac99ce0b3f\.user_uploaded\media_1793029247086.png"
$publicDir = "c:\Users\Sunai\.gemini\antigravity-ide\scratch\recarga-control\public"

$src = [System.Drawing.Image]::FromFile($srcPath)
Write-Output "Source Width: $($src.Width), Height: $($src.Height)"

function CreateSquareIcon($size, $paddingRatio, $bgColorHex, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # High quality rendering
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Fill Background
    $color = [System.Drawing.ColorTranslator]::FromHtml($bgColorHex)
    $brush = New-Object System.Drawing.SolidBrush($color)
    $g.FillRectangle($brush, 0, 0, $size, $size)
    $brush.Dispose()
    
    # Calculate fit within safe area
    $availW = $size * (1 - ($paddingRatio * 2))
    $availH = $size * (1 - ($paddingRatio * 2))
    
    $aspect = $src.Width / $src.Height
    if ($aspect -gt 1) {
        $destW = $availW
        $destH = $availW / $aspect
    } else {
        $destH = $availH
        $destW = $availH * $aspect
    }
    
    $destX = ($size - $destW) / 2
    $destY = ($size - $destH) / 2
    
    $destRect = New-Object System.Drawing.Rectangle([int]$destX, [int]$destY, [int]$destW, [int]$destH)
    $g.DrawImage($src, $destRect)
    
    $g.Dispose()
    
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated: $outPath ($size x $size)"
}

# 1. Standard icon 192 (with ~10% padding)
CreateSquareIcon 192 0.10 "#ffffff" "$publicDir\icon-192.png"

# 2. Standard icon 512 (with ~10% padding)
CreateSquareIcon 512 0.10 "#ffffff" "$publicDir\icon-512.png"

# 3. Maskable icon 192 (with 18% safe-zone padding so Android circular mask never cuts the icon)
CreateSquareIcon 192 0.18 "#ffffff" "$publicDir\icon-maskable-192.png"

# 4. Maskable icon 512 (with 18% safe-zone padding)
CreateSquareIcon 512 0.18 "#ffffff" "$publicDir\icon-maskable-512.png"

# 5. Apple Touch Icon 180 (iOS Home Screen)
CreateSquareIcon 180 0.12 "#ffffff" "$publicDir\apple-touch-icon.png"

# 6. Favicon 64
CreateSquareIcon 64 0.08 "#ffffff" "$publicDir\favicon.png"

# 7. Also overwrite public/icon.svg if needed, or point manifest to these PNGs!
CreateSquareIcon 512 0.10 "#ffffff" "$publicDir\app-icon.png"

$src.Dispose()
Write-Output "All icons created successfully!"
