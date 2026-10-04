$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DistPath = Join-Path $Root "dist\index.html"
if (-not (Test-Path -LiteralPath $DistPath -PathType Leaf)) {
  throw "dist\index.html must exist before screenshot capture."
}

$programFilesX86 = [Environment]::GetFolderPath("ProgramFilesX86")
$chromeCandidates = @(
  (Join-Path $env:ProgramFiles "Google\Chrome\Application\chrome.exe"),
  (Join-Path $programFilesX86 "Google\Chrome\Application\chrome.exe"),
  (Join-Path $env:ProgramFiles "Microsoft\Edge\Application\msedge.exe"),
  (Join-Path $programFilesX86 "Microsoft\Edge\Application\msedge.exe")
)
$browser = $chromeCandidates | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) } | Select-Object -First 1
if (-not $browser) { throw "Chrome or Edge was not found on the runner." }

$pythonCommand = Get-Command python.exe -ErrorAction SilentlyContinue
if (-not $pythonCommand) { $pythonCommand = Get-Command python -ErrorAction SilentlyContinue }
if (-not $pythonCommand) { throw "Python is required for the local screenshot server." }

$outputDirectory = Join-Path $Root "release-screenshots"
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

function Get-BootstrapHtml {
  param(
    [string]$Language,
    [string]$EventName,
    [string[]]$Names
  )

  $participants = @()
  for ($index = 0; $index -lt $Names.Count; $index += 1) {
    $participants += @{
      id = "p$($index + 1)"
      name = $Names[$index]
    }
  }

  $now = "2026-10-04T02:15:00.000Z"
  $eventDocument = @{
    format = "mini-league-desk"
    schemaVersion = 1
    appVersion = "0.9.0"
    event = @{
      id = "release-screenshot-$Language"
      name = $EventName
      phase = "fixtures"
      settings = @{
        resultMode = "score"
        scoreDrawsAllowed = $true
      }
      participants = $participants
      rounds = @(
        @{
          number = 1
          byeParticipantId = $null
          matches = @(
            @{ id="m1"; round=1; order=1; participantAId="p1"; participantBId="p4"; status="completed"; scoreA=3; scoreB=1; result="win"; winnerId="p1" },
            @{ id="m2"; round=1; order=2; participantAId="p2"; participantBId="p3"; status="completed"; scoreA=2; scoreB=2; result="draw"; winnerId=$null }
          )
        },
        @{
          number = 2
          byeParticipantId = $null
          matches = @(
            @{ id="m3"; round=2; order=3; participantAId="p1"; participantBId="p3"; status="completed"; scoreA=0; scoreB=2; result="win"; winnerId="p3" },
            @{ id="m4"; round=2; order=4; participantAId="p4"; participantBId="p2"; status="pending"; scoreA=$null; scoreB=$null; result=$null; winnerId=$null }
          )
        },
        @{
          number = 3
          byeParticipantId = $null
          matches = @(
            @{ id="m5"; round=3; order=5; participantAId="p1"; participantBId="p2"; status="pending"; scoreA=$null; scoreB=$null; result=$null; winnerId=$null },
            @{ id="m6"; round=3; order=6; participantAId="p3"; participantBId="p4"; status="pending"; scoreA=$null; scoreB=$null; result=$null; winnerId=$null }
          )
        }
      )
      ui = @{
        matchFilter = "all"
        participantFocusId = "p1"
        activePage = "progress"
      }
      createdAt = $now
      updatedAt = $now
    }
  }

  $json = $eventDocument | ConvertTo-Json -Depth 20 -Compress
  $languageJson = $Language | ConvertTo-Json -Compress
  return @"
<!doctype html>
<meta charset="utf-8">
<title>Mini League Desk screenshot bootstrap</title>
<script>
localStorage.clear();
localStorage.setItem('mini-league-desk:language', $languageJson);
localStorage.setItem('mini-league-desk:active-event:v1', JSON.stringify($json));
location.replace('/dist/index.html');
</script>
"@
}

$jaBootstrap = Get-BootstrapHtml -Language "ja" -EventName ([char]0x79CB + [char]0x5B63 + [char]0x30DF + [char]0x30CB + [char]0x30EA + [char]0x30FC + [char]0x30B0) -Names @(
  ([char]0x9752 + [char]0x6728),
  ([char]0x4F0A + [char]0x85E4),
  ([char]0x4F50 + [char]0x85E4),
  ([char]0x7530 + [char]0x4E2D)
)
$enBootstrap = Get-BootstrapHtml -Language "en" -EventName "Autumn Mini League" -Names @("Alex","Jordan","Morgan","Taylor")

$jaBootstrapPath = Join-Path $Root "release-bootstrap-ja.html"
$enBootstrapPath = Join-Path $Root "release-bootstrap-en.html"
[System.IO.File]::WriteAllText($jaBootstrapPath, $jaBootstrap, (New-Object System.Text.UTF8Encoding($false)))
[System.IO.File]::WriteAllText($enBootstrapPath, $enBootstrap, (New-Object System.Text.UTF8Encoding($false)))

$server = $null
try {
  $server = Start-Process -FilePath $pythonCommand.Source -ArgumentList @("-m","http.server","8765","--bind","127.0.0.1") -WorkingDirectory $Root -PassThru -WindowStyle Hidden
  Start-Sleep -Seconds 2

  $captures = @(
    @{ Name="screenshot.png"; Bootstrap="release-bootstrap-ja.html"; Width=1440; Height=1000 },
    @{ Name="screenshot-mobile.png"; Bootstrap="release-bootstrap-ja.html"; Width=390; Height=844 },
    @{ Name="screenshot-en.png"; Bootstrap="release-bootstrap-en.html"; Width=1440; Height=1000 },
    @{ Name="screenshot-mobile-en.png"; Bootstrap="release-bootstrap-en.html"; Width=390; Height=844 }
  )

  foreach ($capture in $captures) {
    $profile = Join-Path $env:TEMP ("mini-league-screenshot-" + [Guid]::NewGuid().ToString("N"))
    $output = Join-Path $outputDirectory $capture.Name
    $url = "http://127.0.0.1:8765/" + $capture.Bootstrap
    $arguments = @(
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--user-data-dir=$profile",
      "--window-size=$($capture.Width),$($capture.Height)",
      "--virtual-time-budget=2500",
      "--screenshot=$output",
      $url
    )
    & $browser @arguments | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Browser screenshot command failed for $($capture.Name)." }
    if (-not (Test-Path -LiteralPath $output -PathType Leaf)) { throw "Screenshot was not created: $output" }
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $profile
  }
} finally {
  if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
  Remove-Item -Force -ErrorAction SilentlyContinue $jaBootstrapPath,$enBootstrapPath
}

Write-Host "[OK] Release screenshots captured." -ForegroundColor Green
