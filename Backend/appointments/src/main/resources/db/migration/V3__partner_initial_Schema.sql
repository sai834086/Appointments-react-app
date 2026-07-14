CREATE TABLE partner_user (
    partner_id BIGINT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(45) NOT NULL,
    last_name VARCHAR(45) NOT NULL,
    email VARCHAR(45) NOT NULL UNIQUE,
    phone_number VARCHAR(10) NOT NULL UNIQUE,
    password VARCHAR(500) NOT NULL,
    business_type VARCHAR(45) NOT NULL,
    business_name VARCHAR(45) NOT NULL,
    building_no VARCHAR(45) NOT NULL,
    street VARCHAR(45) NOT NULL,
    city VARCHAR(45) NOT NULL,
    state VARCHAR(45) NOT NULL,
    country VARCHAR(45) NOT NULL,
    zip_code VARCHAR(45) NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (partner_id)
) AUTO_INCREMENT = 100000;
