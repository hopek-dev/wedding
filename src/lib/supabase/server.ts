import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Never import this from a
// "use client" file or a route that runs in the browser — the service role
// key bypasses row level security entirely.
//
// Left untyped (no Database generic): our hand-written row types in
// ./types are simpler than what supabase-js's generated-types generic
// expects, and fighting that shape isn't worth it for a small private app.
// Callers cast query results to the row types themselves.
export function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
