# Supabase setup — HotelConnect

One-time setup. Do this once your Supabase project exists.

## 1. Run the schema

Supabase dashboard → **SQL Editor** → **New query** → paste the contents of
[`schema.sql`](./schema.sql) → **Run**.

This creates the `rooms` table, the auto-`updated_at` trigger, Row Level
Security policies, and turns on realtime for the table. It also creates the
`notes` table (free-standing notes / segnalazioni) with its own RLS policies and
realtime.

> `schema.sql` is **safe to re-run**. If your project predates the notes feature,
> just paste and run `schema.sql` again — it adds the `notes` table without
> touching existing `rooms` data.

## 2. Seed the rooms

Same place: new query → paste [`seed.sql`](./seed.sql) → **Run**.

You should now have 33 rows in **Table Editor → rooms** (25 hotel + 8 B&B).

## 3. Create the two hidden role accounts

The app has no real per-person logins. Instead there are two accounts — one for
reception, one for cleaning — and the PIN a user types IS the password to that
account. This gives a real, secured session while the user only sees a PIN.

Dashboard → **Authentication → Users → Add user → Create new user**. Create two:

| Role      | Email (must match `.env.local`)      | Password (= the PIN, placeholder for now) |
| --------- | ------------------------------------ | ----------------------------------------- |
| Reception | `reception@pulizie-hotel.local`      | `1234`  (placeholder)                     |
| Pulizie   | `pulizie@pulizie-hotel.local`        | `5678`  (placeholder)                     |

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
- Leave the two `*_EMAIL` values as-is unless you used different emails above.

That's it — the data layer (next phase) will connect using these.
