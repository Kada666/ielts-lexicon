param([switch]$Local)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$desktopDir = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktopDir 'IELTS Lexicon.lnk'
$launcher = Join-Path $PSScriptRoot 'open-lexicon.ps1'
$appUrl = 'https://kada666.github.io/ielts-lexicon/'
$shell = New-Object -ComObject WScript.Shell
if (Test-Path -LiteralPath $shortcutPath) {
    $existing = $shell.CreateShortcut($shortcutPath)
    if (-not $existing.Arguments.Contains($launcher) -and -not $existing.Arguments.Contains($appUrl)) { throw 'A different IELTS Lexicon shortcut already exists; refusing to overwrite it.' }
}
$iconPath = Join-Path $projectRoot 'public\lexicon.ico'
Add-Type -AssemblyName System.Drawing
$bitmap = [Drawing.Bitmap]::new((Join-Path $projectRoot 'public\icon-192.png'))
try {
    $icon = [Drawing.Icon]::FromHandle($bitmap.GetHicon())
    $stream = [IO.File]::Create($iconPath)
    try { $icon.Save($stream) } finally { $stream.Dispose() }
} finally { $bitmap.Dispose() }
$shortcut = $shell.CreateShortcut($shortcutPath)
if ($Local) {
    $shortcut.TargetPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    $shortcut.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $launcher + '"'
} else {
    $shortcut.TargetPath = Join-Path $env:SystemRoot 'explorer.exe'
    $shortcut.Arguments = '"' + $appUrl + '"'
}
$shortcut.WorkingDirectory = $projectRoot
$shortcut.IconLocation = $iconPath + ',0'
$shortcut.Description = 'IELTS Lexicon - personal vocabulary, flashcards and offline review'
$shortcut.WindowStyle = 7
$shortcut.Save()
Write-Output $shortcutPath
