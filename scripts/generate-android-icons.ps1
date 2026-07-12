param(
  [string]$Source = "image/logo.png",
  [string]$AndroidRes = "android/app/src/main/res"
)

Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$cream = [System.Drawing.ColorTranslator]::FromHtml("#FFF7E5")
$densities = @{
  "mipmap-mdpi" = 48
  "mipmap-hdpi" = 72
  "mipmap-xhdpi" = 96
  "mipmap-xxhdpi" = 144
  "mipmap-xxxhdpi" = 192
}

function Save-IconPng {
  param(
    [System.Drawing.Image]$SourceImage,
    [string]$Path,
    [int]$Size,
    [bool]$TransparentBackground,
    [double]$Scale
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  if ($TransparentBackground) {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  } else {
    $graphics.Clear($cream)
  }

  $max = [Math]::Round($Size * $Scale)
  $ratio = [Math]::Min($max / $SourceImage.Width, $max / $SourceImage.Height)
  $drawWidth = [Math]::Round($SourceImage.Width * $ratio)
  $drawHeight = [Math]::Round($SourceImage.Height * $ratio)
  $x = [Math]::Round(($Size - $drawWidth) / 2)
  $y = [Math]::Round(($Size - $drawHeight) / 2)
  $graphics.DrawImage($SourceImage, $x, $y, $drawWidth, $drawHeight)
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$sourcePath = Join-Path (Get-Location) $Source
$resPath = Join-Path (Get-Location) $AndroidRes
$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)

foreach ($entry in $densities.GetEnumerator()) {
  $dir = Join-Path $resPath $entry.Key
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Save-IconPng -SourceImage $sourceImage -Path (Join-Path $dir "ic_launcher.png") -Size $entry.Value -TransparentBackground $false -Scale 0.78
  Save-IconPng -SourceImage $sourceImage -Path (Join-Path $dir "ic_launcher_round.png") -Size $entry.Value -TransparentBackground $false -Scale 0.78
  Save-IconPng -SourceImage $sourceImage -Path (Join-Path $dir "ic_launcher_foreground.png") -Size $entry.Value -TransparentBackground $true -Scale 0.64
}

$valuesDir = Join-Path $resPath "values"
New-Item -ItemType Directory -Force -Path $valuesDir | Out-Null
@"
<resources>
    <color name="ic_launcher_background">#FFF7E5</color>
</resources>
"@ | Set-Content -Encoding UTF8 (Join-Path $valuesDir "ic_launcher_background.xml")

$adaptiveDir = Join-Path $resPath "mipmap-anydpi-v26"
New-Item -ItemType Directory -Force -Path $adaptiveDir | Out-Null
@"
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"@ | Set-Content -Encoding UTF8 (Join-Path $adaptiveDir "ic_launcher.xml")
@"
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"@ | Set-Content -Encoding UTF8 (Join-Path $adaptiveDir "ic_launcher_round.xml")

$sourceImage.Dispose()
