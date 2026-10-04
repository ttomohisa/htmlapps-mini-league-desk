$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-ProgressSnapshot {
  param([array]$Matches)

  $ordered = @($Matches | Sort-Object Order)
  $completed = @($ordered | Where-Object { [string]$_.Status -eq "completed" })
  $pending = @($ordered | Where-Object { [string]$_.Status -eq "pending" })
  $percent = if ($ordered.Count -gt 0) {
    [int][Math]::Round(($completed.Count / $ordered.Count) * 100)
  } else {
    0
  }

  return [PSCustomObject]@{
    Matches = $ordered
    Completed = $completed
    Pending = $pending
    Percent = $percent
    Complete = ($ordered.Count -gt 0 -and $pending.Count -eq 0)
  }
}

function Get-ParticipantMatches {
  param(
    [array]$Matches,
    [string]$ParticipantId
  )

  $relevant = @(
    $Matches |
      Where-Object { [string]$_.A -eq $ParticipantId -or [string]$_.B -eq $ParticipantId } |
      Sort-Object Order
  )

  return [PSCustomObject]@{
    Pending = @($relevant | Where-Object { [string]$_.Status -eq "pending" })
    Completed = @($relevant | Where-Object { [string]$_.Status -eq "completed" })
  }
}

function Assert-Equal {
  param($Actual, $Expected, [string]$Message)
  if ($Actual -ne $Expected) {
    throw "$Message Expected '$Expected' but got '$Actual'."
  }
}

$matches = @(
  [PSCustomObject]@{ Id="m4"; Order=4; A="B"; B="C"; Status="pending" },
  [PSCustomObject]@{ Id="m1"; Order=1; A="A"; B="B"; Status="completed" },
  [PSCustomObject]@{ Id="m6"; Order=6; A="C"; B="D"; Status="pending" },
  [PSCustomObject]@{ Id="m2"; Order=2; A="A"; B="C"; Status="pending" },
  [PSCustomObject]@{ Id="m5"; Order=5; A="B"; B="D"; Status="completed" },
  [PSCustomObject]@{ Id="m3"; Order=3; A="A"; B="D"; Status="pending" }
)

$snapshot = Get-ProgressSnapshot -Matches $matches
Assert-Equal $snapshot.Matches.Count 6 "All count."
Assert-Equal $snapshot.Completed.Count 2 "Completed count."
Assert-Equal $snapshot.Pending.Count 4 "Pending count."
Assert-Equal $snapshot.Percent 33 "Progress percent."
Assert-Equal $snapshot.Pending[0].Id "m2" "Next pending match."
Assert-Equal $snapshot.Pending[1].Id "m3" "First following match."
Assert-Equal $snapshot.Pending[2].Id "m4" "Second following match."
Assert-Equal $snapshot.Complete $false "Incomplete event."

$aMatches = Get-ParticipantMatches -Matches $matches -ParticipantId "A"
Assert-Equal $aMatches.Completed.Count 1 "Participant A completed count."
Assert-Equal $aMatches.Completed[0].Id "m1" "Participant A completed opponent match."
Assert-Equal $aMatches.Pending.Count 2 "Participant A pending count."
Assert-Equal $aMatches.Pending[0].Id "m2" "Participant A first pending match."
Assert-Equal $aMatches.Pending[1].Id "m3" "Participant A second pending match."

foreach ($match in $matches) { $match.Status = "completed" }
$complete = Get-ProgressSnapshot -Matches $matches
Assert-Equal $complete.Pending.Count 0 "Completion pending count."
Assert-Equal $complete.Completed.Count 6 "Completion completed count."
Assert-Equal $complete.Percent 100 "Completion percent."
Assert-Equal $complete.Complete $true "Completion state."

$matches[0].Status = "pending"
$reopened = Get-ProgressSnapshot -Matches $matches
Assert-Equal $reopened.Complete $false "Removing one result must reopen event."
Assert-Equal $reopened.Pending[0].Id "m4" "Reopened next match keeps generated order."

Write-Host "[OK] League Desk regression tests passed." -ForegroundColor Green
