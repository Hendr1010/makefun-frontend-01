# make.fun frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/Hendr1010/makefun-frontend-01/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/Hendr1010/makefun-frontend-01/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, readable frontend for [make.fun](https://make.fun) open bounties — no
framework, no build step, no external scripts, stylesheets or fonts. It reads
make.fun's public API alone (`https://make.fun/api`, public GET, no key) and
renders four surfaces, each reachable by a link and by its own hash URL:

- **Bounty board** (`#/`) — hero plus cards for live bounties, each showing
  the title, summary, live pot, entry fee (or "Free"), time left and entries.
- **Bounty page** (`#/bounty/<slug>`) — summary, description, rules, rewards
  table with the live pot, deadline/dates, entry fee, entries, and a link to
  its leaderboard.
- **Leaderboard** (`#/bounty/<slug>/leaderboard`) — ranked rows with rank,
  builder handle + avatar, entry title, score and result; rows link to
  profiles.
- **Account profile** (`#/account/<id>`) — avatar/initial, name, handle,
  stats (entries, placements, wins, best placement, prize money) and recent
  entries linking back to their bounties.

Performance notes: API answers are cached in memory and revalidated with
`ETag` / `If-None-Match` where the API sends one; the first load is six small
local files and nothing else. Images the API points at (avatars) are loaded
with `crossorigin="anonymous"` set before `src`.

## Run it locally

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Open <http://localhost:8080> and click through: board → a bounty → its
leaderboard → a builder's profile.

## Hand it in

```sh
MAKEFUN_OUTPUT_DIR=/tmp/fe-out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` with `buildDossier`
from `vendor/makefun-frontend.ts`.

## Screenshots

`screenshots/` holds three JPEGs of the running app on live make.fun data,
taken with Playwright against the local server (see `shots.json` for the
routes and viewports): the board, the `tiny-chess-01` bounty page, and its
leaderboard.
