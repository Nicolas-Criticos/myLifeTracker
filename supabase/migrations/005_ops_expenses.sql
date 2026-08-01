-- Expense tracker: daily spending by category

create table if not exists ops_expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10,2) not null,
  category text not null check (category in ('FOOD', 'BUSINESS', 'RUNNING COSTS', 'LIFESTYLE')),
  description text not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- RLS
alter table ops_expenses enable row level security;

create policy "ops_expenses_select" on ops_expenses for select using (true);
create policy "ops_expenses_insert" on ops_expenses for insert with check (true);
