-- Dynamic categories and statuses for LOE time entries.

create table if not exists public.entry_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  requires_project boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entry_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  requires_comment boolean not null default false,
  is_blocker boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists entry_categories_name_unique_idx on public.entry_categories (lower(name));
create unique index if not exists entry_statuses_name_unique_idx on public.entry_statuses (lower(name));
create index if not exists entry_categories_active_idx on public.entry_categories (is_active);
create index if not exists entry_statuses_active_idx on public.entry_statuses (is_active);

drop trigger if exists entry_categories_set_updated_at on public.entry_categories;
create trigger entry_categories_set_updated_at
before update on public.entry_categories
for each row execute function public.set_updated_at();

drop trigger if exists entry_statuses_set_updated_at on public.entry_statuses;
create trigger entry_statuses_set_updated_at
before update on public.entry_statuses
for each row execute function public.set_updated_at();

-- Audit triggers
drop trigger if exists entry_categories_audit_trigger on public.entry_categories;
create trigger entry_categories_audit_trigger
after insert or update or delete on public.entry_categories
for each row execute function public.write_audit_log();

drop trigger if exists entry_statuses_audit_trigger on public.entry_statuses;
create trigger entry_statuses_audit_trigger
after insert or update or delete on public.entry_statuses
for each row execute function public.write_audit_log();

-- RLS
alter table public.entry_categories enable row level security;
alter table public.entry_statuses enable row level security;

drop policy if exists "entry_categories_select_authenticated" on public.entry_categories;
create policy "entry_categories_select_authenticated"
on public.entry_categories
for select
to authenticated
using (true);

drop policy if exists "entry_categories_admin_all" on public.entry_categories;
create policy "entry_categories_admin_all"
on public.entry_categories
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "entry_statuses_select_authenticated" on public.entry_statuses;
create policy "entry_statuses_select_authenticated"
on public.entry_statuses
for select
to authenticated
using (true);

drop policy if exists "entry_statuses_admin_all" on public.entry_statuses;
create policy "entry_statuses_admin_all"
on public.entry_statuses
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

-- Seed defaults from existing enum values (idempotent)
insert into public.entry_categories (name, requires_project) values
  ('Project', true),
  ('Time Off', false),
  ('Office Process', false),
  ('Free / Open', false)
on conflict (lower(name)) do nothing;

insert into public.entry_statuses (name, requires_comment, is_blocker) values
  ('None', false, false),
  ('Needs Review', true, false),
  ('Blocked', true, true)
on conflict (lower(name)) do nothing;
