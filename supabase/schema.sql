-- ORS Kahvaltı Ligi — Supabase schema
-- Run in Supabase SQL editor

-- ============= Players =============
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initials text,
  emoji text default '⚽',
  team text,
  created_at timestamptz default now()
);

-- ============= Teams (national teams) =============
create table if not exists teams (
  code text primary key,        -- e.g. 'TUR'
  name text not null,
  flag text,
  color text
);

-- ============= Matches =============
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  home_code text references teams(code),
  away_code text references teams(code),
  kickoff timestamptz not null,
  group_name text,
  venue text,
  result text check (result in ('1','X','2')),  -- null until final
  locked boolean default false,
  created_at timestamptz default now()
);

-- ============= Predictions =============
create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  match_id uuid references matches(id) on delete cascade,
  pick text not null check (pick in ('1','X','2')),
  points int default 0,
  scored boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (player_id, match_id)
);

-- ============= Leaderboard view =============
create or replace view leaderboard as
select
  p.id,
  p.name,
  p.emoji,
  p.team,
  coalesce(sum(pr.points), 0) as points,
  count(pr.*) filter (where pr.scored and pr.points > 0) as correct,
  count(pr.*) filter (where pr.scored and pr.points < 0) as wrong,
  rank() over (order by coalesce(sum(pr.points), 0) desc) as rank
from players p
left join predictions pr on pr.player_id = p.id
group by p.id, p.name, p.emoji, p.team;

-- ============= Scoring trigger =============
-- When a match's result is set, score all predictions for that match.
-- Correct = +3, wrong = -1, no prediction handled separately by scheduled job.
create or replace function score_predictions_on_result()
returns trigger as $$
begin
  if new.result is not null and (old.result is null or old.result <> new.result) then
    update predictions
       set points = case when pick = new.result then 3 else -1 end,
           scored = true,
           updated_at = now()
     where match_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_score_predictions on matches;
create trigger trg_score_predictions
after update on matches
for each row execute function score_predictions_on_result();

-- ============= RLS =============
alter table predictions enable row level security;
create policy "predictions_read" on predictions for select using (true);
create policy "predictions_insert_own" on predictions
  for insert with check (auth.uid() = player_id);
create policy "predictions_update_own" on predictions
  for update using (auth.uid() = player_id);
