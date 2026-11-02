create table public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  tracks     text[] not null default '{}',
  current    text,
  updated_at timestamptz not null default now(),
  -- Keep junk out: only the 23 known track ids, no duplicates, no oversized rows.
  constraint tracks_known check (
    tracks <@ array['support','networking','linux','sql','web','python','security','cloud','devops',
      'programming','math','algorithms','architecture','os','engineering','theory','ai',
      'ba','sad','model','erp','analytics','itpm']
    and cardinality(tracks) <= 23
  ),
  constraint current_known check (
    current is null or current in ('support','networking','linux','sql','web','python','security','cloud','devops',
      'programming','math','algorithms','architecture','os','engineering','theory','ai',
      'ba','sad','model','erp','analytics','itpm')
  )
);

alter table public.progress enable row level security;
alter table public.progress force row level security;
revoke all on public.progress from anon, public;
grant select, insert, update on public.progress to authenticated;

-- True when the user has no 2FA, or is logged in at the 2FA level (aal2).
-- Security definer because normal users cannot read auth.mfa_factors.
create function public.mfa_ok() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors
                     where user_id = auth.uid() and status = 'verified');
$$;
revoke all on function public.mfa_ok() from public, anon;
grant execute on function public.mfa_ok() to authenticated;

create policy "own row, read"   on public.progress for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own row, insert" on public.progress for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "own row, update" on public.progress for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- RESTRICTIVE = must also pass, so a password-only session cannot read data once 2FA is on.
create policy "2fa required if enrolled" on public.progress as restrictive for all to authenticated
  using (public.mfa_ok()) with check (public.mfa_ok());
