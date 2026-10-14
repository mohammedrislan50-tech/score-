# Sri Lanka Softball Cricket Pro

A GitHub-ready React + Vite starter for managing Sri Lankan softball cricket tournaments and a live OBS browser-source overlay.

## Features in this starter
- Create Knockout or League tournaments, configure groups/wickets/overs/balls, multiple dates and tournament logo.
- Tournament workspace with match center, team management, CSV import, team logos/colours, player photos, group tables and basic tournament stats.
- Schedule matches and record toss / batting or bowling decision.
- Ball-by-ball runs, wickets and common extras, undo last delivery, innings completion and second-innings target.
- Broadcast-style responsive scoreboard overlay route (`#/overlay/<tournament-id>`) designed for OBS.
- Local autosave using browser localStorage.

## Run locally
Install Node.js 20+ and then:
```bash
npm install
npm run dev
```
Open the local URL printed by Vite. To create production assets:
```bash
npm run build
npm run preview
```

## GitHub upload
Create a repository and upload the project files (or push with git). Do not upload `node_modules` or `dist`; both are generated locally.

## OBS overlay
Open a tournament, click **Overlay link**, and add that URL as an OBS **Browser Source**. Suggested canvas: 1920×1080. The overlay and scoring app must be served from the same origin and browser storage profile for localStorage-based live updates. For a hosted deployment, open the same deployed origin in the app and OBS.

## Important scope notes
This is a functional starter/MVP, not a production cloud service. Data is saved in the current browser/device only. For multi-device scoring, shared OBS data across separate machines, login, cloud backups, reliable real-time sync, and public overlay URLs, add a backend (for example Supabase/Firebase) and authentication. Player photos are currently stored as data URLs in localStorage; large images can fill browser storage. Full ball-by-ball batter/bowler attribution, strike rotation, detailed bowling figures, DLS, tie-breakers, and official tournament-specific rule variations need additional implementation/testing before live competitive use.

## Suggested next steps
1. Add a cloud database and authentication.
2. Add detailed batter/bowler scorekeeping, strike rotation, wicket dismissal types, and over-end bowler selection.
3. Add tournament export/import backup and public overlay tokens.
4. Test scoring edge cases against your tournament's softball rules.
