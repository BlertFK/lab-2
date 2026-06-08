USE realestate_db;

INSERT INTO plans (name, slug, price, duration_days, max_listings, max_featured, features, is_active)
VALUES
  ('Free', 'free', 0.00, 30, 10, 0, JSON_ARRAY('Up to 10 listings'), 1),
  ('Basic', 'basic', 9.99, 30, 25, 1, JSON_ARRAY('Up to 25 listings', '1 featured listing'), 1),
  ('Pro', 'pro', 19.99, 30, 100, 5, JSON_ARRAY('Up to 100 listings', '5 featured listings'), 1),
  ('Agency', 'agency', 49.99, 30, 500, 20, JSON_ARRAY('Up to 500 listings', '20 featured listings'), 1)
ON DUPLICATE KEY UPDATE
  price = VALUES(price),
  duration_days = VALUES(duration_days),
  max_listings = VALUES(max_listings),
  max_featured = VALUES(max_featured),
  features = VALUES(features),
  is_active = VALUES(is_active);
