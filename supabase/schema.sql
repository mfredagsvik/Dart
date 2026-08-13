create table if not exists public.dart_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dart_state enable row level security;

insert into public.dart_state (id, state)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- Ingen public RLS-policy er nødvendig.
-- Vercel API-et bruker SUPABASE_SERVICE_ROLE_KEY på serversiden.
