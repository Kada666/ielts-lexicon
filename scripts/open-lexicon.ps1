param([switch]$NoOpen)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$appUrl = 'http://127.0.0.1:4173/'
function Test-LexiconServer {
    try {
        $request = [Net.HttpWebRequest]::Create($appUrl)
        $request.Timeout = 1500
        $request.ReadWriteTimeout = 1500
        $request.Proxy = $null
        $response = $request.GetResponse()
        try {
            $reader = New-Object IO.StreamReader($response.GetResponseStream())
            try { $html = $reader.ReadToEnd() } finally { $reader.Dispose() }
            return $html.Contains('IELTS Lexicon')
        } finally { $response.Dispose() }
    } catch { return $false }
}
try {
    if (-not (Test-LexiconServer)) {
        $viteFile = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'
        if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'dist\index.html'))) { throw 'Production build missing. Run npm run build in the project folder first.' }
        if (-not (Test-Path -LiteralPath $viteFile)) { throw 'Dependencies missing. Run npm ci in the project folder first.' }
        $nodeFile = (Get-Command node.exe -ErrorAction Stop).Source
        $runtimeDir = Join-Path $projectRoot 'runtime.local'
        New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
        $serverProcess = Start-Process -FilePath $nodeFile -ArgumentList @(('"' + $viteFile + '"'), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeDir 'preview.log') -RedirectStandardError (Join-Path $runtimeDir 'preview-error.log') -PassThru
        $serverProcess.Id | Set-Content -LiteralPath (Join-Path $runtimeDir 'preview.pid')
        $deadline = (Get-Date).AddSeconds(15)
        while ((Get-Date) -lt $deadline -and -not (Test-LexiconServer)) { Start-Sleep -Milliseconds 250 }
        if (-not (Test-LexiconServer)) { throw 'Could not start the local app. Check runtime.local\preview-error.log; port 4173 may be in use.' }
    }
    if ($NoOpen) { Write-Output ('READY ' + $appUrl) }
    else { Start-Process $appUrl }
} catch {
    if ($NoOpen) { throw }
    Add-Type -AssemblyName System.Windows.Forms
    [Windows.Forms.MessageBox]::Show($_.Exception.Message, 'IELTS Lexicon', 'OK', 'Error') | Out-Null
    exit 1
}
