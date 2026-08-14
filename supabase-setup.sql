-- Bee: create the per-user storage table with row-level security.
-- Paste this whole thing into Supabase → SQL Editor → Run.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  data jsonb,
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

create policy "own row select" on public.user_data
  for select using (auth.uid() = user_id);
create policy "own row insert" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "own row update" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own row delete" on public.user_data
  for delete using (auth.uid() = user_id);
