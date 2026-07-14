INSERT IGNORE INTO roles (role_name) VALUES
('ROLE_USER'),
('ROLE_PARTNER'),
('ROLE_MANAGER');

CREATE TABLE IF NOT EXISTS property_manager_roles (
    property_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (property_id, role_id),
    CONSTRAINT fk_property_user FOREIGN KEY (property_id) REFERENCES property(property_id) ON DELETE CASCADE,
    CONSTRAINT fk_property_manager_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

