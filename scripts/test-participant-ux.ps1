$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourcePath = Join-Path $Root "src\index.template.html"
$source = Get-Content -Raw -Encoding UTF8 $SourcePath

$required = @(
  "participant-add-actions",
  'id="showParticipantAddButton"',
  'id="showBulkAddButton"',
  'id="participantAddPanel"',
  'id="bulkAddPanel"',
  "function setParticipantAddMode",
  "function startParticipantEdit",
  "function commitParticipantEdit",
  "participant-edit-input",
  "createActionButton('edit'",
  "createActionButton('save'",
  "createActionButton('cancel'",
  "body.is-roster-dragging",
  "transform: translateY(-3px) scale(1.018)",
  "box-shadow: 0 16px 34px",
  "document.body.classList.add('is-roster-dragging')",
  "document.body.classList.remove('is-roster-dragging')"
)

foreach ($token in $required) {
  if (-not $source.Contains($token)) {
    throw "Participant UX marker is missing: $token"
  }
}

if ($source.Contains("introTitle: '結果を入れると、順位がすぐ分かる'")) {
  throw "Old Japanese hero punctuation remains."
}

$jaHeadline = ([string][char]0x7D50) + [char]0x679C + [char]0x3092 + [char]0x5165 + [char]0x308C + [char]0x308B + [char]0x3068 + [char]0x9806 + [char]0x4F4D + [char]0x304C + [char]0x3059 + [char]0x3050 + [char]0x5206 + [char]0x304B + [char]0x308B
if (-not $source.Contains($jaHeadline)) {
  throw "Updated Japanese hero headline is missing."
}

$settingsStart = $source.IndexOf('<section class="panel" aria-labelledby="settingsTitle">')
$rosterStart = $source.IndexOf('<section class="panel" aria-labelledby="rosterTitle">')
if ($settingsStart -lt 0 -or $rosterStart -lt 0 -or $rosterStart -le $settingsStart) {
  throw "Setup panels could not be located."
}
$settingsBlock = $source.Substring($settingsStart, $rosterStart - $settingsStart)
if ($settingsBlock.Contains('id="participantForm"') -or $settingsBlock.Contains('id="bulkParticipants"')) {
  throw "Participant add forms must not remain in the event-settings panel."
}

$rosterEnd = $source.IndexOf('</section>', $rosterStart)
if ($rosterEnd -lt 0) { throw "Participant panel end could not be located." }
$rosterBlock = $source.Substring($rosterStart, $rosterEnd - $rosterStart)
foreach ($token in @('id="showParticipantAddButton"','id="showBulkAddButton"','id="participantForm"','id="bulkParticipants"')) {
  if (-not $rosterBlock.Contains($token)) { throw "Participant panel is missing: $token" }
}

if ($source -notmatch "candidate\\.id !== participantId[\\s\\S]*?duplicateName") {
  throw "Inline rename duplicate-name validation is missing."
}

Write-Host "[OK] Participant setup UX regression checks passed." -ForegroundColor Green
