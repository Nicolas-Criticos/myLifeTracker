-- Financial tracker: accounts + monthly balance entries
-- Accounts: personal, business, and any number of investment sub-accounts

create table if not exists fin_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('personal', 'business', 'investment')),
  color text not null default '#6b5c8a',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists fin_monthly_entries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references fin_accounts(id) on delete cascade,
  month text not null, -- YYYY-MM
  amount_zar numeric(14,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  unique(account_id, month)
);

-- Seed defaults
insert into fin_accounts (name, type, color) values
  ('Personal', 'personal', '#5c7a5c'),
  ('Business', 'business', '#6b5c8a')
on conflict do nothing;

-- RLS
alter table fin_accounts enable row level security;
alter table fin_monthly_entries enable row level security;

create policy "fin_accounts_select" on fin_accounts for select using (true);
create policy "fin_accounts_insert" on fin_accounts for insert with check (true);
create policy "fin_accounts_update" on fin_accounts for update using (true);

create policy "fin_entries_select" on fin_monthly_entries for select using (true);
create policy "fin_entries_insert" on fin_monthly_entries for insert with check (true);
create policy "fin_entries_update" on fin_monthly_entries for update using (true);
