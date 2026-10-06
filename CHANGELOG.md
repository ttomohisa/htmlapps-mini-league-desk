# Changelog

## 0.9.0 - Release Candidate - 2026-10-04

- Changed the hero copy to remove the comma in the Japanese headline.
- Moved participant entry under the list: one full-width dashed + Add participant card and the previous disclosure-style bulk-add UI.
- Added inline participant-name editing with validation and Undo.
- Reworked drag to a pointer-following floating card with a separate placeholder, animated sibling reflow, global release/cancel handling, and drop animation.
- Replaced the app icon / favicon with the approved lightweight Mini League Desk SVG.
- Changed the local-processing badge from `端末内で処理` to `完全ローカル処理` and aligned the English badge to `Fully local processing`.
- Froze feature scope for the release candidate.
- Added an explicit 3 / 4 / 5 / 8 / 16 participant RC matrix on top of the existing 3..64 invariant suite.
- Added release-candidate checks for screenshots, favicon, README references, standalone artifacts, CSP, and external runtime resources.
- Replaced the original template/starter screenshots with current Mini League Desk screenshots.
- Added Japanese and English desktop and smartphone screenshots.
- Fixed a mobile min-content overflow found during 390 CSS px release capture.
- Verified release capture at 390 CSS px with scrollWidth equal to innerWidth.
- Finalized Japanese / English README content for the release candidate.
- Kept runtime network access blocked and added no third-party runtime dependency.
- Increased spacing between the bulk participant textarea and its Add all button.
- Added pointer/touch drag-handle reordering for participants while keeping the existing arrow controls.
- Added a Match list / Round-robin table switcher to the Matches screen.
- Added an interactive round-robin matrix whose match cells open result entry directly.

## 0.8.0 - i18n / Accessibility / Polish - 2026-10-04

- Localized League Desk navigation, event-progress, and match-filter accessible names.
- Added translation-key parity and static i18n-reference regression checks.
- Added aria-pressed state for match filters and current result choices.
- Added aria-describedby relationships for result, export, backup, and score-validation content.
- Added dialog opener/focus restoration, including match-focused return after result entry.
- Added select focus-visible coverage and forced-colors support.
- Added list/listitem semantics to standings.
- Replaced stale early-development help fallback text and finalized privacy/help wording.
- Localized standings-PNG record headings.
- Updated Japanese / English README files, specification, and version metadata.
- Kept runtime network access blocked and added no third-party runtime dependency.

## 0.7.0 - Export - 2026-10-04

- Added editable local export dialog available during an event and from the completed-event state.
- Added UTF-8 BOM match-results CSV with spreadsheet formula-prefix protection.
- Added mode-aware standings CSV using the same standings calculation as the UI.
- Added local Canvas standings PNG generation with Browser Kitty branding.
- Added print-only standings and full match-results layout.
- Added safe filename handling with format-specific suffixes and extensions.
- Added export regression checks and updated Japanese / English documentation and version metadata.
- Kept runtime network access blocked and added no third-party runtime dependency.

## 0.6.0 - Mobile / UX - 2026-10-04

- Hardened smartphone bottom-tab spacing and moved event toasts above the fixed navigation.
- Added a 380px narrow-screen matchup layout that prioritizes long participant names.
- Increased smartphone result-choice, score-input, and dialog action touch targets.
- Added current-result display and active-choice highlighting when editing completed matches.
- Added select-on-focus behavior for faster score correction.
- Converted JSON backup dialog to a smartphone bottom sheet with full-width actions.
- Expanded very-narrow participant action buttons to 44px touch targets.
- Added Show all matches recovery from empty match-filter states.
- Updated mobile help copy and added Mobile / UX regression checks.
- Kept runtime network access blocked and added no third-party runtime dependency.

## 0.5.0 - Persistence / JSON Backup - 2026-10-04

- Added schemaVersion 1 event persistence using browser local storage.
- Added event ID, createdAt, and updatedAt metadata.
- Added automatic save/restore for setup, fixtures, results, and League Desk UI state.
- Added JSON backup export with editable sanitized filenames.
- Added JSON import with strict validation before state replacement.
- Added incompatible-schema and malformed-data rejection without overwriting the current event.
- Added replacement confirmation and Undo after successful import.
- Added visible fallback guidance when browser local storage cannot save.
- Added persistence regression tests and updated Japanese / English documentation and version metadata.
- Kept runtime network access blocked and added no third-party runtime dependency.

## 0.4.0 - League Desk - 2026-10-04

- Added Progress / Matches / Standings as the primary in-event workflow.
- Added a safe-area-aware smartphone bottom page bar adapted from the canonical mobile-bottom-bar component.
- Added completed/pending/progress summaries, next match, and two following match suggestions.
- Added All / Pending / Completed match filters.
- Added per-participant pending and completed opponent views with direct match access.
- Added automatic event completion when no pending matches remain.
- Added final standings to the completion state.
- Updated every result mutation and Undo path to refresh progress, matches, participant status, and standings together.
- Added League Desk regression tests and updated Japanese / English documentation and version metadata.
- Kept runtime network access blocked and added no third-party runtime dependency.

## 0.3.0 - Results & Standings - 2026-10-04

- Added Win/Loss, Win/Draw/Loss, and Score result modes.
- Added score-mode draw control and integer score validation.
- Added tap/click result entry, result editing, and result removal for every matchup.
- Added Undo for result add, edit, and removal.
- Added live standings with Played/W/D/L and league points.
- Added score-mode Score For, Score Against, Score Difference, and tiebreak sorting.
- Added shared-rank handling when all active tiebreak values are identical.
- Added confirmation before returning to setup when recorded results would be discarded.
- Added result/standings regression tests and updated Japanese / English help, README files, specification, and version metadata.
- Kept runtime network access blocked and added no third-party runtime dependency.

## 0.2.0 - Round Robin / Fixture generation - 2026-10-04

- Added circle-method round-robin fixture generation from the confirmed roster.
- Added round grouping, total match/round counts, and a dedicated fixture view.
- Added one localized Bye per round for odd participant counts.
- Added pending match records compatible with the upcoming result-entry milestone.
- Added runtime invariant validation before a generated schedule is displayed.
- Added repository regression tests for all participant counts from 3 through 64, covering pair uniqueness, self-matches, per-round duplication, match totals, and Bye allocation.
- Updated Japanese / English help, README files, specification, and version metadata for v0.2.0.
- Kept runtime network access blocked and added no third-party runtime dependency.

## 0.1.0 - Foundation / Event setup - 2026-10-04

- Replaced the starter demo with Mini League Desk.
- Added event-name entry and participant management.
- Added individual and atomic multiline participant entry with duplicate and length validation.
- Added accessible up/down reordering, shuffle with Undo, and participant removal with Undo.
- Added a confirmed-roster review state available from three participants.
- Added full reset through the reusable confirmation dialog.
- Added responsive Japanese / English UI, local-processing privacy copy, empty/error/help states, and the Mini League Desk favicon.
- Updated product metadata, repository documentation, and the formal specification for the v0.1.0 → v1.0.0 roadmap.
- Kept runtime network access blocked and added no third-party runtime dependency.
