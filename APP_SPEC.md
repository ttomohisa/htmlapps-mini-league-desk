# APP_SPEC.md

## 1. Product identity

- **Name:** Mini League Desk
- **Japanese name:** Mini League Desk / ミニリーグ運営
- **Current app version:** v0.9.0
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
- Current v0.9.0 stores the active event locally in addition to the language preference.

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

- Reorder works by a dedicated drag handle and by up/down buttons.
- Drag reordering supports pointer input so mouse and touch users can use the same handle.
- Up/down controls remain available and keyboard accessible; drag is an additional interaction, not the only way to reorder.
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
- a round-robin matrix / head-to-head table showing every participant against every other participant

The Matches screen can switch between the round/list view and the round-robin table. Matrix cells for real matches open that match directly, so the table is not only a read-only summary.

This must answer both “Who does this person still need to play?” and “What is the whole round-robin picture?” without scanning every round card.

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

## 16. Persistence and backup — v0.5.0

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

## 17. Exports — v0.7.0

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

## 18. Current implementation milestone: v0.9.0 Release Candidate

v0.9.0 is the release candidate. Feature scope is frozen; changes in this milestone should be regression fixes, release documentation, screenshots, or verification improvements.

Release-candidate scope:

- all v0.1.0–v0.8.0 functionality remains enabled
- explicit regression coverage for 3, 4, 5, 8, and 16 participant events
- existing 3..64 round-robin invariant coverage remains required
- tie, score, result editing/removal, completion/reopen, persistence, malformed import, export, mobile, and accessibility regressions remain required
- Japanese and English README content is aligned with the actual application
- favicon is the Mini League Desk icon and keeps Browser Kitty brand color `#16624F`
- release screenshots represent the current Mini League Desk UI rather than template/starter content
- desktop and smartphone screenshots are maintained for Japanese and English
- readable standalone, self-extract standalone, and repository-root readable HTML remain the required release artifacts
- runtime CSP keeps `connect-src 'none'`
- no runtime CDN, API, analytics, telemetry, remote font, or hidden network dependency
- privacy statements must match the actual local-processing behavior
- no new tournament format or major feature is added in the release candidate
- release capture verifies 390 CSS px mobile pages with scrollWidth equal to innerWidth
- release screenshots are current Mini League Desk UI in Japanese and English on desktop and smartphone
- RC review fixed a mobile min-content overflow in the event action area before final screenshots
- post-RC user feedback adds spacing below the bulk participant textarea
- participant setup supports drag-handle reordering while retaining keyboard-accessible arrow controls
- Matches provides an explicit Match list / Round-robin table switcher
- round-robin matrix cells show pending/result state and open the corresponding result dialog

## 19. v0.9.0 release-candidate acceptance criteria

### Core event matrix

Explicitly verify the following participant counts in addition to the broader 3..64 invariant suite:

| Participants | Expected matches | Expected rounds | Bye behavior |
| ---: | ---: | ---: | --- |
| 3 | 3 | 3 | one per round |
| 4 | 6 | 3 | none |
| 5 | 10 | 5 | one per round |
| 8 | 28 | 7 | none |
| 16 | 120 | 15 | none |

For each case:

- every unordered pair appears exactly once
- no participant plays themself
- no participant appears twice in one round
- odd counts have complete single-Bye coverage
- even counts have no Bye

### Results / standings / completion

- Win/Loss, Win/Draw/Loss, and Score modes retain their v0.3.0 behavior.
- Shared-rank handling remains intact.
- Score-mode points → difference → score-for ordering remains intact.
- Result add/edit/remove and Undo still recalculate standings and progress.
- Completing all matches enters the completion state.
- Removing or undoing one result after completion reopens the event.

### Persistence / import

- A valid saved event round-trips without changing result mode, UI state, completed/pending matches, or scores.
- Unsupported schema versions are rejected.
- Duplicate participant IDs are rejected.
- Unknown participant references in matches are rejected.
- Invalid import data does not overwrite the current valid event.

### Exports

- Match CSV, standings CSV, standings PNG, and print markers remain present.
- CSV formula-prefix protection remains enabled.
- CSV output keeps a UTF-8 BOM.
- Print output remains isolated from the interactive UI.
- File-producing exports continue to sanitize output names.

### Mobile / i18n / accessibility

- 320–380px narrow-layout protections remain present.
- mobile bottom navigation and toast separation remain present.
- Japanese and English translation-key parity remains enforced.
- static i18n references resolve in both languages.
- focus-visible, aria-pressed, dialog focus restoration, and forced-colors protections remain present.

### Release assets and documentation

- `assets/favicon.svg` exists and is the Mini League Desk icon.
- `assets/screenshot.png` is the current Japanese desktop screenshot.
- `assets/screenshot-mobile.png` is the current Japanese smartphone screenshot.
- `assets/screenshot-en.png` is the current English desktop screenshot.
- `assets/screenshot-mobile-en.png` is the current English smartphone screenshot.
- Japanese README references the Japanese screenshots.
- English README references the English screenshots.
- screenshots must not contain template/starter application UI.

### Standalone / privacy / network

- PowerShell syntax/encoding preflight passes.
- repository check passes.
- readable standalone build passes.
- self-extract build/verification passes when enabled.
- repository-root HTML equals the readable standalone build.
- CSP contains `connect-src 'none'`.
- source has no external runtime script, stylesheet, image, frame, font, API, analytics, or telemetry dependency.
- README privacy claims remain consistent with source and CSP.

### Verification claims

Automated checks may be reported as passed only when their CI jobs pass.

Do not claim real screen-reader, OS print-dialog, real mobile-device, or manual DevTools network-panel verification unless it was actually performed.

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

### v0.5.0 — Persistence — implemented

- local event save/restore
- schema version
- JSON export/import
- corruption handling
- broader Undo state handling

### v0.6.0 — Mobile / UX — implemented

- smartphone bottom tabs
- result-entry optimization
- long-name and narrow-width hardening
- empty/completed/error state polish

### v0.7.0 — Export — implemented

- CSV
- standings image
- print
- editable output filenames

### v0.8.0 — i18n / Accessibility / Polish — implemented

- full bilingual review
- keyboard/accessibility audit
- icon/help/privacy finalization

### v0.9.0 — Release Candidate — implemented

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