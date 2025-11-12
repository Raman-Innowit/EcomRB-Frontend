"""
Check the actual structure of the products table in the database.
"""
import os
import urllib.parse
import pymysql
from pymysql.cursors import DictCursor

db_url = os.environ.get("DATABASE_URL", "").strip()
if not db_url:
    print("ERROR: DATABASE_URL not set")
    exit(1)

if db_url.startswith("mysql+pymysql://"):
    db_url = db_url.replace("mysql+pymysql://", "mysql://")

parsed = urllib.parse.urlparse(db_url)
config = {
    "host": parsed.hostname or "localhost",
    "port": parsed.port or 3306,
    "user": parsed.username or "root",
    "password": urllib.parse.unquote(parsed.password or ""),
    "database": parsed.path.lstrip("/") if parsed.path else "ecommerce_admin",
    "charset": "utf8mb4",
    "cursorclass": DictCursor,
}

try:
    conn = pymysql.connect(**config)
    cursor = conn.cursor()
    
    print("="*60)
    print("Checking products table structure...")
    print("="*60)
    
    # Get table structure
    cursor.execute("DESCRIBE products")
    columns = cursor.fetchall()
    
    print("\nProducts table columns:")
    for col in columns:
        print(f"  - {col['Field']} ({col['Type']})")
    
    # Get a sample product to see actual data
    cursor.execute("SELECT * FROM products LIMIT 1")
    sample = cursor.fetchone()
    
    if sample:
        print("\nSample product data:")
        for key, value in sample.items():
            print(f"  {key}: {value}")
    else:
        print("\nNo products found in table")
    
    # Check categories table
    print("\n" + "="*60)
    print("Checking categories table...")
    print("="*60)
    cursor.execute("DESCRIBE categories")
    cat_columns = cursor.fetchall()
    for col in cat_columns:
        print(f"  - {col['Field']} ({col['Type']})")
    
    cursor.execute("SELECT * FROM categories LIMIT 5")
    categories = cursor.fetchall()
    print(f"\nCategories ({len(categories)} found):")
    for cat in categories:
        print(f"  ID: {cat['id']}, Name: {cat['name']}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")

