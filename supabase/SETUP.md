# Supabase setup — HotelConnect

One-time setup. Do this once your Supabase project exists.

## 1. Run the schema

Supabase dashboard → **SQL Editor** → **New query** → paste the contents of
[`schema.sql`](./schema.sql) → **Run**.

This creates the `rooms` table, the auto-`updated_at` trigger, Row Level
Security policies, and turns on realtime for the table. It also creates the
`notes` table (free-standing notes / segnalazioni) and the breakfast tables
(`catalog_items` + `shopping_items`, the lista della spesa), each with their own
RLS policies and realtime.

> `schema.sql` is **safe to re-run**. If your project predates a feature (notes,
> colazione/spesa), just paste and run `schema.sql` again — it adds the new
> tables/columns without touching existing data. For existing projects there is
> also a self-contained migration per feature in [`migrations/`](./migrations).

## 2. Seed the rooms and the shopping catalog

Same place: new query → paste [`seed.sql`](./seed.sql) → **Run**.

You should now have the rooms in **Table Editor → rooms** and the fixed
shopping catalog in **catalog_items**.

## 3. Create the four hidden role accounts

The app has no real per-person logins. Instead there is one account per role —
reception, cleaning, breakfast, owner — and the PIN (or password, for the
owner) a user types IS the password to that account. This gives a real, secured
session while the user only sees a PIN.

Dashboard → **Authentication → Users → Add user → Create new user**. Create four:

| Role      | Email (must match `.env.local`)      | Password (= the PIN, placeholder for now) |
| --------- | ------------------------------------ | ----------------------------------------- |
| Reception | `reception@pulizie-hotel.local`      | `1234`  (placeholder)                     |
| Pulizie   | `pulizie@pulizie-hotel.local`        | `5678`  (placeholder)                     |
| Colazione | `colazione@pulizie-hotel.local`      | `147369`                                  |
| Titolare  | `admin@pulizie-hotel.local`          | a real password (not a PIN)               |

Important when creating each user:
- Turn **ON** "Auto Confirm User" (so no email confirmation is needed — these
  are fake internal addresses that can't receive mail).
- The real PINs will be chosen by the hotel later; just change these passwords
  when they do.

> Supabase may enforce a minimum password length (commonly 6). If a 4-digit PIN
> is rejected, either set the project's minimum password length lower in
> **Authentication → Policies/Settings**, or agree with the hotel on a 6-digit PIN.

## 4. Fill in environment variables

Copy `.env.example` → `.env.local` in the project root and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (Project Settings → API)
- Leave the four `*_EMAIL` values as-is unless you used different emails above.

Remember to add the same variables to Vercel (Project → Settings →
Environment Variables) and redeploy, otherwise the new roles can't log in.

That's it — the data layer (next phase) will connect using these.
