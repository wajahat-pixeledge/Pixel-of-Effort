-- Extend schema with access rules, assignment active dates, audit logs, and hardened RLS.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'access_rule_type') then
    create type public.access_rule_type as enum ('domain', 'email', 'pattern');
  end if;

  if not exists (select 1 from pg_type where typname = 'audit_action') then
    create type public.audit_action as enum ('insert', 'update', 'delete', 'other');
  end if;
end;
$$;

do $$
begin
  if to_regclass('public.allowed_email_rules') is not null
     and to_regclass('public.access_rules') is null then
    alter table public.allowed_email_rules rename to access_rules;
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'allowed_email_rules_created_by_fkey'
      and conrelid = 'public.access_rules'::regclass
  ) and not exists (
    select 1 from pg_constraint
    where conname = 'access_rules_created_by_fkey'
      and conrelid = 'public.access_rules'::regclass
  ) then
    alter table public.access_rules
      rename constraint allowed_email_rules_created_by_fkey to access_rules_created_by_fkey;
  end if;
end;
$$;

create table if not exists public.access_rules (
  id uuid primary key default gen_random_uuid(),
  rule_type public.access_rule_type not null default 'pattern',
  access_value text not null,
  note text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'access_rules'
      and column_name = 'pattern'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'access_rules'
      and column_name = 'access_value'
  ) then
    alter table public.access_rules rename column pattern to access_value;
  end if;
end;
$$;

alter table public.access_rules
  add column if not exists rule_type public.access_rule_type not null default 'pattern',
  add column if not exists access_value text,
  add column if not exists updated_at timestamptz not null default now();

update public.access_rules
set rule_type = 'pattern'
where rule_type is null;

alter table public.access_rules
  alter column access_value set not null;

alter table public.access_rules drop constraint if exists access_rules_value_check;
alter table public.access_rules
  add constraint access_rules_value_check check (
    (rule_type = 'domain' and access_value !~* '@' and access_value ~* '^[a-z0-9.-]+\.[a-z]{2,}$')
    or (rule_type = 'email' and access_value ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
    or (rule_type = 'pattern')
  );

alter table public.access_rules drop constraint if exists allowed_email_rules_pattern_key;
alter table public.access_rules drop constraint if exists access_rules_pattern_key;
create unique index if not exists access_rules_rule_value_unique_idx
  on public.access_rules (rule_type, lower(access_value));
create index if not exists access_rules_active_idx
  on public.access_rules (is_active, rule_type);

alter table public.project_assignments
  add column if not exists active_from date not null default current_date,
  add column if not exists active_until date,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.project_assignments drop constraint if exists project_assignments_active_dates_check;
alter table public.project_assignments
  add constraint project_assignments_active_dates_check
  check (active_until is null or active_until >= active_from);

create index if not exists project_assignments_active_window_idx
  on public.project_assignments (user_id, is_active, active_from, active_until);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  table_name text not null check (char_length(table_name) > 0),
  record_id text,
  action public.audit_action not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_created_idx
  on public.audit_logs (actor_user_id, created_at desc);
create index if not exists audit_logs_table_created_idx
  on public.audit_logs (table_name, created_at desc);
create index if not exists audit_logs_created_idx
  on public.audit_logs (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists access_rules_set_updated_at on public.access_rules;
create trigger access_rules_set_updated_at
before update on public.access_rules
for each row
execute function public.set_updated_at();

drop trigger if exists project_assignments_set_updated_at on public.project_assignments;
create trigger project_assignments_set_updated_at
before update on public.project_assignments
for each row
execute function public.set_updated_at();

create or replace function public.email_matches_access_rule(email_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.access_rules ar
    where ar.is_active = true
      and (
        (ar.rule_type = 'domain' and lower(email_input) like ('%@' || lower(ar.access_value)))
        or (ar.rule_type = 'email' and lower(email_input) = lower(ar.access_value))
        or (ar.rule_type = 'pattern' and lower(email_input) ilike lower(ar.access_value))
      )
  );
$$;

create or replace function public.email_matches_allowed_rule(email_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.email_matches_access_rule(email_input);
$$;

create or replace function public.is_project_assigned(
  project_input uuid,
  user_input uuid,
  work_date_input date
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_assignments pa
    join public.projects p
      on p.id = pa.project_id
    where pa.project_id = project_input
      and pa.user_id = user_input
      and pa.is_active = true
      and p.is_active = true
      and pa.active_from <= work_date_input
      and (pa.active_until is null or pa.active_until >= work_date_input)
  );
$$;

create or replace function public.is_project_assigned(
  project_input uuid,
  user_input uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_project_assigned(project_input, user_input, current_date);
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and access_status = 'approved'
  );
$$;

create or replace function public.current_user_is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and access_status = 'approved'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first_user boolean;
  should_auto_approve boolean;
begin
  is_first_user := not exists (select 1 from public.profiles);
  should_auto_approve := is_first_user or public.email_matches_access_rule(new.email);

  insert into public.profiles (
    id,
    email,
    role,
    access_status,
    approved_at,
    approved_by
  ) values (
    new.id,
    lower(new.email),
    case when is_first_user then 'admin'::public.app_role else 'user'::public.app_role end,
    case when should_auto_approve then 'approved'::public.access_status else 'pending'::public.access_status end,
    case when should_auto_approve then now() else null end,
    null
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- Backfill any auth users that were created while the profile trigger was missing/broken.
with missing_users as (
  select
    au.id,
    lower(au.email) as email,
    au.created_at,
    row_number() over (order by au.created_at asc, au.id asc) as rn
  from auth.users au
  left join public.profiles p
    on p.id = au.id
  where p.id is null
    and au.email is not null
),
has_admin as (
  select exists (
    select 1
    from public.profiles
    where role = 'admin'
      and access_status = 'approved'
  ) as value
)
insert into public.profiles (
  id,
  email,
  role,
  access_status,
  approved_at,
  approved_by
)
select
  mu.id,
  mu.email,
  case
    when (not ha.value and mu.rn = 1) then 'admin'::public.app_role
    else 'user'::public.app_role
  end as role,
  case
    when (not ha.value and mu.rn = 1) then 'approved'::public.access_status
    when public.email_matches_access_rule(mu.email) then 'approved'::public.access_status
    else 'pending'::public.access_status
  end as access_status,
  case
    when (not ha.value and mu.rn = 1) then now()
    when public.email_matches_access_rule(mu.email) then now()
    else null
  end as approved_at,
  null as approved_by
from missing_users mu
cross join has_admin ha;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  row_id text;
begin
  actor_id := auth.uid();

  if tg_op = 'INSERT' then
    row_id := to_jsonb(new)->>'id';
    insert into public.audit_logs (actor_user_id, table_name, record_id, action, old_data, new_data)
    values (actor_id, tg_table_name, row_id, 'insert', null, to_jsonb(new));
    return new;
  end if;

  if tg_op = 'UPDATE' then
    row_id := to_jsonb(new)->>'id';
    insert into public.audit_logs (actor_user_id, table_name, record_id, action, old_data, new_data)
    values (actor_id, tg_table_name, row_id, 'update', to_jsonb(old), to_jsonb(new));
    return new;
  end if;

  if tg_op = 'DELETE' then
    row_id := to_jsonb(old)->>'id';
    insert into public.audit_logs (actor_user_id, table_name, record_id, action, old_data, new_data)
    values (actor_id, tg_table_name, row_id, 'delete', to_jsonb(old), null);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists projects_audit_trigger on public.projects;
create trigger projects_audit_trigger
after insert or update or delete on public.projects
for each row
execute function public.write_audit_log();

drop trigger if exists project_assignments_audit_trigger on public.project_assignments;
create trigger project_assignments_audit_trigger
after insert or update or delete on public.project_assignments
for each row
execute function public.write_audit_log();

drop trigger if exists time_entries_audit_trigger on public.time_entries;
create trigger time_entries_audit_trigger
after insert or update or delete on public.time_entries
for each row
execute function public.write_audit_log();

drop trigger if exists access_rules_audit_trigger on public.access_rules;
create trigger access_rules_audit_trigger
after insert or update or delete on public.access_rules
for each row
execute function public.write_audit_log();

drop trigger if exists profiles_audit_trigger on public.profiles;
create trigger profiles_audit_trigger
after update on public.profiles
for each row
execute function public.write_audit_log();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_assignments enable row level security;
alter table public.time_entries enable row level security;
alter table public.access_rules enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_admin_only" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;

drop policy if exists "projects_select_assigned_or_admin" on public.projects;
drop policy if exists "projects_admin_insert" on public.projects;
drop policy if exists "projects_admin_update" on public.projects;
drop policy if exists "projects_admin_delete" on public.projects;
drop policy if exists "projects_admin_all" on public.projects;
drop policy if exists "projects_select_assigned_users" on public.projects;

drop policy if exists "assignments_select_own_or_admin" on public.project_assignments;
drop policy if exists "assignments_admin_insert" on public.project_assignments;
drop policy if exists "assignments_admin_update" on public.project_assignments;
drop policy if exists "assignments_admin_delete" on public.project_assignments;
drop policy if exists "project_assignments_admin_all" on public.project_assignments;
drop policy if exists "project_assignments_select_own" on public.project_assignments;

drop policy if exists "time_entries_select_own_or_admin" on public.time_entries;
drop policy if exists "time_entries_insert_own" on public.time_entries;
drop policy if exists "time_entries_update_own" on public.time_entries;
drop policy if exists "time_entries_delete_own_or_admin" on public.time_entries;
drop policy if exists "time_entries_admin_all" on public.time_entries;
drop policy if exists "time_entries_select_own" on public.time_entries;
drop policy if exists "time_entries_insert_own_assigned" on public.time_entries;
drop policy if exists "time_entries_update_own_assigned" on public.time_entries;
drop policy if exists "time_entries_delete_own" on public.time_entries;

drop policy if exists "allowed_rules_admin_all" on public.access_rules;
drop policy if exists "access_rules_admin_all" on public.access_rules;

drop policy if exists "audit_logs_admin_all" on public.audit_logs;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_admin_all"
on public.profiles
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "projects_select_assigned_users"
on public.projects
for select
to authenticated
using (
  public.current_user_is_admin()
  or (
    public.current_user_is_approved()
    and public.is_project_assigned(id, auth.uid(), current_date)
  )
);

create policy "projects_admin_all"
on public.projects
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "project_assignments_select_own"
on public.project_assignments
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

create policy "project_assignments_admin_all"
on public.project_assignments
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "time_entries_select_own"
on public.time_entries
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_is_admin()
);

create policy "time_entries_insert_own_assigned"
on public.time_entries
for insert
to authenticated
with check (
  (
    public.current_user_is_admin()
  )
  or (
    user_id = auth.uid()
    and public.current_user_is_approved()
    and (
      category <> 'project'
      or (
        project_id is not null
        and public.is_project_assigned(project_id, auth.uid(), work_date)
      )
    )
  )
);

create policy "time_entries_update_own_assigned"
on public.time_entries
for update
to authenticated
using (
  public.current_user_is_admin()
  or (
    user_id = auth.uid()
    and public.current_user_is_approved()
  )
)
with check (
  public.current_user_is_admin()
  or (
    user_id = auth.uid()
    and public.current_user_is_approved()
    and (
      category <> 'project'
      or (
        project_id is not null
        and public.is_project_assigned(project_id, auth.uid(), work_date)
      )
    )
  )
);

create policy "time_entries_delete_own"
on public.time_entries
for delete
to authenticated
using (
  public.current_user_is_admin()
  or user_id = auth.uid()
);

create policy "access_rules_admin_all"
on public.access_rules
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "audit_logs_admin_all"
on public.audit_logs
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());
