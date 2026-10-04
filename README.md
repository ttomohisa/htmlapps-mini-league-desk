# Mini League Desk

[日本語版 README](README.ja.md)

Mini League Desk is a local-first browser tool for running small round-robin events. The final v1 workflow is designed around quickly answering: **who plays next, what is still unfinished, and what are the current standings?**

Current development version: **v0.3.0**

## Current features

v0.3.0 supports setup, round-robin fixtures, result entry, and live standings:

- Enter an optional event name
- Add, reorder, shuffle, and remove participants
- Generate every round-robin matchup exactly once
- Show rounds and odd-roster Byes
- Choose one of three result modes:
  - Win / loss: 1 / 0 league points
  - Win / draw / loss: 3 / 1 / 0
  - Score entry: 3 / 1 / 0, with optional tied-score draws
- Choose any matchup to add or edit a result
- Remove a completed result back to pending
- Undo result add, edit, or removal
- Recalculate standings immediately
- Score mode tiebreaks: league points → score difference → score for
- Preserve shared ranks when all active tiebreak values are identical
- Japanese / English UI
- Responsive desktop and smartphone layout
- No runtime CDN, API, analytics, or telemetry

## How to use

1. Enter an event name and choose how results will be recorded.
2. Add at least three participants.
3. Confirm the participants to generate the fixtures.
4. Choose any matchup.
5. Record the winner, draw, or scores depending on the selected mode.
6. Check the standings as they update.
7. Open a completed matchup to edit or remove its result.

## Ranking rules

Win/Loss mode and Win/Draw/Loss mode sort by league points.

Score mode sorts by:

1. league points
2. score difference
3. score for

Rows with identical active tiebreak values share the same rank. Registration order may keep the display stable, but it never creates a false sporting rank.

## Privacy

Event names, participants, fixtures, results, and standings are processed inside the browser. Runtime network access remains blocked by Content Security Policy and the app does not send event data to a server.

v0.3.0 only stores the language preference. **The event itself is not saved yet**, so reloading or closing the page clears the event and its results. Local persistence is planned for v0.5.0.

## Limitations in v0.3.0

Not yet included:

- dedicated Progress / Matches / Standings navigation
- next-match and remaining-match views
- event completion UI
- event persistence / JSON backup
- CSV, image, or print export

See `APP_SPEC.md` for the remaining roadmap.

## Single HTML / offline use

The build creates `dist/index.html`, `dist/index.self-extract.html`, and `mini-league-desk.html`. The readable HTML is intended to work directly with `file://`.

## Browser support

Primary targets: current Chrome and Edge.

Best effort: current Firefox, Safari, Chrome for Android, and Safari on iPhone.

## Development

Read `AGENTS.md`, `APP_SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/LLM_WORKFLOW.md` before changing the app.

Editable source: `src/index.template.html`.

## Build

```powershell
.\build-standalone.bat
```

Repository verification:

```powershell
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-powershell-syntax.ps1
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-repository.ps1
```

## License

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
