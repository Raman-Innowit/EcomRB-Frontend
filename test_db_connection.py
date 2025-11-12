"""
Test MySQL database connection with the provided credentials.
This script helps troubleshoot connection issues.
"""
import os
import urllib.parse
import pymysql
from pymysql.cursors import DictCursor

def test_connection():
    db_url = os.environ.get("DATABASE_URL", "").strip()
    if not db_url:
        print("ERROR: DATABASE_URL environment variable is not set")
        print("Set it with: $env:DATABASE_URL='mysql+pymysql://root:password%4012345@localhost:3306/ecommerce_admin'")
        return False
    
    # Parse the URL
    if db_url.startswith("mysql+pymysql://"):
        db_url = db_url.replace("mysql+pymysql://", "mysql://")
    
    parsed = urllib.parse.urlparse(db_url)
    
    config = {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": parsed.username or "root",
        "password": urllib.parse.unquote(parsed.password or ""),
        "charset": "utf8mb4",
        "cursorclass": DictCursor,
        "connect_timeout": 10,
    }
    
    print("="*60)
    print("Testing MySQL Connection")
    print("="*60)
    print(f"Host: {config['host']}")
    print(f"Port: {config['port']}")
    print(f"User: {config['user']}")
    print(f"Password: {'*' * len(config['password']) if config['password'] else '(empty)'}")
    print("="*60)
    
    # Test 1: Connect without database
    print("\n[Test 1] Connecting to MySQL server (without database)...")
    try:
        conn = pymysql.connect(**config)
        print("✓ Successfully connected to MySQL server!")
        cursor = conn.cursor()
        
        # Test 2: Check if database exists
        database_name = parsed.path.lstrip("/") if parsed.path else "ecommerce_admin"
        print(f"\n[Test 2] Checking if database '{database_name}' exists...")
        cursor.execute("SHOW DATABASES LIKE %s", (database_name,))
        result = cursor.fetchone()
        if result:
            print(f"✓ Database '{database_name}' exists!")
        else:
            print(f"✗ Database '{database_name}' does not exist.")
            print(f"  You can create it with: CREATE DATABASE {database_name};")
        
        # Test 3: Try to use the database
        print(f"\n[Test 3] Attempting to use database '{database_name}'...")
        try:
            cursor.execute(f"USE {database_name}")
            print(f"✓ Successfully using database '{database_name}'!")
        except Exception as e:
            print(f"✗ Cannot use database: {e}")
            print(f"  You may need to create it first or grant permissions.")
        
        # Test 4: Check user privileges
        print(f"\n[Test 4] Checking user privileges...")
        cursor.execute("SHOW GRANTS FOR CURRENT_USER()")
        grants = cursor.fetchall()
        print("Current user grants:")
        for grant in grants:
            print(f"  {grant[list(grant.keys())[0]]}")
        
        cursor.close()
        conn.close()
        print("\n" + "="*60)
        print("All connection tests passed! ✓")
        print("="*60)
        return True
        
    except pymysql.err.OperationalError as e:
        error_code, error_msg = e.args
        print(f"✗ Connection failed!")
        print(f"  Error Code: {error_code}")
        print(f"  Error Message: {error_msg}")
        
        if error_code == 1045:
            print("\nThis is an authentication error. Possible causes:")
            print("  1. Incorrect password")
            print("  2. User doesn't exist")
            print("  3. User doesn't have permission to connect from this host")
            print("\nTo fix:")
            print("  1. Verify the password is correct")
            print("  2. Try: ALTER USER 'root'@'localhost' IDENTIFIED BY 'password@12345';")
            print("  3. Or create a new user: CREATE USER 'root'@'localhost' IDENTIFIED BY 'password@12345';")
            print("  4. Grant privileges: GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';")
        elif error_code == 2003:
            print("\nCannot connect to MySQL server. Possible causes:")
            print("  1. MySQL server is not running")
            print("  2. Wrong host or port")
            print("  3. Firewall blocking the connection")
        
        print("\n" + "="*60)
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        print("\n" + "="*60)
        return False

if __name__ == "__main__":
    test_connection()

