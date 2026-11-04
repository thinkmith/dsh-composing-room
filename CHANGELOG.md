# Changelog

## Unreleased

- **License changed: MIT → PolyForm Noncommercial 1.0.0.** Personal and
  noncommercial use only; commercial use requires written permission from the
  author. `package.json` now declares `SEE LICENSE IN LICENSE`.
- README rebuilt around a centered header, static shields badges, tables and
  collapsible `<details>` blocks; added a project-status / roadmap section that
  states plainly what still does not work (Windows-only, single profile, no CI,
  unsigned installer, no compatibility layer for future DSH releases) and a
  contributing section.
- `DISCLAIMER.md` rewritten: scope, liability, third parties, credentials,
  removal, plus an English summary and an explicit noncommercial clause.
- Added `assets/logo.svg` (geometric type-case mark).

## 0.3.0

- Ship the writing payload with the package (`assets/prompt.default.txt`); a fresh
  install seeds `%USERPROFILE%\.dsh\composing-room\prompt.txt` on first run, so the
  plugin works without copying anything by hand.
- First run also writes a default `state.json` (`armed: false`, `order: 12000`).
- New installers: `install.ps1` (junction or copy, idempotent), `install.cmd`
  wrapper, packed `.tgz`, and a double-click `setup.exe` built with IExpress
  (`node build/build-sfx.mjs`), which carries the sources inside a single script
  and needs no archiver at build time.
- `npm pack` now ships `assets/` and `install.ps1` alongside `lib/`.

## 0.2.0

- The composer pill: a client-side button registered into
  `conversation.input.right`, so arming the section no longer needs a chat command.
- Host route `GET|POST /api/composing-room` (`action=on|off|toggle`) backing the
  pill; the route and the system-prompt section share one state file.
- `package.json` gains the `dsh.client` manifest and a `./client` export.

## 0.1.0

- Manual system-section injection: `ctx.systemPrompt.section` at order 12000,
  armed from `state.json` (hot-reloaded by `fs.watchFile`) and from `/room
  on|off|reload|path`.
