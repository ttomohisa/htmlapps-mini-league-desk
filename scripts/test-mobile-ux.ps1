$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourcePath = Join-Path $Root "src\index.template.html"
$source = Get-Content -Raw -Encoding UTF8 $SourcePath

$requiredTokens = @(
  "@media (max-width: 380px)",
  "grid-template-areas: \"side-a side-b\" \"center center\"",
  "body.has-mobile-bottom-bar .app-toast",
  "var(--app-mobile-bottom-bar-height)",
  ".result-choice.is-current",
  "min-height: 56px",
  'id="resultCurrent"',
  'id="resultCurrentValue"',
  'id="showAllMatchesButton"',
  "event.target.select()",
  ".backup-dialog-actions { flex-direction: column-reverse; }",
  ".small-icon-button { width: 44px; height: 44px; }"
)

foreach ($token in $requiredTokens) {
  if (-not $source.Contains($token)) {
    throw "Mobile / UX source marker is missing: $token"
  }
}

if ($source -notmatch '@media \(max-width: 380px\)[\s\S]*?\.match-row[\s\S]*?grid-template-areas') {
  throw "Narrow match-row reflow is missing."
}

if ($source -notmatch 'body\.has-mobile-bottom-bar \.app-toast[\s\S]*?app-mobile-bottom-bar-height') {
  throw "Toast separation from the mobile bottom bar is missing."
}

Write-Host "[OK] Mobile / UX regression checks passed." -ForegroundColor Green
