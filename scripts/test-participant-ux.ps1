$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourcePath = Join-Path $Root "src\index.template.html"
$source = Get-Content -Raw -Encoding UTF8 $SourcePath

$required = @(
  "participant-add-row",
  'id="showParticipantAddButton"',
  'id="participantAddPanel"',
  'id="bulkDetails"',
  "participant-bulk-details",
  "function setParticipantAddOpen",
  "function startParticipantEdit",
  "function commitParticipantEdit",
  "participant-edit-input",
  "createActionButton('edit'",
  "createActionButton('save'",
  "createActionButton('cancel'",
  "participant-drag-ghost",
  "is-drag-placeholder",
  "function positionRosterDragGhost",
  "function animateRosterReflow",
  "cloneNode(true)",
  "ghost.style.left",
  "element.animate(",
  "window.scrollBy",
  "body.is-roster-dragging",
  "document.body.classList.add('is-roster-dragging')",
  "document.body.classList.remove('is-roster-dragging')"
)

foreach ($token in $required) {
  if (-not $source.Contains($token)) {
    throw "Participant UX marker is missing: $token"
  }
}

$jaHeadline = ([string][char]0x7D50) + [char]0x679C + [char]0x3092 + [char]0x5165 + [char]0x308C + [char]0x308B + [char]0x3068 + [char]0x9806 + [char]0x4F4D + [char]0x304C + [char]0x3059 + [char]0x3050 + [char]0x5206 + [char]0x304B + [char]0x308B
$jaOldHeadline = ([string][char]0x7D50) + [char]0x679C + [char]0x3092 + [char]0x5165 + [char]0x308C + [char]0x308B + [char]0x3068 + [char]0x3001 + [char]0x9806 + [char]0x4F4D + [char]0x304C + [char]0x3059 + [char]0x3050 + [char]0x5206 + [char]0x304B + [char]0x308B
if ($source.Contains($jaOldHeadline)) {
  throw "Old Japanese hero punctuation remains."
}
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
foreach ($token in @('id="showParticipantAddButton"','id="bulkDetails"','id="participantForm"','id="bulkParticipants"')) {
  if (-not $rosterBlock.Contains($token)) { throw "Participant panel is missing: $token" }
}
if ($rosterBlock.Contains('id="showBulkAddButton"') -or $rosterBlock.Contains('id="bulkAddPanel"')) {
  throw "Bulk add must use the disclosure-style details UI rather than a second add button."
}
if (-not $rosterBlock.Contains('class="participant-add-row"')) {
  throw "Single participant add must use one full-width add row."
}

if (-not $source.Contains("candidate.id !== participantId")) {
  throw "Inline rename must exclude the participant being edited from duplicate checks."
}
if (-not $source.Contains("translate('duplicateName')")) {
  throw "Inline rename duplicate-name error handling is missing."
}

Write-Host "[OK] Participant setup UX regression checks passed." -ForegroundColor Green
