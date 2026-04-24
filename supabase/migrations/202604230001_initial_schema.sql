-- Core schema for LOE tracker.
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'user');
create type public.access_status as enum ('pending', 'approved', 'rejected');
create type public.time_entry_category as enum ('project', 'time_off', 'office_process', 'free_open');
create type public.time_entry_status_flag as enum ('none', 'needs_review', 'blocked');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'user',
  access_status public.access_status not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.allowed_email_rules (
  id uuid primary key default gen_random_uuid(),
  pattern text not null unique,
  note text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  category public.time_entry_category not null,
  work_date date not null,
  minutes integer not null check (minutes > 0 and minutes <= 1440),
  comment text,
  status_flag public.time_entry_status_flag,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_entry_consistency check (
    (category = 'project' and project_id is not null)
    or (category <> 'project' and project_id is null)
  )
);

create index profiles_role_idx on public.profiles (role, access_status);
create index project_assignments_user_idx on public.project_assignments (user_id);
create index project_assignments_project_idx on public.project_assignments (project_id);
create index time_entries_user_date_idx on public.time_entries (user_id, work_date desc);
create index time_entries_project_idx on public.time_entries (project_id);
create index allowed_email_rules_active_idx on public.allowed_email_rules (is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create trigger time_entries_set_updated_at
before update on public.time_entries
for each row
execute function public.set_updated_at();

create or replace function public.email_matches_allowed_rule(email_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_email_rules
    where is_active = true
      and lower(email_input) ilike lower(pattern)
  );
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

create or replace function public.is_project_assigned(project_input uuid, user_input uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_assignments
    where project_id = project_input
      and user_id = user_input
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
  should_auto_approve := is_first_user or public.email_matches_allowed_rule(new.email);

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

alter table public.profiles enable row level security;
alter table public.allowed_email_rules enable row level security;
alter table public.projects enable row level security;
alter table public.project_assignments enable row level security;
alter table public.time_entries enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid() or public.current_user_is_admin()
);

create policy "profiles_update_admin_only"
on public.profiles
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "allowed_rules_admin_all"
on public.allowed_email_rules
for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "projects_select_assigned_or_admin"
on public.projects
for select
to authenticated
using (
  public.current_user_is_admin()
  or (
    public.current_user_is_approved()
    and public.is_project_assigned(id, auth.uid())
  )
);

create policy "projects_admin_insert"
on public.projects
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "projects_admin_update"
on public.projects
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "projects_admin_delete"
on public.projects
for delete
to authenticated
using (public.current_user_is_admin());

create policy "assignments_select_own_or_admin"
on public.project_assignments
for select
to authenticated
using (
  user_id = auth.uid() or public.current_user_is_admin()
);

create policy "assignments_admin_insert"
on public.project_assignments
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "assignments_admin_update"
on public.project_assignments
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "assignments_admin_delete"
on public.project_assignments
for delete
to authenticated
using (public.current_user_is_admin());

create policy "time_entries_select_own_or_admin"
on public.time_entries
for select
to authenticated
using (
  user_id = auth.uid() or public.current_user_is_admin()
);

create policy "time_entries_insert_own"
on public.time_entries
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.current_user_is_approved()
  and (
    category <> 'project'
    or (
      project_id is not null
      and public.is_project_assigned(project_id, auth.uid())
    )
  )
);

create policy "time_entries_update_own"
on public.time_entries
for update
to authenticated
using (
  user_id = auth.uid()
  and public.current_user_is_approved()
)
with check (
  user_id = auth.uid()
  and public.current_user_is_approved()
  and (
    category <> 'project'
    or (
      project_id is not null
      and public.is_project_assigned(project_id, auth.uid())
    )
  )
);

create policy "time_entries_delete_own_or_admin"
on public.time_entries
for delete
to authenticated
using (
  user_id = auth.uid() or public.current_user_is_admin()
);
