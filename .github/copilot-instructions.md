# Copilot Instructions for Juegos Workspace

## Overview
This workspace contains several educational mini-games, each in its own directory. The main entry point is `index.html`, which links to individual games and shared resources.

## Major Components
- **Root Level**: Contains `index.html`, `main-script.js`, and `main-style.css` for the main menu/navigation.
- **CalculoMental/**: Math game with its own `index.html`, `script.js`, `style.css`, and resources. Uses JSON files (e.g., `ejercicios.json`) for exercises.
- **Encriptación/**: Encryption-themed game with similar structure.
- **Blockly/**: Likely a block-based activity/game, with its own HTML, JS, and CSS.

## Data Flow & Patterns
- Each game is self-contained, loading its own scripts and styles.
- Shared navigation and UI patterns are defined in the root files.
- JSON files (e.g., `CalculoMental/ejercicios.json`) provide structured data for exercises/questions.
- Some games (e.g., CalculoMental) use external libraries (e.g., A-Frame, AR.js) via CDN in their HTML.

## Developer Workflows
- **No build step**: All code is plain HTML/CSS/JS, runnable directly in the browser.
- **Debugging**: Use browser dev tools. No source maps or transpilation.
- **Testing**: No automated tests detected; manual testing via browser is expected.
- **Adding Content**: For new exercises, edit the relevant JSON files (e.g., `CalculoMental/ejercicios.json`).

## Project-Specific Conventions
- Keep each game's assets (HTML, JS, CSS, resources) in its own directory.
- Use descriptive filenames for resources and exercises.
- Use `classList.add('hidden')`/`remove('hidden')` for UI state changes (see `CalculoMental/script.js`).
- Use CDN links for third-party libraries; do not add local copies.

## Integration Points
- Main menu (`index.html`) links to each game's `index.html` via iframes or navigation.
- Games do not share JS logic; communication is via navigation only.

## Examples
- To add a new math exercise: edit `CalculoMental/ejercicios.json`.
- To add a new game: create a new directory with `index.html`, `script.js`, `style.css`, and link it from the root `index.html`.

## Key Files
- `index.html`, `main-script.js`, `main-style.css` (root navigation)
- `CalculoMental/ejercicios.json` (math exercises)
- `CalculoMental/script.js` (game logic, UI state)
- `Encriptación/index.html` (encryption game UI)

---

For questions or unclear patterns, review the structure of existing game directories for examples.