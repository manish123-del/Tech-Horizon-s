create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text default 'user',
  created_at timestamp with time zone default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  channel text not null,
  language text,
  started_at timestamp with time zone default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  role text not null,
  content text not null,
  audio_url text,
  sentiment text,
  urgency text,
  fraud boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists bot_configs (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  system_prompt text not null,
  theme_color text,
  avatar_url text
);

create table if not exists flagged_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  reason text not null,
  detected_at timestamp with time zone default now()
);


-- enable row level security and policies
alter table users enable row level security;
create policy "users can see own profile" on users
  for select using (auth.uid() = id);
create policy "admins can manage users" on users
  for all using (auth.role() = 'admin');

alter table conversations enable row level security;
create policy "own conversations" on conversations
  for all using (user_id = auth.uid());
create policy "public insert conv" on conversations
  for insert with check (true);

alter table messages enable row level security;
create policy "messages for own convs" on messages
  for select using (exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "idlers can insert" on messages
  for insert with check (true);

alter table bot_configs enable row level security;
create policy "public read bots" on bot_configs
  for select using (true);

alter table flagged_events enable row level security;
create policy "own flags" on flagged_events
  for select using (exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid()));
