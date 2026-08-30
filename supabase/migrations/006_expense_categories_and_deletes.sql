-- User-managed expense categories and safe expense deletion.
-- Historical expenses retain their category text if an unused category is removed.
alter table ops_expenses drop constraint if exists ops_expenses_category_check;

create table if not exists ops_expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name = upper(trim(name)) and length(name) between 1 and 40),
  color text not null default '#6f7468' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_builtin boolean not null default false,
  created_at timestamptz not null default now()
);

insert into ops_expense_categories (name, color, is_builtin) values
  ('FOOD', '#8a6a3a', true), ('BUSINESS', '#6b5c8a', true),
  ('RUNNING COSTS', '#5c7a5c', true), ('LIFESTYLE', '#8a4a4a', true)
on conflict (name) do update set is_builtin = true;

alter table ops_expense_categories enable row level security;
create policy "ops_expense_categories_select" on ops_expense_categories for select using (true);
create policy "ops_expense_categories_insert" on ops_expense_categories for insert with check (is_builtin = false);
create policy "ops_expense_categories_delete" on ops_expense_categories for delete using (is_builtin = false);
create policy "ops_expenses_delete" on ops_expenses for delete using (true);
