# APP_SPEC.md

## 1. Product identity

- **Name:** Mini League Desk
- **Japanese name:** Mini League Desk / ミニリーグ運営
- **Current app version:** v0.4.0
- **Target stable release:** v1.0.0
- **One-sentence purpose:** Small-event organizers can prepare a round-robin event, record results, see what is next, find remaining matches, and check standings without accounts or a server.
- **Primary users:** Organizers of small table-tennis, badminton, futsal, board-game, card-game, school, club, office, and casual round-robin events.
- **Typical scale:** 3–16 participants. The UI may support larger rosters where browser performance remains reasonable.
- **Release artifacts:** `dist/index.html`, `dist/index.self-extract.html`, and the repository-root readable copy `mini-league-desk.html`.

## 2. Product definition

Mini League Desk is not a general tournament-management platform.

The core repeated questions are:

1. Who plays next?
2. What matches are still unfinished?
3. Who does a specific participant still need to play?
4. What are the current standings?
5. How far through the event are we?

The product should make those answers quick to reach on a phone while an event is running.

## 3. Non-goals for v1.0.0

Do not add these before v1.0.0 unless this specification is intentionally revised:

- knockout brackets
- Swiss pairing
- group stage + knockout
- user accounts
- server-side storage
- real-time multi-device synchronization
- spectator publishing URLs
- detailed venue scheduling
- team-member management
- Elo/rating systems
- social-network features
- large-event administration

## 4. Runtime and privacy contract

- The app must work as a self-contained HTML file opened directly with `file://`.
- Runtime CDN, API, analytics, telemetry, remote fonts, and hidden network dependencies are prohibited.
- Keep `connect-src 'none'`.
- Event names, participant names, fixtures, scores, and standings must remain in the browser unless the user explicitly exports data.
- No user account is required.
- `assets/favicon.svg` is the canonical app icon.
- Japanese and English live in the same HTML.
- Desktop and smartphone layouts are first-class.
- Current v0.4.0 stores only the language preference. Event draft persistence intentionally starts at v0.5.0.

## 5. Event setup

### 5.1 Event name

- Optional.
- Maximum 100 characters.
- Trim surrounding whitespace for the committed event name.
- If blank when setup is confirmed, use the localized default `新しい大会` / `New event`.

### 5.2 Participants

- Minimum for confirming setup: 3.
- Current hard maximum: 64.
- Maximum participant-name length: 80 Unicode code points.
- Trim surrounding whitespace and collapse runs of whitespace when a name is added.
- Blank names are invalid.
- Duplicate participant names are invalid.
- Duplicate comparison is case-insensitive after normalization.
- Participant identity must use internal IDs, not names.

### 5.3 Add methods

Support:

- one-at-a-time participant entry
- multiline paste, one participant per line
- blank-line removal in multiline input
- reorder
- shuffle
- removal
- full reset

Bulk add is atomic. If the batch contains an invalid name, duplicate, or would exceed the participant limit, add none of the batch.

### 5.4 Reorder and removal

- Reorder must work by buttons; drag-and-drop is not required.
- Up/down controls must be keyboard accessible.
- Removing one participant is immediate and offers Undo.
- Shuffle is immediate and offers Undo.
- Full reset requires a confirmation dialog because it clears multiple fields at once.

## 6. Setup phases

The v0.2.0 state model is:

```text
setup
fixtures
```

### setup

Event name and participants are editable.

### fixtures

Confirming a roster of at least three participants generates the round-robin schedule and shows it by round. Returning to setup invalidates the generated schedule; confirming again generates a fresh schedule from the current roster.

## 7. Round-robin fixtures — v0.2.0

For `n` participants, generate exactly:

```text
n × (n - 1) / 2
```

matches.

Requirements:

- every unordered participant pair occurs exactly once
- no participant plays themself
- no duplicate pair exists
- organize matches into rounds using a standard round-robin/circle-method schedule
- odd participant counts produce one localized `休み` / `Bye` per round
- round order helps display and default progression but does not block entering later matches first

## 8. Match state — v0.3.0

Each match has:

```text
id
round
order
participantAId
participantBId
status
scoreA
scoreB
result
winnerId
```

v1 states:

- `pending`
- `completed`

Do not add in-progress, delayed, forfeit, or cancelled states before they have a clear user need.

## 9. Result modes — v0.3.0

Support three presets.

### Win/loss

- win = 1 league point
- loss = 0

### Win/draw/loss

- win = 3
- draw = 1
- loss = 0

### Score entry

- enter both scores as non-negative whole numbers from 0 through 999999
- win = 3 league points
- draw = 1
- loss = 0
- derive win/draw/loss from the scores
- a setup checkbox controls whether equal scores are accepted; it is enabled by default
- when draws are disabled, equal scores cannot be committed

## 10. Standings — v0.3.0

Recalculate immediately after every result add, edit, or removal.

For score-based events, sort by:

1. league points
2. score difference
3. score for

For modes without scores, sort by league points only.

If every active tiebreak value is identical, participants share the same rank. Never use name or registration order to create a false sporting rank.

Direct-head-to-head tiebreak is out of scope for v1.0.0.

## 11. Main navigation — v0.4.0

Smartphone primary destinations:

```text
進行 / Progress
対戦 / Matches
順位 / Standings
```

Use the canonical mobile bottom-tab pattern when implemented.

Desktop may show more information simultaneously when it improves event operation.

## 12. Progress screen — v0.4.0

Show:

- event name
- completed match count
- total match count
- progress
- next pending match
- following pending matches
- remaining match count

Default next match is the first remaining match in generated order.

This is a suggestion, not a lock. Any pending match may be opened and completed.

## 13. Remaining matches — v0.4.0

Provide:

- all remaining matches
- all completed matches
- all matches
- per-participant completed opponents
- per-participant remaining opponents

This must answer “Who does this person still need to play?” without scanning the full fixture table.

## 14. Result editing — v0.3.0 onward

Completed matches can be opened to:

- edit the result
- remove the result and return the match to pending

All dependent standings and progress values must update immediately.

Where practical, result add/edit/removal should offer Undo.

## 15. Completion — v0.4.0 onward

The event is automatically considered complete when every match is completed.

Do not require a separate “End tournament” action.

Completion UI shows at least:

- completion confirmation
- final standings
- export entry points once exports exist

## 16. Persistence and backup — v0.5.0 target

Persist the active event locally.

Persist at least:

```text
schemaVersion
event id
event name
settings
participants
participant order
matches
results
createdAt
updatedAt
```

Requirements:

- reload restores the same event
- restored standings equal pre-reload standings
- restored remaining matches equal pre-reload remaining matches
- incompatible or malformed imported data must not overwrite valid current state

### JSON backup

Provide explicit JSON export and import.

JSON export is the portability/backup path when browser site data is cleared or another device is used.

## 17. Exports — v0.7.0 target

### CSV

Export match results and standings.

### Standings image

Generate a shareable local image containing at least:

- event name
- rank
- participant
- key record/points fields relevant to the selected scoring mode

### Print

Provide print CSS for standings and results.

Every file-producing feature must offer an editable safe filename before saving.

## 18. Current implementation milestone: v0.4.0

v0.4.0 turns the fixture/result view into the League Desk workflow used during an event.

Implemented behavior:

- all setup, round-robin, result-entry, Undo, and standings behavior from v0.1.0–v0.3.0
- Progress / Matches / Standings primary destinations
- canonical smartphone bottom page tabs for those three destinations
- desktop overview keeps Progress and Standings visible together, with Matches below
- completed / pending / progress percentage summary
- next pending match is the first pending match by generated global order
- up to two following pending matches are shown
- next/following matches open result entry directly
- All / Pending / Completed match filters
- per-participant pending and completed opponent views
- participant opponent entries open the corresponding match directly
- event automatically becomes complete when no pending matches remain
- completion view shows final standings and a direct path to the Standings page
- all League Desk surfaces refresh immediately after result add/edit/remove and Undo
- Japanese and English League Desk UI
- no runtime network

Not implemented in v0.4.0:

- local event persistence
- JSON backup / restore
- CSV/image/print exports
- release-stage mobile/accessibility polish beyond the current responsive implementation

## 19. v0.4.0 acceptance criteria

### Progress

- Completed, pending, and progress percentage derive from match state rather than separate counters.
- The next match is the lowest-order pending match.
- Following matches are the next two pending matches by generated order.
- Any pending match may still be opened from the Matches page regardless of the suggested order.
- Entering, editing, removing, or undoing a result refreshes Progress immediately.
- The Pending shortcut switches the Matches view to its Pending filter.
- When all matches are completed, the normal next-match state is replaced by the completion state.

### Matches

- All, Pending, and Completed filters show the correct counts and matches.
- A filter with no matches shows an explicit empty state.
- Filtering never changes match data.
- Selecting a participant shows every pending opponent and every completed opponent for that participant.
- Participant-specific opponent entries open the exact corresponding match.
- Long participant names remain wrapping-safe.

### Standings / completion

- Standings retain the v0.3.0 ranking behavior.
- Completion is automatic when total matches are non-zero and pending matches equal zero.
- Completion UI shows the final standings.
- Removing or undoing a result after completion returns the event to an in-progress state.

### Responsive / navigation

- Smartphone primary navigation is Progress / Matches / Standings in a safe-area-aware fixed bottom bar.
- At smartphone widths only the selected League Desk page is shown.
- Desktop keeps the event dashboard in normal document flow and provides quick section navigation.
- Bottom navigation is hidden during setup.
- The bottom bar must not cover reachable page content.

### Regression / build

- Existing round-robin tests for 3..64 participants continue to pass.
- Existing result/standings tests continue to pass.
- League Desk regression tests cover next-match order, following matches, filters, per-participant pending/completed opponents, and completion.
- `window.AppMobileBottomBar` remains available from the adapted canonical component.
- PowerShell syntax preflight and repository check must pass.
- Do not claim real-device/manual-network verification unless it was actually performed.

## 20. Planned development sequence

### v0.2.0 — Round Robin — implemented

- round-robin algorithm
- rounds
- odd-count Bye
- fixture view
- pairing invariant tests

### v0.3.0 — Results & Standings — implemented

- result modes
- score entry
- result edit/remove
- standings
- shared rank handling

### v0.4.0 — League Desk — implemented

- Progress / Matches / Standings workflow
- next match
- remaining matches
- participant remaining-opponent view
- event completion

### v0.5.0 — Persistence

- local event save/restore
- schema version
- JSON export/import
- corruption handling
- broader Undo state handling

### v0.6.0 — Mobile / UX

- smartphone bottom tabs
- result-entry optimization
- long-name and narrow-width hardening
- empty/completed/error state polish

### v0.7.0 — Export

- CSV
- standings image
- print
- editable output filenames

### v0.8.0 — i18n / Accessibility / Polish

- full bilingual review
- keyboard/accessibility audit
- icon/help/privacy finalization

### v0.9.0 — Release Candidate

- regression testing
- 3/4/5/8/16 participant cases
- tie/result/persistence/import tests
- README and screenshots
- standalone and privacy checks

### v1.0.0 — Stable

- release fixes only
- final regression
- version alignment
- final screenshots
- final standalone/network/privacy verification

## 21. Browser targets

Primary:

- current Chrome
- current Edge

Best effort:

- current Safari
- current Firefox
- Chrome for Android
- Safari on iPhone

Avoid browser APIs that are unnecessary for this product.

## 22. Accessibility

At minimum:

- semantic buttons and fields
- explicit labels
- visible focus
- keyboard operation
- `aria-label` for icon-only actions
- `aria-live` for relevant dynamic status
- sufficient contrast
- state not communicated by color alone
- reduced-motion support

## 23. Implementation priority

When scope conflicts arise:

```text
correct event state
→ understandable workflow
→ mobile usability
→ error recovery
→ visual polish
→ additional features
```

The goal is not to accumulate tournament features. The goal is to make a small round-robin event easy to run.