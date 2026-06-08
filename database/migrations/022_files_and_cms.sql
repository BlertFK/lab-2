-- ============================================================
-- Migration: Files, CMS Tables
-- Owner: Lis
-- ============================================================

-- Files
CREATE TABLE IF NOT EXISTS files (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entity       VARCHAR(50)     NULL,
  entity_id    BIGINT UNSIGNED NULL,
  filename     VARCHAR(255)    NOT NULL,
  original_name VARCHAR(255)   NOT NULL,
  mime_type    VARCHAR(100)    NOT NULL,
  file_path    VARCHAR(500)    NOT NULL,
  file_size    BIGINT          NOT NULL,
  width        INT             NULL,
  height       INT             NULL,
  uploaded_by  BIGINT UNSIGNED NOT NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_files_entity (entity, entity_id),
  INDEX idx_files_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CMS Pages
CREATE TABLE IF NOT EXISTS cms_pages (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug             VARCHAR(120)    NOT NULL UNIQUE,
  title            VARCHAR(255)    NOT NULL,
  meta_title       VARCHAR(255)    NULL,
  meta_description TEXT            NULL,
  is_published     TINYINT(1)      NOT NULL DEFAULT 0,
  published_at     TIMESTAMP       NULL,
  created_by       BIGINT UNSIGNED NULL,
  updated_by       BIGINT UNSIGNED NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CMS Sections
CREATE TABLE IF NOT EXISTS cms_sections (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  page_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(80)     NOT NULL,
  sort_order TINYINT         NOT NULL DEFAULT 0,
  type       ENUM('hero','features','testimonials','team','faq','stats','mission','contact','footer','generic')
             NOT NULL DEFAULT 'generic',
  is_visible TINYINT(1)      NOT NULL DEFAULT 1,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_sections_page (page_id),
  FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CMS Blocks
CREATE TABLE IF NOT EXISTS cms_blocks (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  section_id   BIGINT UNSIGNED NOT NULL,
  key_name     VARCHAR(80)     NOT NULL,
  type         ENUM('text','image','link','json') NOT NULL DEFAULT 'text',
  content_json JSON            NULL COMMENT 'Published content',
  draft_json   JSON            NULL COMMENT 'Draft / unsaved changes',
  updated_by   BIGINT UNSIGNED NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cms_blocks_section (section_id),
  FOREIGN KEY (section_id) REFERENCES cms_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CMS Block Versions
CREATE TABLE IF NOT EXISTS cms_block_versions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  block_id       BIGINT UNSIGNED NOT NULL,
  version_number INT             NOT NULL,
  content_json   JSON            NOT NULL,
  created_by     BIGINT UNSIGNED NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cms_versions_block (block_id),
  FOREIGN KEY (block_id) REFERENCES cms_blocks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Seed: Default CMS pages (home, about, contact, faq)
-- ============================================================
INSERT IGNORE INTO cms_pages (slug, title, meta_title, is_published, published_at) VALUES
  ('home',    'Home',    'RealEstate - Find Your Dream Home', 1, NOW()),
  ('about',   'About',   'About Us',                          1, NOW()),
  ('contact', 'Contact', 'Contact Us',                        1, NOW()),
  ('faq',     'FAQ',     'Frequently Asked Questions',        1, NOW());

-- Home page sections
INSERT IGNORE INTO cms_sections (page_id, name, sort_order, type) VALUES
  (1, 'Hero',         1, 'hero'),
  (1, 'Features',     2, 'features'),
  (1, 'Testimonials', 3, 'testimonials');

-- Home Hero blocks
INSERT IGNORE INTO cms_blocks (section_id, key_name, type, content_json, draft_json) VALUES
  (1, 'title',    'text', '{"value":"Find Your Dream Home in Kosovo"}', '{"value":"Find Your Dream Home in Kosovo"}'),
  (1, 'subtitle', 'text', '{"value":"Browse thousands of properties across all major cities."}', '{"value":"Browse thousands of properties across all major cities."}'),
  (1, 'cta_text', 'text', '{"value":"Browse Properties"}', '{"value":"Browse Properties"}'),
  (1, 'cta_link', 'link', '{"url":"/properties","label":"Browse Properties"}', '{"url":"/properties","label":"Browse Properties"}');

-- About sections
INSERT IGNORE INTO cms_sections (page_id, name, sort_order, type) VALUES
  (2, 'Story',   1, 'mission'),
  (2, 'Stats',   2, 'stats'),
  (2, 'Mission', 3, 'mission');

-- FAQ sections
INSERT IGNORE INTO cms_sections (page_id, name, sort_order, type) VALUES
  (4, 'FAQ Items', 1, 'faq');

INSERT IGNORE INTO cms_blocks (section_id, key_name, type, content_json, draft_json) VALUES
  (6, 'items', 'json',
   '[{"question":"How do I list a property?","answer":"Register an account, go to My Properties and click Add Property."},{"question":"Is listing free?","answer":"Basic listings are free. Upgrade your plan for premium placement."}]',
   '[{"question":"How do I list a property?","answer":"Register an account, go to My Properties and click Add Property."},{"question":"Is listing free?","answer":"Basic listings are free. Upgrade your plan for premium placement."}]');

-- Contact sections
INSERT IGNORE INTO cms_sections (page_id, name, sort_order, type) VALUES
  (3, 'Contact Info', 1, 'contact');

INSERT IGNORE INTO cms_blocks (section_id, key_name, type, content_json, draft_json) VALUES
  (7, 'header',  'text', '{"value":"Get in Touch"}', '{"value":"Get in Touch"}'),
  (7, 'address', 'text', '{"value":"Str. Nëna Terezë, Prishtina, Kosovo"}', '{"value":"Str. Nëna Terezë, Prishtina, Kosovo"}'),
  (7, 'email',   'text', '{"value":"info@realestate.local"}', '{"value":"info@realestate.local"}'),
  (7, 'phone',   'text', '{"value":"+383 44 000 000"}', '{"value":"+383 44 000 000"}');
