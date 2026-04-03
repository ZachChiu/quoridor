# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # Start dev server (http://localhost:3000)
npm run build   # Generate static output to /out (also runs next-sitemap postbuild)
npm run lint    # Run ESLint checks
npm start       # Serve /out locally
```

No test suite is configured.

## Architecture

Static **Next.js 15** app (`output: "export"`) — all game logic runs client-side.

**State management via React Context** (both providers wrapped in `app/layout.tsx`):
- `GameContext` — player count (2 or 3), game flow state
- `RuleModalContext` — rule modal visibility

**Core game logic lives entirely in `app/play/PlayClient.tsx`**:
- 7×7 board (`Player[][]`), separate horizontal/vertical wall arrays
- `getAvailableMovesRecursive()` — recursive move validation with a visited set
- Flood-fill territory calculation → win condition detection
- 3-player wall destruction mechanic (tracked in `breakWallCountObj`, max 1 per player)
- Opening phase: players auto-place one piece (`openingStep[]`)

**`app/components/Chessboard.tsx`** handles board rendering and click dispatch; wrapped in `React.memo()`.

**`app/config/playerTemplates.tsx`** holds initial board state, turn order, and wall templates for 2- and 3-player modes.

**Types**: `Player` (`'A' | 'B' | 'C' | null`), `Direction`, `Move` — defined in `app/types/chessboard.ts`.

## Key Conventions

- **State mutation**: Always use `cloneDeep()` (lodash-es) for nested state; never mutate directly.
- **Player colors**: Defined as CSS variables `--player-A/B/C` in `app/globals.css` lines 5–45; referenced via Tailwind custom colors `player-A`, `player-B`, `player-C`.
- **Responsive breakpoints**: `portrait`, `landscape`, `md`, `lg` (see `tailwind.config.ts`).
- **Analytics**: Wrap user-initiated actions with `trackButtonClick()` from `app/utils/analytics.ts`.
- **Import alias**: Use `@/*` for `app/*` (e.g., `@/components/Button`).
- **Context hooks**: Always throw if used outside their provider (see pattern in `GameContext.tsx`).

## Deployment

GitHub Actions (`.github/workflows/`) builds and syncs `/out` to AWS S3. Set `SITE_URL` env var to override the default `https://quoridorgame.com` for sitemap generation.
