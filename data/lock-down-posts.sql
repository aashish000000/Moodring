-- Locks the posts table so that everyone can read posts, but only the blog
-- owner's account can add, edit or delete them.
--
-- Run once in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- It is safe to run again.
--
-- The owner is taken to be the oldest account under Authentication > Users.
-- The query at the bottom lists the accounts so you can confirm that is you.

do $$
declare
  owner_id uuid;
  pol record;
begin
  select id into owner_id from auth.users order by created_at asc limit 1;
  if owner_id is null then
    raise exception 'No user account found under Authentication > Users';
  end if;

  alter table public.posts enable row level security;

  -- Remove whatever rules exist today, including the one that lets anyone write.
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'posts'
  loop
    execute format('drop policy %I on public.posts', pol.policyname);
  end loop;

  create policy "Anyone can read posts"
    on public.posts for select
    using (true);

  execute format(
    'create policy "Only the owner can add posts" on public.posts
       for insert to authenticated with check (auth.uid() = %L)', owner_id);

  execute format(
    'create policy "Only the owner can edit posts" on public.posts
       for update to authenticated using (auth.uid() = %L) with check (auth.uid() = %L)',
    owner_id, owner_id);

  execute format(
    'create policy "Only the owner can delete posts" on public.posts
       for delete to authenticated using (auth.uid() = %L)', owner_id);
end $$;

-- The first row is the account that can now write posts. It should be yours.
select email, created_at from auth.users order by created_at asc;
