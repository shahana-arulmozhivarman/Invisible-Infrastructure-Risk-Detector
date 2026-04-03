# CivicScan — Urban Infrastructure Risk Detection MVP

## Overview

Full-stack urban infrastructure risk detection app. City engineers and civic workers can scan, score, and act on infrastructure issues across Mumbai.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/civicscan) — Tailwind CSS, shadcn/ui, Wouter, TanStack Query
- **API framework**: Express 5 (artifacts/api-server)
- **Data storage**: In-memory Python list (no DB) — seeded with 6 Mumbai reports
- **AI**: OpenRouter (google/gemini-flash-1.5 for vision, mistralai/mistral-7b-instruct for risk scoring)
- **Map**: Leaflet.js (loaded via CDN in useEffect)
- **Validation**: Zod (`zod/v4`), Orval codegen
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Pages

- `/` or `/dashboard` — Stat tiles + report cards sorted by risk_score, severity filter, link to map
- `/report` — Smart form with AI photo analysis (auto-prefills issue_type, severity, description), geolocation, submission with confirmation card
- `/map` — Leaflet map centered on Mumbai, colored markers by severity, auto-refresh every 5s, live counter
- `/admin` — Admin table with editable status dropdowns, color-coded rows

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/civicscan run dev` — run frontend locally

## API Endpoints (Express server at /api)

- `GET /api/healthz` — health check
- `GET /api/reports` — list all reports (sorted by risk_score desc, filterable by severity/status)
- `POST /api/reports` — create report (triggers AI risk scoring via OpenRouter)
- `GET /api/reports/summary` — dashboard stats
- `GET /api/reports/:id` — get single report
- `PATCH /api/reports/:id` — update report status
- `POST /api/analyze-photo` — AI vision analysis (base64 image → issue_type, severity, description)

## Environment Variables

- `OPENROUTER_API_KEY` — Required for AI features (vision analysis + risk scoring)
- `PORT` — Assigned per service by Replit
- `SESSION_SECRET` — Session management

## Architecture Notes

- No database — all data stored in in-memory array in `artifacts/api-server/src/routes/reports.ts`
- 6 seeded realistic Mumbai infrastructure reports spread across varied locations and severities
- AI risk scoring uses mistral-7b-instruct with rule-based fallback
- Photo analysis uses google/gemini-flash-1.5 (vision model)
- Repair cost ranges calculated by rule-based formula (severity × issue type multiplier)
- CORS enabled on Express server

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
