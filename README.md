# Mini League Desk

[日本語版 README](README.ja.md)

Mini League Desk is a local-first browser tool for running small round-robin events. It is designed around quickly answering: **who plays next, what is still unfinished, and what are the current standings?**

Current development version: **v0.7.0**

## Current features

v0.7.0 adds local result export to the existing League Desk workflow:

- Event setup and three result modes
- Complete round-robin fixtures
- Result add / edit / removal with Undo
- Progress / Matches / Standings workflow
- Per-participant remaining/completed opponents
- Automatic local save and JSON backup / restore
- Smartphone-focused result entry and navigation
- **Match results CSV**
- **Standings CSV**
- **Standings PNG**
- **Print layout for standings and all match results**
- Editable safe filename before file downloads
- Japanese / English UI
- No runtime CDN, API, analytics, telemetry, or external export service

## Export

Open **Export** during an event or from the completed-event card.

### Match results CSV

Contains every match in generated order with round, order, participants, status, optional score, result, and winner.

CSV is written as UTF-8 with BOM. User-controlled text that begins with common spreadsheet formula prefixes is protected before serialization.

### Standings CSV

Uses the same standings calculation shown in the app. The columns adapt to the active result mode, including score statistics only when relevant.

### Standings PNG

Creates a 1200px-wide shareable image entirely with the browser Canvas API. It includes the event name, result mode, participant order, rank, record, points, and score difference for score-based events.

### Print

Builds a print-only sheet containing the standings and every round's match results. The normal app UI, dialogs, and mobile navigation are hidden from print.

## File names

The export dialog proposes an event/date-based file name. Edit it before saving if desired. Unsafe filename characters are replaced locally; each export adds its own suffix and extension.

## Persistence and privacy

The active event is saved locally in the browser. JSON backup remains available for portability and recovery.

Event data and generated exports are processed locally. Runtime network access remains blocked by Content Security Policy.

## Limitations in v0.7.0

Not yet completed:

- final bilingual copy review
- final keyboard/accessibility audit
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
