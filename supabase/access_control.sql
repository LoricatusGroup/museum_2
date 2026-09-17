-- ════════════════════════════════════════════════════════════════════════
--  Admin hozzáférés — a Supabase projektre MÁR ALKALMAZOTT állapot másolata
--  (referencia; az élő igazság az adatbázisban van)
--
--  Szabály: admin az, akinek a címe @loricatus.hu végű VAGY rajta van a
--  kivétellistán, ÉS a címét megerősítette.
--
--  Miért itt: a repóban eddig semmi nem rögzítette, ki férhet az adminhoz.
--  Ha a projektet valaha újra kell építeni, ez a fájl a kiindulópont.
-- ════════════════════════════════════════════════════════════════════════

-- ── Kivételek a domain-szabály mellé ──
create table if not exists public.admin_allowlist (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);
alter table public.admin_allowlist enable row level security;

-- ── Engedélyezett-e a cím? Domain VAGY kivétellista ──
create or replace function public.email_allowed(addr text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    lower(addr) like '%@loricatus.hu'
    or exists (select 1 from public.admin_allowlist a where a.email = lower(addr)),
    false);
$$;

-- ── A hívó admin-e? ──
-- Szándékosan az auth.users TÁBLÁT olvassa, nem a JWT user_metadata mezőjét:
-- azt a felhasználó maga is átírhatja a /auth/v1/user végponton, a táblát nem.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and u.deleted_at is null
      and (u.banned_until is null or u.banned_until < now())
      and coalesce(u.is_anonymous, false) = false
      and public.email_allowed(u.email)
  );
$$;

-- Az email_allowed() NEM lehet kívülről hívható: azzal végig lehetne próbálni,
-- melyik cím van a kivétellistán. Az is_admin() csak a hívóról mond igazat.
revoke execute on function public.email_allowed(text) from anon, authenticated, public;
grant  execute on function public.is_admin() to anon, authenticated;

-- ── Második védelmi vonal: idegen címmel fiók se jöjjön létre ──
-- A BEJELENTKEZÉS nem ír auth.users-be, csak a REGISZTRÁCIÓ — ha ez a trigger
-- valaha hibázna, a meglévő adminok akkor is be tudnak lépni.
create or replace function public.block_signup_outside_domain()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or not public.email_allowed(new.email) then
    raise exception 'Ehhez a felülethez csak @loricatus.hu címmel lehet fiókot létrehozni.'
      using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke execute on function public.block_signup_outside_domain() from anon, authenticated, public;

drop trigger if exists csak_ceges_domain on auth.users;
create trigger csak_ceges_domain
  before insert on auth.users
  for each row execute function public.block_signup_outside_domain();

-- ════════════════════════════════════════════════════════════════════════
--  RLS: minden admin-művelet is_admin()-t követel.
--  KORÁBBAN ezek "using (true)" voltak, azaz BÁRMELY bejelentkezett
--  felhasználó teljes admin volt — ez volt a betömött lyuk.
--  A (select public.is_admin()) forma szándékos: így soronként nem fut újra.
-- ════════════════════════════════════════════════════════════════════════

-- ── admin_allowlist: csak admin ──
drop policy if exists "admin kezeli a kivetellistat" on public.admin_allowlist;
create policy "admin kezeli a kivetellistat" on public.admin_allowlist
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── exhibits ──
drop policy if exists "admin teljes olvasas" on public.exhibits;
create policy "admin teljes olvasas" on public.exhibits
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "admin beszuras" on public.exhibits;
create policy "admin beszuras" on public.exhibits
  for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "admin modositas" on public.exhibits;
create policy "admin modositas" on public.exhibits
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "admin torles" on public.exhibits;
create policy "admin torles" on public.exhibits
  for delete to authenticated using ((select public.is_admin()));
-- a látogató látja a kész, publikált tárgyakat (ez adja a múzeum tartalmát)
drop policy if exists "publikus olvasas kesz targyakra" on public.exhibits;
create policy "publikus olvasas kesz targyakra" on public.exhibits
  for select to anon, authenticated
  using (is_published and status = 'ready');

-- ── narrations ──
drop policy if exists "admin teljes olvasas" on public.narrations;
create policy "admin teljes olvasas" on public.narrations
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "admin beszuras" on public.narrations;
create policy "admin beszuras" on public.narrations
  for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "admin modositas" on public.narrations;
create policy "admin modositas" on public.narrations
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "admin torles" on public.narrations;
create policy "admin torles" on public.narrations
  for delete to authenticated using ((select public.is_admin()));
-- csak a publikált sáv látszik, és csak ha van hozzá hang (enélkül a lejátszó üres)
drop policy if exists "publikus olvasas kesz sav" on public.narrations;
create policy "publikus olvasas kesz sav" on public.narrations
  for select to anon, authenticated
  using (is_published and audio_url is not null);

-- ── app_settings (Drive-mappák) ──
drop policy if exists "admin olvassa a beallitasokat" on public.app_settings;
create policy "admin olvassa a beallitasokat" on public.app_settings
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "admin irja a beallitasokat" on public.app_settings;
create policy "admin irja a beallitasokat" on public.app_settings
  for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "admin modositja a beallitasokat" on public.app_settings;
create policy "admin modositja a beallitasokat" on public.app_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── Storage: media bucket ──
-- Az OLVASÁS publikus marad: a múzeum innen tölti a képeket, videókat, hangot.
drop policy if exists "media publikus olvasas" on storage.objects;
create policy "media publikus olvasas" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
drop policy if exists "media admin feltoltes" on storage.objects;
create policy "media admin feltoltes" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.is_admin()));
drop policy if exists "media admin modositas" on storage.objects;
create policy "media admin modositas" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));
drop policy if exists "media admin torles" on storage.objects;
create policy "media admin torles" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.is_admin()));
