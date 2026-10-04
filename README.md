# Mini League Desk

[日本語版 README](README.ja.md)

Mini League Desk is a local-first browser tool for running small round-robin events. It is designed around quickly answering: **who plays next, what is still unfinished, and what are the current standings?**

Current development version: **v0.8.0**

## Current features

Mini League Desk currently includes:

- Event setup and three result modes
- Complete round-robin fixtures
- Result add / edit / removal with Undo
- Progress / Matches / Standings workflow
- Per-participant remaining/completed opponents
- Automatic event completion and final standings
- Local automatic save and JSON backup / restore
- Smartphone-focused navigation and narrow-screen handling
- Match Results CSV and Standings CSV
- Local Canvas Standings PNG
- Print layout for standings and all match results
- Japanese / English UI
- Keyboard-visible focus and localized accessible labels
- Dialog focus restoration and accessible selected-state indicators
- No runtime CDN, API, analytics, telemetry, or external export service

## Accessibility and keyboard operation

v0.8.0 completes the pre-release accessibility pass:

- buttons, inputs, textareas, selects, and summaries show a visible keyboard focus indicator
- Match filters expose their selected state with `aria-pressed`
- completed-result winner/draw choices expose the current selection with `aria-pressed`
- League Desk navigation, progress, and filter accessible names are localized
- result, export, backup, and help dialogs restore focus to a meaningful control when closed where possible
- score validation is associated with both score fields
- standings expose list/listitem semantics
- forced-colors mode receives explicit border and selected-state support
- reduced-motion behavior remains supported

Japanese and English translation keys are checked for parity in repository verification, and static i18n references are checked against both dictionaries.

## Privacy

Event names, participants, matches, results, standings, saved-event data, and generated JSON/CSV/PNG outputs are processed locally in the browser. The application makes no runtime network requests and keeps `connect-src 'none'`.

## Export and persistence

The active event is saved locally in the browser. JSON backup is available for portability and recovery.

During an event, Export provides Match Results CSV, Standings CSV, Standings PNG, and a print layout. File-producing exports allow an editable safe filename before saving.

## Remaining before v1.0.0

v0.9.0 is the release-candidate milestone and focuses on:

- broader regression cases
- README and screenshot finalization
- standalone / privacy / network checks
- release-candidate browser/device review

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
