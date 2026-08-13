-- Chalupa (Lotería) game schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table if not exists rooms (
  id text primary key,                     -- short room code, e.g. "FOX42"
  status text not null default 'waiting',  -- waiting | playing | finished
  deck jsonb not null default '[]'::jsonb, -- shuffled array of card ids, draw order
  draw_index int not null default 0,       -- how many cards from `deck` have been called
  paused boolean not null default false,   -- caller-triggered break; halts auto-calling
  winner_player_id uuid,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now() -- bumped by triggers below; drives 24h expiry
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  name text not null,
  is_caller boolean not null default false,
  tabla jsonb not null,                    -- array of 16 card ids for this player's board
  marked jsonb not null default '[]'::jsonb, -- array of card ids the player has marked
  wins int not null default 0,             -- lifetime round wins in this room, for the leaderboard
  joined_at timestamptz not null default now(),
  last_active_at timestamptz not null default now() -- bumped on any change; drives 1h inactivity kick
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  player_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table rooms enable row level security;
alter table players enable row level security;
alter table messages enable row level security;

-- Casual party game: no accounts, anyone with the room code can read/write.
-- Not suitable for anything sensitive, but fine for a living-room game.
create policy "rooms readable by anyone" on rooms for select using (true);
create policy "rooms writable by anyone" on rooms for insert with check (true);
create policy "rooms updatable by anyone" on rooms for update using (true);

create policy "players readable by anyone" on players for select using (true);
create policy "players insertable by anyone" on players for insert with check (true);
create policy "players updatable by anyone" on players for update using (true);

create policy "messages readable by anyone" on messages for select using (true);
create policy "messages insertable by anyone" on messages for insert with check (true);

-- Enable realtime on all three tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table messages;

-- Room expiry: a room whose last activity (a draw, a mark, a chat message,
-- a player joining, etc.) is more than 24h old gets deleted automatically.
-- Players/messages cascade-delete with it via their existing foreign keys.
-- Safe to re-run: covers projects created before this column existed too.
alter table rooms add column if not exists last_active_at timestamptz not null default now();

create or replace function touch_room_last_active()
returns trigger as $$
begin
  if tg_table_name = 'rooms' then
    new.last_active_at := now();
    return new;
  end if;

  update rooms set last_active_at = now() where id = new.room_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists rooms_touch_last_active on rooms;
create trigger rooms_touch_last_active
  before update on rooms
  for each row execute function touch_room_last_active();

drop trigger if exists players_touch_room on players;
create trigger players_touch_room
  after insert or update on players
  for each row execute function touch_room_last_active();

drop trigger if exists messages_touch_room on messages;
create trigger messages_touch_room
  after insert on messages
  for each row execute function touch_room_last_active();

-- Hourly cleanup job. Requires the pg_cron extension — enable it once via
-- the Supabase dashboard (Database -> Extensions -> pg_cron) before running
-- this, or the CREATE EXTENSION line below may need dashboard access too
-- depending on your project's permissions.
create extension if not exists pg_cron;

select cron.schedule(
  'chalupa-room-expiry',
  '0 * * * *', -- every hour, on the hour
  $$ delete from rooms where last_active_at < now() - interval '24 hours' $$
);

-- Inactive-player cleanup: a player who hasn't marked a card or otherwise
-- touched their row in over an hour gets removed from the room, so a dead
-- browser tab doesn't linger in the player list/leaderboard forever. The
-- caller is exempt -- once calling starts, cards auto-advance via the
-- rooms table, not the caller's own players row, so a caller who's quietly
-- hosting without clicking anything would otherwise look "inactive" and
-- get wrongly kicked mid-game.
alter table players add column if not exists last_active_at timestamptz not null default now();

create or replace function touch_player_last_active()
returns trigger as $$
begin
  new.last_active_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists players_self_touch_last_active on players;
create trigger players_self_touch_last_active
  before update on players
  for each row execute function touch_player_last_active();

select cron.schedule(
  'chalupa-inactive-player-cleanup',
  '*/15 * * * *', -- every 15 minutes, for tighter precision than the 1h window
  $$ delete from players where last_active_at < now() - interval '1 hour' and is_caller = false $$
);
