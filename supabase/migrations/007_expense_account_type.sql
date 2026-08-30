-- Classify each expense for log filtering while retaining combined reporting.
alter table ops_expenses
  add column if not exists account_type text not null default 'personal'
  check (account_type in ('personal', 'business'));

create index if not exists ops_expenses_account_type_date_idx
  on ops_expenses (account_type, date desc);
