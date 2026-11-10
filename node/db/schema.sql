CREATE TABLE IF NOT EXISTS agencies (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS advertisers (
  id SERIAL PRIMARY KEY,
  agency_id INTEGER NOT NULL REFERENCES agencies(id),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  advertiser_id INTEGER NOT NULL REFERENCES advertisers(id),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  weight INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT;
UPDATE campaigns SET status = CASE WHEN active THEN 'active' ELSE 'paused' END WHERE status IS NULL;
ALTER TABLE campaigns ALTER COLUMN status SET NOT NULL;
ALTER TABLE campaigns ALTER COLUMN status SET DEFAULT 'active';

CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  weight INTEGER NOT NULL DEFAULT 1,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  image_url TEXT,
  click_url TEXT,
  html_body TEXT
);

ALTER TABLE banners ADD COLUMN IF NOT EXISTS status TEXT;
UPDATE banners SET status = CASE WHEN active THEN 'active' ELSE 'paused' END WHERE status IS NULL;
ALTER TABLE banners ALTER COLUMN status SET NOT NULL;
ALTER TABLE banners ALTER COLUMN status SET DEFAULT 'active';

CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS zone_banners (
  zone_id INTEGER NOT NULL REFERENCES zones(id),
  banner_id INTEGER NOT NULL REFERENCES banners(id),
  PRIMARY KEY (zone_id, banner_id)
);

CREATE TABLE IF NOT EXISTS stats_ad_hourly (
  banner_id INTEGER NOT NULL REFERENCES banners(id),
  day DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (banner_id, day, hour)
);
