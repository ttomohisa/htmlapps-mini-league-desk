$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function New-RoundRobinSchedule {
  param([int]$ParticipantCount)

  if ($ParticipantCount -lt 3) { throw "ParticipantCount must be at least 3." }

  $rotation = @(0..($ParticipantCount - 1))
  if (($ParticipantCount % 2) -eq 1) {
    $rotation += $null
  }

  $roundCount = $rotation.Count - 1
  $matchesPerRound = [int]($rotation.Count / 2)
  $rounds = @()

  for ($roundIndex = 0; $roundIndex -lt $roundCount; $roundIndex += 1) {
    $matches = @()
    $bye = $null

    for ($pairIndex = 0; $pairIndex -lt $matchesPerRound; $pairIndex += 1) {
      $a = $rotation[$pairIndex]
      $b = $rotation[$rotation.Count - 1 - $pairIndex]

      if ($null -eq $a -or $null -eq $b) {
        if ($null -eq $a) { $bye = $b } else { $bye = $a }
        continue
      }

      $matches += [PSCustomObject]@{ A = [int]$a; B = [int]$b }
    }

    $rounds += [PSCustomObject]@{ Matches = @($matches); Bye = $bye }

    $middle = @($rotation[1..($rotation.Count - 2)])
    $rotation = @($rotation[0], $rotation[$rotation.Count - 1]) + $middle
  }

  return @($rounds)
}

foreach ($participantCount in 3..64) {
  $rounds = @(New-RoundRobinSchedule -ParticipantCount $participantCount)
  $expectedRoundCount = if (($participantCount % 2) -eq 0) { $participantCount - 1 } else { $participantCount }
  if ($rounds.Count -ne $expectedRoundCount) {
    throw "Unexpected round count for $participantCount participants: $($rounds.Count)."
  }

  $expectedMatchCount = [int]($participantCount * ($participantCount - 1) / 2)
  $matchCount = 0
  $pairs = @{}
  $byes = @{}

  foreach ($round in $rounds) {
    $active = @{}

    foreach ($match in @($round.Matches)) {
      $a = [int]$match.A
      $b = [int]$match.B

      if ($a -eq $b) { throw "Self match found for $participantCount participants." }
      if ($active.ContainsKey($a) -or $active.ContainsKey($b)) {
        throw "Participant appears twice in one round for $participantCount participants."
      }
      $active[$a] = $true
      $active[$b] = $true

      $low = [Math]::Min($a, $b)
      $high = [Math]::Max($a, $b)
      $key = ([string]$low + ":" + [string]$high)
      if ($pairs.ContainsKey($key)) { throw "Duplicate pair $key for $participantCount participants." }
      $pairs[$key] = $true
      $matchCount += 1
    }

    if (($participantCount % 2) -eq 1) {
      if ($null -eq $round.Bye) { throw "Missing Bye for $participantCount participants." }
      $bye = [int]$round.Bye
      if ($active.ContainsKey($bye)) { throw "Bye participant also plays in the same round for $participantCount participants." }
      if ($byes.ContainsKey($bye)) { throw "Participant receives more than one Bye for $participantCount participants." }
      $byes[$bye] = $true
    } elseif ($null -ne $round.Bye) {
      throw "Unexpected Bye for even participant count $participantCount."
    }
  }

  if ($matchCount -ne $expectedMatchCount) {
    throw "Unexpected match count for $participantCount participants: $matchCount."
  }
  if ($pairs.Count -ne $expectedMatchCount) {
    throw "Pair coverage mismatch for $participantCount participants."
  }
  if (($participantCount % 2) -eq 1 -and $byes.Count -ne $participantCount) {
    throw "Bye coverage mismatch for $participantCount participants."
  }
}

Write-Host "[OK] Round-robin invariant tests passed for participant counts 3..64." -ForegroundColor Green
