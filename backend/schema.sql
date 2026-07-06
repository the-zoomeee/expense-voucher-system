-- Expense Voucher Management System - MySQL schema
CREATE DATABASE IF NOT EXISTS expense_voucher_db;
USE expense_voucher_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('employee', 'director', 'accounts') NOT NULL,
  employee_code VARCHAR(50) DEFAULT NULL,
  department_name VARCHAR(150) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vouchers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voucher_number VARCHAR(50) NOT NULL UNIQUE,
  voucher_date DATE NOT NULL,
  expense_date DATE NOT NULL,
  department_name VARCHAR(150) NOT NULL,
  expense_title VARCHAR(200) NOT NULL,
  expense_category VARCHAR(100) NOT NULL,
  expense_description TEXT,
  amount DECIMAL(12,2) NOT NULL,

  employee_id INT NOT NULL,
  employee_signature_path VARCHAR(255) DEFAULT NULL,

  status ENUM('draft', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'draft',

  director_id INT DEFAULT NULL,
  director_signature_path VARCHAR(255) DEFAULT NULL,
  approval_date DATETIME DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_voucher_employee FOREIGN KEY (employee_id) REFERENCES users(id),
  CONSTRAINT fk_voucher_director FOREIGN KEY (director_id) REFERENCES users(id),
  CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_vouchers_employee ON vouchers(employee_id);
CREATE INDEX idx_vouchers_status ON vouchers(status);
