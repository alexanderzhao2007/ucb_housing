-- Create the listings table for scraped housing data (e.g. Craigslist)
-- Matches the shape of data from scrapers/scraper.py: title, url, price, location, bedrooms, bathrooms
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  price TEXT NOT NULL,
  location TEXT NOT NULL,
  bedrooms TEXT NOT NULL,
  bathrooms TEXT,
  source TEXT DEFAULT 'craigslist',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all listings
CREATE POLICY "Anyone can view listings" ON listings
  FOR SELECT USING (true);

-- Policy: Allow insert for anon (scraper script) and authenticated (app) and service_role
CREATE POLICY "Allow insert listings" ON listings
  FOR INSERT WITH CHECK (true);

-- Policy: Service role can update/delete (for deduping or cleanup)
-- Omit UPDATE/DELETE for anon/authenticated so only service_role can modify after insert
CREATE POLICY "Service can update listings" ON listings
  FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service can delete listings" ON listings
  FOR DELETE USING (auth.role() = 'service_role');

-- Indexes for common filters and dedupe by url
CREATE INDEX listings_url_idx ON listings(url);
CREATE INDEX listings_created_at_idx ON listings(created_at DESC);
CREATE INDEX listings_location_idx ON listings(location);
CREATE INDEX listings_source_idx ON listings(source);

-- Reuse the same updated_at trigger function from create_notes (must run after that migration)
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
