# Journal View — Spec

## Concept
Nicris checks in with Tracey (Telegram bot). Tracey writes the rich qualitative data to Supabase.
The app displays it — Nicris never types into the app directly.
The app is a *read-only mirror* of what Tracey captures.

## Data Source (ops_daily_checkins)
Fields Tracey writes:
- `date`
- `wake_time` — e.g. "4:30am"
- `morning_routine` — what he did before the day started
- `reflection` — full qualitative narrative (the main journal entry)
- `whats_weighing` — what's weighing on him
- `whats_light` — what feels good/light
- `energy_level` / `focus_level` / `peace_level` — 1-10
- `intent` — what the day is about
- `non_negotiable` — the one thing that must happen

## Data Source (ops_daily_logs)
Fields Tracey writes:
- `date`
- `what_happened` — what actually occurred
- `blockers` — what got in the way
- `evening_reflection` — full qualitative narrative
- `observations` — free reflection
- `momentum_score` / `peace_level` — 1-10
- `key_insight` — one sentence distillation

## Journal Page (new route: /journal)
A chronological feed of days. Most recent at top.

### Each day entry:
- Date header: Cormorant Garamond, large, e.g. "Wednesday, 22 April"
- If morning check-in exists:
  - Wake time + morning routine (small, muted)
  - Main reflection text — full paragraph, Cormorant, readable size
  - What's weighing / what's light — two soft pill tags or inline
  - Three dots row: Energy · Focus · Peace as colored dots with numbers
  - Intent + non-negotiable — small, muted below
- If evening log exists:
  - Divider line (subtle)
  - "Evening" label
  - What happened + evening reflection text
  - Key insight — highlighted softly (gold tint background)
  - Momentum score as a single number with label
- If only one exists, show what's there, no empty sections

### Visual style:
- Like reading a physical journal — generous line height (1.8+)
- Text is the hero, not charts
- Warm paper background
- No tables, no grids
- Subtle day separator (thin line or spacing)
- Dates feel like journal headings, not UI labels

### Empty state:
"Your journal begins with your first check-in with Tracey. Say 'check in' to @TraceyTracker_bot."

## Nav
Add "Journal" to top nav between Dashboard and Projects.
Icon: a soft circle or quill — nothing techy.
