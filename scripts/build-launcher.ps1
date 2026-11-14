# scripts/build-launcher.ps1
# Builds the native Pa-Hire-Po.exe launcher with embedded mascot icon and generates Windows Desktop and Taskbar shortcuts.

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $rootDir

Write-Host "==> [Pa-Hire Po] Generating multi-size .ico icon..." -ForegroundColor Cyan

Add-Type -AssemblyName System.Drawing

function Convert-JpgToIco {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int[]]$Sizes = @(256, 128, 64, 48, 32, 16)
    )

    $srcImage = [System.Drawing.Image]::FromFile($InputPath)
    $pngStreams = @()

    foreach ($size in $Sizes) {
        $bmp = New-Object System.Drawing.Bitmap($size, $size)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.DrawImage($srcImage, 0, 0, $size, $size)
        $g.Dispose()

        $ms = New-Object System.IO.MemoryStream
        $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        $pngStreams += $ms
    }
    $srcImage.Dispose()

    $fs = [System.IO.File]::Create($OutputPath)
    $bw = New-Object System.IO.BinaryWriter($fs)

    $bw.Write([uint16]0) # Reserved
    $bw.Write([uint16]1) # Type 1 = ICO
    $bw.Write([uint16]$Sizes.Count) # Count

    $offset = 6 + (16 * $Sizes.Count)

    for ($i = 0; $i -lt $Sizes.Count; $i++) {
        $size = $Sizes[$i]
        $w = if ($size -ge 256) { [byte]0 } else { [byte]$size }
        $h = if ($size -ge 256) { [byte]0 } else { [byte]$size }
        $bytes = $pngStreams[$i].ToArray()

        $bw.Write([byte]$w)
        $bw.Write([byte]$h)
        $bw.Write([byte]0) # Color count
        $bw.Write([byte]0) # Reserved
        $bw.Write([uint16]1) # Color planes
        $bw.Write([uint16]32) # Bits per pixel
        $bw.Write([uint32]$bytes.Length) # Image size in bytes
        $bw.Write([uint32]$offset) # Image offset

        $offset += $bytes.Length
    }

    for ($i = 0; $i -lt $Sizes.Count; $i++) {
        $bytes = $pngStreams[$i].ToArray()
        $bw.Write($bytes)
        $pngStreams[$i].Dispose()
    }

    $bw.Flush()
    $bw.Close()
    $fs.Close()
}

$logoJpg = Join-Path $rootDir "public\pa-hire-po-logo.jpg"
$icoPublic = Join-Path $rootDir "public\pa-hire-po.ico"
$icoFaviconApp = Join-Path $rootDir "src\app\favicon.ico"
$icoFaviconPublic = Join-Path $rootDir "public\favicon.ico"

Convert-JpgToIco -InputPath $logoJpg -OutputPath $icoPublic
Convert-JpgToIco -InputPath $logoJpg -OutputPath $icoFaviconApp
Convert-JpgToIco -InputPath $logoJpg -OutputPath $icoFaviconPublic
Write-Host "   Multi-size icons generated successfully." -ForegroundColor Green

Write-Host "==> [Pa-Hire Po] Compiling Pa-Hire-Po.exe..." -ForegroundColor Cyan

$cscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $cscPath)) {
    $cscPath = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}

$csSource = @'
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading;

namespace PaHirePo
{
    class Program
    {
        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        static bool IsServerReady(string url)
        {
            try
            {
                var request = (HttpWebRequest)WebRequest.Create(url);
                request.Timeout = 1500;
                request.Method = "GET";
                using (var response = (HttpWebResponse)request.GetResponse())
                {
                    return (int)response.StatusCode >= 200 && (int)response.StatusCode < 500;
                }
            }
            catch
            {
                return false;
            }
        }

        static void Main(string[] args)
        {
            try
            {
                SetCurrentProcessExplicitAppUserModelID("com.pahirepo.desktop");
            }
            catch { }

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string targetUrl = "http://localhost:3000";

            // 1. Ensure local Next.js dev server is running
            if (!IsServerReady(targetUrl))
            {
                ProcessStartInfo npmPsi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c npm run dev",
                    WorkingDirectory = appDir,
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true,
                    UseShellExecute = true
                };

                try
                {
                    Process.Start(npmPsi);
                }
                catch { }

                // Wait up to 30 seconds
                int maxAttempts = 60;
                while (maxAttempts-- > 0)
                {
                    Thread.Sleep(500);
                    if (IsServerReady(targetUrl))
                    {
                        break;
                    }
                }
            }

            // 2. Launch Electron desktop shell or Edge/Chrome App window
            string electronExe = Path.Combine(appDir, "node_modules", "electron", "dist", "electron.exe");

            if (File.Exists(electronExe))
            {
                ProcessStartInfo electronPsi = new ProcessStartInfo
                {
                    FileName = electronExe,
                    Arguments = ".",
                    WorkingDirectory = appDir,
                    UseShellExecute = false
                };
                electronPsi.EnvironmentVariables["ELECTRON_START_URL"] = targetUrl;
                Process.Start(electronPsi);
            }
            else
            {
                try
                {
                    Process.Start("msedge.exe", "--app=" + targetUrl);
                }
                catch
                {
                    Process.Start(targetUrl);
                }
            }
        }
    }
}
'@

$tempCs = Join-Path $rootDir "temp_launcher.cs"
[System.IO.File]::WriteAllText($tempCs, $csSource)
$outExe = Join-Path $rootDir "Pa-Hire-Po.exe"

& $cscPath /target:winexe /win32icon:$icoPublic /out:$outExe $tempCs
Remove-Item $tempCs -Force -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $outExe)) {
    Write-Error "Failed to compile Pa-Hire-Po.exe"
}
Write-Host "   Pa-Hire-Po.exe compiled successfully with mascot icon." -ForegroundColor Green

Write-Host "==> [Pa-Hire Po] Creating desktop and project shortcuts..." -ForegroundColor Cyan

$wsh = New-Object -ComObject WScript.Shell

# Project shortcut
$projLnk = Join-Path $rootDir "Pa-Hire Po.lnk"
$shortcutProj = $wsh.CreateShortcut($projLnk)
$shortcutProj.TargetPath = $outExe
$shortcutProj.WorkingDirectory = $rootDir
$shortcutProj.IconLocation = "$icoPublic,0"
$shortcutProj.Description = "Pa-Hire Po — Multi-Board Job Finder & Resume Workspace"
$shortcutProj.Save()

# User Desktop shortcuts
$desktopPaths = @(
    [Environment]::GetFolderPath("Desktop"),
    "C:\Users\$env:USERNAME\Desktop",
    "C:\Users\$env:USERNAME\OneDrive\Desktop"
) | Select-Object -Unique

foreach ($dp in $desktopPaths) {
    if (Test-Path $dp) {
        $deskLnk = Join-Path $dp "Pa-Hire Po.lnk"
        $shortcutDesk = $wsh.CreateShortcut($deskLnk)
        $shortcutDesk.TargetPath = $outExe
        $shortcutDesk.WorkingDirectory = $rootDir
        $shortcutDesk.IconLocation = "$icoPublic,0"
        $shortcutDesk.Description = "Pa-Hire Po — Multi-Board Job Finder & Resume Workspace"
        $shortcutDesk.Save()
        Write-Host "   Created shortcut at: $deskLnk" -ForegroundColor Green
    }
}

Write-Host "`nAll set! You can now double-click Pa-Hire-Po.exe or right-click it -> 'Pin to taskbar'!" -ForegroundColor Yellow
