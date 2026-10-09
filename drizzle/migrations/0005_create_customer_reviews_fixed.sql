-- Customer reviews with explicit admin moderation.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(trim(comment)) between 8 and 1200),
  response text null check (response is null or char_length(response) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);
grant select, insert on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
create index if not exists reviews_status_created_at_idx on public.reviews (status, created_at desc);
alter table public.reviews enable row level security;
drop policy if exists "Anyone can read approved reviews" on public.reviews;
create policy "Anyone can read approved reviews" on public.reviews for select to anon, authenticated using (status = 'approved');
drop policy if exists "Admins can read all reviews" on public.reviews;
create policy "Admins can read all reviews" on public.reviews for select to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists "Visitors can submit pending reviews" on public.reviews;
create policy "Visitors can submit pending reviews" on public.reviews for insert to anon, authenticated with check (status = 'pending' and response is null and rating between 1 and 5 and char_length(trim(name)) between 2 and 80 and char_length(trim(comment)) between 8 and 1200);
drop policy if exists "Admins can moderate reviews" on public.reviews;
create policy "Admins can moderate reviews" on public.reviews for update to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role)) with check (public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists "Admins can delete reviews" on public.reviews;
create policy "Admins can delete reviews" on public.reviews for delete to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));