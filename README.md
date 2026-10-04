# Mini League Desk

[日本語版 README](README.ja.md)

Mini League Desk is a local-first browser tool for running small round-robin events. It is designed around quickly answering: **who plays next, what is still unfinished, and what are the current standings?**

Current development version: **v0.5.0**

## Current features

v0.5.0 adds local persistence and JSON backup to the existing League Desk workflow:

- Event setup and three result modes
- Complete round-robin fixture generation
- Result add / edit / removal with Undo
- Progress / Matches / Standings workflow
- Per-participant remaining/completed opponent views
- Automatic event completion and final standings
- **Automatic local event save**
- Reload and continue the same event in the same browser context
- Schema-versioned event data with event ID and timestamps
- **JSON backup export** with an editable safe filename
- **JSON import** with strict validation before replacement
- Confirmation before replacing an existing event
- Undo after a successful replacement import
- Japanese / English UI
- No runtime CDN, API, analytics, or telemetry

## Persistence

Mini League Desk stores the active event in browser local storage. Setup drafts, participants, settings, fixtures, results, and League Desk UI state are included.

If saved local data is malformed or uses an unsupported schema version, it is not applied to the app.

Browser storage can be cleared by the browser or operating system, so JSON backup is the portability and recovery path for important events.

## JSON backup

Choose **JSON backup**, edit the proposed file name if needed, and save the file locally.

A backup includes:

- schema version
- event ID
- event name
- result settings
- participants and order
- rounds and matches
- recorded results
- League Desk UI state
- created / updated timestamps

Import validates the document before touching the current event. Invalid or incompatible files are rejected. Replacing an existing event requires confirmation.

## Privacy

Event names, participants, fixtures, results, progress, standings, and backups are processed locally in the browser. Runtime network access remains blocked by Content Security Policy.

## Limitations in v0.5.0

Not yet included:

- CSV export
- standings image export
- print layout
- final release-stage mobile/accessibility polish
- release-candidate screenshots and broader browser/device regression

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
