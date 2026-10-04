$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourcePath = Join-Path $Root "src\index.template.html"
$source = Get-Content -Raw -Encoding UTF8 $SourcePath

$requiredTokens = @(
  'id="exportDialog"',
  'id="outputFilename"',
  'id="exportMatchesCsvButton"',
  'id="exportStandingsCsvButton"',
  'id="exportStandingsPngButton"',
  'id="printEventButton"',
  'id="printSheet"',
  'function safeOutputStem',
  'function makeOutputFilename',
  'function spreadsheetSafeValue',
  'function csvText',
  'function exportMatchesCsv',
  'function standingsCsvRows',
  'function exportStandingsPng',
  'canvas.toBlob',
  "'image/png'",
  '#16624F',
  'function buildPrintSheet',
  'window.print()',
  'body > *:not(#printSheet)',
  "let outputFilename = ''"
)

foreach ($token in $requiredTokens) {
  if (-not $source.Contains($token)) {
    throw "Export source marker is missing: $token"
  }
}

if (-not $source.Contains("return /^[=+\-@]/.test(value)")) {
  throw "Spreadsheet formula-prefix protection is missing."
}

if (-not $source.Contains("return '\uFEFF' + rows.map")) {
  throw "CSV UTF-8 BOM marker is missing."
}

if ($source -notmatch '@media print[\s\S]*?body > \*:not\(#printSheet\)') {
  throw "Print-sheet isolation CSS is missing."
}

Write-Host "[OK] Export regression checks passed." -ForegroundColor Green
