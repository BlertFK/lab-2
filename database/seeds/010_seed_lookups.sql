USE realestate_db;

INSERT INTO property_types (name, slug, icon)
VALUES
  ('Apartment', 'apartment', 'building-2'),
  ('House', 'house', 'home'),
  ('Villa', 'villa', 'landmark'),
  ('Penthouse', 'penthouse', 'building'),
  ('Studio', 'studio', 'door-open'),
  ('Office', 'office', 'briefcase'),
  ('Land', 'land', 'map'),
  ('Commercial Space', 'commercial-space', 'store')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  icon = VALUES(icon);

INSERT INTO categories (name, slug)
VALUES
  ('For Sale', 'for-sale'),
  ('For Rent', 'for-rent'),
  ('New Development', 'new-development'),
  ('Luxury', 'luxury'),
  ('Commercial', 'commercial')
ON DUPLICATE KEY UPDATE
  name = VALUES(name);

INSERT INTO cities (name, region, country)
VALUES
  ('Pristina', 'Pristina District', 'XK'),
  ('Prizren', 'Prizren District', 'XK'),
  ('Peja', 'Peja District', 'XK'),
  ('Gjakova', 'Gjakova District', 'XK'),
  ('Gjilan', 'Gjilan District', 'XK'),
  ('Ferizaj', 'Ferizaj District', 'XK'),
  ('Mitrovica', 'Mitrovica District', 'XK'),
  ('Vushtrri', 'Mitrovica District', 'XK'),
  ('Podujeva', 'Pristina District', 'XK'),
  ('Suhareka', 'Prizren District', 'XK'),
  ('Rahovec', 'Gjakova District', 'XK'),
  ('Lipjan', 'Pristina District', 'XK')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  region = VALUES(region);

INSERT INTO locations (city_id, district, address_line, postal_code, latitude, longitude)
SELECT c.id, seed.district, seed.address_line, seed.postal_code, seed.latitude, seed.longitude
FROM (
  SELECT 'Pristina' city, 'Bregu i Diellit' district, 'Rruga B' address_line, '10000' postal_code, 42.6488000 latitude, 21.1753000 longitude
  UNION ALL SELECT 'Pristina', 'Arberia', 'Rruga Ahmet Krasniqi', '10000', 42.6669000, 21.1518000
  UNION ALL SELECT 'Pristina', 'Ulpiana', 'Rruga Deshmoret e Kombit', '10000', 42.6531000, 21.1645000
  UNION ALL SELECT 'Prizren', 'Qendra', 'Shadervan', '20000', 42.2096000, 20.7417000
  UNION ALL SELECT 'Peja', 'Qendra', 'Rruga Mbreteresha Teute', '30000', 42.6593000, 20.2887000
  UNION ALL SELECT 'Gjakova', 'Qendra', 'Rruga Nena Tereze', '50000', 42.3803000, 20.4308000
  UNION ALL SELECT 'Gjilan', 'Dardania', 'Rruga Idriz Seferi', '60000', 42.4635000, 21.4695000
  UNION ALL SELECT 'Ferizaj', 'Qendra', 'Rruga Deshmoret e Kombit', '70000', 42.3706000, 21.1553000
  UNION ALL SELECT 'Mitrovica', 'Qendra', 'Rruga Mbreteresha Teute', '40000', 42.8914000, 20.8660000
  UNION ALL SELECT 'Vushtrri', 'Qendra', 'Rruga Adem Jashari', '42000', 42.8231000, 20.9675000
  UNION ALL SELECT 'Podujeva', 'Qendra', 'Rruga Zahir Pajaziti', '11000', 42.9106000, 21.1933000
  UNION ALL SELECT 'Suhareka', 'Qendra', 'Rruga Brigada 123', '23000', 42.3586000, 20.8250000
) seed
INNER JOIN cities c ON c.name = seed.city AND c.country = 'XK'
WHERE NOT EXISTS (
  SELECT 1
  FROM locations l
  WHERE l.city_id = c.id
    AND l.district = seed.district
    AND l.address_line = seed.address_line
);

INSERT INTO amenities (name, icon, category)
VALUES
  ('Central Heating', 'flame', 'indoor'),
  ('Air Conditioning', 'snowflake', 'indoor'),
  ('Furnished', 'sofa', 'indoor'),
  ('Elevator', 'arrow-up-down', 'indoor'),
  ('Fireplace', 'flame-kindling', 'indoor'),
  ('Walk-in Closet', 'shirt', 'indoor'),
  ('Balcony', 'panel-top', 'outdoor'),
  ('Garden', 'trees', 'outdoor'),
  ('Terrace', 'sun', 'outdoor'),
  ('Private Parking', 'parking-circle', 'outdoor'),
  ('Garage', 'warehouse', 'outdoor'),
  ('Swimming Pool', 'waves', 'outdoor'),
  ('Security Cameras', 'cctv', 'security'),
  ('Alarm System', 'bell-ring', 'security'),
  ('Intercom', 'phone-call', 'security'),
  ('Gated Entrance', 'lock-keyhole', 'security')
ON DUPLICATE KEY UPDATE
  icon = VALUES(icon),
  category = VALUES(category);
