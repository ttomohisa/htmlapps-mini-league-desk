$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourcePath = Join-Path $Root "src\index.template.html"
$source = Get-Content -Raw -Encoding UTF8 $SourcePath

function Get-TranslationKeys {
  param(
    [string]$Text,
    [string]$StartMarker,
    [string]$EndMarker
  )
  $start = $Text.IndexOf($StartMarker, [System.StringComparison]::Ordinal)
  if ($start -lt 0) { throw "Translation block start marker is missing: $StartMarker" }
  $start += $StartMarker.Length
  $end = $Text.IndexOf($EndMarker, $start, [System.StringComparison]::Ordinal)
  if ($end -lt 0) { throw "Translation block end marker is missing: $EndMarker" }
  $block = $Text.Substring($start, $end - $start)
  $matches = [regex]::Matches($block, '(?m)^\s{10}([A-Za-z][A-Za-z0-9]*):\s*')
  $keys = @($matches | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)
  $inlineMatches = [regex]::Matches($block, '(?m)^\s{10}[A-Za-z][A-Za-z0-9]*:[^\r\n]*')
  foreach ($lineMatch in $inlineMatches) {
    $line = $lineMatch.Value
    $extra = [regex]::Matches($line, ',\s*([A-Za-z][A-Za-z0-9]*):\s*')
    $keys += @($extra | ForEach-Object { $_.Groups[1].Value })
  }
  return @($keys | Sort-Object -Unique)
}

$jaKeys = @(Get-TranslationKeys -Text $source -StartMarker "        ja: {" -EndMarker "        en: {")
$enKeys = @(Get-TranslationKeys -Text $source -StartMarker "        en: {" -EndMarker "      };")

$missingInEnglish = @($jaKeys | Where-Object { $enKeys -notcontains $_ })
$missingInJapanese = @($enKeys | Where-Object { $jaKeys -notcontains $_ })
if ($missingInEnglish.Count -gt 0) {
  throw "Translation keys missing in English: $($missingInEnglish -join ', ')"
}
if ($missingInJapanese.Count -gt 0) {
  throw "Translation keys missing in Japanese: $($missingInJapanese -join ', ')"
}

$i18nReferences = @(
  [regex]::Matches($source, 'data-i18n(?:-(?:title|aria-label|placeholder))?="([^"]+)"') |
    ForEach-Object { $_.Groups[1].Value } |
    Sort-Object -Unique
)
foreach ($key in $i18nReferences) {
  if ($jaKeys -notcontains $key -or $enKeys -notcontains $key) {
    throw "Static i18n reference is missing from one or both dictionaries: $key"
  }
}

$requiredTokens = @(
  'select:focus-visible',
  '@media (forced-colors: active)',
  'data-i18n-aria-label="leagueNavLabel"',
  'data-i18n-aria-label="eventProgressLabel"',
  'data-i18n-aria-label="matchFilterLabel"',
  'aria-pressed="true"',
  'aria-describedby="resultDialogMeta"',
  'aria-describedby="scoreError"',
  'aria-describedby="backupFilenameHelp"',
  'aria-describedby="exportFilenameHelp"',
  'function rememberDialogOpener',
  'function restoreDialogOpener',
  'data-match-id',
  "item.setAttribute('role', 'listitem')",
  "root.setAttribute('role', 'list')"
)

foreach ($token in $requiredTokens) {
  if (-not $source.Contains($token)) {
    throw "i18n / accessibility source marker is missing: $token"
  }
}

foreach ($forbidden in @(
  'aria-label="League navigation"',
  'aria-label="League desk sections"',
  'aria-label="Match filter"',
  'aria-label="Event progress"',
  'v0.1.0では大会内容の自動保存はまだありません。',
  "W-D-L",
  "W-L"
)) {
  if ($source.Contains($forbidden)) {
    throw "Obsolete or non-localized source marker remains: $forbidden"
  }
}

if ($source -notmatch "button\.setAttribute\('aria-pressed', active \? 'true' : 'false'\)") {
  throw "Match-filter aria-pressed synchronization is missing."
}

if ($source -notmatch "currentWinnerButton\.setAttribute\('aria-pressed', 'true'\)") {
  throw "Current result aria-pressed synchronization is missing."
}

Write-Host "[OK] i18n / accessibility regression checks passed." -ForegroundColor Green
