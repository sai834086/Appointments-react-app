-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles  (
    role_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(30) NOT NULL UNIQUE
);

-- 2. Insert default roles
INSERT IGNORE INTO roles (role_name) VALUES
('ROLE_USER'),
('ROLE_PARTNER');

-- Bridge table for AppUser ↔ Role
CREATE TABLE IF NOT EXISTS app_user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_app_user_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

-- Bridge table for PartnerUser ↔ Role
CREATE TABLE IF NOT EXISTS partner_user_roles (
    partner_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (partner_id, role_id),
    CONSTRAINT fk_partner_user FOREIGN KEY (partner_id) REFERENCES partner_user(partner_id) ON DELETE CASCADE,
    CONSTRAINT fk_partner_user_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);
