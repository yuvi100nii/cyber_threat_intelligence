-- Crime Record Management System (CRMS) Database Schema
-- MySQL Database

-- Create Database
CREATE DATABASE IF NOT EXISTS crms_db;
USE crms_db;

-- Users Table (Admin and Police Officers)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('admin', 'police_officer') NOT NULL DEFAULT 'police_officer',
    badge_number VARCHAR(20) UNIQUE,
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Police Officers Table (Extended info for officers)
CREATE TABLE police_officers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    `rank` VARCHAR(50),
    station VARCHAR(100),
    joining_date DATE,
    specialization VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Criminals Table
CREATE TABLE criminals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    alias VARCHAR(100),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    nationality VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    identification_mark TEXT,
    photo_path VARCHAR(255),
    fingerprint_id VARCHAR(100),
    height_cm INT,
    weight_kg INT,
    eye_color VARCHAR(30),
    hair_color VARCHAR(30),
    status ENUM('wanted', 'arrested', 'released', 'deceased') DEFAULT 'wanted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crimes Table
CREATE TABLE crimes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    crime_number VARCHAR(50) UNIQUE NOT NULL,
    crime_type ENUM('theft', 'robbery', 'assault', 'murder', 'fraud', 'cybercrime', 'drug_offense', 'kidnapping', 'domestic_violence', 'other') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date_occurred DATE NOT NULL,
    time_occurred TIME,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status ENUM('open', 'investigating', 'closed', 'solved') DEFAULT 'open',
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    evidence_description TEXT,
    weapon_used VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Victims Table
CREATE TABLE victims (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    occupation VARCHAR(100),
    injury_description TEXT,
    statement TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- FIR (First Information Report) Table
CREATE TABLE fir (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fir_number VARCHAR(50) UNIQUE NOT NULL,
    crime_id INT NOT NULL,
    complainant_name VARCHAR(100) NOT NULL,
    complainant_address TEXT,
    complainant_phone VARCHAR(20),
    date_filed DATE NOT NULL,
    time_filed TIME,
    description TEXT NOT NULL,
    status ENUM('registered', 'under_investigation', 'chargesheet_filed', 'closed') DEFAULT 'registered',
    investigating_officer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (crime_id) REFERENCES crimes(id) ON DELETE CASCADE,
    FOREIGN KEY (investigating_officer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Crime-Criminal Link Table (Many-to-Many)
CREATE TABLE crime_criminals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    crime_id INT NOT NULL,
    criminal_id INT NOT NULL,
    role ENUM('primary', 'accomplice', 'suspect') DEFAULT 'suspect',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crime_id) REFERENCES crimes(id) ON DELETE CASCADE,
    FOREIGN KEY (criminal_id) REFERENCES criminals(id) ON DELETE CASCADE,
    UNIQUE KEY unique_crime_criminal (crime_id, criminal_id)
);

-- Crime-Victim Link Table (Many-to-Many)
CREATE TABLE crime_victims (
    id INT PRIMARY KEY AUTO_INCREMENT,
    crime_id INT NOT NULL,
    victim_id INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crime_id) REFERENCES crimes(id) ON DELETE CASCADE,
    FOREIGN KEY (victim_id) REFERENCES victims(id) ON DELETE CASCADE,
    UNIQUE KEY unique_crime_victim (crime_id, victim_id)
);

-- Case Assignments Table (Police assigned to cases)
CREATE TABLE case_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    crime_id INT NOT NULL,
    officer_id INT NOT NULL,
    assigned_date DATE NOT NULL,
    role ENUM('lead', 'support', 'investigator') DEFAULT 'investigator',
    status ENUM('active', 'completed', 'transferred') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (crime_id) REFERENCES crimes(id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Case Updates/Notes Table
CREATE TABLE case_updates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    crime_id INT NOT NULL,
    officer_id INT,
    update_type ENUM('note', 'evidence', 'witness', 'arrest', 'other') DEFAULT 'note',
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crime_id) REFERENCES crimes(id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Evidence Table
CREATE TABLE evidence (
    id INT PRIMARY KEY AUTO_INCREMENT,
    crime_id INT NOT NULL,
    evidence_type VARCHAR(100) NOT NULL,
    description TEXT,
    location_found VARCHAR(255),
    collected_by INT,
    collection_date DATE,
    storage_location VARCHAR(100),
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crime_id) REFERENCES crimes(id) ON DELETE CASCADE,
    FOREIGN KEY (collected_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX idx_crimes_status ON crimes(status);
CREATE INDEX idx_crimes_type ON crimes(crime_type);
CREATE INDEX idx_crimes_date ON crimes(date_occurred);
CREATE INDEX idx_crimes_location ON crimes(city, state);
CREATE INDEX idx_criminals_status ON criminals(status);
CREATE INDEX idx_fir_status ON fir(status);
CREATE INDEX idx_case_assignments_status ON case_assignments(status);
