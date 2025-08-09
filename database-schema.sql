-- =====================================================
-- LUXONE QUOTATION SYSTEM - DATABASE SCHEMA
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS quotation_files;
DROP TABLE IF EXISTS quotation_pieces;
DROP TABLE IF EXISTS quotations;
DROP TABLE IF EXISTS company_settings;
DROP TABLE IF EXISTS admin_companies;
DROP TABLE IF EXISTS users;

-- =====================================================
-- USERS TABLE (Authentication & Authorization)
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    permissions JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- =====================================================
-- ADMIN COMPANIES TABLE (Data Isolation)
-- =====================================================
CREATE TABLE admin_companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255),
    company_phone VARCHAR(50),
    company_address TEXT,
    company_website VARCHAR(255),
    logo_url VARCHAR(500),
    logo_file_path VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_company_name (company_name)
);

-- =====================================================
-- COMPANY SETTINGS TABLE (Per-Admin Settings)
-- =====================================================
CREATE TABLE company_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    address TEXT,
    logo_url VARCHAR(500),
    logo_file_path VARCHAR(500),
    logo_file_name VARCHAR(255),
    whatsapp_india VARCHAR(50),
    whatsapp_uae VARCHAR(50),
    admin_email VARCHAR(255),
    form_fields JSON,
    pdf_templates JSON,
    active_pdf_template VARCHAR(255),
    pricing_rules JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_settings (admin_user_id),
    INDEX idx_admin_user (admin_user_id)
);

-- =====================================================
-- QUOTATIONS TABLE (Quote Data with Admin Isolation)
-- =====================================================
CREATE TABLE quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_id VARCHAR(255) UNIQUE,
    admin_user_id INT NOT NULL, -- Which admin owns this quote
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_location VARCHAR(255),
    service_level VARCHAR(100),
    material_source VARCHAR(100),
    material_type VARCHAR(100),
    material_color VARCHAR(100),
    worktop_layout TEXT,
    project_type VARCHAR(100),
    timeline VARCHAR(100),
    sink_option VARCHAR(100),
    additional_comments TEXT,
    quote_data JSON,
    pricing_data JSON,
    total_area DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'AED',
    status VARCHAR(50) DEFAULT 'pending',
    user_id INT NULL, -- Regular user who submitted (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- QUOTATION PIECES TABLE (Quote Components)
-- =====================================================
CREATE TABLE quotation_pieces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT NOT NULL,
    piece_name VARCHAR(255) NOT NULL,
    dimensions VARCHAR(100),
    material VARCHAR(100),
    color VARCHAR(100),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    INDEX idx_quotation_id (quotation_id)
);

-- =====================================================
-- QUOTATION FILES TABLE (Attachments)
-- =====================================================
CREATE TABLE quotation_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quotation_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
    INDEX idx_quotation_id (quotation_id)
);

-- =====================================================
-- MATERIAL OPTIONS TABLE (Per-Admin Materials)
-- =====================================================
CREATE TABLE material_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(100),
    material_color VARCHAR(100),
    base_cost DECIMAL(10,2),
    cost_per_sqm DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_material_type (material_type)
);

-- =====================================================
-- SINK OPTIONS TABLE (Per-Admin Sinks)
-- =====================================================
CREATE TABLE sink_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    sink_name VARCHAR(255) NOT NULL,
    sink_type VARCHAR(100),
    base_cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_user (admin_user_id)
);

-- =====================================================
-- PRICING RULES TABLE (Per-Admin Pricing)
-- =====================================================
CREATE TABLE pricing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100),
    base_amount DECIMAL(10,2),
    percentage DECIMAL(5,2),
    min_amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_user (admin_user_id)
);

-- =====================================================
-- FORM FIELDS TABLE (Per-Admin Custom Fields)
-- =====================================================
CREATE TABLE form_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(100),
    field_label VARCHAR(255),
    field_placeholder VARCHAR(255),
    is_required BOOLEAN DEFAULT FALSE,
    field_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_field_order (field_order)
);

-- =====================================================
-- PDF TEMPLATES TABLE (Per-Admin Templates)
-- =====================================================
CREATE TABLE pdf_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_content TEXT,
    template_variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_user (admin_user_id)
);

-- =====================================================
-- ACTIVITY LOGS TABLE (Audit Trail)
-- =====================================================
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    user_id INT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- EMAIL TEMPLATES TABLE (Per-Admin Email Templates)
-- =====================================================
CREATE TABLE email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    template_subject VARCHAR(255),
    template_body TEXT,
    template_variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_user (admin_user_id)
);

-- =====================================================
-- SYSTEM SETTINGS TABLE (Global Settings)
-- =====================================================
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default super admin user
INSERT INTO users (email, password_hash, full_name, role, permissions) VALUES 
('superadmin@theluxone.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Administrator', 'super_admin', 
'{"can_manage_users": true, "can_manage_admins": true, "can_view_quotes": true, "can_edit_quotes": true, "can_view_analytics": true, "can_edit_company_settings": true, "can_change_passwords": true, "can_access_super_admin": true}');

-- Insert default admin user
INSERT INTO users (email, password_hash, full_name, role, permissions) VALUES 
('admin@theluxone.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin',
'{"can_manage_users": false, "can_manage_admins": false, "can_view_quotes": true, "can_edit_quotes": true, "can_view_analytics": true, "can_edit_company_settings": true, "can_change_passwords": false, "can_access_super_admin": false}');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, is_public) VALUES
('system_name', 'Luxone Quotation System', 'string', true),
('system_version', '1.0.0', 'string', true),
('max_file_size', '5242880', 'number', true),
('allowed_file_types', '["jpg", "jpeg", "png", "pdf", "doc", "docx"]', 'json', true),
('session_timeout', '3600', 'number', true);

-- =====================================================
-- CREATE VIEWS FOR DATA ACCESS CONTROL
-- =====================================================

-- View for admin to see only their quotations
CREATE VIEW admin_quotations AS
SELECT q.*, u.full_name as customer_full_name
FROM quotations q
LEFT JOIN users u ON q.user_id = u.id
WHERE q.admin_user_id = ?;

-- View for super admin to see all quotations
CREATE VIEW super_admin_quotations AS
SELECT q.*, u.full_name as customer_full_name, a.full_name as admin_full_name
FROM quotations q
LEFT JOIN users u ON q.user_id = u.id
LEFT JOIN users a ON q.admin_user_id = a.id;

-- =====================================================
-- CREATE STORED PROCEDURES FOR DATA ISOLATION
-- =====================================================

DELIMITER //

-- Procedure to get admin's quotations
CREATE PROCEDURE GetAdminQuotations(IN admin_id INT)
BEGIN
    SELECT * FROM quotations WHERE admin_user_id = admin_id ORDER BY created_at DESC;
END //

-- Procedure to get admin's company settings
CREATE PROCEDURE GetAdminCompanySettings(IN admin_id INT)
BEGIN
    SELECT * FROM company_settings WHERE admin_user_id = admin_id;
END //

-- Procedure to update admin's company settings
CREATE PROCEDURE UpdateAdminCompanySettings(
    IN admin_id INT,
    IN company_name VARCHAR(255),
    IN website VARCHAR(255),
    IN address TEXT,
    IN logo_url VARCHAR(500),
    IN whatsapp_india VARCHAR(50),
    IN whatsapp_uae VARCHAR(50),
    IN admin_email VARCHAR(255)
)
BEGIN
    INSERT INTO company_settings (admin_user_id, company_name, website, address, logo_url, whatsapp_india, whatsapp_uae, admin_email)
    VALUES (admin_id, company_name, website, address, logo_url, whatsapp_india, whatsapp_uae, admin_email)
    ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        website = VALUES(website),
        address = VALUES(address),
        logo_url = VALUES(logo_url),
        whatsapp_india = VALUES(whatsapp_india),
        whatsapp_uae = VALUES(whatsapp_uae),
        admin_email = VALUES(admin_email),
        updated_at = CURRENT_TIMESTAMP;
END //

DELIMITER ;

-- =====================================================
-- CREATE TRIGGERS FOR AUDIT TRAIL
-- =====================================================

DELIMITER //

-- Trigger to log quotation changes
CREATE TRIGGER quotation_audit_insert
AFTER INSERT ON quotations
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (admin_user_id, user_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.admin_user_id, NEW.user_id, 'CREATE', 'quotation', NEW.id, JSON_OBJECT('quote_id', NEW.quote_id, 'customer_name', NEW.customer_name));
END //

CREATE TRIGGER quotation_audit_update
AFTER UPDATE ON quotations
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (admin_user_id, user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (NEW.admin_user_id, NEW.user_id, 'UPDATE', 'quotation', NEW.id, 
            JSON_OBJECT('status', OLD.status, 'total_amount', OLD.total_amount),
            JSON_OBJECT('status', NEW.status, 'total_amount', NEW.total_amount));
END //

DELIMITER ;

-- =====================================================
-- GRANT PERMISSIONS (Example for MySQL)
-- =====================================================

-- Create application user with limited permissions
-- CREATE USER 'luxone_app'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON luxone_quotation_system.* TO 'luxone_app'@'localhost';
-- FLUSH PRIVILEGES;
