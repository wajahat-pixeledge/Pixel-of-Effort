-- Reliability + performance updates:
-- 1) Server-callable profile bootstrap for authenticated users.
-- 2) Additional indexes for dashboard/report filters.

create or replace function public.bootstrap_profile_for_current_user()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_uid uuid := auth.uid();
  auth_email text;
  is_first_user boolean;
  should_auto_approve boolean;
  has_access_rule_fn boolean;
  profile_row public.profiles%rowtype;
begin
  if current_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'no_auth_user');
  end if;

  select *
  into profile_row
  from public.profiles
  where id = current_uid;

  if found then
    return to_jsonb(profile_row);
  end if;

  select lower(email)
  into auth_email
  from auth.users
  where id = current_uid;

  if auth_email is null then
    return jsonb_build_object('ok', false, 'reason', 'email_missing');
  end if;

  is_first_user := not exists (select 1 from public.profiles);
  has_access_rule_fn := to_regprocedure('public.email_matches_access_rule(text)') is not null;

  if has_access_rule_fn then
    should_auto_approve := is_first_user or public.email_matches_access_rule(auth_email);
  else
    should_auto_approve := is_first_user or public.email_matches_allowed_rule(auth_email);
  end if;

  insert into public.profiles (
    id,
    email,
    role,
    access_status,
    approved_at,
    approved_by
  ) values (
    current_uid,
    auth_email,
    case when is_first_user then 'admin'::public.app_role else 'user'::public.app_role end,
    case when should_auto_approve then 'approved'::public.access_status else 'pending'::public.access_status end,
    case when should_auto_approve then now() else null end,
    null
  )
  on conflict (id) do nothing;

  select *
  into profile_row
  from public.profiles
  where id = current_uid;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'insert_failed');
  end if;

  return to_jsonb(profile_row);
end;
$$;

revoke all on function public.bootstrap_profile_for_current_user() from public;
grant execute on function public.bootstrap_profile_for_current_user() to authenticated;

create index if not exists projects_active_name_idx
  on public.projects (is_active, name);

create index if not exists profiles_access_created_idx
  on public.profiles (access_status, role, created_at desc);

create index if not exists project_assignments_project_active_window_idx
  on public.project_assignments (project_id, is_active, active_from, active_until);

create index if not exists time_entries_work_date_idx
  on public.time_entries (work_date desc);

create index if not exists time_entries_filter_idx
  on public.time_entries (work_date desc, category, status_flag, user_id, project_id);

create index if not exists audit_logs_entity_idx
  on public.audit_logs (table_name, record_id, created_at desc);
