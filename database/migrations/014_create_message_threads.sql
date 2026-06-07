USE realestate_db;

CREATE TABLE IF NOT EXISTS message_threads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  last_message_at TIMESTAMP NULL,
  buyer_unread_count INT NOT NULL DEFAULT 0,
  seller_unread_count INT NOT NULL DEFAULT 0,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_message_thread (property_id, buyer_id, seller_id),
  INDEX idx_message_threads_buyer_id (buyer_id),
  INDEX idx_message_threads_seller_id (seller_id),
  INDEX idx_message_threads_last_message_at (last_message_at),
  CONSTRAINT fk_message_threads_property_id
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_message_threads_buyer_id
    FOREIGN KEY (buyer_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_message_threads_seller_id
    FOREIGN KEY (seller_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE messages
  ADD COLUMN thread_id INT NULL AFTER id,
  ADD COLUMN sender_id INT NULL AFTER thread_id,
  ADD COLUMN body TEXT NULL AFTER message,
  ADD COLUMN attachment_file_id INT NULL AFTER body,
  ADD COLUMN is_edited TINYINT(1) NOT NULL DEFAULT 0 AFTER attachment_file_id,
  ADD COLUMN edited_at TIMESTAMP NULL AFTER is_edited,
  ADD COLUMN read_at TIMESTAMP NULL AFTER edited_at,
  ADD INDEX idx_messages_thread_id (thread_id),
  ADD INDEX idx_messages_sender_id (sender_id),
  ADD INDEX idx_messages_read_at (read_at);

INSERT IGNORE INTO message_threads (property_id, buyer_id, seller_id, last_message_at, created_at, updated_at)
SELECT property_id, buyer_id, seller_id, MAX(created_at), MIN(created_at), NOW()
FROM messages
WHERE buyer_id IS NOT NULL
  AND seller_id IS NOT NULL
GROUP BY property_id, buyer_id, seller_id;

UPDATE messages m
INNER JOIN message_threads mt
  ON mt.buyer_id = m.buyer_id
  AND mt.seller_id = m.seller_id
  AND (
    (mt.property_id = m.property_id)
    OR (mt.property_id IS NULL AND m.property_id IS NULL)
  )
SET
  m.thread_id = COALESCE(m.thread_id, mt.id),
  m.sender_id = COALESCE(m.sender_id, m.buyer_id),
  m.body = COALESCE(m.body, m.message);

ALTER TABLE messages
  MODIFY body TEXT NOT NULL,
  ADD CONSTRAINT fk_messages_thread_id
    FOREIGN KEY (thread_id) REFERENCES message_threads(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_messages_sender_id
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE message_threads mt
SET
  buyer_unread_count = (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.thread_id = mt.id
      AND m.sender_id = mt.seller_id
      AND m.read_at IS NULL
  ),
  seller_unread_count = (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.thread_id = mt.id
      AND m.sender_id = mt.buyer_id
      AND m.read_at IS NULL
  );
