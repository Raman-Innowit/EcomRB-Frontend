import os
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Tuple, Optional

from flask import Flask, jsonify, request
from flask_cors import CORS
import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv

# Load environment variables from .env file
# Get the directory where this script is located
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path, override=True)


def get_db_config() -> Dict[str, Any]:
	"""
	Get MySQL connection config from environment variables.
	Supports both individual DB_* variables and DATABASE_URL for backward compatibility.
	"""
	# Try individual environment variables first
	db_hostname = os.environ.get("DB_HOSTNAME", "").strip()
	db_port = os.environ.get("DB_PORT", "").strip()
	db_user = os.environ.get("DB_USER", "").strip()
	db_password = os.environ.get("DB_PASSWORD", "").strip()
	db_name = os.environ.get("DB_NAME", "").strip()
	
	# If individual variables are provided, use them
	if db_hostname and db_user and db_name:
		if not db_port:
			raise ValueError("DB_PORT environment variable is required")
		try:
			port = int(db_port)
		except ValueError:
			raise ValueError(f"DB_PORT must be a valid integer, got: {db_port}")
		
		# Connection timeout for remote connections
		connect_timeout_str = os.environ.get("DB_CONNECT_TIMEOUT")
		if not connect_timeout_str:
			raise ValueError("DB_CONNECT_TIMEOUT environment variable is required")
		try:
			connect_timeout = int(connect_timeout_str)
		except ValueError:
			raise ValueError(f"DB_CONNECT_TIMEOUT must be a valid integer, got: {connect_timeout_str}")
		
		config = {
			"host": db_hostname,
			"port": port,
			"user": db_user,
			"password": db_password,
			"database": db_name,
			"charset": "utf8mb4",
			"cursorclass": DictCursor,
			"autocommit": False,
			"connect_timeout": connect_timeout,
		}
		
		# Add SSL configuration if provided (for remote servers)
		ssl_ca = os.environ.get("DB_SSL_CA", "").strip()
		ssl_cert = os.environ.get("DB_SSL_CERT", "").strip()
		ssl_key = os.environ.get("DB_SSL_KEY", "").strip()
		ssl_disabled = os.environ.get("DB_SSL_DISABLED", "false").strip().lower() == "true"
		
		if ssl_disabled:
			config["ssl"] = {"check_hostname": False}
		elif ssl_ca or ssl_cert or ssl_key:
			ssl_config = {}
			if ssl_ca:
				ssl_config["ca"] = ssl_ca
			if ssl_cert:
				ssl_config["cert"] = ssl_cert
			if ssl_key:
				ssl_config["key"] = ssl_key
			config["ssl"] = ssl_config
		
		return config
	
	# Fallback to DATABASE_URL for backward compatibility
	db_url = os.environ.get("DATABASE_URL", "").strip()
	if not db_url:
		raise ValueError(
			"Database configuration required. Please set either:\n"
			"  - Individual variables: DB_HOSTNAME, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME\n"
			"  - Or DATABASE_URL: mysql+pymysql://user:password@host:port/database"
		)
	
	# Parse the URL
	# Format: mysql+pymysql://user:password@host:port/database
	if db_url.startswith("mysql+pymysql://"):
		db_url = db_url.replace("mysql+pymysql://", "mysql://")
	
	parsed = urllib.parse.urlparse(db_url)
	
	password = urllib.parse.unquote(parsed.password or "")
	
	# Connection timeout for remote connections
	connect_timeout_str = os.environ.get("DB_CONNECT_TIMEOUT")
	if not connect_timeout_str:
		raise ValueError("DB_CONNECT_TIMEOUT environment variable is required")
	try:
		connect_timeout = int(connect_timeout_str)
	except ValueError:
		raise ValueError(f"DB_CONNECT_TIMEOUT must be a valid integer, got: {connect_timeout_str}")
	
	if not parsed.hostname:
		raise ValueError("Database hostname is required in DATABASE_URL")
	if not parsed.port:
		raise ValueError("Database port is required in DATABASE_URL")
	if not parsed.username:
		raise ValueError("Database username is required in DATABASE_URL")
	database_name = parsed.path.lstrip("/") if parsed.path else None
	if not database_name:
		raise ValueError("Database name is required in DATABASE_URL")
	
	config = {
		"host": parsed.hostname,
		"port": parsed.port,
		"user": parsed.username,
		"password": password,
		"database": database_name,
		"charset": "utf8mb4",
		"cursorclass": DictCursor,
		"autocommit": False,
		"connect_timeout": connect_timeout,
	}
	
	# Add SSL configuration if provided (for remote servers)
	ssl_ca = os.environ.get("DB_SSL_CA", "").strip()
	ssl_cert = os.environ.get("DB_SSL_CERT", "").strip()
	ssl_key = os.environ.get("DB_SSL_KEY", "").strip()
	ssl_disabled = os.environ.get("DB_SSL_DISABLED", "false").strip().lower() == "true"
	
	if ssl_disabled:
		config["ssl"] = {"check_hostname": False}
	elif ssl_ca or ssl_cert or ssl_key:
		ssl_config = {}
		if ssl_ca:
			ssl_config["ca"] = ssl_ca
		if ssl_cert:
			ssl_config["cert"] = ssl_cert
		if ssl_key:
			ssl_config["key"] = ssl_key
		config["ssl"] = ssl_config
	
	return config


def open_db():
	"""
	Open a MySQL connection.
	"""
	config = get_db_config()
	try:
		conn = pymysql.connect(**config)
		return conn
	except pymysql.err.OperationalError as e:
		error_msg = str(e)
		if "Can't connect to MySQL server" in error_msg:
			host = config.get('host', 'unknown')
			port = config.get('port', 'unknown')
			raise ConnectionError(
				f"Unable to connect to database server at {host}:{port}. "
				f"Please verify:\n"
				f"1. The database server is running and accessible\n"
				f"2. Your IP address is whitelisted on the server\n"
				f"3. The firewall allows connections on port {port}\n"
				f"4. The host, port, and database name are correct\n"
				f"Original error: {error_msg}"
			) from e
		raise


def ensure_schema() -> None:
	"""
	Create minimal tables if they don't exist.
	This is intentionally generic - extend/alter as needed later.
	"""
	conn = open_db()
	cursor = conn.cursor()
	
	try:
		# Lookup tables
		cursor.execute(
			"""
			CREATE TABLE IF NOT EXISTS categories (
				id INT AUTO_INCREMENT PRIMARY KEY,
				name VARCHAR(255) NOT NULL
			)
			"""
		)
		cursor.execute(
			"""
			CREATE TABLE IF NOT EXISTS health_benefits (
				id INT AUTO_INCREMENT PRIMARY KEY,
				name VARCHAR(255) NOT NULL
			)
			"""
		)
		# Note: Products table already exists in the database with different schema
		# We'll work with the existing schema instead of creating a new one
		pass
		
		# Create orders table
		cursor.execute(
			"""
			CREATE TABLE IF NOT EXISTS orders (
				id INT AUTO_INCREMENT PRIMARY KEY,
				customer_name VARCHAR(255) NOT NULL,
				customer_email VARCHAR(255) NOT NULL,
				customer_phone VARCHAR(20),
				shipping_address TEXT NOT NULL,
				total_amount DECIMAL(10, 2) NOT NULL,
				currency_symbol VARCHAR(10) DEFAULT '₹',
				status VARCHAR(50) DEFAULT 'pending',
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
			"""
		)
		
		# Create order_items table
		cursor.execute(
			"""
			CREATE TABLE IF NOT EXISTS order_items (
				id INT AUTO_INCREMENT PRIMARY KEY,
				order_id INT NOT NULL,
				product_id INT NOT NULL,
				product_name VARCHAR(255) NOT NULL,
				quantity INT NOT NULL,
				price DECIMAL(10, 2) NOT NULL,
				subtotal DECIMAL(10, 2) NOT NULL,
				FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
				FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
			)
			"""
		)
		
		conn.commit()
	except Exception as e:
		conn.rollback()
		raise
	finally:
		cursor.close()
		conn.close()


def serialize_product(row: Dict[str, Any]) -> Dict[str, Any]:
	"""
	Serialize DB row to the structure the current frontend expects.
	- Matches keys used in ProductCard and Products.js
	- Maps actual database columns to frontend expected format
	"""
	# Map base_price to price for frontend compatibility
	base_price = float(row.get("base_price") or 0) if row.get("base_price") is not None else None
	sale_price = float(row.get("sale_price")) if row.get("sale_price") is not None else None
	
	# Parse comma-separated image URLs
	image_url_raw = row.get("image_url")
	image_urls = []
	if image_url_raw:
		# Split by comma and clean up whitespace
		# Filter out empty strings but keep all non-empty URLs
		# Handle cases with trailing commas or extra whitespace
		raw_str = str(image_url_raw).strip()
		if raw_str:
			image_urls = [url.strip() for url in raw_str.split(",") if url and url.strip()]
	
	thumbnail_url = row.get("thumbnail_url")
	
	product = {
		"id": row["id"],
		"name": row.get("name", ""),
		"slug": row.get("slug"),
		"converted_price": base_price,
		"converted_sale_price": sale_price,
		"base_price": base_price,
		"currency_symbol": row.get("base_currency") or "₹",
		"description": row.get("description") or row.get("short_description"),
		"stock_quantity": row.get("stock_quantity", 0),
		"featured": bool(row.get("featured", False)),
		"category_id": row.get("category_id"),
		"created_at": row.get("created_at"),
		"thumbnail_url": thumbnail_url,
		"image_url": image_urls[0] if image_urls else None,  # First image for backward compatibility
		"image_urls": image_urls,  # Array of all images (parsed from comma-separated image_url)
		"image_url_raw": str(image_url_raw) if image_url_raw else None,  # Original comma-separated string from DB
		"sku": row.get("sku"),
	}
	
	# Add category information if available
	if row.get("category_name"):
		product["category"] = {
			"id": row.get("category_id"),
			"name": row.get("category_name")
		}
	
	# Add health benefit information if available (if health_benefits table exists)
	if row.get("health_benefit_name"):
		product["health_benefits"] = [{
			"id": row.get("health_benefit_id"),
			"name": row.get("health_benefit_name")
		}]
	
	return product


def create_app() -> Flask:
	app = Flask(__name__)
	CORS(app, resources={r"/api/*": {"origins": "*"}})

	# Ensure minimal schema exists so the app can run immediately
	try:
		ensure_schema()
	except Exception:
		pass

	@app.get("/health")
	def health() -> Tuple[str, int]:
		return "ok", 200

	@app.get("/api/public/products")
	def public_products():
		"""
		Query params supported by the frontend:
		- page (int, default 1)
		- per_page (int, default 20)
		- sort_by ('created_at'|'name'|'price', default 'created_at')
		- sort_order ('asc'|'desc', default 'desc')
		- search (string, optional) - simple LIKE on name
		- category_id, health_benefit_id (ignored here but accepted for future)
		"""
		try:
			page = max(int(request.args.get("page", 1) or 1), 1)
			per_page = min(max(int(request.args.get("per_page", 20) or 20), 1), 100)
			search = (request.args.get("search") or "").strip()
			sort_by = (request.args.get("sort_by") or "created_at").strip()
			sort_order = (request.args.get("sort_order") or "desc").strip().lower()

			sort_by_whitelist = {"created_at", "name", "price"}
			if sort_by not in sort_by_whitelist:
				sort_by = "created_at"
			sort_order = "ASC" if sort_order == "asc" else "DESC"

			offset = (page - 1) * per_page

			conn = open_db()
			params: List[Any] = []
			where = []
			
			# Only show active products
			where.append("p.is_active = 1")
			
			if search:
				where.append("p.name LIKE %s")
				params.append(f"%{search}%")
			
			# Optional filters accepted by the frontend
			category_id = request.args.get("category_id")
			health_benefit_id = request.args.get("health_benefit_id")
			if category_id:
				where.append("(p.category_id = %s)")
				params.append(int(category_id))
			
			# Price filters
			min_price = request.args.get("min_price")
			max_price = request.args.get("max_price")
			if min_price:
				where.append("(p.base_price >= %s)")
				params.append(float(min_price))
			if max_price:
				where.append("(p.base_price <= %s)")
				params.append(float(max_price))
			
			# Health benefit filter using junction table
			health_benefit_join = ""
			if health_benefit_id:
				health_benefit_join = "INNER JOIN product_health_benefits phb ON p.id = phb.product_id"
				where.append("(phb.health_benefit_id = %s)")
				params.append(int(health_benefit_id))

			where_clause = f"WHERE {' AND '.join(where)}" if where else ""

			cursor = conn.cursor()
			# Use proper table alias in COUNT query
			count_query = f"SELECT COUNT(DISTINCT p.id) AS c FROM products p {health_benefit_join} {where_clause}"
			cursor.execute(count_query, params)
			total = cursor.fetchone()["c"]
			
			# Map sort_by to use table alias and actual column names
			sort_column_map = {
				"created_at": "p.created_at",
				"name": "p.name",
				"price": "p.base_price"  # Use base_price instead of price
			}
			sort_column = sort_column_map.get(sort_by, "p.created_at")
			
			cursor.execute(
				f"""
				SELECT DISTINCT p.id, p.name, p.slug, p.base_price, p.sale_price, p.base_currency, 
				       p.description, p.short_description, p.stock_quantity, p.featured, 
				       p.category_id, p.created_at, p.thumbnail_url, p.image_url, p.sku,
				       c.name AS category_name
				FROM products p
				LEFT JOIN categories c ON p.category_id = c.id
				{health_benefit_join}
				{where_clause}
				ORDER BY {sort_column} {sort_order}
				LIMIT %s OFFSET %s
				""",
				[*params, per_page, offset],
			)
			rows = cursor.fetchall()
			cursor.close()
			conn.close()

			products = [serialize_product(r) for r in rows]

			# Compute total pages similar to backend the frontend expects
			pages = max((total + per_page - 1) // per_page, 1) if total else 1
			return jsonify({"products": products, "total": total, "pages": pages})
		except ConnectionError as e:
			return jsonify({
				"error": "Database connection failed",
				"message": "Unable to connect to database. Please check your database server configuration.",
				"products": [],
				"total": 0,
				"pages": 1
			}), 503
		except Exception as e:
			return jsonify({
				"error": "Failed to fetch products",
				"message": str(e),
				"products": [],
				"total": 0,
				"pages": 1
			}), 500

	@app.get("/api/public/categories")
	def public_categories():
		try:
			conn = open_db()
			cursor = conn.cursor()
			cursor.execute("""
				SELECT c.id, c.name, COUNT(p.id) AS product_count
				FROM categories c
				LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
				GROUP BY c.id, c.name
				ORDER BY c.name ASC
			""")
			rows = cursor.fetchall()
			cursor.close()
			conn.close()
			return jsonify({"categories": [{"id": r["id"], "name": r["name"], "product_count": r["product_count"] or 0} for r in rows]})
		except Exception as e:
			return jsonify({"error": "Failed to fetch categories", "message": str(e)}), 500

	@app.get("/api/public/health-benefits")
	def public_health_benefits():
		try:
			conn = open_db()
			cursor = conn.cursor()
			cursor.execute("SELECT id, name FROM health_benefits ORDER BY name ASC")
			rows = cursor.fetchall()
			cursor.close()
			conn.close()
			return jsonify({"health_benefits": [{"id": r["id"], "name": r["name"]} for r in rows]})
		except Exception as e:
			return jsonify({"error": "Failed to fetch health benefits", "message": str(e)}), 500

	@app.get("/api/public/product/<int:product_id>")
	def public_product_detail(product_id: int):
		import json
		conn = open_db()
		cursor = conn.cursor()
		
		# Get product with category, health benefits, and all dynamic content fields
		cursor.execute(
			"""
			SELECT p.id, p.name, p.slug, p.base_price, p.sale_price, p.base_currency, 
			       p.description, p.short_description, p.stock_quantity, p.featured, 
			       p.category_id, p.created_at, p.thumbnail_url, p.image_url, p.sku,
			       p.min_order_quantity, p.max_order_quantity,
			       p.product_features, p.reviews, p.directions, p.highlights,
			       p.product_type, p.color_name, p.color_shade, p.is_taxable, p.tax_rate,
			       p.is_grouped_product, p.site_id, p.reward_points,
			       c.name AS category_name,
			       GROUP_CONCAT(DISTINCT hb.id) AS health_benefit_ids,
			       GROUP_CONCAT(DISTINCT hb.name) AS health_benefit_names
			FROM products p
			LEFT JOIN categories c ON p.category_id = c.id
			LEFT JOIN product_health_benefits phb ON p.id = phb.product_id
			LEFT JOIN health_benefits hb ON phb.health_benefit_id = hb.id
			WHERE p.id = %s AND p.is_active = 1
			GROUP BY p.id, p.name, p.slug, p.base_price, p.sale_price, p.base_currency, 
			         p.description, p.short_description, p.stock_quantity, p.featured, 
			         p.category_id, p.created_at, p.thumbnail_url, p.image_url, p.sku,
			         p.min_order_quantity, p.max_order_quantity, p.product_features, 
			         p.reviews, p.directions, p.highlights, p.product_type, p.color_name,
			         p.color_shade, p.is_taxable, p.tax_rate, p.is_grouped_product, 
			         p.site_id, p.reward_points, c.name
			""",
			(product_id,),
		)
		row = cursor.fetchone()
		
		if not row:
			cursor.close()
			conn.close()
			return jsonify({"error": "Not found"}), 404
		
		# Try to fetch additional columns that might exist (for backward compatibility)
		# These are fields that may not be in all database versions
		try:
			cursor.execute("""
				SELECT COLUMN_NAME 
				FROM INFORMATION_SCHEMA.COLUMNS 
				WHERE TABLE_SCHEMA = DATABASE() 
				AND TABLE_NAME = 'products' 
				AND COLUMN_NAME IN (
					'key_ingredients', 'recommended_dosage', 'dosage', 'warning', 'faqs', 
					'additional_images', 'ingredient_details', 'gallery_images'
				)
			""")
			available_columns = [col['COLUMN_NAME'] for col in cursor.fetchall()]
			
			# Fetch additional fields if they exist
			if available_columns:
				cursor.execute(
					f"""
					SELECT {', '.join([f'p.{col}' for col in available_columns])}
					FROM products p
					WHERE p.id = %s
					""",
					(product_id,),
				)
				additional_row = cursor.fetchone()
				if additional_row:
					for col in available_columns:
						value = additional_row.get(col)
						if value:
							# Try to parse JSON fields
							if col in ['product_features', 'faqs', 'additional_images', 'ingredient_details', 'gallery_images', 'highlights', 'reviews']:
								try:
									row[col] = json.loads(value) if isinstance(value, str) else value
								except (json.JSONDecodeError, TypeError):
									row[col] = value
							else:
								row[col] = value
		except Exception:
			# If additional fields query fails, just continue without them
			pass
		
		# Parse JSON fields that are already in the row (if they're strings)
		json_fields = ['product_features', 'highlights', 'reviews', 'gallery_images', 'additional_images', 'ingredient_details', 'faqs']
		for field in json_fields:
			if row.get(field) and isinstance(row.get(field), str):
				try:
					row[field] = json.loads(row[field])
				except (json.JSONDecodeError, TypeError):
					pass
		
		# Handle dosage field - check for both 'dosage' and 'recommended_dosage'
		if row.get('dosage') and not row.get('recommended_dosage'):
			row['recommended_dosage'] = row.get('dosage')
		
		# Parse health benefits
		health_benefit_ids = []
		health_benefit_names = []
		if row.get("health_benefit_ids") and row.get("health_benefit_names"):
			try:
				health_benefit_ids = [int(x) for x in str(row["health_benefit_ids"]).split(",") if x.strip()]
				health_benefit_names = [x.strip() for x in str(row["health_benefit_names"]).split(",") if x.strip()]
			except (ValueError, AttributeError):
				health_benefit_ids = []
				health_benefit_names = []
		
		# Build health benefits array
		health_benefits = []
		for i, hb_id in enumerate(health_benefit_ids):
			if i < len(health_benefit_names):
				health_benefits.append({
					"id": hb_id,
					"name": health_benefit_names[i]
				})
		
		# Serialize product
		product = serialize_product(row)
		product["health_benefits"] = health_benefits if health_benefits else []
		product["min_order_quantity"] = row.get("min_order_quantity") or 1
		product["max_order_quantity"] = row.get("max_order_quantity") or 10
		
		# Add short_description as a separate field
		if row.get("short_description"):
			product["short_description"] = row.get("short_description")
		
		# Add all dynamic content fields from database
		dynamic_fields = [
			"product_features", "highlights", "directions", "reviews",
			"key_ingredients", "recommended_dosage", "warning", "faqs", 
			"additional_images", "gallery_images", "ingredient_details",
			"product_type", "color_name", "color_shade", "is_taxable", 
			"tax_rate", "is_grouped_product", "site_id", "reward_points"
		]
		for field in dynamic_fields:
			if row.get(field) is not None:
				product[field] = row.get(field)
		
		cursor.close()
		conn.close()
		return jsonify({"product": product})
	
	@app.post("/api/public/orders")
	def create_order():
		"""
		Create a new order from cart items.
		Expected JSON body:
		{
			"customer_name": "John Doe",
			"customer_email": "john@example.com",
			"customer_phone": "+1234567890",
			"shipping_address": "123 Main St, City, State, ZIP",
			"items": [
				{
					"product_id": 1,
					"product_name": "Product Name",
					"quantity": 2,
					"price": 99.99
				}
			]
		}
		"""
		data = request.get_json()
		
		if not data:
			return jsonify({"error": "No data provided"}), 400
		
		required_fields = ["customer_name", "customer_email", "shipping_address", "items"]
		for field in required_fields:
			if field not in data:
				return jsonify({"error": f"Missing required field: {field}"}), 400
		
		if not data["items"] or len(data["items"]) == 0:
			return jsonify({"error": "Order must have at least one item"}), 400
		
		# Calculate total
		total_amount = sum(item["price"] * item["quantity"] for item in data["items"])
		
		conn = open_db()
		cursor = conn.cursor()
		
		try:
			# Insert order
			cursor.execute(
				"""
				INSERT INTO orders (customer_name, customer_email, customer_phone, 
				                    shipping_address, total_amount, currency_symbol, status)
				VALUES (%s, %s, %s, %s, %s, %s, %s)
				""",
				(
					data["customer_name"],
					data["customer_email"],
					data.get("customer_phone", ""),
					data["shipping_address"],
					total_amount,
					data.get("currency_symbol", "₹"),
					"pending"
				)
			)
			order_id = cursor.lastrowid
			
			# Insert order items
			for item in data["items"]:
				subtotal = item["price"] * item["quantity"]
				cursor.execute(
					"""
					INSERT INTO order_items (order_id, product_id, product_name, quantity, price, subtotal)
					VALUES (%s, %s, %s, %s, %s, %s)
					""",
					(
						order_id,
						item["product_id"],
						item["product_name"],
						item["quantity"],
						item["price"],
						subtotal
					)
				)
			
			conn.commit()
			return jsonify({
				"success": True,
				"order_id": order_id,
				"message": "Order created successfully"
			}), 201
		except Exception as e:
			conn.rollback()
			return jsonify({"error": str(e)}), 500
		finally:
			cursor.close()
			conn.close()

	return app


if __name__ == "__main__":
	"""
	Run a simple dev server:
	- Change host/port with HOST/PORT env vars as needed.
	- Configure DB file path with DATABASE_URL=sqlite:///path/to/file.db
	"""
	app = create_app()
	host = os.environ.get("HOST")
	port = os.environ.get("PORT")
	
	if not host:
		raise ValueError("HOST environment variable is required")
	if not port:
		raise ValueError("PORT environment variable is required")
	
	try:
		port = int(port)
	except ValueError:
		raise ValueError(f"PORT must be a valid integer, got: {port}")
	
	app.run(host=host, port=port, debug=True)


