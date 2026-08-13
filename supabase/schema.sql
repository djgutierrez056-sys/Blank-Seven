-- Chalupa (Lotería) game schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table if not exists rooms (
  id text primary key,                     -- short room code, e.g. "FOX42"
  status text not null default 'waiting',  -- waiting | playing | finished
  deck jsonb not null default '[]'::jsonb, -- shuffled array of card ids, draw order
  draw_index int not null default 0,       -- how many cards from `deck` have been called
  winner_player_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  name text not null,
  is_caller boolean not null default false,
  tabla jsonb not null,                    -- array of 16 card ids for this player's board
  marked jsonb not null default '[]'::jsonb, -- array of card ids the player has marked
  joined_at timestamptz not null default now()
);

alter table rooms enable row level security;
alter table players enable row level security;

-- Casual party game: no accounts, anyone with the room code can read/write.
-- Not suitable for anything sensitive, but fine for a living-room game.
create policy "rooms readable by anyone" on rooms for select using (true);
create policy "rooms writable by anyone" on rooms for insert with check (true);
create policy "rooms updatable by anyone" on rooms for update using (true);

create policy "players readable by anyone" on players for select using (true);
create policy "players insertable by anyone" on players for insert with check (true);
create policy "players updatable by anyone" on players for update using (true);

-- Enable realtime on both tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
