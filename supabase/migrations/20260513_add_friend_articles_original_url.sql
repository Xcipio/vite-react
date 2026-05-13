alter table public.friend_articles
  add column if not exists original_url text;
