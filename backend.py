import os
import sqlite3
from typing import Any, Dict, List, Tuple

from flask import Flask, jsonify, request
from flask_cors import CORS


def get_db_path() -> str:
	"""
	Resolve the database path from environment or defaults.
	Hi my name is shruti.
	Defaults to ./instance/rasayanabio_data.db (created if missing).
	"""
	db_url = os.environ.get("DATABASE_URL", "").strip()
	if db_url and db_url.startswith(("sqlite:///", "file:")):
		# Support DATABASE_URL=sqlite:///absolute/or/relative/path.db
		db_path = db_url.replace("sqlite:///", "")
	else:
		# Default local sqlite db under ./instance
		instance_dir = os.path.join(os.getcwd(), "instance")
		os.makedirs(instance_dir, exist_ok=True)
		db_path = os.path.join(instance_dir, "rasayanabio_data.db")
	return db_path


def open_db() -> sqlite3.Connection:
	"""
	Open a SQLite connection with row access by column name.
	"""
	conn = sqlite3.connect(get_db_path())
	conn.row_factory = sqlite3.Row
	return conn


def ensure_schema() -> None:
	"""
	Create minimal tables if they don't exist.
	This is intentionally generic - extend/alter as needed later.
	"""
	conn = open_db()
	with conn:
		# Lookup tables
		conn.execute(
			"""
			CREATE TABLE IF NOT EXISTS categories (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL
			)
			"""
		)
		conn.execute(
			"""
			CREATE TABLE IF NOT EXISTS health_benefits (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL
			)
			"""
		)
		conn.execute(
			"""
			CREATE TABLE IF NOT EXISTS products (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				slug TEXT,
				price REAL NOT NULL DEFAULT 0,
				sale_price REAL,
				currency_symbol TEXT DEFAULT '$',
				category_id INTEGER,
				health_benefit_id INTEGER,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
			"""
		)
		# Seed minimal data if empty
		if conn.execute("SELECT COUNT(*) c FROM categories").fetchone()["c"] == 0:
			conn.executemany("INSERT INTO categories(name) VALUES (?)", [(n,) for n in ["Health Supplements", "Cosmetics", "Honey"]])
		if conn.execute("SELECT COUNT(*) c FROM health_benefits").fetchone()["c"] == 0:
			conn.executemany(
				"INSERT INTO health_benefits(name) VALUES (?)",
				[(n,) for n in ["Immunity Booster", "Sleep Support", "Stress and Anxiety", "Women's Health"]],
			)
	conn.close()


def serialize_product(row: sqlite3.Row) -> Dict[str, Any]:
	"""
	Serialize DB row to the structure the current frontend expects.
	- Matches keys used in ProductCard and Products.tsx
	"""
	return {
		"id": row["id"],
		"name": row["name"],
		"slug": row["slug"],
		"converted_price": float(row["price"]) if row["price"] is not None else None,
		"converted_sale_price": float(row["sale_price"]) if row["sale_price"] is not None else None,
		"currency_symbol": row["currency_symbol"] or "$",
	}


def create_app() -> Flask:
	app = Flask(__name__)
	CORS(app, resources={r"/api/*": {"origins": "*"}})

	# Ensure minimal schema exists so the app can run immediately
	ensure_schema()

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
		if search:
			where.append("name LIKE ?")
			params.append(f"%{search}%")
		# Optional filters accepted by the frontend
		category_id = request.args.get("category_id")
		health_benefit_id = request.args.get("health_benefit_id")
		if category_id:
			where.append("(category_id = ?)")
			params.append(int(category_id))
		if health_benefit_id:
			where.append("(health_benefit_id = ?)")
			params.append(int(health_benefit_id))

		where_clause = f"WHERE {' AND '.join(where)}" if where else ""

		total = conn.execute(f"SELECT COUNT(*) AS c FROM products {where_clause}", params).fetchone()["c"]
		rows = conn.execute(
			f"""
			SELECT id, name, slug, price, sale_price, currency_symbol, created_at
			FROM products
			{where_clause}
			ORDER BY {sort_by} {sort_order}
			LIMIT ? OFFSET ?
			""",
			[*params, per_page, offset],
		).fetchall()
		conn.close()

		products = [serialize_product(r) for r in rows]

		# Compute total pages similar to backend the frontend expects
		pages = max((total + per_page - 1) // per_page, 1) if total else 1
		return jsonify({"products": products, "total": total, "pages": pages})

	@app.get("/api/public/categories")
	def public_categories():
		conn = open_db()
		rows = conn.execute("SELECT id, name FROM categories ORDER BY name ASC").fetchall()
		conn.close()
		return jsonify({"categories": [{"id": r["id"], "name": r["name"]} for r in rows]})

	@app.get("/api/public/health-benefits")
	def public_health_benefits():
		conn = open_db()
		rows = conn.execute("SELECT id, name FROM health_benefits ORDER BY name ASC").fetchall()
		conn.close()
		return jsonify({"health_benefits": [{"id": r["id"], "name": r["name"]} for r in rows]})

	@app.get("/api/public/product/<int:product_id>")
	def public_product_detail(product_id: int):
		conn = open_db()
		row = conn.execute(
			"""
			SELECT id, name, slug, price, sale_price, currency_symbol, created_at
			FROM products
			WHERE id = ?
			""",
			(product_id,),
		).fetchone()
		conn.close()
		if not row:
			return jsonify({"error": "Not found"}), 404
		return jsonify(serialize_product(row))

	return app


if __name__ == "__main__":
	"""
	Run a simple dev server:
	- Change host/port with HOST/PORT env vars as needed.
	- Configure DB file path with DATABASE_URL=sqlite:///path/to/file.db
	"""
	app = create_app()
	host = os.environ.get("HOST", "127.0.0.1")
	port = int(os.environ.get("PORT", "5000"))
	app.run(host=host, port=port, debug=True)


