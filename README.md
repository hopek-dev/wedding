# Wedding Planner

Private planning dashboard for the wedding day: town hall ceremony, restaurant reception, and boat party. Next.js (App Router) + Supabase, no auth — meant to run locally or behind a private deployment for just the two of you.

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres) via Server Actions using the service role key (never exposed to the browser)

## Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the SQL editor, run [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql). This creates the `events`, `guests`, `guest_rsvps`, `budget_items`, and `tasks` tables, and seeds the three events (ceremony, reception, boat party) so there's something to edit right away.
3. Copy `.env.local.example` to `.env.local` and fill in your project's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API in the Supabase dashboard).
4. Install dependencies and run the dev server:

   ```
   npm install
   npm run dev
   ```

5. Open http://localhost:3000. Edit the three seeded events with real venue/time details (e.g. Marylebone or Chelsea Town Hall for the ceremony), then start adding guests and budget line items.

## Notes

- **No authentication is set up.** This is fine for local use. If you deploy it somewhere reachable on the internet, add a login gate (e.g. Supabase magic-link auth restricted to your two email addresses) before putting real guest data in it.
- Guests get an RSVP row per event automatically when added, defaulting to "not invited" — update per-event status from the Guests table.
- The `tasks` table exists in the schema for a future checklist view but isn't wired into the UI yet.
