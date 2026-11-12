-- ============================================================
-- Bilinha Jóias e Pratas — Schema Supabase (Postgres)
-- Execute este arquivo no SQL Editor do Supabase.
-- ============================================================

-- Extensões necessárias
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Função auxiliar: verifica se o JWT pertence a um admin
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ------------------------------------------------------------
-- Tabela: products
-- ------------------------------------------------------------
create table if not exists public.products (
  id            bigint primary key default extract(epoch from now()) * 1000,
  title         text        not null check (char_length(title) between 2 and 120),
  category      text        not null,
  price         numeric(12,2) not null check (price > 0),
  promo         numeric(12,2) check (promo is null or promo > 0),
  installment   text        default '',
  description   text        default '',
  featured      boolean     not null default false,
  available     boolean     not null default true,
  images        jsonb       not null default '[]'::jsonb,
  sort_order    integer     not null default 0,
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: banners
-- ------------------------------------------------------------
create table if not exists public.banners (
  id            bigint primary key default extract(epoch from now()) * 1000,
  title         text        default '',
  sub           text        default '',
  btn           text        default '',
  link          text        default '',
  img           jsonb       default null,
  on            boolean     not null default true,
  sort_order    integer     not null default 0,
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: ads (anúncios)
-- ------------------------------------------------------------
create table if not exists public.ads (
  id            bigint primary key default extract(epoch from now()) * 1000,
  title         text        default '',
  "text"        text        default '',
  btn           text        default '',
  link          text        default '',
  img           jsonb       default null,
  on            boolean     not null default true,
  sort_order    integer     not null default 0,
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: categories
-- ------------------------------------------------------------
create table if not exists public.categories (
  id            bigint primary key default extract(epoch from now()) * 1000,
  name          text        not null unique,
  img           jsonb       default null,
  on            boolean     not null default true,
  sort_order    integer     not null default 0,
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: settings (linha única, id = 1)
-- ------------------------------------------------------------
create table if not exists public.settings (
  id            integer primary key default 1 check (id = 1),
  data          jsonb       not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Triggers de updated_at
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_banners_updated_at on public.banners;
create trigger trg_banners_updated_at
  before update on public.banners
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_ads_updated_at on public.ads;
create trigger trg_ads_updated_at
  before update on public.ads
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------
alter table public.products    enable row level security;
alter table public.banners     enable row level security;
alter table public.ads         enable row level security;
alter table public.categories  enable row level security;
alter table public.settings    enable row level security;

-- Leitura pública
create policy "Leitura pública products"
  on public.products for select
  using (true);

create policy "Leitura pública banners"
  on public.banners for select
  using (true);

create policy "Leitura pública ads"
  on public.ads for select
  using (true);

create policy "Leitura pública categories"
  on public.categories for select
  using (true);

create policy "Leitura pública settings"
  on public.settings for select
  using (true);

-- Escrita apenas para admin
create policy "Admin escreve products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin escreve banners"
  on public.banners for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin escreve ads"
  on public.ads for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin escreve categories"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin escreve settings"
  on public.settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- Publicação Realtime
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.banners;
alter publication supabase_realtime add table public.ads;
alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.settings;

-- ------------------------------------------------------------
-- Dados iniciais (opcional — categorias padrão)
-- ------------------------------------------------------------
insert into public.categories (name, sort_order)
values
  ('Pratas', 0),
  ('Relógios', 1),
  ('Alianças', 2),
  ('Colares', 3),
  ('Óculos', 4),
  ('Combos', 5)
on conflict (name) do nothing;

-- Settings inicial
insert into public.settings (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;