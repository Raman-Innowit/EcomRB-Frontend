"""
Script to help diagnose MySQL authentication issues.
This will try to connect and provide suggestions.
"""
import subprocess
import sys

print("="*60)
print("MySQL Authentication Diagnostic Tool")
print("="*60)
print("\nIf the password is correct but connection fails, try these solutions:\n")

print("SOLUTION 1: Change MySQL authentication plugin to mysql_native_password")
print("-" * 60)
print("Connect to MySQL (using MySQL Workbench, command line, or phpMyAdmin)")
print("and run these commands:")
print()
print("  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password@12345';")
print("  FLUSH PRIVILEGES;")
print()

print("SOLUTION 2: Reset the root password")
print("-" * 60)
print("If you have access to MySQL, try:")
print()
print("  ALTER USER 'root'@'localhost' IDENTIFIED BY 'password@12345';")
print("  FLUSH PRIVILEGES;")
print()

print("SOLUTION 3: Check if user exists and has correct host")
print("-" * 60)
print("Run in MySQL:")
print()
print("  SELECT user, host, plugin FROM mysql.user WHERE user='root';")
print("  SHOW GRANTS FOR 'root'@'localhost';")
print()

print("SOLUTION 4: Try connecting with different host")
print("-" * 60)
print("Sometimes '127.0.0.1' works when 'localhost' doesn't.")
print("Try updating DATABASE_URL to use 127.0.0.1 instead of localhost")
print()

print("SOLUTION 5: Check MySQL service status")
print("-" * 60)
print("Make sure MySQL service is running:")
print("  Windows: Check Services (services.msc) for MySQL")
print("  Or run: Get-Service | Where-Object {$_.Name -like '*mysql*'}")
print()

print("="*60)
print("After making changes, run the test script again:")
print("  python test_db_connection.py")
print("="*60)

