-- Categories (with sub-category support via parent_id)
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  parent_id uuid references categories(id) on delete cascade,
  created_at timestamptz default now() not null
);

create index idx_categories_user on categories(user_id);
create index idx_categories_parent on categories(parent_id);

-- Items
create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  raw_transcript text not null default '',
  status text not null default 'pending' check (status in ('pending', 'processing', 'done')),
  reminder_at timestamptz,
  confidence text not null default 'high' check (confidence in ('high', 'low')),
  created_at timestamptz default now() not null
);

create index idx_items_user on items(user_id);
create index idx_items_category on items(category_id);
create index idx_items_status on items(status);

-- Voice notes
create table voice_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  duration real not null default 0,
  created_at timestamptz default now() not null
);

-- Join table: voice_notes <-> items (many-to-many)
create table voice_note_items (
  voice_note_id uuid references voice_notes(id) on delete cascade not null,
  item_id uuid references items(id) on delete cascade not null,
  primary key (voice_note_id, item_id)
);

-- Health entries
create table health_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null check (type in ('food', 'exercise')),
  details jsonb not null default '{}',
  logged_at timestamptz default now() not null
);

create index idx_health_user on health_entries(user_id);
create index idx_health_type on health_entries(type);

-- Row Level Security
alter table categories enable row level security;
alter table items enable row level security;
alter table voice_notes enable row level security;
alter table voice_note_items enable row level security;
alter table health_entries enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can CRUD own categories"
  on categories for all using (auth.uid() = user_id);

create policy "Users can CRUD own items"
  on items for all using (auth.uid() = user_id);

create policy "Users can CRUD own voice notes"
  on voice_notes for all using (auth.uid() = user_id);

create policy "Users can CRUD own voice note items"
  on voice_note_items for all using (
    voice_note_id in (select id from voice_notes where user_id = auth.uid())
  );

create policy "Users can CRUD own health entries"
  on health_entries for all using (auth.uid() = user_id);
