# Sri Lanka Softball App (HTML/CSS/JavaScript demo)

## Run it
1. Extract the ZIP.
2. Open `index.html` in a modern browser.
3. Create a tournament, add at least two teams, add players, create a match, and open scoring.

## Included
- Tournament creation/edit/delete, League/Knockout selection, groups, dates, logo upload.
- Teams and players create/edit/delete; team colour/logo and player photo.
- Match setup and basic scoring with runs, wides, no-balls, byes, leg-byes, penalty, wicket, undo, innings switch and finish match.
- Basic league points table and tournament summary statistics.
- Scoreboard preview and a URL query-based overlay view.
- Saves demo data to this browser's localStorage.

## Important limitations
This is a front-end starter/demo, not a production scoring system:
- Data is stored only in this browser/device. It does not sync to other devices.
- The overlay URL only works where the app is hosted and the same browser storage has the data. For public OBS use, deploy the app and connect a shared backend/database with realtime updates.
- No authentication, server-side validation, tournament sharing, team import, detailed batting/bowling/fielding scorecards, automatic legal cricket/softball dismissal handling, tie-break rules, or full official rules engine.
- The scoring engine is deliberately a starter implementation; verify rules for your competition before using it for official scoring.
