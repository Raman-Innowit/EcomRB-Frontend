-- MySQL Commands to Fix Authentication Issues
-- Run these commands in MySQL (MySQL Workbench, command line, or phpMyAdmin)

-- Option 1: Change authentication plugin to mysql_native_password (Recommended)
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password@12345';
FLUSH PRIVILEGES;

-- Option 2: If Option 1 doesn't work, try resetting the password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password@12345';
FLUSH PRIVILEGES;

-- Option 3: Check current user configuration
SELECT user, host, plugin, authentication_string FROM mysql.user WHERE user='root';

-- Option 4: If root@localhost doesn't exist, create it
CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'password@12345';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;

-- Option 5: Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ecommerce_admin;
GRANT ALL PRIVILEGES ON ecommerce_admin.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

