-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists pgcrypto;

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  category text not null,
  created_at timestamptz not null default now()
);

alter table books enable row level security;

create policy "authenticated can read books"
  on books for select
  using (auth.role() = 'authenticated');

create policy "authenticated can insert books"
  on books for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated can update books"
  on books for update
  using (auth.role() = 'authenticated');

create policy "authenticated can delete books"
  on books for delete
  using (auth.role() = 'authenticated');
