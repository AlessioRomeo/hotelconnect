import { createClient } from "@supabase/supabase-js";

// Single shared browser client. The publishable key is safe to expose because
// Row Level Security protects the data — an unauthenticated client sees nothing.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
      "Copy .env.example to .env.local and fill it in.",
  );
}

export const supabase = createClient(url, key);
