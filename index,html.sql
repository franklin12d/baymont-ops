-- Run this in Supabase → SQL Editor
-- Creates the single table used by Baymont Operations Hub v5

create table if not exists app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Allow the app (anon key) to read and write
alter table app_state enable row level security;

create policy "anon read" on app_state
  for select using (true);

create policy "anon write" on app_state
  for insert with check (true);

create policy "anon update" on app_state
  for update using (true);

-- Done. The app will auto-create rows on first save.
