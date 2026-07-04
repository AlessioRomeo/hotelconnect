---
name: verify
description: Build, run, and drive HotelConnect locally without a real Supabase project, by stubbing the Supabase HTTP API in Playwright.
---

# Verifying HotelConnect changes

The app is a single client page; every feature is behind the PIN/password login,
and all data comes from Supabase (REST + auth + realtime). There is usually no
`.env.local` on dev machines, so run it with dummy env vars and stub the network.

## Build

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_dummy \
NEXT_PUBLIC_RECEPTION_EMAIL=reception@pulizie-hotel.local \
NEXT_PUBLIC_PULIZIE_EMAIL=pulizie@pulizie-hotel.local \
NEXT_PUBLIC_COLAZIONE_EMAIL=colazione@pulizie-hotel.local \
NEXT_PUBLIC_ADMIN_EMAIL=admin@pulizie-hotel.local \
npm run build   # or: npm run dev -- --port 3456 (background)
```

## Drive

Playwright (scratchpad `npm i playwright`, may need
`npx playwright install chromium-headless-shell`). Stub with `context.route`:

- `**/auth/v1/token**` → 200 with `{access_token, token_type: "bearer",
  expires_in, expires_at, refresh_token, user: {id, aud: "authenticated",
  email}}`; the email decides the role (see `ROLE_EMAILS` in `useAuth.ts`).
  For a wrong PIN/password return 400 with `msg: "Invalid login credentials"`.
- `**/auth/v1/logout**` → 204.
- `**/rest/v1/<table>**` (`rooms`, `notes`, `catalog_items`, `shopping_items`)
  → GET returns a fixture JSON array; POST 201 / PATCH·DELETE 204 with empty
  body (the app is optimistic and only checks `error`).
- Realtime websocket connection failing is fine — the app ignores it.

Login flows: PIN roles via the on-screen pad buttons (digits, then "Conferma");
Titolare via the password input + "Accedi".

## Gotchas

- Bottom-nav accessible names put the badge first: the button is "1 Spesa",
  not "Spesa 1" — match with `locator("nav").getByRole("button", {name: /Spesa/})`.
- `fullPage: true` screenshots repeat the fixed bottom nav mid-page; it's a
  screenshot artifact, not a layout bug.
- UI is Italian; assert on Italian strings.
