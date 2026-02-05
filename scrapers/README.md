# Scrapers

Craigslist housing scraper; optional pipeline to store results in Supabase.

## Pipeline: Scrape → Store in Supabase

1. **Apply the Supabase migration** (if you haven’t) so the `listings` table exists:
   - `supabase db push` from project root, or run `supabase/migrations/20240203000000_create_listings.sql` in the Dashboard SQL Editor.

2. **Set environment variables** so the scraper can talk to Supabase:
   - `SUPABASE_URL` – your project URL (e.g. `https://xxxx.supabase.co`).
   - `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` – from Dashboard → Project Settings → API.
   - You can use the same values as your Next app: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or service role key in a server-only env).

   **Option A – `.env` in `scrapers/`**  
   Create `scrapers/.env` (and add it to `.gitignore` if it isn’t):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   **Option B – Copy from project root**  
   If your root `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, you can copy those into `scrapers/.env` as `SUPABASE_URL` and `SUPABASE_ANON_KEY`, or load `.env.local` before running (e.g. `dotenv` or manual export).

3. **Install dependencies** (from repo root or `scrapers/`):
   ```bash
   pip install -r scrapers/requirements.txt
   ```

4. **Run the pipeline** (from repo root or from `scrapers/`):
   ```bash
   cd scrapers
   python scraper.py
   ```
   - This scrapes one page of “berkeley” housing and **upserts** all listings into the Supabase `listings` table (by `url`, so repeats update instead of duplicate).
   - To only scrape and print (no Supabase):
   ```bash
   python scraper.py --no-save
   ```

5. **Check in Supabase**  
   Dashboard → Table Editor → `listings` to see the rows.

## Summary

| Step              | Action |
|-------------------|--------|
| 1. Migration      | `supabase db push` or run the listings migration SQL in Dashboard. |
| 2. Env vars       | Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`) in `scrapers/.env` or your shell. |
| 3. Install        | `pip install -r scrapers/requirements.txt` |
| 4. Run            | `cd scrapers && python scraper.py` (use `--no-save` to skip Supabase). |
| 5. Verify         | Open Table Editor → `listings` in the Supabase Dashboard. |
