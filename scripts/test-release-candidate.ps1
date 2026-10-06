$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Assert-Equal {
  param($Actual, $Expected, [string]$Message)
  if ($Actual -ne $Expected) {
    throw "$Message Expected '$Expected' but got '$Actual'."
  }
}

function New-ReleaseRoundRobinSchedule {
  param([int]$ParticipantCount)

  $rotation = @(0..($ParticipantCount - 1))
  if (($ParticipantCount % 2) -eq 1) { $rotation += $null }

  $rounds = @()
  $roundCount = $rotation.Count - 1
  $matchesPerRound = [int]($rotation.Count / 2)

  for ($roundIndex = 0; $roundIndex -lt $roundCount; $roundIndex += 1) {
    $matches = @()
    $bye = $null

    for ($pairIndex = 0; $pairIndex -lt $matchesPerRound; $pairIndex += 1) {
      $a = $rotation[$pairIndex]
      $b = $rotation[$rotation.Count - 1 - $pairIndex]
      if ($null -eq $a -or $null -eq $b) {
        if ($null -eq $a) { $bye = $b } else { $bye = $a }
        continue
      }
      $matches += [PSCustomObject]@{ A = [int]$a; B = [int]$b }
    }

    $rounds += [PSCustomObject]@{ Matches = @($matches); Bye = $bye }
    $middle = @($rotation[1..($rotation.Count - 2)])
    $rotation = @($rotation[0], $rotation[$rotation.Count - 1]) + $middle
  }

  return @($rounds)
}

$matrix = @(
  @{ Count = 3; Matches = 3; Rounds = 3; Byes = 3 },
  @{ Count = 4; Matches = 6; Rounds = 3; Byes = 0 },
  @{ Count = 5; Matches = 10; Rounds = 5; Byes = 5 },
  @{ Count = 8; Matches = 28; Rounds = 7; Byes = 0 },
  @{ Count = 16; Matches = 120; Rounds = 15; Byes = 0 }
)

foreach ($case in $matrix) {
  $rounds = @(New-ReleaseRoundRobinSchedule -ParticipantCount $case.Count)
  Assert-Equal $rounds.Count $case.Rounds "Release round count for $($case.Count) participants."

  $pairs = @{}
  $byes = @{}
  $matchCount = 0

  foreach ($round in $rounds) {
    $active = @{}
    foreach ($match in @($round.Matches)) {
      if ($match.A -eq $match.B) { throw "Release self match for $($case.Count) participants." }
      if ($active.ContainsKey($match.A) -or $active.ContainsKey($match.B)) {
        throw "Release duplicate participant in one round for $($case.Count) participants."
      }
      $active[$match.A] = $true
      $active[$match.B] = $true

      $low = [Math]::Min($match.A, $match.B)
      $high = [Math]::Max($match.A, $match.B)
      $pairKey = ([string]$low + ":" + [string]$high)
      if ($pairs.ContainsKey($pairKey)) { throw "Release duplicate pair $pairKey." }
      $pairs[$pairKey] = $true
      $matchCount += 1
    }

    if ($null -ne $round.Bye) {
      if ($active.ContainsKey([int]$round.Bye)) { throw "Release Bye participant also plays." }
      $byes[[int]$round.Bye] = $true
    }
  }

  Assert-Equal $matchCount $case.Matches "Release match count for $($case.Count) participants."
  Assert-Equal $pairs.Count $case.Matches "Release pair coverage for $($case.Count) participants."
  Assert-Equal $byes.Count $case.Byes "Release Bye coverage for $($case.Count) participants."
}

function Get-PngDimensions {
  param([string]$Path)

  $bytes = [System.IO.File]::ReadAllBytes($Path)
  if ($bytes.Length -lt 24) { throw "PNG is too small: $Path" }
  $signature = @(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a)
  for ($index = 0; $index -lt $signature.Count; $index += 1) {
    if ($bytes[$index] -ne $signature[$index]) { throw "Invalid PNG signature: $Path" }
  }

  $width = [int](
    ([int64]$bytes[16] * 16777216) +
    ([int64]$bytes[17] * 65536) +
    ([int64]$bytes[18] * 256) +
    [int64]$bytes[19]
  )
  $height = [int](
    ([int64]$bytes[20] * 16777216) +
    ([int64]$bytes[21] * 65536) +
    ([int64]$bytes[22] * 256) +
    [int64]$bytes[23]
  )
  return [PSCustomObject]@{ Width = $width; Height = $height; Bytes = $bytes.Length }
}

$screenshots = @(
  @{ Path = "assets\screenshot.png"; Width = 1440; Height = 1000 },
  @{ Path = "assets\screenshot-mobile.png"; Width = 390; Height = 844 },
  @{ Path = "assets\screenshot-en.png"; Width = 1440; Height = 1000 },
  @{ Path = "assets\screenshot-mobile-en.png"; Width = 390; Height = 844 }
)

foreach ($shot in $screenshots) {
  $absolute = Join-Path $Root $shot.Path
  if (-not (Test-Path -LiteralPath $absolute -PathType Leaf)) { throw "Release screenshot is missing: $($shot.Path)" }
  $info = Get-PngDimensions -Path $absolute
  Assert-Equal $info.Width $shot.Width "Release screenshot width for $($shot.Path)."
  Assert-Equal $info.Height $shot.Height "Release screenshot height for $($shot.Path)."
  if ($info.Bytes -lt 20000) { throw "Release screenshot looks unexpectedly small: $($shot.Path)" }
}

$staleScreenshotBlobs = @{
  "assets\screenshot.png" = @(
    "66fc76b66a7a241b2507ad488ce0a5514e546258",
    "9363e057c0b6adcbcd9c3eca6e48d8c3b334aadf"
  )
  "assets\screenshot-mobile.png" = @(
    "9f854b8cf00453c4615d25fb3df5d37712fc6ae6",
    "aa77522b3548b9170d85f73a04c676581856760f"
  )
  "assets\screenshot-en.png" = @(
    "f61cc56b3d535ab1dc192bf7268e490fb2f7d2ad"
  )
  "assets\screenshot-mobile-en.png" = @(
    "06931ab3390938372bb29cc32b73920febe8363e"
  )
}
foreach ($relative in $staleScreenshotBlobs.Keys) {
  $currentBlob = (& git -C $Root hash-object -- $relative).Trim()
  if (@($staleScreenshotBlobs[$relative]) -contains $currentBlob) {
    throw "Stale release screenshot returned: $relative"
  }
}

$app = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "app.config.json") | ConvertFrom-Json
Assert-Equal ([string]$app.version) "1.0.0" "Stable release version."
if (-not [bool]$app.build.blockRuntimeNetwork) { throw "blockRuntimeNetwork must remain true." }
if (-not [bool]$app.build.selfExtract.enabled) { throw "Self-extract build must remain enabled." }

$source = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "src\index.template.html")
if (-not $source.Contains("connect-src 'none'")) { throw "Runtime CSP must keep connect-src 'none'." }
$externalPattern = '(?is)<(?:script|link|img|iframe)\b[^>]*(?:src|href)\s*=\s*["'']https?://'
if ($source -match $externalPattern) { throw "External runtime resource URL found in source." }
if ($source.Contains("single-html-app-starter")) { throw "Template starter marker remains in application source." }
$jaFullyLocal = ([string][char]0x5B8C) + [char]0x5168 + [char]0x30ED + [char]0x30FC + [char]0x30AB + [char]0x30EB + [char]0x51E6 + [char]0x7406
$jaOldLocal = ([string][char]0x7AEF) + [char]0x672B + [char]0x5185 + [char]0x3067 + [char]0x51E6 + [char]0x7406
$jaBadgeMarker = "localBadge: '" + $jaFullyLocal + "'"
if (-not $source.Contains($jaBadgeMarker)) { throw "Japanese fully-local badge copy is missing." }
if (-not $source.Contains("localBadge: 'Fully local processing'")) { throw "English fully-local badge copy is missing." }
if ($source.Contains($jaOldLocal)) { throw "Old local-processing badge copy remains." }

$faviconPath = Join-Path $Root "assets\favicon.svg"
$faviconHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $faviconPath).Hash.ToLowerInvariant()
if ($faviconHash -ne "f193a4a50de2bb3ed918a076dee6b4a557ed218c03fffb438e3613b6c66bac45") {
  throw "Favicon must match the approved Mini League Desk SVG."
}

$readme = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "README.md")
$readmeJa = Get-Content -Raw -Encoding UTF8 (Join-Path $Root "README.ja.md")
foreach ($token in @("v1.0.0", "assets/screenshot-en.png", "assets/screenshot-mobile-en.png", "connect-src 'none'")) {
  if (-not $readme.Contains($token)) { throw "English README release marker is missing: $token" }
}
foreach ($token in @("v1.0.0", "assets/screenshot.png", "assets/screenshot-mobile.png", "connect-src 'none'")) {
  if (-not $readmeJa.Contains($token)) { throw "Japanese README release marker is missing: $token" }
}

$readable = Join-Path $Root ([string]$app.build.output)
$selfExtract = Join-Path $Root ([string]$app.build.selfExtract.output)
$rootHtml = Join-Path $Root "mini-league-desk.html"
foreach ($artifact in @($readable, $selfExtract, $rootHtml)) {
  if (-not (Test-Path -LiteralPath $artifact -PathType Leaf)) { throw "Release artifact is missing: $artifact" }
  if ((Get-Item -LiteralPath $artifact).Length -le 0) { throw "Release artifact is empty: $artifact" }
}

$builtHtml = Get-Content -Raw -Encoding UTF8 $readable
if (-not $builtHtml.Contains("connect-src 'none'")) { throw "Built standalone CSP must keep connect-src 'none'." }
if ($builtHtml -match $externalPattern) { throw "External runtime resource URL found in built standalone HTML." }
if (-not $builtHtml.Contains('"version":"1.0.0"')) { throw "Built standalone does not contain config version 1.0.0." }

Write-Host "[OK] Stable release checks passed for 3/4/5/8/16 participants, release assets, standalone, CSP, and privacy markers." -ForegroundColor Green
