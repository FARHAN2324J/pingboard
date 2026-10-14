-- Pingboard MVP schema. This starter policy is intentionally open for link-based prototyping.
-- Before storing private content, replace the permissive policies with room-token/authenticated membership checks.
create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id text primary key,
  title text not null default 'our little corner',
  created_at timestamptz not null default now()
);

create table if not exists public.board_objects (
  id uuid primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists board_objects_room_created_idx on public.board_objects(room_id, created_at);
create index if not exists board_objects_data_gin_idx on public.board_objects using gin(data);

alter table public.rooms enable row level security;
alter table public.board_objects enable row level security;

drop policy if exists "rooms are readable in MVP" on public.rooms;
create policy "rooms are readable in MVP" on public.rooms for select using (true);
drop policy if exists "rooms can be created in MVP" on public.rooms;
create policy "rooms can be created in MVP" on public.rooms for insert with check (true);
drop policy if exists "board objects are readable in MVP" on public.board_objects;
create policy "board objects are readable in MVP" on public.board_objects for select using (true);
drop policy if exists "board objects can be created in MVP" on public.board_objects;
create policy "board objects can be created in MVP" on public.board_objects for insert with check (true);
drop policy if exists "board objects can be updated in MVP" on public.board_objects;
create policy "board objects can be updated in MVP" on public.board_objects for update using (true) with check (true);
drop policy if exists "board objects can be deleted in MVP" on public.board_objects;
create policy "board objects can be deleted in MVP" on public.board_objects for delete using (true);

-- Create the board_objects table in the Supabase project, then enable Realtime if you want to use
-- Postgres Changes later. This app currently uses Supabase Broadcast for low-latency collaboration.
