# Panic Express — The Last Train Home

A polished arcade redesign: 100 quick cartoon emergencies, ten interaction mechanics, campaign practice, a shuffled endless deck (all 100 challenges appear before the deck repeats), streak scoring, three lives, local progress, and JSON backup/restore. Built with vanilla JavaScript, CSS, and SVG/CSS illustration; no runtime dependencies.

## Run on Windows
1. Extract this folder.
2. Install Node.js 18 or newer.
3. Open a terminal in this folder.
4. Run `npm test`, then `npm run build`, then `npm run dev`.
5. Open the local URL printed by the dev server (default http://localhost:4173).

## Gameplay
- Start Panic Run for an endless randomized run. Three misses end the run.
- Open 100 Challenges to practice individual scenarios.
- Ten mechanics: tap, mash, hold, choice, sequence, timing, direction choice, safe-lane selection, memory, and slider aiming. Choice rounds always have three unique options; every memory symbol is selectable.
- Score and cleared challenges save locally. Use Backup to export/import a JSON save; malformed, negative, fractional, and unsafe progression values are rejected.
- Sound effects are optional and generated locally with Web Audio.
- Press Escape to pause. Resuming preserves the remaining round time and restarts that short challenge cleanly, preventing hidden timers from advancing behind the dialog.

## Validation
`npm test` covers challenge integrity, all choice options, memory-symbol availability, shuffled-deck coverage, and save/progression rules. `npm run build` creates a self-contained `dist/` folder. JavaScript syntax checks pass. A full visual browser run could not be completed in the build environment, so please still verify appearance and touch behavior on your own devices.
