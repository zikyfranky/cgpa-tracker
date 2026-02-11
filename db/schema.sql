CREATE DATABASE IF NOT EXISTS cgpa_tracker;
USE cgpa_tracker;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matric_number VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_matric (matric_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User CGPA state (grades, carryovers, preferences)
CREATE TABLE IF NOT EXISTS user_state (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  active_tab VARCHAR(50) DEFAULT 'overview',
  input_mode VARCHAR(10) DEFAULT 'scores',
  current_level VARCHAR(10) DEFAULT '100',
  current_semester VARCHAR(50) DEFAULT 'First Semester',
  upcoming_filter VARCHAR(50) DEFAULT 'all',
  grades JSON,
  carryovers JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Levels (100L, 200L, 300L, etc.)
CREATE TABLE IF NOT EXISTS levels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level_number INT NOT NULL UNIQUE,
  session_name VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0,
  INDEX idx_level_num (level_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Semesters per level
CREATE TABLE IF NOT EXISTS semesters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level_id INT NOT NULL,
  semester_name VARCHAR(50) NOT NULL,
  max_units INT DEFAULT 24,
  UNIQUE KEY uk_level_sem (level_id, semester_name),
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  semester_id INT NOT NULL,
  code VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  units INT NOT NULL DEFAULT 2,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Global settings
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
