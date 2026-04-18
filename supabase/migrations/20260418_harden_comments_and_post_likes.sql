alter table public.comments enable row level security;

drop policy if exists "Allow public read approved comments" on public.comments;
create policy "Allow public read approved comments"
on public.comments
for select
to anon
using (is_approved = true);

drop policy if exists "Allow public insert comments" on public.comments;
create policy "Allow public insert comments"
on public.comments
for insert
to anon
with check (
  char_length(trim(post_slug)) > 0
  and char_length(trim(author_name)) between 1 and 40
  and char_length(trim(content)) between 3 and 1000
  and device_id is not null
  and char_length(trim(device_id)) >= 16
);

drop policy if exists "Allow public read active likes" on public.post_likes;
create policy "Allow public read active likes"
on public.post_likes
for select
to anon
using (is_active = true);

drop policy if exists "Allow public insert likes" on public.post_likes;
drop policy if exists "Allow public update own device likes" on public.post_likes;
