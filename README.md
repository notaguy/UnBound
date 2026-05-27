# INGENIUM — Platformă accesibilitate & sport (MTU Cork)

Platformă mobile-first unde persoanele cu dizabilități cer ce au nevoie (rampă, echipament adaptat, infrastructură), **MTU Cork** aprobă și creează proiecte cu **studenți**, iar **comunitatea** se conectează prin prieteni, evenimente și mesaje.

## Unde sunt stocate datele?

- **Frontend**: GitHub Pages (static)
- **Date**: Supabase (free tier) — conturi, cereri, proiecte, prieteni, mesaje, înscrieri

## Roluri

- **Vizitator** — evenimente săptămână, cereri aprobate (exemple), info roluri
- **Citizen** — cont nou; evenimente, prieteni, chat, comunități
- **Persoană cu dizabilități** — trimite cereri către MTU Cork
- **Student** — alocat pe proiecte (credite facultate)
- **MTU Cork Admin** — aprobă cereri/roluri, creează proiecte, alocă studenți
- **Voluntar** — opțional, pe lângă participare

## Setup Supabase (MVP rapid)

1. Creează un proiect Supabase (free).
2. În Supabase → **SQL Editor** rulează fișierul `supabase/schema.sql`.
   (Pentru MVP, fișierul dezactivează RLS pe tabelele folosite. Pentru producție recomand să activezi RLS și politici stricte.)
3. Activează email/password în Auth. (Pentru test rapid, poți dezactiva confirmarea email-ului.)
4. Marchează un user ca administrator MTU Cork:

   ```sql
   update public.profiles
   set roles = array_append(roles, 'mtu_admin')
   where id = '<AUTH_USER_ID>';
   ```

5. Configurează GitHub Secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Rulare locală
Setează variabilele de mediu:

```bash
set VITE_SUPABASE_URL=https://<project-ref>.supabase.co
set VITE_SUPABASE_ANON_KEY=<anon-key>
npm install
npm run dev
```

## GitHub Pages

Push pe `main` → Settings → Pages → GitHub Actions.

URL: `https://<user>.github.io/<repo>/#/`

## Flux de test

1. **Vizitator** — pagina principală, evenimente, overview platformă
2. **Înregistrare** — devii Citizen
3. **Roluri** — cere „Persoană cu dizabilități” → login ca **MTU Cork Admin** → aprobă rol
4. **Cereri** — Citizen cu rol „Persoană cu dizabilități” trimite cerere → admin aprobă → creează proiect → alocă student
5. **Prieteni** — adaugă prieteni, chat, invită la eveniment
