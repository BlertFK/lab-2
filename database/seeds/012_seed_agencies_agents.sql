USE realestate_db;

INSERT INTO agencies (
  name, email, phone, address, city, state_province, postal_code, country,
  website, license_number, founded_year, description, logo_url, status
)
VALUES
  ('Pristina Prime Realty', 'hello@pristinaprime.local', '+38344111001', 'Rruga B, Bregu i Diellit', 'Pristina', 'Pristina District', '10000', 'Kosovo', 'https://pristinaprime.local', 'XK-AG-1001', 2012, 'Residential agency focused on Pristina apartments and houses.', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&q=80', 'active'),
  ('Dukagjini Estates', 'info@dukagjiniestates.local', '+38344111002', 'Rruga Mbreteresha Teute', 'Peja', 'Peja District', '30000', 'Kosovo', 'https://dukagjiniestates.local', 'XK-AG-1002', 2015, 'Western Kosovo agency specializing in family homes and land.', 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=500&q=80', 'active'),
  ('Shadervan Properties', 'sales@shadervanproperties.local', '+38344111003', 'Shadervan', 'Prizren', 'Prizren District', '20000', 'Kosovo', 'https://shadervanproperties.local', 'XK-AG-1003', 2010, 'Historic city and commercial property experts.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&q=80', 'active'),
  ('Anamorava Homes', 'contact@anamoravahomes.local', '+38344111004', 'Rruga Idriz Seferi', 'Gjilan', 'Gjilan District', '60000', 'Kosovo', 'https://anamoravahomes.local', 'XK-AG-1004', 2018, 'Homes, apartments, and commercial spaces in eastern Kosovo.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500&q=80', 'active'),
  ('UrbanKeys Agency Network', 'agency@urbankeys.local', '+38344111005', 'Rruga Ahmet Krasniqi', 'Pristina', 'Pristina District', '10000', 'Kosovo', 'https://urbankeys.local', 'XK-AG-1005', 2021, 'Demo agency network for platform testing.', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=500&q=80', 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  phone = VALUES(phone),
  address = VALUES(address),
  city = VALUES(city),
  status = VALUES(status);

INSERT INTO users (name, email, password, role)
VALUES
  ('Arta Krasniqi', 'arta.krasniqi@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller'),
  ('Driton Gashi', 'driton.gashi@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller'),
  ('Elira Berisha', 'elira.berisha@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller'),
  ('Ilir Hoxha', 'ilir.hoxha@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller'),
  ('Nora Shala', 'nora.shala@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller'),
  ('Blerim Morina', 'blerim.morina@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller'),
  ('Vesa Selimi', 'vesa.selimi@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller'),
  ('Luan Rexha', 'luan.rexha@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller'),
  ('Dafina Osmani', 'dafina.osmani@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller'),
  ('Arian Kelmendi', 'arian.kelmendi@urbankeys.local', '$2b$10$ojS8DTBxcSliAYb4a26hxO7w/Rr2iKFLIRozvg2V9SJ5N5lipHt1u', 'seller')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role);

INSERT INTO agents (
  user_id, agency_id, license_number, specialization, phone, bio,
  profile_image_url, commission_rate, verified, verified_at, status
)
SELECT u.id, a.id, seed.license_number, seed.specialization, seed.phone, seed.bio,
       seed.profile_image_url, seed.commission_rate, 1, NOW(), 'active'
FROM (
  SELECT 'arta.krasniqi@urbankeys.local' email, 'Pristina Prime Realty' agency_name, 'XK-AGT-2001' license_number, 'Apartments' specialization, '+38345111201' phone, 'Pristina apartment specialist with a focus on first-time buyers.' bio, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80' profile_image_url, 4.50 commission_rate
  UNION ALL SELECT 'driton.gashi@urbankeys.local', 'Pristina Prime Realty', 'XK-AGT-2002', 'Luxury', '+38345111202', 'Luxury homes and penthouses across central Pristina.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80', 5.00
  UNION ALL SELECT 'elira.berisha@urbankeys.local', 'Dukagjini Estates', 'XK-AGT-2003', 'Family Homes', '+38345111203', 'Family homes and garden properties in Peja and nearby towns.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80', 4.75
  UNION ALL SELECT 'ilir.hoxha@urbankeys.local', 'Dukagjini Estates', 'XK-AGT-2004', 'Land', '+38345111204', 'Development and agricultural land advisor.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80', 4.25
  UNION ALL SELECT 'nora.shala@urbankeys.local', 'Shadervan Properties', 'XK-AGT-2005', 'Commercial', '+38345111205', 'Commercial property and retail leasing in Prizren.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', 5.00
  UNION ALL SELECT 'blerim.morina@urbankeys.local', 'Shadervan Properties', 'XK-AGT-2006', 'Historic Homes', '+38345111206', 'Historic homes and renovation opportunities.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', 4.50
  UNION ALL SELECT 'vesa.selimi@urbankeys.local', 'Anamorava Homes', 'XK-AGT-2007', 'Residential', '+38345111207', 'Residential listings in Gjilan and Ferizaj.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80', 4.50
  UNION ALL SELECT 'luan.rexha@urbankeys.local', 'Anamorava Homes', 'XK-AGT-2008', 'Offices', '+38345111208', 'Office and mixed-use commercial advisor.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80', 5.25
  UNION ALL SELECT 'dafina.osmani@urbankeys.local', 'UrbanKeys Agency Network', 'XK-AGT-2009', 'New Development', '+38345111209', 'New development and buyer representation specialist.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80', 4.75
  UNION ALL SELECT 'arian.kelmendi@urbankeys.local', 'UrbanKeys Agency Network', 'XK-AGT-2010', 'Investments', '+38345111210', 'Investment properties and portfolio advisory.', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=500&q=80', 5.50
) seed
INNER JOIN users u ON u.email = seed.email
INNER JOIN agencies a ON a.name = seed.agency_name
ON DUPLICATE KEY UPDATE
  agency_id = VALUES(agency_id),
  specialization = VALUES(specialization),
  phone = VALUES(phone),
  bio = VALUES(bio),
  profile_image_url = VALUES(profile_image_url),
  commission_rate = VALUES(commission_rate),
  verified = VALUES(verified),
  verified_at = VALUES(verified_at),
  status = VALUES(status);
