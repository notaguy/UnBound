import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Pentru build/TypeScript: exportăm client non-null.
// Dacă lipsesc variabilele de mediu, folosim un placeholder ca să nu crape aplicația.
// Apelurile către DB vor eșua până setezi `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY`.
const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  "https://invalid.supabase.co";
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "invalid";

export const supabase: SupabaseClient = createClient(url, anonKey);

