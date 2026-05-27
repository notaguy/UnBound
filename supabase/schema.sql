-- Supabase schema pentru INGENIUM (MVP, rapid de configurat)
-- Rulează în SQL Editor din Supabase.

create extension if not exists pgcrypto;

-- Pentru MVP: păstrează RLS simplu.
-- Varianta rapidă: dezactivează RLS pe tabelele folosite.
-- (Pentru producție, activează RLS și scrie politici stricte.)

-- PROFILURI (de la auth.users id)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  roles text[] not null default '{}'::text[],
  is_volunteer boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cereneri de rol (Citizen -> Student / Disability)
create table if not exists public.role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  status text not null default 'pending',
  message text,
  created_at timestamptz not null default now()
);

-- Cereri de accesibilitate (disability -> MTU Cork)
create table if not exists public.need_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  image_url text,
  status text not null default 'pending',
  admin_note text,
  project_id uuid,
  created_at timestamptz not null default now()
);

-- Proiecte create de MTU Cork
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  need_request_id uuid not null references public.need_requests(id) on delete cascade,
  title text not null,
  description text not null,
  faculty_tags text[] not null default '{}'::text[],
  student_ids uuid[] not null default '{}'::uuid[],
  status text not null default 'planning',
  created_by_admin_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Comunități
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  creator_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

-- Prietenii (simetric prin cod)
create table if not exists public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'accepted',
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

-- Evenimente (evenimentele sunt în cod; aici ținem înscrieri + invitații)
create table if not exists public.event_registrations (
  event_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.event_invitations (
  event_id text not null,
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (event_id, to_user_id)
);

-- Conversații + mesaje
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Dezactivare RLS (MVP rapid)
-- Pentru fiecare tabel, dezactivează dacă ai RLS activ.
alter table public.profiles disable row level security;
alter table public.role_requests disable row level security;
alter table public.need_requests disable row level security;
alter table public.projects disable row level security;
alter table public.communities disable row level security;
alter table public.community_members disable row level security;
alter table public.friendships disable row level security;
alter table public.event_registrations disable row level security;
alter table public.event_invitations disable row level security;
alter table public.conversations disable row level security;
alter table public.messages disable row level security;

