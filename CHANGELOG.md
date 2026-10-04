# Changelog

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
