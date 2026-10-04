# Mini League Desk

[日本語版 README](README.ja.md)

Mini League Desk is a local-first browser tool for running small round-robin events. It is designed around quickly answering: **who plays next, what is still unfinished, and what are the current standings?**

Current development version: **v0.4.0**

## Current features

v0.4.0 adds the League Desk workflow used while an event is running:

- Event setup and three result modes
- Complete round-robin fixture generation
- Result add / edit / removal with Undo
- Live standings and shared ranks
- **Progress** view with completed, pending, percentage, next match, and following matches
- **Matches** view with All / Pending / Completed filters
- Per-participant pending and completed opponent lists
- **Standings** view with the current table
- Automatic event completion when every match has a result
- Final standings shown in the completion state
- Smartphone bottom tabs for Progress / Matches / Standings
- Desktop layout that keeps key event information visible together
- Japanese / English UI
- No runtime CDN, API, analytics, or telemetry

## Event workflow

1. Enter an event name and choose a result mode.
2. Add at least three participants and generate the round-robin schedule.
3. Use **Progress** to see what is next.
4. Enter a result from the next-match card or from any matchup.
5. Use **Matches** to find pending/completed matches or see one participant's remaining opponents.
6. Use **Standings** to check the live table.
7. When no pending matches remain, the event automatically shows its completion state and final standings.

The suggested next match is the first pending match in generated order. It is never a lock: any pending match may be completed first.

## Result and ranking rules

- Win / loss: win 1, loss 0
- Win / draw / loss: win 3, draw 1, loss 0
- Score entry: win 3, draw 1, loss 0; tied scores can be enabled or disabled

Non-score modes rank by league points. Score mode ranks by league points → score difference → score for. Identical active tiebreak values share the same rank.

## Privacy

Event names, participants, fixtures, results, progress, and standings are processed inside the browser. Runtime network access remains blocked by Content Security Policy and the app does not send event data to a server.

v0.4.0 only stores the language preference. **The event itself is not saved yet**, so reloading or closing the page clears the event and its results. Local persistence is planned for v0.5.0.

## Limitations in v0.4.0

Not yet included:

- local event persistence
- JSON backup / restore
- CSV, image, or print export
- final release-stage mobile/accessibility polish

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
