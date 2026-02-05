-- Listings table for scraper upsert (url = unique key).
-- Ensures trigger function exists for updated_at.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  price TEXT NOT NULL,
  bedrooms TEXT NOT NULL,
  bathrooms TEXT,
  source TEXT NOT NULL DEFAULT 'craigslist',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listings" ON listings FOR SELECT USING (true);
CREATE POLICY "Allow insert listings" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update listings" ON listings FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service can delete listings" ON listings FOR DELETE USING (auth.role() = 'service_role');

CREATE INDEX listings_url_idx ON listings(url);
CREATE INDEX listings_created_at_idx ON listings(created_at DESC);
CREATE INDEX listings_address_idx ON listings(address);
CREATE INDEX listings_source_idx ON listings(source);

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
