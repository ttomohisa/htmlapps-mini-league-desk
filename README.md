# Mini League Desk

[日本語版 README](README.ja.md)

Mini League Desk is a local-first browser tool for running small round-robin events. It is designed around quickly answering: **who plays next, what is still unfinished, and what are the current standings?**

Current development version: **v0.6.0**

## Current features

v0.6.0 keeps the existing League Desk and persistence features, with a stronger smartphone workflow:

- Event setup and three result modes
- Complete round-robin fixture generation
- Result add / edit / removal with Undo
- Progress / Matches / Standings workflow
- Per-participant pending/completed opponents
- Automatic event completion and final standings
- Local automatic save and JSON backup / restore
- Smartphone fixed bottom tabs for Progress / Matches / Standings
- Narrow-screen matchup cards that reflow participant names before result/status
- Larger result controls and score fields on phones
- Current-result highlighting when editing completed matches
- Fast score correction by selecting the existing score on focus
- Toasts positioned above the mobile bottom navigation
- Mobile bottom-sheet JSON backup dialog
- Empty match-filter recovery with **Show all matches**
- Japanese / English UI
- No runtime CDN, API, analytics, or telemetry

## Smartphone workflow

On phones, the event is split into three bottom-tab pages:

- **Progress** — next match, following matches, completed/pending counts, completion state
- **Matches** — filters, participant-specific remaining/completed opponents, result entry
- **Standings** — current ranking

The fixed bottom navigation is safe-area aware. Toast notifications and reachable content are kept above it.

At very narrow widths, matchup cards place the two participant names on the first row and result/status on the second row to avoid squeezing long names.

## Result correction

Opening a completed match shows its current recorded result. In Win/Loss or Win/Draw/Loss modes, the active choice is highlighted. In Score mode, the current score is shown and focusing a score field selects the existing value for quick replacement.

## Persistence and privacy

The active event is saved locally in the browser. JSON backup is available for portability and recovery.

Event names, participants, fixtures, results, progress, standings, and backups are processed locally. Runtime network access remains blocked by Content Security Policy.

## Limitations in v0.6.0

Not yet included:

- CSV export
- standings image export
- print layout
- final i18n/accessibility release audit
- release-candidate screenshots and broad browser/device regression

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
