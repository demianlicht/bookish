-- Run once in the Supabase SQL editor (Project -> SQL Editor -> New query),
-- after schema.sql. Adds the vinyl records collection.

create table if not exists vinyl_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  year integer,
  genre text,
  created_at timestamptz not null default now()
);

alter table vinyl_records enable row level security;

create policy "authenticated can read vinyl_records"
  on vinyl_records for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert vinyl_records"
  on vinyl_records for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update vinyl_records"
  on vinyl_records for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete vinyl_records"
  on vinyl_records for delete
  using (auth.role() = 'authenticated');
