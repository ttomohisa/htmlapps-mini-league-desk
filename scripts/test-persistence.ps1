$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$SchemaVersion = 1

function Test-EventDocument {
  param($Document)

  if ($null -eq $Document) { return $false }
  if ([string]$Document.format -ne "mini-league-desk") { return $false }
  if ([int]$Document.schemaVersion -ne $SchemaVersion) { return $false }
  if ($null -eq $Document.event) { return $false }

  $event = $Document.event
  if ([string]::IsNullOrWhiteSpace([string]$event.id)) { return $false }
  if ([string]$event.phase -notin @("setup", "fixtures")) { return $false }
  if ($null -eq $event.settings) { return $false }
  if ([string]$event.settings.resultMode -notin @("winLoss", "winDrawLoss", "score")) { return $false }
  if ($event.participants.Count -gt 64) { return $false }

  $ids = @{}
  foreach ($participant in @($event.participants)) {
    $id = [string]$participant.id
    $name = [string]$participant.name
    if ([string]::IsNullOrWhiteSpace($id) -or [string]::IsNullOrWhiteSpace($name)) { return $false }
    if ($ids.ContainsKey($id)) { return $false }
    $ids[$id] = $true
  }

  if ([string]$event.phase -eq "fixtures") {
    if ($event.participants.Count -lt 3) { return $false }
    $matchIds = @{}
    $orders = @{}
    foreach ($round in @($event.rounds)) {
      foreach ($match in @($round.matches)) {
        $matchId = [string]$match.id
        $order = [int]$match.order
        if ($matchIds.ContainsKey($matchId) -or $orders.ContainsKey($order)) { return $false }
        $matchIds[$matchId] = $true
        $orders[$order] = $true
        if (-not $ids.ContainsKey([string]$match.participantAId)) { return $false }
        if (-not $ids.ContainsKey([string]$match.participantBId)) { return $false }
        if ([string]$match.participantAId -eq [string]$match.participantBId) { return $false }
        if ([string]$match.status -notin @("pending", "completed")) { return $false }
      }
    }
  }

  return $true
}

function Assert-Equal {
  param($Actual, $Expected, [string]$Message)
  if ($Actual -ne $Expected) {
    throw "$Message Expected '$Expected' but got '$Actual'."
  }
}

$document = [PSCustomObject]@{
  format = "mini-league-desk"
  schemaVersion = 1
  appVersion = "0.5.0"
  event = [PSCustomObject]@{
    id = "event-1"
    name = "Test League"
    phase = "fixtures"
    settings = [PSCustomObject]@{
      resultMode = "score"
      scoreDrawsAllowed = $true
    }
    participants = @(
      [PSCustomObject]@{ id = "A"; name = "Alpha" },
      [PSCustomObject]@{ id = "B"; name = "Bravo" },
      [PSCustomObject]@{ id = "C"; name = "Charlie" }
    )
    rounds = @(
      [PSCustomObject]@{
        number = 1
        byeParticipantId = "A"
        matches = @(
          [PSCustomObject]@{ id="m1"; round=1; order=1; participantAId="B"; participantBId="C"; status="completed"; scoreA=4; scoreB=2; result="win"; winnerId="B" }
        )
      },
      [PSCustomObject]@{
        number = 2
        byeParticipantId = "C"
        matches = @(
          [PSCustomObject]@{ id="m2"; round=2; order=2; participantAId="A"; participantBId="B"; status="pending"; scoreA=$null; scoreB=$null; result=$null; winnerId=$null }
        )
      },
      [PSCustomObject]@{
        number = 3
        byeParticipantId = "B"
        matches = @(
          [PSCustomObject]@{ id="m3"; round=3; order=3; participantAId="C"; participantBId="A"; status="completed"; scoreA=1; scoreB=1; result="draw"; winnerId=$null }
        )
      }
    )
    ui = [PSCustomObject]@{
      matchFilter = "pending"
      participantFocusId = "A"
      activePage = "matches"
    }
    createdAt = "2026-10-04T00:00:00.000Z"
    updatedAt = "2026-10-04T01:00:00.000Z"
  }
}

if (-not (Test-EventDocument -Document $document)) { throw "Valid event document was rejected." }

$json = $document | ConvertTo-Json -Depth 20
$restored = $json | ConvertFrom-Json

Assert-Equal ([string]$restored.event.id) "event-1" "Event ID round-trip."
Assert-Equal ([string]$restored.event.settings.resultMode) "score" "Settings round-trip."
Assert-Equal ([string]$restored.event.ui.matchFilter) "pending" "UI filter round-trip."
Assert-Equal ([string]$restored.event.ui.activePage) "matches" "UI page round-trip."

$restoredMatches = @($restored.event.rounds | ForEach-Object { $_.matches } | ForEach-Object { $_ })
Assert-Equal (@($restoredMatches | Where-Object { $_.status -eq "pending" }).Count) 1 "Pending match count round-trip."
Assert-Equal (@($restoredMatches | Where-Object { $_.status -eq "completed" }).Count) 2 "Completed match count round-trip."
Assert-Equal ([int]($restoredMatches | Where-Object { $_.id -eq "m1" }).scoreA) 4 "Score round-trip."

$badSchema = $json | ConvertFrom-Json
$badSchema.schemaVersion = 99
Assert-Equal (Test-EventDocument -Document $badSchema) $false "Unsupported schema must fail."

$badParticipant = $json | ConvertFrom-Json
$badParticipant.event.participants[1].id = "A"
Assert-Equal (Test-EventDocument -Document $badParticipant) $false "Duplicate participant ID must fail."

$badMatch = $json | ConvertFrom-Json
$badMatch.event.rounds[1].matches[0].participantBId = "UNKNOWN"
Assert-Equal (Test-EventDocument -Document $badMatch) $false "Unknown participant in match must fail."

$currentEventId = "current-valid-event"
$invalidImport = $badSchema
if (Test-EventDocument -Document $invalidImport) {
  $currentEventId = [string]$invalidImport.event.id
}
Assert-Equal $currentEventId "current-valid-event" "Invalid import must not replace current state."

Write-Host "[OK] Persistence and JSON backup regression tests passed." -ForegroundColor Green
