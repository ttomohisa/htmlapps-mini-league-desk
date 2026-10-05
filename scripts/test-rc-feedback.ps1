$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourcePath = Join-Path $Root "src\index.template.html"
$source = Get-Content -Raw -Encoding UTF8 $SourcePath

$requiredTokens = @(
  ".bulk-add-button { margin-top: 12px; }",
  'class="button bulk-add-button"',
  "participant-drag-handle",
  "touch-action: none",
  "function beginParticipantDrag",
  "function moveParticipantDrag",
  "function endParticipantDrag",
  "setPointerCapture",
  "item.dataset.participantId",
  'data-match-view="rounds"',
  'data-match-view="matrix"',
  'id="roundRobinMatrix"',
  "function renderRoundRobinMatrix",
  "function matrixResultText",
  "matrix-cell-button",
  "matchView: 'rounds'",
  "matchView: state.ui.matchView",
  "ui.matchView = rawUi.matchView",
  "renderMatchView()"
)

foreach ($token in $requiredTokens) {
  if (-not $source.Contains($token)) {
    throw "RC feedback source marker is missing: $token"
  }
}

if ($source -notmatch 'participant-drag-handle[\s\S]*?pointerdown') {
  throw "Participant drag handle is not wired to pointer input."
}

if ($source -notmatch 'renderRoundRobinMatrix\(\)[\s\S]*?matrixPairKey') {
  throw "Round-robin matrix renderer is missing pair lookup."
}

if ($source -notmatch 'matrix-cell-button[\s\S]*?openResultDialog') {
  throw "Round-robin matrix cells must open match result entry."
}

if ($source -notmatch "visibleMatches[\s\S]*?roundsContainer") {
  throw "Existing round/list fixture view must remain available."
}

Write-Host "[OK] RC feedback regression checks passed." -ForegroundColor Green
