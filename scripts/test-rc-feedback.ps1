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
  "function matrixResultAria",
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

$circle = [string][char]0x25CB
$cross = [string][char]0x00D7
$triangle = [string][char]0x25B3
foreach ($symbol in @($circle, $cross, $triangle)) {
  if (-not $source.Contains($symbol)) {
    throw "Round-robin outcome symbol is missing."
  }
}
$matrixStart = $source.IndexOf("function matrixResultText")
$matrixEnd = $source.IndexOf("function renderRoundRobinMatrix", $matrixStart)
if ($matrixStart -lt 0 -or $matrixEnd -le $matrixStart) { throw "Matrix result function block is missing." }
$matrixBlock = $source.Substring($matrixStart, $matrixEnd - $matrixStart)
foreach ($token in @("function matrixScoreText", "scoreA", "scoreB", "matrix-result-symbol", "matrix-result-score")) {
  if (-not $source.Contains($token)) {
    throw "Round-robin score display marker is missing: $token"
  }
}
if (-not $matrixBlock.Contains("state.settings.resultMode !== 'score'")) {
  throw "Round-robin score text must be limited to score-entry mode."
}

if (-not $source.Contains('id="roundMatchView"') -or -not $source.Contains('id="roundsContainer"')) {
  throw "Existing round/list fixture view must remain available."
}

Write-Host "[OK] RC feedback regression checks passed." -ForegroundColor Green
