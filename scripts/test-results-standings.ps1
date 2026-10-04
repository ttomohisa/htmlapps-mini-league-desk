$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-Standings {
  param(
    [array]$Participants,
    [array]$Matches,
    [string]$Mode,
    [bool]$DrawsAllowed = $true
  )

  if ($Mode -eq "winLoss") {
    $winPoints = 1
    $drawPoints = 0
    $scoreBased = $false
  } else {
    $winPoints = 3
    $drawPoints = 1
    $scoreBased = ($Mode -eq "score")
  }

  $rows = @()
  for ($index = 0; $index -lt $Participants.Count; $index += 1) {
    $rows += [PSCustomObject]@{
      Id = [string]$Participants[$index]
      DisplayOrder = $index
      Played = 0
      Wins = 0
      Draws = 0
      Losses = 0
      ScoreFor = 0
      ScoreAgainst = 0
      Difference = 0
      Points = 0
      Rank = $null
    }
  }

  $byId = @{}
  foreach ($row in $rows) { $byId[$row.Id] = $row }
  $completed = 0

  foreach ($match in $Matches) {
    if ([string]$match.Status -ne "completed") { continue }
    $a = $byId[[string]$match.A]
    $b = $byId[[string]$match.B]
    $completed += 1
    $a.Played += 1
    $b.Played += 1

    if ($scoreBased) {
      $a.ScoreFor += [int]$match.ScoreA
      $a.ScoreAgainst += [int]$match.ScoreB
      $b.ScoreFor += [int]$match.ScoreB
      $b.ScoreAgainst += [int]$match.ScoreA
    }

    if ([string]$match.Result -eq "draw") {
      if (-not $DrawsAllowed) { throw "Draw encountered while draws are disabled." }
      $a.Draws += 1
      $b.Draws += 1
      $a.Points += $drawPoints
      $b.Points += $drawPoints
    } elseif ([string]$match.Winner -eq $a.Id) {
      $a.Wins += 1
      $b.Losses += 1
      $a.Points += $winPoints
    } elseif ([string]$match.Winner -eq $b.Id) {
      $b.Wins += 1
      $a.Losses += 1
      $b.Points += $winPoints
    } else {
      throw "Completed match has no valid result."
    }
  }

  foreach ($row in $rows) {
    $row.Difference = $row.ScoreFor - $row.ScoreAgainst
  }

  if ($scoreBased) {
    $sortProperties = @(
      @{ Expression = { $_.Points }; Descending = $true },
      @{ Expression = { $_.Difference }; Descending = $true },
      @{ Expression = { $_.ScoreFor }; Descending = $true },
      @{ Expression = { $_.DisplayOrder }; Descending = $false }
    )
  } else {
    $sortProperties = @(
      @{ Expression = { $_.Points }; Descending = $true },
      @{ Expression = { $_.DisplayOrder }; Descending = $false }
    )
  }
  $rows = @($rows | Sort-Object -Property $sortProperties)

  $previousKey = $null
  $previousRank = $null
  for ($index = 0; $index -lt $rows.Count; $index += 1) {
    $row = $rows[$index]
    if ($completed -eq 0) {
      $row.Rank = $null
      continue
    }

    $key = if ($scoreBased) {
      "$($row.Points)|$($row.Difference)|$($row.ScoreFor)"
    } else {
      "$($row.Points)"
    }

    if ($index -gt 0 -and $key -eq $previousKey) {
      $row.Rank = $previousRank
    } else {
      $row.Rank = $index + 1
    }
    $previousKey = $key
    $previousRank = $row.Rank
  }

  return @($rows)
}

function Test-ScorePair {
  param($ScoreA, $ScoreB, [bool]$DrawsAllowed)
  if ($ScoreA -isnot [int] -or $ScoreB -isnot [int]) { return $false }
  if ($ScoreA -lt 0 -or $ScoreB -lt 0 -or $ScoreA -gt 999999 -or $ScoreB -gt 999999) { return $false }
  if ($ScoreA -eq $ScoreB -and -not $DrawsAllowed) { return $false }
  return $true
}

function Assert-Equal {
  param($Actual, $Expected, [string]$Message)
  if ($Actual -ne $Expected) {
    throw "$Message Expected '$Expected' but got '$Actual'."
  }
}

$participants = @("A", "B", "C")

$winLossMatches = @(
  [PSCustomObject]@{ Status="completed"; A="A"; B="B"; Result="win"; Winner="A"; ScoreA=$null; ScoreB=$null },
  [PSCustomObject]@{ Status="completed"; A="B"; B="C"; Result="win"; Winner="B"; ScoreA=$null; ScoreB=$null },
  [PSCustomObject]@{ Status="completed"; A="A"; B="C"; Result="win"; Winner="A"; ScoreA=$null; ScoreB=$null }
)
$rows = @(Get-Standings -Participants $participants -Matches $winLossMatches -Mode "winLoss" -DrawsAllowed $false)
Assert-Equal $rows[0].Id "A" "Win/Loss leader."
Assert-Equal $rows[0].Points 2 "Win/Loss points."
Assert-Equal $rows[1].Id "B" "Win/Loss second."
Assert-Equal $rows[2].Points 0 "Win/Loss loser points."

$drawMatches = @(
  [PSCustomObject]@{ Status="completed"; A="A"; B="B"; Result="draw"; Winner=$null; ScoreA=$null; ScoreB=$null },
  [PSCustomObject]@{ Status="completed"; A="A"; B="C"; Result="win"; Winner="A"; ScoreA=$null; ScoreB=$null },
  [PSCustomObject]@{ Status="completed"; A="B"; B="C"; Result="win"; Winner="B"; ScoreA=$null; ScoreB=$null }
)
$rows = @(Get-Standings -Participants $participants -Matches $drawMatches -Mode "winDrawLoss")
Assert-Equal $rows[0].Points 4 "Draw mode first points."
Assert-Equal $rows[1].Points 4 "Draw mode second points."
Assert-Equal $rows[0].Rank 1 "Shared rank first."
Assert-Equal $rows[1].Rank 1 "Shared rank second."
Assert-Equal $rows[2].Rank 3 "Competition rank after tie."

$scoreMatches = @(
  [PSCustomObject]@{ Status="completed"; A="A"; B="B"; Result="win"; Winner="A"; ScoreA=2; ScoreB=0 },
  [PSCustomObject]@{ Status="completed"; A="C"; B="A"; Result="win"; Winner="C"; ScoreA=3; ScoreB=1 },
  [PSCustomObject]@{ Status="completed"; A="B"; B="C"; Result="win"; Winner="B"; ScoreA=5; ScoreB=1 }
)
$rows = @(Get-Standings -Participants $participants -Matches $scoreMatches -Mode "score")
Assert-Equal $rows[0].Id "B" "Score tiebreak leader."
Assert-Equal $rows[0].Difference 2 "Score tiebreak difference."
Assert-Equal $rows[1].Id "A" "Score tiebreak second."
Assert-Equal $rows[2].Id "C" "Score tiebreak third."

$circleMatches = @(
  [PSCustomObject]@{ Status="completed"; A="A"; B="B"; Result="win"; Winner="A"; ScoreA=1; ScoreB=0 },
  [PSCustomObject]@{ Status="completed"; A="B"; B="C"; Result="win"; Winner="B"; ScoreA=1; ScoreB=0 },
  [PSCustomObject]@{ Status="completed"; A="C"; B="A"; Result="win"; Winner="C"; ScoreA=1; ScoreB=0 }
)
$rows = @(Get-Standings -Participants $participants -Matches $circleMatches -Mode "score")
foreach ($row in $rows) {
  Assert-Equal $row.Points 3 "Complete tie points."
  Assert-Equal $row.Difference 0 "Complete tie difference."
  Assert-Equal $row.ScoreFor 1 "Complete tie score for."
  Assert-Equal $row.Rank 1 "Complete tie rank."
}

$emptyRows = @(Get-Standings -Participants $participants -Matches @() -Mode "winLoss" -DrawsAllowed $false)
foreach ($row in $emptyRows) {
  if ($null -ne $row.Rank) { throw "Empty standings must not assign a rank." }
}

Assert-Equal (Test-ScorePair -ScoreA 2 -ScoreB 2 -DrawsAllowed $false) $false "Equal score must fail when draws are disabled."
Assert-Equal (Test-ScorePair -ScoreA 2 -ScoreB 2 -DrawsAllowed $true) $true "Equal score must pass when draws are enabled."
Assert-Equal (Test-ScorePair -ScoreA -1 -ScoreB 2 -DrawsAllowed $true) $false "Negative score must fail."
Assert-Equal (Test-ScorePair -ScoreA 1000000 -ScoreB 2 -DrawsAllowed $true) $false "Oversized score must fail."

Write-Host "[OK] Result and standings regression tests passed." -ForegroundColor Green
