-- Create content_edit_requests table for managing edit request workflow
-- This table allows admins to request edits from content creators after submission

CREATE TABLE IF NOT EXISTS content_edit_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_id INT NOT NULL,
    requested_by INT NOT NULL COMMENT 'Admin user ID who requested the edit',
    requested_to INT NOT NULL COMMENT 'Content creator user ID',
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    admin_comment TEXT COMMENT 'Admin comment/reason for edit request',
    creator_comment TEXT COMMENT 'Creator comment when accepting/rejecting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_to) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_content_id (content_id),
    INDEX idx_requested_to (requested_to),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
