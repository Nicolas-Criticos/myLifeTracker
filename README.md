# myLifeTracker

Personal life operations dashboard for Nicris — tracking check-ins, projects, tasks, dreams, finances, olive rehab, and business metrics.

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL (shared with Samsara Community App) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `VITE_BUSINESS_SUPABASE_URL` | ✅ | Business/olive oil Supabase project URL |
| `VITE_BUSINESS_SUPABASE_KEY` | ✅ | Business Supabase service role key |

## Project Structure

```
src/
  pages/           # One file per top-level page (Business, Dashboard, etc.)
  components/
    business/      # Business page sections (ProductsSection, SalesSection, etc.)
    dashboard/     # Dashboard widgets
    invoices/      # Invoice management
    layout/        # TopBar and layout components
    olive-rehab/   # Olive rehab tracker
    projects/      # Project management
    reviews/       # Weekly review UI
    todos/         # Todo list components
    ui/            # Shared UI primitives (ErrorBoundary, LoadingSpinner, etc.)
  lib/
    supabase.ts    # Supabase client + all TypeScript types
    queries.ts     # React Query hooks for all data operations
```

## Key Concepts

- **Two Supabase projects**: `myLifeTracker` DB (personal/community) and `samsara_funnel` DB (business/olive oil)
- **React Query** powers all data fetching — query keys live in `lib/queries.ts`
- **Business page** uses section components for Products, Sales, Summary, and Expenses
- **Olive Rehab** tracks rehabilitation of ~16,000 olive trees across blocks on the farm

## Tech Stack

- React 18 + TypeScript
- Vite (bundler)
- React Query (data fetching & caching)
- Supabase (database + auth)
- Recharts (revenue charts)
- date-fns (date formatting)
- React Router v6

## Deploy

```bash
npm run build
# Output goes to dist/ — deploy to any static host (Vercel, Netlify, etc.)
vercel --token $VERCEL_TOKEN
```
