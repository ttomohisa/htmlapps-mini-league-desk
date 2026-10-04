# Mini League Desk

[日本語版 README](README.ja.md)

Mini League Desk is a local-first browser tool for running small round-robin events. The final v1 workflow is designed around quickly answering: **who plays next, what is still unfinished, and what are the current standings?**

Current development version: **v0.1.0**

## Current features

v0.1.0 implements the event-setup foundation:

- Enter an optional event name
- Add participants one at a time
- Paste multiple participant names, one per line
- Reject duplicate names and invalid batches
- Reorder participants with accessible up/down controls
- Shuffle with Undo
- Remove participants with Undo
- Reset the full setup with confirmation
- Confirm a roster once at least three participants are present
- Review the confirmed roster and return to editing
- Japanese / English UI
- Responsive desktop and smartphone layout
- No runtime CDN, API, analytics, or telemetry

## How to use

1. Enter an event name if needed.
2. Add at least three participants individually or with multiline paste.
3. Adjust the participant order or shuffle it.
4. Choose **Confirm participants**.
5. Review the roster or return to editing.

## Privacy

Event and participant names are processed inside the browser. The application is built with runtime network access blocked by its Content Security Policy and does not send entered event data to a server.

v0.1.0 only stores the language preference. **The event draft itself is not saved yet**, so reloading or closing the page clears the current setup. Local event persistence is planned for v0.5.0.

## Limitations in v0.1.0

This milestone does not yet include:

- round-robin fixture generation
- match result entry
- standings
- event-data persistence or backup
- CSV, image, or print export

These are tracked in `APP_SPEC.md` and will be added in later development milestones.

## Single HTML / offline use

The build creates:

- `dist/index.html`
- `dist/index.self-extract.html`
- `mini-league-desk.html` at the repository root

The readable HTML is intended to work when opened directly with `file://`.

## Browser support

Primary targets:

- Chrome
- Edge

Best effort:

- Firefox
- Safari
- Chrome for Android
- Safari on iPhone

## Development

Read these first:

1. `AGENTS.md`
2. `APP_SPEC.md`
3. `docs/ARCHITECTURE.md`
4. `docs/LLM_WORKFLOW.md`

Editable app source:

```text
src/index.template.html
```

Do not edit generated standalone HTML files manually.

## Build

On Windows:

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