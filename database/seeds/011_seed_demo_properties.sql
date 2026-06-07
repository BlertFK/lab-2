USE realestate_db;

INSERT INTO users (name, email, password, role)
VALUES
  ('Demo Seller', 'demo.seller@urban-keys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role);

INSERT INTO properties (
  title, slug, description, price, currency, area_m2, rooms, bedrooms, bathrooms,
  floor, total_floors, year_built, type_id, category_id, location_id, status,
  image_url, seller_id, views_count, published_at, created_by, updated_by
)
SELECT seed.title, seed.slug, seed.description, seed.price, 'EUR', seed.area_m2, seed.rooms,
       seed.bedrooms, seed.bathrooms, seed.floor, seed.total_floors, seed.year_built,
       pt.id, c.id, l.id, seed.status, seed.image_url, u.id, seed.views_count, NOW(), u.id, u.id
FROM (
  SELECT 'Sunny Apartment in Bregu i Diellit' title, 'demo-sunny-apartment-bregu-i-diellit' slug, 'Bright apartment near schools, cafes, and transit.' description, 125000 price, 82 area_m2, 3 rooms, 2 bedrooms, 1 bathrooms, 5 floor, 9 total_floors, 2016 year_built, 'Apartment' type_name, 'For Sale' category_name, 'Pristina' city_name, 'Bregu i Diellit' district, 'available' status, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80' image_url, 184 views_count
  UNION ALL SELECT 'Arberia City View Penthouse', 'demo-arberia-city-view-penthouse', 'Top-floor home with wide terrace and city views.', 285000, 145, 4, 3, 2, 8, 8, 2020, 'Penthouse', 'Luxury', 'Pristina', 'Arberia', 'available', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80', 221
  UNION ALL SELECT 'Ulpiana Renovated Studio', 'demo-ulpiana-renovated-studio', 'Compact renovated studio close to the city center.', 68000, 38, 1, 1, 1, 3, 6, 2012, 'Studio', 'For Sale', 'Pristina', 'Ulpiana', 'available', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80', 98
  UNION ALL SELECT 'Modern Office on Rruga B', 'demo-modern-office-rruga-b', 'Open-plan office suitable for a growing team.', 210000, 118, 5, 0, 2, 2, 6, 2019, 'Office', 'Commercial', 'Pristina', 'Bregu i Diellit', 'available', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80', 156
  UNION ALL SELECT 'Prizren Stone House', 'demo-prizren-stone-house', 'Character house near the historic center.', 175000, 160, 5, 4, 2, NULL, 2, 1988, 'House', 'For Sale', 'Prizren', 'Qendra', 'available', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80', 131
  UNION ALL SELECT 'Shadervan Boutique Commercial Space', 'demo-shadervan-boutique-commercial-space', 'Street-level commercial space in a busy pedestrian area.', 240000, 92, 2, 0, 1, 0, 3, 2005, 'Commercial Space', 'Commercial', 'Prizren', 'Qendra', 'available', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80', 174
  UNION ALL SELECT 'Peja Family House with Garden', 'demo-peja-family-house-garden', 'Detached family house with garden and mountain access.', 195000, 210, 6, 4, 3, NULL, 2, 2009, 'House', 'For Sale', 'Peja', 'Qendra', 'available', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80', 202
  UNION ALL SELECT 'Peja New Development Apartment', 'demo-peja-new-development-apartment', 'New apartment with elevator and garage parking.', 99000, 76, 3, 2, 1, 4, 7, 2023, 'Apartment', 'New Development', 'Peja', 'Qendra', 'available', 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1200&q=80', 117
  UNION ALL SELECT 'Gjakova Central Apartment', 'demo-gjakova-central-apartment', 'Well-kept apartment near shops and restaurants.', 88000, 70, 3, 2, 1, 2, 5, 2014, 'Apartment', 'For Sale', 'Gjakova', 'Qendra', 'available', 'https://images.unsplash.com/photo-1560448075-bb485b067938?w=1200&q=80', 89
  UNION ALL SELECT 'Gjakova Villa Estate', 'demo-gjakova-villa-estate', 'Large villa with private pool and landscaped yard.', 420000, 340, 8, 5, 4, NULL, 2, 2018, 'Villa', 'Luxury', 'Gjakova', 'Qendra', 'available', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80', 268
  UNION ALL SELECT 'Gjilan Dardania Apartment', 'demo-gjilan-dardania-apartment', 'Move-in-ready apartment in a quiet residential block.', 78000, 68, 3, 2, 1, 1, 5, 2011, 'Apartment', 'For Sale', 'Gjilan', 'Dardania', 'available', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80', 76
  UNION ALL SELECT 'Gjilan Commercial Office', 'demo-gjilan-commercial-office', 'Flexible office near main road access.', 135000, 105, 4, 0, 2, 1, 4, 2015, 'Office', 'Commercial', 'Gjilan', 'Dardania', 'available', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80', 94
  UNION ALL SELECT 'Ferizaj Family Apartment', 'demo-ferizaj-family-apartment', 'Spacious apartment close to city amenities.', 92000, 86, 3, 2, 2, 5, 8, 2017, 'Apartment', 'For Sale', 'Ferizaj', 'Qendra', 'available', 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=1200&q=80', 112
  UNION ALL SELECT 'Ferizaj Development Land', 'demo-ferizaj-development-land', 'Urban land parcel suitable for residential development.', 160000, 620, 0, 0, 0, NULL, NULL, NULL, 'Land', 'For Sale', 'Ferizaj', 'Qendra', 'available', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80', 143
  UNION ALL SELECT 'Mitrovica Riverside Apartment', 'demo-mitrovica-riverside-apartment', 'Apartment with river views and modern finishes.', 83000, 74, 3, 2, 1, 6, 9, 2018, 'Apartment', 'For Sale', 'Mitrovica', 'Qendra', 'available', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80', 101
  UNION ALL SELECT 'Mitrovica Main Street Retail', 'demo-mitrovica-main-street-retail', 'Retail unit with wide frontage and storage area.', 148000, 88, 2, 0, 1, 0, 4, 2008, 'Commercial Space', 'Commercial', 'Mitrovica', 'Qendra', 'available', 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=1200&q=80', 129
  UNION ALL SELECT 'Vushtrri Quiet House', 'demo-vushtrri-quiet-house', 'Comfortable house with garage and garden.', 132000, 155, 5, 3, 2, NULL, 2, 2007, 'House', 'For Sale', 'Vushtrri', 'Qendra', 'available', 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200&q=80', 87
  UNION ALL SELECT 'Podujeva New Apartment', 'demo-podujeva-new-apartment', 'Newly finished apartment with balcony.', 74000, 64, 3, 2, 1, 3, 6, 2022, 'Apartment', 'New Development', 'Podujeva', 'Qendra', 'available', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&q=80', 119
  UNION ALL SELECT 'Suhareka Villa with Terrace', 'demo-suhareka-villa-terrace', 'Private villa with mountain-facing terrace.', 265000, 240, 6, 4, 3, NULL, 2, 2016, 'Villa', 'Luxury', 'Suhareka', 'Qendra', 'available', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80', 166
  UNION ALL SELECT 'Rahovec Vineyard Land', 'demo-rahovec-vineyard-land', 'Agricultural land near vineyard routes.', 115000, 1800, 0, 0, 0, NULL, NULL, NULL, 'Land', 'For Sale', 'Rahovec', NULL, 'available', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80', 73
) seed
INNER JOIN property_types pt ON pt.name = seed.type_name
INNER JOIN categories c ON c.name = seed.category_name
LEFT JOIN cities city ON city.name = seed.city_name AND city.country = 'XK'
LEFT JOIN locations l ON l.city_id = city.id AND (l.district = seed.district OR seed.district IS NULL)
INNER JOIN users u ON u.email = 'demo.seller@urban-keys.local'
WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.slug = seed.slug);

INSERT INTO property_images (property_id, image_url, sort_order, is_primary, caption)
SELECT p.id, p.image_url, 0, 1, 'Primary listing image'
FROM properties p
WHERE p.slug LIKE 'demo-%'
  AND p.image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM property_images pi WHERE pi.property_id = p.id AND pi.is_primary = 1
  );

INSERT INTO property_images (property_id, image_url, sort_order, is_primary, caption)
SELECT p.id,
       CONCAT('https://images.unsplash.com/photo-', seed.photo_id, '?w=1200&q=80'),
       1,
       0,
       'Interior view'
FROM properties p
INNER JOIN (
  SELECT 'demo-sunny-apartment-bregu-i-diellit' slug, '1560185127-6ed189bf02f4' photo_id
  UNION ALL SELECT 'demo-arberia-city-view-penthouse', '1600585154340-be6161a56a0c'
  UNION ALL SELECT 'demo-prizren-stone-house', '1600566753190-17f0baa2a6c3'
  UNION ALL SELECT 'demo-peja-family-house-garden', '1600607687920-4e2a09cf159d'
  UNION ALL SELECT 'demo-gjakova-villa-estate', '1600607688969-a5bfcd646154'
) seed ON seed.slug = p.slug
WHERE NOT EXISTS (
  SELECT 1 FROM property_images pi WHERE pi.property_id = p.id AND pi.sort_order = 1
);

INSERT IGNORE INTO property_amenities (property_id, amenity_id)
SELECT p.id, a.id
FROM properties p
INNER JOIN amenities a ON a.name IN ('Central Heating', 'Air Conditioning', 'Balcony', 'Private Parking', 'Intercom')
WHERE p.slug LIKE 'demo-%' AND p.type IN ('Apartment', 'Studio', 'Penthouse');

INSERT IGNORE INTO property_amenities (property_id, amenity_id)
SELECT p.id, a.id
FROM properties p
INNER JOIN amenities a ON a.name IN ('Garden', 'Garage', 'Security Cameras', 'Central Heating')
WHERE p.slug LIKE 'demo-%' AND p.type IN ('House', 'Villa');

INSERT IGNORE INTO property_amenities (property_id, amenity_id)
SELECT p.id, a.id
FROM properties p
INNER JOIN amenities a ON a.name IN ('Security Cameras', 'Alarm System', 'Private Parking')
WHERE p.slug LIKE 'demo-%' AND p.type IN ('Office', 'Commercial Space');
