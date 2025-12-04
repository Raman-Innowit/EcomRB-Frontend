from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, 
    get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
from functools import wraps
import os
import json 
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy import func, desc, or_, text, bindparam, inspect
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv
import traceback
try:
    from zoneinfo import ZoneInfo  # Python 3.9+
except ImportError:
    ZoneInfo = None

# Load environment variables from .env if present
load_dotenv()

# Initialize Flask App
app = Flask(__name__)

if ZoneInfo:
    try:
        IST = ZoneInfo('Asia/Kolkata')
    except Exception:
        IST = timezone(timedelta(hours=5, minutes=30))
else:
    IST = timezone(timedelta(hours=5, minutes=30))

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
# Build SQLAlchemy database URI from environment variables (same as PyMySQL endpoints)
# This ensures both SQLAlchemy and PyMySQL connect to the same database
def get_sqlalchemy_database_uri():
    """Build SQLAlchemy database URI from environment variables"""
    # Try individual environment variables first (same as _public_get_db_config)
    db_hostname = os.environ.get("DB_HOSTNAME", "").strip()
    db_port = os.environ.get("DB_PORT", "").strip()
    db_user = os.environ.get("DB_USER", "").strip()
    db_password = os.environ.get("DB_PASSWORD", "").strip()
    db_name = os.environ.get("DB_NAME", "").strip()
    
    # If individual variables are provided, use them
    if db_hostname and db_user and db_name and db_port:
        # URL encode password to handle special characters
        import urllib.parse
        encoded_password = urllib.parse.quote_plus(db_password) if db_password else ""
        return f"mysql+pymysql://{db_user}:{encoded_password}@{db_hostname}:{db_port}/{db_name}"
    
    # Fallback to DATABASE_URL environment variable
    db_url = os.environ.get("DATABASE_URL", "").strip()
    if db_url:
        # Ensure it uses pymysql driver
        if db_url.startswith("mysql://"):
            db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)
        elif not db_url.startswith("mysql+pymysql://"):
            # If it's a different format, try to convert it
            pass
        return db_url
    
    # Final fallback to default (for backward compatibility)
    return 'mysql+pymysql://root:password%4012345@127.0.0.1:3306/ecommerce_admin'

app.config['SQLALCHEMY_DATABASE_URI'] = get_sqlalchemy_database_uri()
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = False  # Disable SQL query logging

# Debug: Print database URI (without password for security)
db_uri_for_log = app.config['SQLALCHEMY_DATABASE_URI']
if '@' in db_uri_for_log:
    # Mask password in log
    parts = db_uri_for_log.split('@')
    if ':' in parts[0]:
        user_pass = parts[0].split('://')[1] if '://' in parts[0] else parts[0]
        if ':' in user_pass:
            user = user_pass.split(':')[0]
            masked_uri = db_uri_for_log.replace(user_pass, f"{user}:***")
            print(f"[INFO] SQLAlchemy connecting to: {masked_uri}")
        else:
            print(f"[INFO] SQLAlchemy connecting to: {db_uri_for_log.split('@')[1]}")
    else:
        print(f"[INFO] SQLAlchemy connecting to: {db_uri_for_log.split('@')[1]}")
else:
    print(f"[INFO] SQLAlchemy database URI configured")


# Initialize Extensions
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})
db = SQLAlchemy(app)
jwt = JWTManager(app)

def _default_country_code_for_currency(currency_code: str) -> str:
    """
    Map a currency code to the default country code used for global pricing rows.
    We keep it short (<=3 chars) to fit the column definition.
    """
    if not currency_code:
        return 'INT'
    code = currency_code.strip().upper()
    return code[:3] if len(code) >= 3 else code.ljust(3, 'X')

PRICING_TYPE_AUTO = 'S'  # Stored as single-character in DB (Standard / System generated)
PRICING_TYPE_MANUAL = 'M'  # Manual override / Locked pricing


def normalize_pricing_type(value) -> str:
    """
    Normalise the pricing type flag coming from the database/UI into the single-character
    code that is persisted in MySQL.
    Supported values:
      - 'auto', 'standard', 's' → 'S'
      - 'manual', 'locked', 'm' → 'M'
    """
    if value is None:
        return PRICING_TYPE_AUTO

    value_str = str(value).strip()
    if not value_str:
        return PRICING_TYPE_AUTO

    value_upper = value_str.upper()
    if value_upper in ('M', 'MANUAL', 'LOCKED'):
        return PRICING_TYPE_MANUAL
    if value_upper in ('S', 'STANDARD', 'AUTO'):
        return PRICING_TYPE_AUTO

    # Fall back to single-character codes if already provided
    if value_upper == PRICING_TYPE_MANUAL:
        return PRICING_TYPE_MANUAL
    return PRICING_TYPE_AUTO


def pricing_type_label(value) -> str:
    """Return human readable label for pricing type."""
    normalized = normalize_pricing_type(value)
    return 'manual' if normalized == PRICING_TYPE_MANUAL else 'auto'


def _coerce_date(value):
    """Parse a date string in YYYY-MM-DD format into a date object."""
    if not value:
        return None
    try:
        return datetime.strptime(value[:10], '%Y-%m-%d').date()
    except (TypeError, ValueError):
        return None


def parse_date_range(default_days=30):
    """
    Normalize incoming date range parameters.
    Accepts ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD or ?days=N.
    Returns both date and datetime boundaries plus the previous comparison window.
    Uses UTC timezone for all datetime calculations to match MySQL TIMESTAMP behavior.
    """
    days_param = request.args.get('days', type=int)
    if days_param and days_param > 0:
        default_days = days_param

    today = datetime.utcnow().date()
    end_date = (
        _coerce_date(request.args.get('end_date')) or
        _coerce_date(request.args.get('endDate')) or
        today
    )
    start_date = (
        _coerce_date(request.args.get('start_date')) or
        _coerce_date(request.args.get('startDate'))
    )

    if not start_date:
        # Match MySQL DATE_SUB(CURDATE(), INTERVAL N DAY) behavior exactly
        # For "last 30 days", we want exactly 30 days back from today
        # MySQL: DATE_SUB(CURDATE(), INTERVAL 30 DAY) gives exactly 30 days ago
        offset = max(default_days, 1)  # For 30 days: use 30 days back
        start_date = end_date - timedelta(days=offset)

    if start_date > end_date:
        start_date, end_date = end_date, start_date

    period_days = (end_date - start_date).days + 1
    previous_end_date = start_date - timedelta(days=1)
    previous_start_date = previous_end_date - timedelta(days=period_days - 1)

    # Use UTC timezone for all datetime objects to match MySQL TIMESTAMP behavior
    start_datetime = datetime.combine(start_date, datetime.min.time(), tzinfo=timezone.utc)
    end_datetime = datetime.combine(end_date, datetime.max.time(), tzinfo=timezone.utc)
    end_datetime_exclusive = datetime.combine(end_date + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)

    previous_start_datetime = datetime.combine(previous_start_date, datetime.min.time(), tzinfo=timezone.utc)
    previous_end_datetime = datetime.combine(previous_end_date, datetime.max.time(), tzinfo=timezone.utc)
    previous_end_exclusive = datetime.combine(previous_end_date + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc)

    return {
        'start_date': start_date,
        'end_date': end_date,
        'start_datetime': start_datetime,
        'end_datetime': end_datetime,
        'end_datetime_exclusive': end_datetime_exclusive,
        'days': period_days,
        'previous_start_date': previous_start_date,
        'previous_end_date': previous_end_date,
        'previous_start_datetime': previous_start_datetime,
        'previous_end_datetime': previous_end_datetime,
        'previous_end_datetime_exclusive': previous_end_exclusive
    }


# ==================== DATABASE MODELS ====================

# Admin User Model
class AdminUser(db.Model):
    __tablename__ = 'admin_users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='admin')
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# REMOVED - Multi-tenancy removed
# Site/Tenant Model for Multi-Tenant Support
# class Site(db.Model):
#     __tablename__ = 'sites'
#     ... (removed)

# Customer User Model
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    country_code = db.Column(db.String(3))
    preferred_currency = db.Column(db.String(3), default='USD')
    wallet_balance = db.Column(db.Float, default=0.0)
    reward_points = db.Column(db.Integer, default=0)
    # site_id removed - multi-tenancy removed
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Category Model
class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True)
    description = db.Column(db.Text)
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    # site_id removed - multi-tenancy removed
    is_active = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Health Benefit Model
class HealthBenefit(db.Model):
    __tablename__ = 'health_benefits'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Size Model
class Size(db.Model):
    __tablename__ = 'sizes'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.Text)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Product Health Benefit Association
product_health_benefits = db.Table('product_health_benefits',
    db.Column('product_id', db.Integer, db.ForeignKey('products.id'), primary_key=True),
    db.Column('health_benefit_id', db.Integer, db.ForeignKey('health_benefits.id'), primary_key=True)
)

# Key Ingredient Model
class KeyIngredient(db.Model):
    __tablename__ = 'key_ingredients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500))
    thumbnail_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'image_url': self.image_url,
            'thumbnail_url': self.thumbnail_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Product Key Ingredient Association (Junction Table)
class ProductKeyIngredient(db.Model):
    __tablename__ = 'product_key_ingredients'
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), primary_key=True)
    key_ingredient_id = db.Column(db.Integer, db.ForeignKey('key_ingredients.id'), primary_key=True)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product', back_populates='key_ingredient_mappings')
    key_ingredient = db.relationship('KeyIngredient', backref='product_mappings')

# Product Model
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True)
    sku = db.Column(db.String(100), unique=True)
    description = db.Column(db.Text)
    short_description = db.Column(db.String(500))
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    category = db.relationship('Category', backref='products')
    product_type = db.Column(db.String(20), default='simple')  # simple, variable, grouped
    base_price = db.Column(db.Float, nullable=False)
    sale_price = db.Column(db.Float)
    base_currency = db.Column(db.String(3), default='INR')
    stock_quantity = db.Column(db.Integer, default=0)
    min_order_quantity = db.Column(db.Integer, default=1)
    max_order_quantity = db.Column(db.Integer)
    color_name = db.Column(db.String(50))
    color_shade = db.Column(db.String(7))  # Hex color
    # site_id removed - multi-tenancy removed
    is_taxable = db.Column(db.Boolean, default=True)
    tax_rate = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    featured = db.Column(db.Boolean, default=False)
    is_grouped_product = db.Column(db.Boolean, default=False)
    thumbnail_url = db.Column(db.String(500))
    image1 = db.Column(db.String(500))
    image2 = db.Column(db.String(500))
    image3 = db.Column(db.String(500))
    image4 = db.Column(db.String(500))
    image5 = db.Column(db.String(500))
    reward_points = db.Column(db.Integer, default=0)
    health_benefits = db.relationship('HealthBenefit', secondary=product_health_benefits, backref='products')
    key_ingredient_mappings = db.relationship('ProductKeyIngredient', back_populates='product', cascade='all, delete-orphan')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Product FAQ Model
class ProductFAQ(db.Model):
    __tablename__ = 'product_faqs'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False, unique=True)
    product = db.relationship('Product', backref=db.backref('faqs', lazy='noload', uselist=False, cascade='all, delete-orphan'))
    faq1_question = db.Column(db.Text)
    faq1_answer = db.Column(db.Text)
    faq2_question = db.Column(db.Text)
    faq2_answer = db.Column(db.Text)
    faq3_question = db.Column(db.Text)
    faq3_answer = db.Column(db.Text)
    faq4_question = db.Column(db.Text)
    faq4_answer = db.Column(db.Text)
    faq5_question = db.Column(db.Text)
    faq5_answer = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'faq1': {'question': self.faq1_question, 'answer': self.faq1_answer} if self.faq1_question else None,
            'faq2': {'question': self.faq2_question, 'answer': self.faq2_answer} if self.faq2_question else None,
            'faq3': {'question': self.faq3_question, 'answer': self.faq3_answer} if self.faq3_question else None,
            'faq4': {'question': self.faq4_question, 'answer': self.faq4_answer} if self.faq4_question else None,
            'faq5': {'question': self.faq5_question, 'answer': self.faq5_answer} if self.faq5_question else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Product Feature Card Model
class ProductFeatureCard(db.Model):
    __tablename__ = 'product_feature_cards'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    card_text = db.Column(db.String(255), nullable=False)
    card_image_url = db.Column(db.String(500))
    display_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    product = db.relationship('Product', backref=db.backref('feature_cards', lazy='dynamic', cascade='all, delete-orphan'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'card_text': self.card_text,
            'card_image_url': self.card_image_url,
            'display_order': self.display_order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Currency Model
class Currency(db.Model):
    __tablename__ = 'currencies'
    id = db.Column(db.Integer, primary_key=True)
    currency_code = db.Column(db.String(3), unique=True, nullable=False)
    currency_name = db.Column(db.String(100), nullable=False)
    currency_symbol = db.Column(db.String(10), nullable=False)
    api_rate = db.Column(db.Float, default=1.0)
    exchange_rate = db.Column(db.Float, default=1.0)
    is_base_currency = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    adjustment_factor = db.Column(db.Float, default=1.0)
    custom_percentage_change = db.Column(db.Float, default=0.0)
    custom_value_factor = db.Column(db.Float, default=1.0)
    regional_tax_percent = db.Column(db.Float, default=0.0)
    # Dynamic pricing fields
    manual_override = db.Column(db.Boolean, default=False)
    manual_rate = db.Column(db.Float)
    is_auto_update = db.Column(db.Boolean, default=True)
    rate_source = db.Column(db.String(50), default='api')
    last_api_update = db.Column(db.DateTime)
    api_fetch_interval = db.Column(db.Integer, default=3600)

# Country Model (Main countries table)
class Country(db.Model):
    __tablename__ = 'countries'
    id = db.Column(db.Integer, primary_key=True)
    country_code = db.Column(db.String(3), unique=True, nullable=False)
    country_name = db.Column(db.String(100), nullable=False)
    currency_code = db.Column(db.String(3), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Tax configuration fields
    default_tax_rate = db.Column(db.Float, default=0.0)
    shipping_tax_rate = db.Column(db.Float, default=0.0)
    tax_display_name = db.Column(db.String(100))
    tax_number_required = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Tax Country Model (Legacy - for tax-specific settings)
class TaxCountry(db.Model):
    __tablename__ = 'tax_countries'
    id = db.Column(db.Integer, primary_key=True)
    country_code = db.Column(db.String(3), unique=True, nullable=False)
    country_name = db.Column(db.String(100), nullable=False)
    currency_code = db.Column(db.String(3), nullable=False)
    default_tax_rate = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Order Model
class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    user = db.relationship('User', backref='orders')
    # site_id removed - multi-tenancy removed
    status = db.Column(db.String(20), default='pending')
    subtotal = db.Column(db.Float, nullable=False)
    discount_amount = db.Column(db.Float, default=0.0)
    coupon_discount = db.Column(db.Float, default=0.0)
    group_discount = db.Column(db.Float, default=0.0)
    wallet_used = db.Column(db.Float, default=0.0)
    reward_points_used = db.Column(db.Integer, default=0)
    shipping_cost = db.Column(db.Float, default=0.0)
    tax_amount = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='INR')
    country_code = db.Column(db.String(3))
    coupon_code = db.Column(db.String(50))
    payment_method = db.Column(db.String(50))
    payment_status = db.Column(db.String(20), default='pending')
    shipping_address = db.Column(db.Text)
    billing_address = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Order Item Model
class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'))
    order = db.relationship('Order', backref='items')
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    product = db.relationship('Product')
    product_name = db.Column(db.String(200))
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    discount_amount = db.Column(db.Float, default=0.0)
    group_discount = db.Column(db.Float, default=0.0)
    total_price = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='INR')
    reward_points_earned = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Coupon Model
class Coupon(db.Model):
    __tablename__ = 'coupons'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200))
    discount_type = db.Column(db.String(20), nullable=False)  # percentage, fixed_amount, free_shipping
    discount_value = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='INR')
    min_purchase_amount = db.Column(db.Float, default=0.0)
    max_discount_amount = db.Column(db.Float)
    usage_limit = db.Column(db.Integer)
    usage_per_user = db.Column(db.Integer)
    usage_count = db.Column(db.Integer, default=0)
    valid_from = db.Column(db.Date)
    valid_until = db.Column(db.Date)
    applicable_countries = db.Column(db.Text)  # JSON string or comma-separated
    applicable_categories = db.Column(db.Text)  # JSON string or comma-separated
    applicable_products = db.Column(db.Text)  # JSON string or comma-separated
    is_active = db.Column(db.Boolean, default=True)
    
    # REWARD POINTS INTEGRATION
    can_combine_with_reward_points = db.Column(db.Boolean, default=True)  # Can use with reward points
    reward_points_multiplier = db.Column(db.Float, default=1.0)  # Multiply reward points earned (e.g., 2.0 = double points)
    
    created_by = db.Column(db.Integer, db.ForeignKey('admin_users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('AdminUser', backref='created_coupons', foreign_keys=[created_by])

# Coupon Usage Model
class CouponUsage(db.Model):
    __tablename__ = 'coupon_usage'
    id = db.Column(db.Integer, primary_key=True)
    coupon_id = db.Column(db.Integer, db.ForeignKey('coupons.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'))
    discount_amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='INR')
    used_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    coupon = db.relationship('Coupon', backref='usage_records')
    user = db.relationship('User', backref='coupon_usages')
    order = db.relationship('Order', backref='coupon_usage')

# Group Order Discount Model
class GroupOrderDiscount(db.Model):
    __tablename__ = 'group_order_discounts'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    min_quantity = db.Column(db.Integer, nullable=False)
    max_quantity = db.Column(db.Integer)
    discount_type = db.Column(db.String(20), nullable=False)  # percentage, fixed_amount
    discount_value = db.Column(db.Float, nullable=False)
    applicable_products = db.Column(db.Text)  # JSON string
    applicable_categories = db.Column(db.Text)  # JSON string
    priority = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    valid_from = db.Column(db.Date)
    valid_until = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Product Price Model (Regional Pricing)
class ProductPrice(db.Model):
    __tablename__ = 'product_prices'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    country_code = db.Column(db.String(3), nullable=False)
    currency_code = db.Column(db.String(3), nullable=False)
    price = db.Column(db.Float, nullable=False)
    pricing_type = db.Column(db.String(1), default=PRICING_TYPE_AUTO)  # 'S' for standard, 'M' for manual
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='product_prices')

# Regional Price Model (Used by price recalculation service)
class RegionalPrice(db.Model):
    __tablename__ = 'regional_prices'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    country_code = db.Column(db.String(3), nullable=False)
    currency_code = db.Column(db.String(3), nullable=False)
    regular_price = db.Column(db.Numeric(12, 2), nullable=False)
    sale_price = db.Column(db.Numeric(12, 2))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='regional_price_records')

# Reward Transaction Model
class RewardTransaction(db.Model):
    __tablename__ = 'reward_transactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # earned, redeemed, expired
    points = db.Column(db.Integer, nullable=False)
    balance_after = db.Column(db.Integer, nullable=False)
    reference_type = db.Column(db.String(20))  # order, product_review, referral
    reference_id = db.Column(db.Integer)
    description = db.Column(db.Text)
    expiry_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='reward_transactions')

# Wallet Transaction Model
class WalletTransaction(db.Model):
    __tablename__ = 'wallet_transactions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # credit, debit, refund
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='INR')
    balance_after = db.Column(db.Float, nullable=False)
    reference_type = db.Column(db.String(20))  # order, refund, admin_credit
    reference_id = db.Column(db.Integer)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='completed')  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='wallet_transactions')

# Wishlist Model
class Wishlist(db.Model):
    __tablename__ = 'wishlist'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='wishlist_items')
    product = db.relationship('Product', backref='wishlist_entries')
    
    # Unique constraint: one user can only have one entry per product
    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='unique_user_product_wishlist'),)

# Cart Model
class Cart(db.Model):
    __tablename__ = 'cart'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='cart_items')
    product = db.relationship('Product', backref='cart_entries')
    
    # Unique constraint: one user can only have one entry per product
    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='unique_user_product_cart'),)

# Message Model
class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    subject = db.Column(db.String(200))
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='unread')  # unread, read, replied
    is_starred = db.Column(db.Boolean, default=False)
    replied_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Review Model
class Review(db.Model):
    __tablename__ = 'reviews'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Allow guest reviews
    name = db.Column(db.String(100), nullable=False)  # User name for display
    email = db.Column(db.String(120), nullable=False)  # Email for verification
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    review_text = db.Column(db.Text, nullable=True)  # Review content
    image_url = db.Column(db.String(500), nullable=True)  # Optional review image
    video_url = db.Column(db.String(500), nullable=True)  # Optional review video
    is_verified = db.Column(db.Boolean, default=False)  # Verified purchase
    is_approved = db.Column(db.Boolean, default=True)  # Admin approval
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = db.relationship('Product', backref=db.backref('reviews', cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('user_reviews', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'rating': self.rating,
            'review_text': self.review_text,
            'image_url': self.image_url,
            'video_url': self.video_url,
            'is_verified': self.is_verified,
            'is_approved': self.is_approved,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Tax Rate Template Model (Predefined tax rates per country)
class TaxRateTemplate(db.Model):
    __tablename__ = 'tax_rate_templates'
    id = db.Column(db.Integer, primary_key=True)
    country_code = db.Column(db.String(3), nullable=False)
    country_name = db.Column(db.String(100), nullable=False)
    tax_type = db.Column(db.String(50), nullable=False)
    tax_rate = db.Column(db.Float, nullable=False)
    display_name = db.Column(db.String(100), nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    effective_from = db.Column(db.Date)
    effective_until = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Product Regional Override Model (Product-specific regional pricing)
class ProductRegionalOverride(db.Model):
    __tablename__ = 'product_regional_overrides'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE'), nullable=False)
    country_code = db.Column(db.String(3), nullable=False)
    currency_code = db.Column(db.String(3), nullable=False)
    override_type = db.Column(db.String(1), default=PRICING_TYPE_AUTO)  # aligns with product_prices.pricing_type
    base_price_override = db.Column(db.Float)
    sale_price_override = db.Column(db.Float)
    adjustment_percentage = db.Column(db.Float, default=0.0)
    tax_rate_override = db.Column(db.Float)
    use_country_default_tax = db.Column(db.Boolean, default=True)
    price_locked = db.Column(db.Boolean, default=False)
    lock_reason = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    priority = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(100))
    product = db.relationship('Product', backref=db.backref('regional_overrides', cascade='all, delete-orphan'))

# Currency Rate History Model (Audit trail for rate changes)
class CurrencyRateHistory(db.Model):
    __tablename__ = 'currency_rate_history'
    id = db.Column(db.Integer, primary_key=True)
    currency_code = db.Column(db.String(3), nullable=False)
    old_rate = db.Column(db.Float, nullable=False)
    new_rate = db.Column(db.Float, nullable=False)
    rate_change_percent = db.Column(db.Float)
    change_source = db.Column(db.String(50), nullable=False)  # api, manual, system
    changed_by = db.Column(db.String(100))
    change_reason = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class CurrencyRateFetchLog(db.Model):
    __tablename__ = 'currency_rate_fetch_log'
    id = db.Column(db.Integer, primary_key=True)
    fetched_at = db.Column(db.DateTime, default=datetime.utcnow)
    provider = db.Column(db.String(100))
    base_currency = db.Column(db.String(3))
    updated_count = db.Column(db.Integer, default=0)
    unchanged_count = db.Column(db.Integer, default=0)
    fetched_by = db.Column(db.String(100))
    status = db.Column(db.String(20), default='success')
    message = db.Column(db.String(255))
    raw_payload = db.Column(db.Text)

# Pricing Audit Log Model (Complete audit trail for pricing changes)
class PricingAuditLog(db.Model):
    __tablename__ = 'pricing_audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    action_type = db.Column(db.String(50), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer)
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    performed_by = db.Column(db.String(100))
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    notes = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# ==================== MULTI-TENANT SITE DETECTION ====================
# REMOVED - Multi-tenancy removed

# def get_current_site():
#     ... (removed)

# @app.before_request
# def inject_site_context():
#     ... (removed)

# ==================== HELPER FUNCTIONS ====================

def has_user_purchased(user_id):
    """
    Check if a user has made any purchase (has any paid orders).
    Returns True if user has purchased, False otherwise.
    """
    if not user_id:
        return False
    
    try:
        # Check if user has any paid orders
        paid_orders_count = Order.query.filter(
            Order.user_id == user_id,
            func.lower(Order.payment_status) == 'paid'
        ).count()
        
        return paid_orders_count > 0
    except Exception as e:
        print(f"[WARNING] Error checking purchase status for user {user_id}: {str(e)}")
        return False

def track_order_analytics(order):
    """
    Track analytics for a paid order:
    1. Creates customer session (converted)
    2. Logs customer type (new vs returning)
    
    This function is called automatically when:
    - Order is created with payment_status='paid'
    - Order payment_status changes to 'paid'
    - Order status changes from 'pending' to confirmed/paid
    
    This ensures Conversion Rate and Customer Distribution charts work correctly.
    """
    try:
        # Only track if order is paid
        if not order or (order.payment_status and order.payment_status.lower() != 'paid'):
            return False
        
        # Check if already tracked (avoid duplicates)
        existing_session = db.session.execute(
            text("SELECT id FROM customer_sessions WHERE order_id = :order_id"),
            {'order_id': order.id}
        ).fetchone()
        
        if existing_session:
            return True  # Already tracked
        
        # 1. Check if customer is new or returning
        previous_orders = Order.query.filter(
            Order.user_id == order.user_id,
            Order.id < order.id,
            func.lower(Order.payment_status) == 'paid'
        ).count()
        
        customer_type = 'new' if previous_orders == 0 else 'returning'
        
        # 2. Log customer type (for Customer Distribution chart)
        log_query = text("""
            INSERT INTO customer_type_log (user_id, order_id, customer_type, previous_orders_count, logged_at)
            VALUES (:user_id, :order_id, :customer_type, :previous_count, NOW())
            ON DUPLICATE KEY UPDATE 
                customer_type = VALUES(customer_type),
                previous_orders_count = VALUES(previous_orders_count)
        """)
        db.session.execute(log_query, {
            'user_id': order.user_id,
            'order_id': order.id,
            'customer_type': customer_type,
            'previous_count': previous_orders
        })
        
        # 3. Create customer session with conversion (for Conversion Rate chart)
        session_query = text("""
            INSERT INTO customer_sessions 
            (session_id, user_id, is_converted, conversion_value, order_id, entry_time, created_at, updated_at)
            VALUES (:session_id, :user_id, 1, :amount, :order_id, :entry_time, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                is_converted = 1,
                conversion_value = VALUES(conversion_value),
                order_id = VALUES(order_id)
        """)
        db.session.execute(session_query, {
            'session_id': f'order_{order.id}',
            'user_id': order.user_id,
            'amount': float(order.total_amount),
            'order_id': order.id,
            'entry_time': order.created_at or datetime.utcnow()
        })
        
        db.session.commit()
        print(f"[ANALYTICS] ✅ Tracked conversion for order {order.id}: {customer_type} customer, amount: {order.total_amount}")
        return True
        
    except Exception as e:
        print(f"[ANALYTICS ERROR] ❌ Failed to track analytics for order {order.id}: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return False

def generate_order_number():
    """Generate unique order number"""
    date_str = datetime.now().strftime('%Y%m%d')
    last_order = Order.query.filter(
        Order.order_number.like(f'RB-{date_str}-%')
    ).order_by(desc(Order.id)).first()
    
    if last_order:
        last_num = int(last_order.order_number.split('-')[-1])
        new_num = last_num + 1
    else:
        new_num = 1
    
    return f'RB-{date_str}-{new_num:04d}'
def parse_date(date_string):
    """Parse date from various formats (handles ISO datetime strings from frontend)"""
    if not date_string:
        return None
    
    # Handle ISO datetime format (2025-11-07T10:24:02.747Z)
    if 'T' in date_string:
        date_string = date_string.split('T')[0]
    
    # Parse the date
    try:
        return datetime.strptime(date_string, '%Y-%m-%d').date()
    except ValueError:
        # Try other common formats
        for fmt in ['%d-%m-%Y', '%m/%d/%Y', '%Y/%m/%d']:
            try:
                return datetime.strptime(date_string, fmt).date()
            except ValueError:
                continue
        raise ValueError(f"Unable to parse date: {date_string}")

def admin_required(fn):
    """Decorator to require admin role"""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper

# ==================== CURRENCY SCHEMA HELPERS ====================

def ensure_currency_schema():
    """
    Ensure new columns/tables required for advanced currency management exist.
    Safe to call multiple times; uses checkfirst guards.
    """
    try:
        CurrencyRateFetchLog.__table__.create(db.engine, checkfirst=True)
    except Exception as e:
        print(f"[Currency Schema] Failed to ensure fetch log table: {e}")

    try:
        inspector = inspect(db.engine)
        columns = {col['name'] for col in inspector.get_columns('currencies')}
    except Exception as e:
        print(f"[Currency Schema] Unable to inspect currencies table: {e}")
        return

    try:
        if 'api_rate' not in columns:
            with db.engine.connect() as conn:
                conn.execute(text(
                    "ALTER TABLE currencies ADD COLUMN api_rate FLOAT DEFAULT 1.0 AFTER currency_symbol"
                ))
                print("[Currency Schema] Added api_rate column to currencies")
    except Exception as e:
        print(f"[Currency Schema] Error adding api_rate column: {e}")

    try:
        if 'effective_rate' in columns:
            # We used exchange_rate as effective rate previously; nothing to do
            pass
    except Exception as e:
        print(f"[Currency Schema] Error verifying effective_rate column: {e}")


def calculate_effective_rate(currency, base_rate=None):
    """
    Calculate the effective exchange rate for a currency given its adjustments.
    """
    rate = base_rate if base_rate is not None else (currency.api_rate or currency.exchange_rate or 0)
    if rate is None:
        return 0.0

    effective = float(rate)
    if currency.custom_percentage_change:
        effective *= (1 + (currency.custom_percentage_change / 100))
    if currency.custom_value_factor and currency.custom_value_factor != 1.0:
        effective *= currency.custom_value_factor
    if currency.adjustment_factor and currency.adjustment_factor != 1.0:
        effective *= currency.adjustment_factor
    return effective


def format_timestamp(timestamp):
    if not timestamp:
        return {
            'utc': None,
            'local': None,
            'display': '—'
        }
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    local = timestamp.astimezone(IST)
    return {
        'utc': timestamp.isoformat(),
        'local': local.isoformat(),
        'display': local.strftime('%Y-%m-%d %H:%M:%S IST')
    }
# ==================== AUTHENTICATION ROUTES ====================
@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login - checks admin_users first, then regular users table"""
    try:
        data = request.get_json()
        username = data.get('username') or data.get('email')  # Support both username and email
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Email/username and password required'}), 400
        
        user = None
        user_role = None
        user_id = None
        
        # Try admin_users table first (has username column) - optimized query
        admin_user = AdminUser.query.filter(
            or_(AdminUser.username == username, AdminUser.email == username)
        ).first()
        
        if admin_user:
            password_valid = check_password_hash(admin_user.password_hash, password)
            
            if password_valid:
                if not admin_user.is_active:
                    return jsonify({'error': 'Account is disabled'}), 403
                
                # Only allow super_admin login (multi-tenancy removed)
                if admin_user.role != 'super_admin':
                    return jsonify({'error': 'Access denied. Only super admin can login.'}), 403
                
                user = admin_user
                user_role = admin_user.role
                user_id = f"admin_{admin_user.id}"
                
                # Update last login asynchronously (don't block response)
                try:
                    admin_user.last_login = datetime.now(timezone.utc)
                    db.session.commit()
                except:
                    db.session.rollback()
        
        # If not admin, check regular users table
        if not user:
            regular_user = User.query.filter_by(email=username.lower().strip()).first()
            
            if regular_user:
                password_valid = check_password_hash(regular_user.password_hash, password)
                
                if password_valid:
                    if not regular_user.is_active:
                        return jsonify({'error': 'Account is disabled'}), 403
                    
                    user = regular_user
                    user_role = 'user'
                    user_id = f"user_{regular_user.id}"
                    
                    # Update last login (users table doesn't have last_login, but we can track it)
                    try:
                        regular_user.updated_at = datetime.now(timezone.utc)
                        db.session.commit()
                    except:
                        db.session.rollback()
                else:
                    # User exists but wrong password - return generic error for security
                    return jsonify({'error': 'Invalid email or password'}), 401
            else:
                # User doesn't exist - tell them to register first
                return jsonify({'error': 'User not found. Please register first.'}), 401
        
        if not user:
            # This should not be reached, but keeping as fallback
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Create access token
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': getattr(user, 'username', user.email),
                'email': user.email,
                'full_name': user.full_name,
                'phone': getattr(user, 'phone', None),
                'role': user_role
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout"""
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        current_user_id = get_jwt_identity()
        
        # Parse user type and ID
        if current_user_id.startswith('admin_'):
            user_id = int(current_user_id.replace('admin_', ''))
            user = db.session.get(AdminUser, user_id)
            user_role = user.role if user else 'admin'
        elif current_user_id.startswith('user_'):
            user_id = int(current_user_id.replace('user_', ''))
            user = db.session.get(User, user_id)
            user_role = 'user'
        else:
            # Legacy format - try as regular user ID
            user = db.session.get(User, current_user_id)
            user_role = 'user' if user else None
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's preferred currency (default to INR, not USD)
        preferred_currency = getattr(user, 'preferred_currency', 'INR')
        if not preferred_currency or preferred_currency == '':
            preferred_currency = 'INR'
        
        print(f"[DEBUG] Returning profile for {user.username}, preferred_currency: {preferred_currency}")
        
        return jsonify({
            'user': {
                'id': user.id,
                'username': getattr(user, 'username', user.email),
                'email': user.email,
                'full_name': user.full_name,
                'role': user_role,
                'phone': getattr(user, 'phone', None),
                'country_code': getattr(user, 'country_code', None),
                'preferred_currency': preferred_currency
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/update-currency', methods=['PUT'])
@jwt_required()
def update_admin_currency():
    """Update admin's preferred viewing currency for entire portal"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        currency_code = data.get('currency_code')
        
        if not currency_code:
            return jsonify({'error': 'Currency code required'}), 400
        
        # Verify currency exists
        currency_check = Currency.query.filter_by(currency_code=currency_code).first()
        if not currency_check:
            return jsonify({'error': 'Invalid currency code'}), 400
        
        # Update admin user
        if current_user_id.startswith('admin_'):
            user_id = int(current_user_id.replace('admin_', ''))
            admin = db.session.get(AdminUser, user_id)
            if admin:
                admin.preferred_currency = currency_code
                db.session.commit()
                
                print(f"[GLOBAL CURRENCY] Admin {admin.username} changed currency to {currency_code}")
                
                return jsonify({
                    'message': 'Currency preference updated successfully',
                    'currency': currency_code,
                    'note': 'Entire portal will now display prices in ' + currency_code
                }), 200
            else:
                return jsonify({'error': 'Admin user not found'}), 404
        else:
            # Regular user
            user_id = int(current_user_id.replace('user_', '')) if current_user_id.startswith('user_') else current_user_id
            user = db.session.get(User, user_id)
            if user:
                user.preferred_currency = currency_code
                db.session.commit()
                return jsonify({
                    'message': 'Currency preference updated',
                    'currency': currency_code
                }), 200
            else:
                return jsonify({'error': 'User not found'}), 404
            
    except Exception as e:
        db.session.rollback()
        print(f"Currency update error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if not check_password_hash(user.password_hash, old_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
# ==================== DASHBOARD ROUTES ====================

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics with configurable date ranges and comparison windows."""
    try:
        # site_id removed - multi-tenancy removed
        date_range = parse_date_range(default_days=30)

        start_dt = date_range['start_datetime']
        end_dt = date_range['end_datetime_exclusive']  # Use exclusive end to avoid time boundary issues
        prev_start_dt = date_range['previous_start_datetime']
        prev_end_dt = date_range['previous_end_datetime_exclusive']
        
        # Use inclusive end date to match MySQL CURDATE() behavior (includes entire end date)
        end_dt_inclusive = date_range['end_datetime']
        end_dt_inclusive_str = end_dt_inclusive.strftime('%Y-%m-%d %H:%M:%S') if end_dt_inclusive else None
        
        # Debug logging
        print(f"[Dashboard Stats] Date range: {date_range['start_date']} to {date_range['end_date']} ({date_range['days']} days)")
        print(f"[Dashboard Stats] DateTime range: {start_dt} to {end_dt}")
        print(f"[Dashboard Stats] Using inclusive end date: {end_dt_inclusive_str}")

        paid_order_filter = [
            func.lower(Order.payment_status) == 'paid'
        ]

        period_paid_filter = paid_order_filter + [
            Order.created_at >= start_dt,
            Order.created_at < end_dt  # Use < instead of <= for exclusive end
        ]

        previous_paid_filter = paid_order_filter + [
            Order.created_at >= prev_start_dt,
            Order.created_at < prev_end_dt  # Use < instead of <= for exclusive end
        ]
        
        # ==================== REVENUE STATISTICS ====================
        # Use raw SQL queries to ensure accurate date comparisons with MySQL TIMESTAMP
        # Convert timezone-aware datetime to naive datetime strings for MySQL
        # MySQL TIMESTAMP columns are stored in UTC, so we use UTC datetime strings
        start_dt_str = start_dt.strftime('%Y-%m-%d %H:%M:%S') if start_dt else None
        end_dt_str = end_dt.strftime('%Y-%m-%d %H:%M:%S') if end_dt else None
        prev_start_dt_str = prev_start_dt.strftime('%Y-%m-%d %H:%M:%S') if prev_start_dt else None
        prev_end_dt_str = prev_end_dt.strftime('%Y-%m-%d %H:%M:%S') if prev_end_dt else None
        
        # Lifetime revenue (all paid orders)
        lifetime_revenue_query = text("""
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM orders 
            WHERE LOWER(payment_status) = 'paid'
        """)
        lifetime_revenue = float(db.session.execute(lifetime_revenue_query).scalar() or 0)
        
        # Period revenue (last 30 days or specified range)
        # Match MySQL query: use <= for end date to include entire end date
        period_revenue_query = text("""
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM orders 
            WHERE LOWER(payment_status) = 'paid'
            AND created_at >= :start_dt 
            AND created_at <= :end_dt
        """)
        period_revenue = float(db.session.execute(period_revenue_query, {
            'start_dt': start_dt_str,
            'end_dt': end_dt_inclusive_str
        }).scalar() or 0)
        
        # Previous period revenue (for comparison)
        previous_revenue_query = text("""
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM orders 
            WHERE LOWER(payment_status) = 'paid'
            AND created_at >= :start_dt 
            AND created_at < :end_dt
        """)
        previous_revenue = float(db.session.execute(previous_revenue_query, {
            'start_dt': prev_start_dt_str,
            'end_dt': prev_end_dt_str
        }).scalar() or 0)
        
        revenue_growth = 0
        if previous_revenue > 0:
            revenue_growth = ((period_revenue - previous_revenue) / previous_revenue) * 100
        elif period_revenue > 0:
            revenue_growth = 100
        
        # ==================== ORDERS STATISTICS ====================
        
        # Lifetime orders (all paid orders)
        lifetime_orders_query = text("""
            SELECT COUNT(*) 
            FROM orders 
            WHERE LOWER(payment_status) = 'paid'
        """)
        lifetime_orders = db.session.execute(lifetime_orders_query).scalar() or 0
        
        # Period orders (last 30 days or specified range)
        # Match MySQL query: created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        # Use <= for end date to include the entire end date (up to 23:59:59)
        period_orders_query = text("""
            SELECT COUNT(*) 
            FROM orders 
            WHERE LOWER(payment_status) = 'paid'
            AND created_at >= :start_dt 
            AND created_at <= :end_dt
        """)
        period_orders = db.session.execute(period_orders_query, {
            'start_dt': start_dt_str,
            'end_dt': end_dt_inclusive_str
        }).scalar() or 0
        
        # Previous period orders (for comparison)
        previous_orders_query = text("""
            SELECT COUNT(*) 
            FROM orders 
            WHERE LOWER(payment_status) = 'paid'
            AND created_at >= :start_dt 
            AND created_at < :end_dt
        """)
        previous_orders = db.session.execute(previous_orders_query, {
            'start_dt': prev_start_dt_str,
            'end_dt': prev_end_dt_str
        }).scalar() or 0
        
        # Debug logging
        print(f"[Dashboard Stats] Orders - Lifetime: {lifetime_orders}, Period: {period_orders}, Previous: {previous_orders}")
        print(f"[Dashboard Stats] Date strings - Start: {start_dt_str}, End: {end_dt_str}")
        
        orders_growth = 0
        if previous_orders > 0:
            orders_growth = ((period_orders - previous_orders) / previous_orders) * 100
        elif period_orders > 0:
            orders_growth = 100
        
        # ==================== CONVERSION RATE (from customer_sessions) ====================
        session_query = text("""
            SELECT 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN is_converted = 1 THEN 1 ELSE 0 END) as conversions
            FROM customer_sessions 
            WHERE entry_time >= :start_dt AND entry_time < :end_dt
        """)
        session_result = db.session.execute(session_query, {
            'start_dt': start_dt_str,
            'end_dt': end_dt_str
        }).fetchone()
        total_sessions = session_result[0] if session_result else 0
        conversions = session_result[1] if session_result else 0
        conversion_rate = (conversions / total_sessions * 100) if total_sessions > 0 else 0
        
        prev_session_query = text("""
            SELECT 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN is_converted = 1 THEN 1 ELSE 0 END) as conversions
            FROM customer_sessions 
            WHERE entry_time >= :start_dt AND entry_time < :end_dt
        """)
        prev_result = db.session.execute(prev_session_query, {
            'start_dt': prev_start_dt_str,
            'end_dt': prev_end_dt_str
        }).fetchone()
        prev_sessions = prev_result[0] if prev_result else 0
        prev_conversions = prev_result[1] if prev_result else 0
        prev_conversion_rate = (prev_conversions / prev_sessions * 100) if prev_sessions > 0 else 0
        
        conversion_growth = 0
        if prev_conversion_rate > 0:
            conversion_growth = ((conversion_rate - prev_conversion_rate) / prev_conversion_rate) * 100
        elif conversion_rate > 0:
            conversion_growth = 100
        
        # ==================== USERS STATISTICS ====================
        lifetime_users = db.session.query(func.count(func.distinct(Order.user_id))).filter(
            *paid_order_filter
        ).scalar() or 0
        period_users = db.session.query(func.count(func.distinct(Order.user_id))).filter(
            *period_paid_filter
        ).scalar() or 0
        previous_users = db.session.query(func.count(func.distinct(Order.user_id))).filter(
            *previous_paid_filter
        ).scalar() or 0

        active_users = period_users
        
        users_growth = 0
        if previous_users > 0:
            users_growth = ((period_users - previous_users) / previous_users) * 100
        elif period_users > 0:
            users_growth = 100
        
        # Products (lifetime)
        total_products = Product.query.count()
        active_products = Product.query.filter_by(is_active=True).count()
        
        response = {
            'meta': {
                'range': {
                    'start_date': date_range['start_date'].isoformat(),
                    'end_date': date_range['end_date'].isoformat(),
                    'days': date_range['days']
                },
                'previous_range': {
                    'start_date': date_range['previous_start_date'].isoformat(),
                    'end_date': date_range['previous_end_date'].isoformat(),
                    'days': date_range['days']
                }
            },
            'revenue': {
                'total': round(period_revenue, 2),
                'current_period': round(period_revenue, 2),
                'previous_period': round(previous_revenue, 2),
                'lifetime_total': round(lifetime_revenue, 2),
                'growth': round(revenue_growth, 2)
            },
            'sales': {
                'total': round(period_revenue, 2),
                'current_period': round(period_revenue, 2),
                'previous_period': round(previous_revenue, 2),
                'last_month': round(previous_revenue, 2),  # backwards compatibility
                'change_percentage': round(revenue_growth, 2),
                'lifetime_total': round(lifetime_revenue, 2)
            },
            'orders': {
                'total': period_orders,  # Orders in selected date range
                'current_period': period_orders,
                'previous_period': previous_orders,
                'last_month': previous_orders,  # backwards compatibility
                'change_percentage': round(orders_growth, 2),
                'lifetime_total': lifetime_orders
            },
            'products': {
                'total': total_products,
                'active': active_products,
                'featured': 0
            },
            'conversion': {
                'rate': round(conversion_rate, 2),
                'conversions': conversions,
                'sessions': total_sessions,
                'growth': round(conversion_growth, 2)
            },
            'users': {
                'total': period_users,
                'current_period': period_users,
                'previous_period': previous_users,
                'last_month': previous_users,
                'lifetime_total': lifetime_users,
                'active': active_users,
                'growth': round(users_growth, 2)
            }
        }

        return jsonify(response), 200
        
    except Exception as e:
        print(f"Dashboard stats error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/data', methods=['GET'])
@jwt_required()
def get_analytics_data():
    """Get analytics data for analytics dashboard"""
    try:
        site_id = getattr(g, 'site_id', 1)
        date_range = parse_date_range(default_days=30)

        start_dt = date_range['start_datetime']
        end_dt = date_range['end_datetime_exclusive']  # Use exclusive end for consistency
        prev_start_dt = date_range['previous_start_datetime']
        prev_end_dt = date_range['previous_end_datetime_exclusive']  # Use exclusive end
        
        # Convert timezone-aware datetime to strings for MySQL
        start_dt_str = start_dt.strftime('%Y-%m-%d %H:%M:%S') if start_dt else None
        end_dt_str = end_dt.strftime('%Y-%m-%d %H:%M:%S') if end_dt else None
        prev_start_dt_str = prev_start_dt.strftime('%Y-%m-%d %H:%M:%S') if prev_start_dt else None
        prev_end_dt_str = prev_end_dt.strftime('%Y-%m-%d %H:%M:%S') if prev_end_dt else None

        # Orders - Use raw SQL for accurate date comparison
        period_orders_query = text("""
            SELECT COUNT(*) 
            FROM orders 
            WHERE site_id = :site_id 
            AND created_at >= :start_dt 
            AND created_at < :end_dt
        """)
        period_orders = db.session.execute(period_orders_query, {
            'site_id': site_id,
            'start_dt': start_dt_str,
            'end_dt': end_dt_str
        }).scalar() or 0
        
        previous_orders_query = text("""
            SELECT COUNT(*) 
            FROM orders 
            WHERE site_id = :site_id 
            AND created_at >= :start_dt 
            AND created_at < :end_dt
        """)
        previous_orders = db.session.execute(previous_orders_query, {
            'site_id': site_id,
            'start_dt': prev_start_dt_str,
            'end_dt': prev_end_dt_str
        }).scalar() or 0

        orders_change = 0
        if previous_orders > 0:
            orders_change = ((period_orders - previous_orders) / previous_orders) * 100
        elif period_orders > 0:
            orders_change = 100

        # Sales - Use raw SQL for accurate date comparison
        period_sales_query = text("""
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM orders 
            WHERE site_id = :site_id 
            AND created_at >= :start_dt 
            AND created_at < :end_dt
        """)
        period_sales = float(db.session.execute(period_sales_query, {
            'site_id': site_id,
            'start_dt': start_dt_str,
            'end_dt': end_dt_str
        }).scalar() or 0)
        
        previous_sales_query = text("""
            SELECT COALESCE(SUM(total_amount), 0) 
            FROM orders 
            WHERE site_id = :site_id 
            AND created_at >= :start_dt 
            AND created_at < :end_dt
        """)
        previous_sales = float(db.session.execute(previous_sales_query, {
            'site_id': site_id,
            'start_dt': prev_start_dt_str,
            'end_dt': prev_end_dt_str
        }).scalar() or 0)
        
        sales_change = 0
        if previous_sales > 0:
            sales_change = ((period_sales - previous_sales) / previous_sales) * 100
        elif period_sales > 0:
            sales_change = 100

        # Customers (new users) - Use raw SQL for accurate date comparison
        period_customers_query = text("""
            SELECT COUNT(*) 
            FROM users 
            WHERE site_id = :site_id 
            AND created_at >= :start_dt 
            AND created_at < :end_dt
        """)
        period_customers = db.session.execute(period_customers_query, {
            'site_id': site_id,
            'start_dt': start_dt_str,
            'end_dt': end_dt_str
        }).scalar() or 0
        
        previous_customers_query = text("""
            SELECT COUNT(*) 
            FROM users 
            WHERE site_id = :site_id 
            AND created_at >= :start_dt 
            AND created_at < :end_dt
        """)
        previous_customers = db.session.execute(previous_customers_query, {
            'site_id': site_id,
            'start_dt': prev_start_dt_str,
            'end_dt': prev_end_dt_str
        }).scalar() or 0

        customers_change = 0
        if previous_customers > 0:
            customers_change = ((period_customers - previous_customers) / previous_customers) * 100
        elif period_customers > 0:
            customers_change = 100

        # Conversion rate (reuse customer_sessions data)
        session_query = text("""
            SELECT 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN is_converted = 1 THEN 1 ELSE 0 END) as conversions
            FROM customer_sessions 
            WHERE entry_time >= :start_dt AND entry_time < :end_dt
        """)
        session_result = db.session.execute(session_query, {
            'start_dt': start_dt_str,
            'end_dt': end_dt_str
        }).fetchone()
        total_sessions = session_result[0] if session_result else 0
        conversions = session_result[1] if session_result else 0
        conversion_rate = (conversions / total_sessions * 100) if total_sessions > 0 else 0

        prev_session_result = db.session.execute(session_query, {
            'start_dt': prev_start_dt_str,
            'end_dt': prev_end_dt_str
        }).fetchone()
        prev_sessions = prev_session_result[0] if prev_session_result else 0
        prev_conversions = prev_session_result[1] if prev_session_result else 0
        prev_conversion_rate = (prev_conversions / prev_sessions * 100) if prev_sessions > 0 else 0

        conversion_change = 0
        if prev_conversion_rate > 0:
            conversion_change = ((conversion_rate - prev_conversion_rate) / prev_conversion_rate) * 100
        elif conversion_rate > 0:
            conversion_change = 100
        
        return jsonify({
            'meta': {
                'site_id': site_id,
                'range': {
                    'start_date': date_range['start_date'].isoformat(),
                    'end_date': date_range['end_date'].isoformat(),
                    'days': date_range['days']
                },
                'previous_range': {
                    'start_date': date_range['previous_start_date'].isoformat(),
                    'end_date': date_range['previous_end_date'].isoformat(),
                    'days': date_range['days']
                }
            },
            'revenue': {
                'total': round(period_sales, 2),
                'previous_total': round(previous_sales, 2),
                'change': round(sales_change, 2)
            },
            'orders': {
                'total': period_orders,
                'previous_total': previous_orders,
                'change': round(orders_change, 2)
            },
            'customers': {
                'total': period_customers,
                'previous_total': previous_customers,
                'change': round(customers_change, 2)
            },
            'conversion_rate': {
                'value': round(conversion_rate, 2),
                'previous_value': round(prev_conversion_rate, 2),
                'change': round(conversion_change, 2)
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@app.route('/api/dashboard/sales-chart', methods=['GET'])
@jwt_required()
def get_sales_chart():
    """Get sales chart data with proper sorting and customer count"""
    try:
        # site_id removed - multi-tenancy removed
        date_range = parse_date_range(default_days=request.args.get('days', type=int) or 30)
        
        start_dt = date_range['start_datetime']
        end_dt_inclusive = date_range['end_datetime']  # Use inclusive end to match MySQL CURDATE()
        
        print(f"[Sales Chart] Fetching data between {start_dt} and {end_dt_inclusive}")
        
        # Convert datetime objects to strings for MySQL
        start_dt_str = start_dt.strftime('%Y-%m-%d %H:%M:%S') if start_dt else None
        end_dt_inclusive_str = end_dt_inclusive.strftime('%Y-%m-%d %H:%M:%S') if end_dt_inclusive else None

        query = text('''
            WITH order_totals AS (
            SELECT 
                    DATE(o.created_at) AS day,
                    COALESCE(SUM(o.total_amount), 0) AS sales,
                    COUNT(o.id) AS orders,
                    COUNT(DISTINCT o.user_id) AS customers
            FROM orders o
                WHERE LOWER(o.payment_status) = 'paid'
                  AND o.created_at >= :start_dt
                  AND o.created_at <= :end_dt
            GROUP BY DATE(o.created_at)
            ),
            product_totals AS (
                SELECT 
                    DATE(o.created_at) AS day,
                    COALESCE(SUM(oi.quantity), 0) AS products_sold
                FROM orders o
                JOIN order_items oi ON oi.order_id = o.id
                WHERE LOWER(o.payment_status) = 'paid'
                  AND o.created_at >= :start_dt
                  AND o.created_at <= :end_dt
                GROUP BY DATE(o.created_at)
            )
            SELECT 
                ot.day AS date,
                ot.sales,
                ot.orders,
                ot.customers,
                COALESCE(pt.products_sold, 0) AS products_sold
            FROM order_totals ot
            LEFT JOIN product_totals pt ON pt.day = ot.day
            ORDER BY ot.day ASC
        ''')
        
        result = db.session.execute(query, {
            'start_dt': start_dt_str,
            'end_dt': end_dt_inclusive_str
        })
        sales_data = result.fetchall()
        
        # Format data with proper sorting
        chart_data = []
        for row in sales_data:
            chart_data.append({
                'date': str(row[0]),
                'sales': float(row[1]) if row[1] else 0,
                'orders': int(row[2]) if row[2] else 0,
                'customers': int(row[3]) if row[3] else 0,
                'products_sold': int(row[4]) if row[4] else 0
            })
        
        # Additional sort by date to ensure chronological order
        chart_data.sort(key=lambda x: x['date'])
        
        print(f"[Sales Chart] Returning {len(chart_data)} data points")
        
        return jsonify({
            'chart_data': chart_data,
            'period': f"{date_range['days']} days",
            'meta': {
                'range': {
                    'start_date': date_range['start_date'].isoformat(),
                    'end_date': date_range['end_date'].isoformat(),
                    'days': date_range['days']
                }
            }
        }), 200
        
    except Exception as e:
        print(f"[Sales Chart] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'chart_data': []}), 500

@app.route('/api/dashboard/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    """Get top selling products with actual revenue data"""
    try:
        limit = request.args.get('limit', 10, type=int)
        date_range = parse_date_range(default_days=request.args.get('days', type=int) or 30)
        # site_id removed - multi-tenancy removed
        
        print(f"[Top Products] Fetching top {limit} products between {date_range['start_datetime']} and {date_range['end_datetime']}")
        
        # Convert datetime to strings for MySQL
        start_dt_str = date_range['start_datetime'].strftime('%Y-%m-%d %H:%M:%S') if date_range['start_datetime'] else None
        end_dt_str = date_range['end_datetime'].strftime('%Y-%m-%d %H:%M:%S') if date_range['end_datetime'] else None
        
        # Query top products by revenue
        top_products_query = text("""
            SELECT 
                p.id,
                p.name,
                COALESCE(p.base_price, 0) as price,
                COALESCE(SUM(oi.quantity), 0) as total_sold,
                COALESCE(SUM(oi.total_price), 0) as total_revenue,
                COUNT(DISTINCT oi.order_id) as orders_count
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE LOWER(o.payment_status) = 'paid'
              AND o.created_at >= :start_dt
              AND o.created_at <= :end_dt
            GROUP BY p.id, p.name, p.base_price
            HAVING total_revenue > 0
            ORDER BY total_revenue DESC
            LIMIT :limit
        """)
        
        results = db.session.execute(top_products_query, {
            'start_dt': start_dt_str,
            'end_dt': end_dt_str,
            'limit': limit
        }).fetchall()
        
        # Calculate total revenue for percentages
        total_all_revenue = sum(float(row[4]) for row in results) if results else 1
        
        products_data = []
        for row in results:
            revenue = float(row[4]) if row[4] else 0
            products_data.append({
                'id': int(row[0]),
                'name': str(row[1]),
                'price': float(row[2]) if row[2] else 0,
                'total_sold': int(row[3]) if row[3] else 0,
                'revenue': revenue,
                'orders': int(row[5]) if row[5] else 0,
                'percentage': (revenue / total_all_revenue * 100) if total_all_revenue > 0 else 0
            })
        
        print(f"[Top Products] Returning {len(products_data)} products")
        return jsonify({
            'products': products_data,
            'meta': {
                'range': {
                    'start_date': date_range['start_date'].isoformat(),
                    'end_date': date_range['end_date'].isoformat(),
                    'days': date_range['days']
                }
            }
        }), 200
        
    except Exception as e:
        print(f"[Top Products] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'products': []}), 200  # Return empty array instead of error
@app.route('/api/dashboard/sales-by-category', methods=['GET'])
@jwt_required()
def get_sales_by_category():
    """Get sales breakdown by category for pie chart"""
    try:
        date_range = parse_date_range(default_days=request.args.get('days', type=int) or 30)
        site_id = getattr(g, 'site_id', 1)
        
        print(f"[Sales by Category] Fetching data for site {site_id} between {date_range['start_datetime']} and {date_range['end_datetime']}")
        
        # Query sales by category with payment status filter
        category_query = text("""
            SELECT 
                c.id,
                c.name,
                COALESCE(SUM(oi.total_price), 0) as total_revenue,
                COALESCE(SUM(oi.quantity), 0) as total_items,
                COUNT(DISTINCT oi.order_id) as orders_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.site_id = :site_id
              AND LOWER(o.payment_status) = 'paid'
              AND o.created_at >= :start_dt
              AND o.created_at <= :end_dt
              AND c.id IS NOT NULL
            GROUP BY c.id, c.name
            HAVING total_revenue > 0
            ORDER BY total_revenue DESC
        """)
        
        results = db.session.execute(category_query, {
            'site_id': site_id,
            'start_dt': date_range['start_datetime'],
            'end_dt': date_range['end_datetime']
        }).fetchall()
        
        # Format for pie chart with colors
        colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
        
        # Calculate total for percentages
        total_revenue = sum(float(row[2]) for row in results) if results else 1
        
        categories = []
        for idx, row in enumerate(results):
            revenue = float(row[2]) if row[2] else 0
            categories.append({
                'id': int(row[0]),
                'name': str(row[1]),
                'value': revenue,
                'revenue': revenue,
                'items_sold': int(row[3]) if row[3] else 0,
                'orders': int(row[4]) if row[4] else 0,
                'percentage': (revenue / total_revenue * 100) if total_revenue > 0 else 0,
                'color': colors[idx % len(colors)]
            })
        
        print(f"[Sales by Category] Returning {len(categories)} categories")
        return jsonify({
            'categories': categories,
            'meta': {
                'site_id': site_id,
                'range': {
                    'start_date': date_range['start_date'].isoformat(),
                    'end_date': date_range['end_date'].isoformat(),
                    'days': date_range['days']
                }
            }
        }), 200
        
    except Exception as e:
        print(f"[Sales by Category] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'categories': []}), 200  # Return empty array instead of error
@app.route('/api/dashboard/customer-distribution', methods=['GET'])
@jwt_required()
def get_customer_distribution():
    """Get new vs returning customer distribution"""
    try:
        date_range = parse_date_range(default_days=request.args.get('days', type=int) or 30)
        site_id = getattr(g, 'site_id', 1)
        
        dist_query = text("""
            SELECT 
                ctl.customer_type,
                COUNT(*) as count
            FROM customer_type_log ctl
            JOIN orders o ON ctl.order_id = o.id
            WHERE o.site_id = :site_id
              AND ctl.logged_at >= :start_dt
              AND ctl.logged_at <= :end_dt
            GROUP BY ctl.customer_type
        """)
        
        results = db.session.execute(dist_query, {
            'site_id': site_id,
            'start_dt': date_range['start_datetime'],
            'end_dt': date_range['end_datetime']
        }).fetchall()
        
        # Format for bar chart
        distribution = []
        for row in results:
            customer_type = row[0]
            count = row[1]
            
            if customer_type == 'new':
                distribution.append({
                    'name': 'New Customers',
                    'value': count,
                    'color': '#3b82f6'
                })
            elif customer_type == 'returning':
                distribution.append({
                    'name': 'Returning Customers',
                    'value': count,
                    'color': '#10b981'
                })
        
        # If no data, return structure with zeros
        if not distribution:
            distribution = [
                {'name': 'New Customers', 'value': 0, 'color': '#3b82f6'},
                {'name': 'Returning Customers', 'value': 0, 'color': '#10b981'}
            ]
        
        return jsonify({
            'distribution': distribution,
            'meta': {
                'site_id': site_id,
                'range': {
                    'start_date': date_range['start_date'].isoformat(),
                    'end_date': date_range['end_date'].isoformat(),
                    'days': date_range['days']
                }
            }
        }), 200
        
    except Exception as e:
        print(f"Customer distribution error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/track-session', methods=['POST', 'OPTIONS'])
def track_visitor_session():
    """
    Track visitor session in real-time (NO AUTH REQUIRED - public endpoint)
    Works for both logged-in users and anonymous guests
    """
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        data = request.get_json()
        
        session_id = data.get('session_id')
        user_id = data.get('user_id')
        page_url = data.get('page_url', '/')
        referrer = data.get('referrer', '')
        user_agent = request.headers.get('User-Agent', '')
        ip_address = request.remote_addr
        
        # Device info from frontend
        device_type = data.get('device_type', 'Unknown')
        browser = data.get('browser', 'Unknown')
        os = data.get('os', 'Unknown')
        screen_resolution = data.get('screen_resolution')
        language = data.get('language')
        timezone = data.get('timezone')
        
        if not session_id:
            generated_suffix = os.urandom(4).hex()
            session_id = f"session_{int(datetime.utcnow().timestamp()*1000)}_{generated_suffix}"

        # Determine which table to use based on purchase status
        has_purchased = has_user_purchased(user_id) if user_id else False
        table_name = 'customer_sessions' if has_purchased else 'user_sessions'
        
        # Define update_query for the appropriate table
        update_query = text(f"""
            UPDATE {table_name} 
            SET pages_viewed = pages_viewed + 1,
                current_page = :page_url,
                last_activity = NOW(),
                user_id = COALESCE(:user_id, user_id),
                device_type = COALESCE(:device_type, device_type),
                browser = COALESCE(:browser, browser),
                os = COALESCE(:os, os),
                screen_resolution = COALESCE(:screen_resolution, screen_resolution),
                language = COALESCE(:language, language),
                timezone = COALESCE(:timezone, timezone)
            WHERE session_id = :session_id
        """)
        
        update_params = {
                'session_id': session_id,
                'page_url': page_url,
                'user_id': user_id,
                'device_type': device_type,
                'browser': browser,
                'os': os,
                'screen_resolution': screen_resolution,
                'language': language,
                'timezone': timezone
        }

        # Get or create session in the appropriate table
        session_query = text(f"SELECT id FROM {table_name} WHERE session_id = :session_id")
        existing_session = db.session.execute(session_query, {'session_id': session_id}).fetchone()
        
        if existing_session:
            # Update existing session
            db.session.execute(update_query, update_params)
        else:
            # Create new session in the appropriate table
            insert_query = text(f"""
                INSERT INTO {table_name} 
                (session_id, user_id, ip_address, user_agent, referrer_url, landing_page, 
                 current_page, device_type, browser, os, screen_resolution, language, timezone,
                 entry_time, last_activity, created_at, updated_at)
                VALUES (:session_id, :user_id, :ip, :ua, :referrer, :landing, :current,
                        :device_type, :browser, :os, :screen_resolution, :language, :timezone,
                        NOW(), NOW(), NOW(), NOW())
            """)
            insert_params = {
                'session_id': session_id,
                'user_id': user_id,
                'ip': ip_address,
                'ua': user_agent,
                'referrer': referrer,
                'landing': page_url,
                'current': page_url,
                'device_type': device_type,
                'browser': browser,
                'os': os,
                'screen_resolution': screen_resolution,
                'language': language,
                'timezone': timezone
            }
            try:
                db.session.execute(insert_query, insert_params)
            except IntegrityError:
                db.session.rollback()
                db.session.execute(update_query, update_params)
        
        db.session.commit()
        return jsonify({'status': 'tracked', 'session_id': session_id}), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Session tracking error: {str(e)}")
        print(f"[ERROR] Full traceback:\n{error_trace}")
        db.session.rollback()
        return jsonify({'error': str(e), 'details': str(e)}), 500

@app.route('/api/analytics/track-page-view', methods=['POST', 'OPTIONS'])
def track_page_view():
    """
    Track individual page view (NO AUTH REQUIRED - public endpoint)
    """
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        data = request.get_json()
        
        session_id = data.get('session_id')
        page_url = data.get('page_url')
        page_title = data.get('page_title', '')
        time_on_page = data.get('time_on_page', 0)
        
        # Insert page view
        insert_query = text("""
            INSERT INTO page_views (session_id, page_url, page_title, time_on_page, viewed_at)
            VALUES (:session_id, :page_url, :page_title, :time_on_page, NOW())
        """)
        db.session.execute(insert_query, {
            'session_id': session_id,
            'page_url': page_url,
            'page_title': page_title,
            'time_on_page': time_on_page
        })
        
        # Update session time spent in the appropriate table
        # First, check which table has this session
        user_id = data.get('user_id')
        has_purchased = has_user_purchased(user_id) if user_id else False
        table_name = 'customer_sessions' if has_purchased else 'user_sessions'
        
        # Check if session exists in customer_sessions
        check_customer = db.session.execute(
            text("SELECT id FROM customer_sessions WHERE session_id = :session_id"),
            {'session_id': session_id}
        ).fetchone()
        
        # Check if session exists in user_sessions
        check_user = db.session.execute(
            text("SELECT id FROM user_sessions WHERE session_id = :session_id"),
            {'session_id': session_id}
        ).fetchone()
        
        # Use the table where session exists, or the appropriate table based on purchase status
        if check_customer:
            table_name = 'customer_sessions'
        elif check_user:
            table_name = 'user_sessions'
        # else use table_name based on purchase status (already set above)
        
        update_query = text(f"""
            UPDATE {table_name} 
            SET time_spent_seconds = time_spent_seconds + :time_on_page,
                last_activity = NOW()
            WHERE session_id = :session_id
        """)
        db.session.execute(update_query, {
            'session_id': session_id,
            'time_on_page': time_on_page
        })
        
        db.session.commit()
        return jsonify({'status': 'tracked'}), 200
        
    except Exception as e:
        print(f"Page view tracking error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/track-click', methods=['POST', 'OPTIONS'])
def track_click():
    """
    Track individual click events (NO AUTH REQUIRED - public endpoint)
    """
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        data = request.get_json()
        
        # Convert complex objects to strings
        element_class = data.get('element_class')
        if isinstance(element_class, (dict, list)):
            import json
            element_class = json.dumps(element_class)
        elif element_class:
            element_class = str(element_class)
        
        element_id = data.get('element_id')
        if isinstance(element_id, (dict, list)):
            import json
            element_id = json.dumps(element_id)
        elif element_id:
            element_id = str(element_id)
        
        insert_query = text("""
            INSERT INTO click_events 
            (session_id, user_id, page_url, element_type, element_id, element_class, 
             element_text, click_x, click_y, timestamp)
            VALUES (:session_id, :user_id, :page_url, :element_type, :element_id, 
                    :element_class, :element_text, :click_x, :click_y, NOW())
        """)
        
        db.session.execute(insert_query, {
            'session_id': data.get('session_id'),
            'user_id': data.get('user_id'),
            'page_url': data.get('page_url'),
            'element_type': data.get('element_type'),
            'element_id': element_id,
            'element_class': element_class,
            'element_text': data.get('element_text'),
            'click_x': data.get('click_x'),
            'click_y': data.get('click_y')
        })
        
        # Also update click count in the appropriate session table
        user_id = data.get('user_id')
        session_id = data.get('session_id')
        has_purchased = has_user_purchased(user_id) if user_id else False
        
        # Check which table has this session
        check_customer = db.session.execute(
            text("SELECT id FROM customer_sessions WHERE session_id = :session_id"),
            {'session_id': session_id}
        ).fetchone()
        
        check_user = db.session.execute(
            text("SELECT id FROM user_sessions WHERE session_id = :session_id"),
            {'session_id': session_id}
        ).fetchone()
        
        # Use the table where session exists, or the appropriate table based on purchase status
        if check_customer:
            table_name = 'customer_sessions'
        elif check_user:
            table_name = 'user_sessions'
        else:
            table_name = 'customer_sessions' if has_purchased else 'user_sessions'
        
        update_query = text(f"""
            UPDATE {table_name} 
            SET clicks = clicks + 1,
                last_activity = NOW()
            WHERE session_id = :session_id
        """)
        db.session.execute(update_query, {'session_id': data.get('session_id')})
        
        db.session.commit()
        return jsonify({'status': 'tracked'}), 200
        
    except Exception as e:
        print(f"Click tracking error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/track-action', methods=['POST', 'OPTIONS'])
def track_action():
    """
    Track specific user actions like login, search, filter (NO AUTH REQUIRED - public endpoint)
    Routes to user_sessions or customer_sessions based on purchase status.
    """
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        session_id = data.get('session_id')
        action_type = data.get('action_type')
        action_details = data.get('action_details')
        page_url = data.get('page_url')
        
        # Determine which table to use based on purchase status
        has_purchased = has_user_purchased(user_id) if user_id else False
        table_name = 'customer_sessions' if has_purchased else 'user_sessions'
        
        # Insert into user_actions table (common for both)
        insert_action_query = text("""
            INSERT INTO user_actions 
            (session_id, user_id, action_type, action_details, page_url, timestamp)
            VALUES (:session_id, :user_id, :action_type, :action_details, :page_url, NOW())
        """)
        
        db.session.execute(insert_action_query, {
            'session_id': session_id,
            'user_id': user_id,
            'action_type': action_type,
            'action_details': action_details,
            'page_url': page_url
        })
        
        # Also update the session table (user_sessions or customer_sessions)
        # Check if session exists in the appropriate table
        check_session_query = text(f"SELECT id FROM {table_name} WHERE session_id = :session_id")
        existing_session = db.session.execute(check_session_query, {'session_id': session_id}).fetchone()
        
        if existing_session:
            # Update existing session
            update_session_query = text(f"""
                UPDATE {table_name} 
                SET last_activity = NOW(),
                    clicks = clicks + 1,
                    user_id = COALESCE(:user_id, user_id)
                WHERE session_id = :session_id
            """)
            db.session.execute(update_session_query, {
                'session_id': session_id,
                'user_id': user_id
            })
        else:
            # Create new session entry if it doesn't exist
            # Get basic info from request
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent', '')
            
            insert_session_query = text(f"""
                INSERT INTO {table_name} 
                (session_id, user_id, ip_address, user_agent, current_page, 
                 last_activity, entry_time, created_at, updated_at)
                VALUES (:session_id, :user_id, :ip_address, :user_agent, :page_url,
                        NOW(), NOW(), NOW(), NOW())
            """)
            db.session.execute(insert_session_query, {
                'session_id': session_id,
                'user_id': user_id,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'page_url': page_url
            })
        
        db.session.commit()
        print(f"[SUCCESS] Tracked action '{action_type}' for user {user_id} in {table_name} table")
        return jsonify({'status': 'tracked', 'table': table_name}), 200
        
    except Exception as e:
        print(f"[ERROR] Action tracking error: {str(e)}")
        print(f"[ERROR] Data received: user_id={data.get('user_id')}, session_id={data.get('session_id')}, action_type={data.get('action_type')}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics/track-error', methods=['POST', 'OPTIONS'])
def track_error():
    """
    Track JavaScript and other errors (NO AUTH REQUIRED - public endpoint)
    """
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        data = request.get_json()
        
        insert_query = text("""
            INSERT INTO session_errors 
            (session_id, user_id, error_type, error_message, error_stack, page_url, timestamp)
            VALUES (:session_id, :user_id, :error_type, :error_message, :error_stack, :page_url, NOW())
        """)
        
        db.session.execute(insert_query, {
            'session_id': data.get('session_id'),
            'user_id': data.get('user_id'),
            'error_type': data.get('error_type'),
            'error_message': (data.get('error_message') or '')[:1000],
            'error_stack': (data.get('error_stack') or '')[:5000],
            'page_url': data.get('page_url')
        })
        
        db.session.commit()
        return jsonify({'status': 'tracked'}), 200
        
    except Exception as e:
        print(f"Error tracking error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/recent-orders', methods=['GET'])
@jwt_required()
def get_recent_orders():
    """Get recent orders"""
    try:
        limit = request.args.get('limit', 10, type=int)
        # site_id removed - multi-tenancy removed
        
        # Query orders without site_id filter
        orders = Order.query.order_by(desc(Order.created_at)).limit(limit).all()
        
        orders_data = []
        for order in orders:
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'user': {
                    'full_name': order.user.full_name if order.user else 'Guest',
                    'email': order.user.email if order.user else None
                },
                'total_amount': float(order.total_amount) if order.total_amount else 0.0,
                'status': order.status or 'pending',
                'payment_status': order.payment_status or 'pending',
                'created_at': order.created_at.isoformat() if order.created_at else None
            })
        
        print(f"[Recent Orders] Returning {len(orders_data)} orders")
        return jsonify({'orders': orders_data}), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Recent Orders] Error: {str(e)}")
        return jsonify({'error': str(e), 'orders': []}), 500
# ==================== PRODUCT ROUTES ====================
@app.route('/api/products', methods=['GET', 'OPTIONS'])
@app.route('/api/products/', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)  # Allow both authenticated and public access
def get_products():
    """Get all products with filters"""
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        return response, 200
    try:
        # Get query parameters
        currency = request.args.get('currency', 'INR')
        country_code = request.args.get('country_code', 'IND')
        include_tax = request.args.get('include_tax', 'false').lower() == 'true'
        include_archived = request.args.get('include_archived', 'false').lower() == 'true'
        category_id = request.args.get('category_id', type=int)
        health_benefit = request.args.get('health_benefit', type=int)
        search = request.args.get('search', '')
        sort = request.args.get('sort', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query - Filter by active status
        if include_archived:
            query = Product.query.filter(Product.is_active == False)  # Show ONLY archived products
            print(f"  - Showing: ARCHIVED products only (is_active=False)")
        else:
            query = Product.query  # Show ALL products by default
            print(f"  - Showing: ALL products (active + archived)")
        
        # Debug logging
        print(f"[INFO] Products API - Filters applied:")
        print(f"  - Category ID: {category_id}")
        print(f"  - Health Benefit ID: {health_benefit}")
        print(f"  - Search: {search}")
        print(f"  - Sort: {sort} {sort_order}")
        print(f"  - Currency: {currency}, Country: {country_code}")
        print(f"  - Filtering: Active products only (is_active=True)")
        
        # Apply health benefit filter FIRST (if specified)
        if health_benefit:
            try:
                # Use explicit join to avoid ambiguity
                query = query.join(Product.health_benefits).filter(
                    HealthBenefit.id == health_benefit
                ).distinct()
                print(f"[OK] Health benefit filter applied successfully")
            except Exception as hb_error:
                print(f"[ERROR] Error applying health benefit filter: {str(hb_error)}")
                raise
        
        # Apply category filter (if specified)
        if category_id:
            try:
                # Get category and all its subcategories
                category = db.session.get(Category, category_id)
                if category:
                    # Get all subcategory IDs recursively
                    def get_subcategory_ids(cat_id):
                        ids = [cat_id]
                        subcats = Category.query.filter_by(parent_id=cat_id).all()
                        for subcat in subcats:
                            ids.extend(get_subcategory_ids(subcat.id))
                        return ids
                    
                    category_ids = get_subcategory_ids(category_id)
                    query = query.filter(Product.category_id.in_(category_ids))
                    print(f"[OK] Category filter applied for IDs: {category_ids}")
            except Exception as cat_error:
                print(f"[ERROR] Error applying category filter: {str(cat_error)}")
                raise
        
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    Product.name.ilike(search_term),
                    Product.sku.ilike(search_term),
                    Product.description.ilike(search_term)
                )
            )
        
        # Apply sorting
        if sort == 'name':
            query = query.order_by(Product.name.asc() if sort_order == 'asc' else Product.name.desc())
        elif sort == 'price':
            query = query.order_by(Product.base_price.asc() if sort_order == 'asc' else Product.base_price.desc())
        elif sort == 'stock':
            query = query.order_by(Product.stock_quantity.asc() if sort_order == 'asc' else Product.stock_quantity.desc())
        else:  # created_at
            query = query.order_by(Product.created_at.desc() if sort_order == 'desc' else Product.created_at.asc())
        
        products = query.all()
        
        # Get currency for conversion
        currency_obj = Currency.query.filter_by(currency_code=currency).first()
        exchange_rate = currency_obj.exchange_rate if currency_obj else 1.0
        currency_symbol = currency_obj.currency_symbol if currency_obj else '₹'
        
        # Get tax rate for country
        tax_country = TaxCountry.query.filter_by(country_code=country_code).first()
        default_tax_rate = tax_country.default_tax_rate if tax_country else 0.0
        
        # Format products
        products_data = []
        for product in products:
            try:
                # FIRST: Check if we have a RegionalPrice (recalculated price) for this product and country
                # Wrap in try-except in case the table doesn't exist yet
                regional_price = None
                try:
                    regional_price = RegionalPrice.query.filter_by(
                        product_id=product.id,
                        country_code=country_code.upper(),
                        is_active=True
                    ).first()
                except Exception as e:
                    # Table doesn't exist or other database error - fall back to on-the-fly calculation
                    print(f"[WARNING] RegionalPrice table not available: {str(e)}")
                    regional_price = None
                
                # Determine price and tax
                if regional_price:
                    # Use the recalculated price from RegionalPrice table
                    # regular_price in RegionalPrice is the subtotal (price before tax)
                    converted_price = float(regional_price.regular_price)
                    
                    # Get tax rate - use product tax rate (which was just updated)
                    tax_rate = (product.tax_rate if product.tax_rate is not None else 0.0) if product.is_taxable else 0.0
                    
                    # Check for regional tax override
                    regional_override = None
                    try:
                        regional_override = ProductRegionalOverride.query.filter_by(
                            product_id=product.id,
                            country_code=country_code
                        ).first()
                    except Exception as e:
                        # Table doesn't exist - skip override
                        print(f"[WARNING] ProductRegionalOverride table not available: {str(e)}")
                    
                    if regional_override and regional_override.tax_rate_override is not None:
                        tax_rate = regional_override.tax_rate_override
                    elif (tax_rate is None or tax_rate == 0.0) and product.is_taxable:
                        # Fall back to country default tax rate
                        tax_rate = default_tax_rate if default_tax_rate is not None else 0.0
                    
                    # Ensure tax_rate is never None
                    if tax_rate is None:
                        tax_rate = 0.0
                    
                    # Calculate tax on the recalculated subtotal price
                    # The regular_price is already the converted price with currency, now add tax
                    tax_amount = converted_price * (tax_rate / 100) if include_tax and tax_rate > 0 else 0.0
                    price_with_tax = converted_price + tax_amount
                    
                    print(f"[INFO] Using RegionalPrice for Product {product.id} ({product.name}) in {country_code}:")
                    print(f"  - RegionalPrice.regular_price (subtotal): {converted_price:.2f}")
                    print(f"  - Tax Rate: {tax_rate}%")
                    print(f"  - Tax Amount: {tax_amount:.2f}")
                    print(f"  - Final Price with Tax: {price_with_tax:.2f}")
                else:
                    # Fallback: Calculate price on-the-fly (for products not yet recalculated)
                    converted_price = product.base_price * exchange_rate
                    
                    # Calculate tax - Check for regional override FIRST
                    tax_rate = (product.tax_rate if product.tax_rate is not None else 0.0) if product.is_taxable else 0.0
                    
                    # Check if there's a regional tax override for this product and country
                    regional_override = None
                    try:
                        regional_override = ProductRegionalOverride.query.filter_by(
                            product_id=product.id,
                            country_code=country_code
                        ).first()
                    except Exception as e:
                        # Table doesn't exist - skip override
                        print(f"[WARNING] ProductRegionalOverride table not available: {str(e)}")
                    
                    if regional_override and regional_override.tax_rate_override is not None:
                        # Use the regional override tax rate
                        tax_rate = regional_override.tax_rate_override
                    elif (tax_rate is None or tax_rate == 0.0) and product.is_taxable:
                        # Fall back to country default tax rate
                        tax_rate = default_tax_rate if default_tax_rate is not None else 0.0
                    
                    # Ensure tax_rate is never None
                    if tax_rate is None:
                        tax_rate = 0.0
                    
                    tax_amount = converted_price * (tax_rate / 100) if include_tax and tax_rate > 0 else 0.0
                    price_with_tax = converted_price + tax_amount
                
                # Get health benefits
                health_benefits_data = [{
                    'id': hb.id,
                    'name': hb.name
                } for hb in product.health_benefits]
                
                # Get all regional tax rates for this product
                regional_tax_rates = {}
                try:
                    all_regional_overrides = ProductRegionalOverride.query.filter_by(product_id=product.id).all()
                    for override in all_regional_overrides:
                        if override.tax_rate_override is not None:
                            regional_tax_rates[override.country_code] = override.tax_rate_override
                except Exception as e:
                    print(f"[WARNING] Error fetching regional tax rates: {str(e)}")
                    regional_tax_rates = {}
                
                # Log tax calculation for first product (debugging)
                if len(products_data) == 0:
                    print(f"[INFO] Tax Calculation Example (Product {product.id} - {product.name}):")
                    print(f"  - Base Price: {currency} {converted_price:.2f}")
                    print(f"  - Is Taxable: {product.is_taxable}")
                    print(f"  - Product Tax Rate: {product.tax_rate}%")
                    print(f"  - Regional Override: {regional_override.tax_rate_override if regional_override else 'None'}%")
                    print(f"  - Final Tax Rate Used: {tax_rate}%")
                    print(f"  - Tax Amount: {currency} {tax_amount:.2f}")
                    print(f"  - Price with Tax: {currency} {price_with_tax:.2f}")
                
                products_data.append({
                    'id': product.id,
                    'name': product.name,
                    'sku': product.sku,
                    'description': product.description,
                    'category': {
                        'id': product.category.id,
                        'name': product.category.name
                    } if product.category else None,
                    'product_type': product.product_type,
                    'base_price': converted_price,
                    'sale_price': product.sale_price * exchange_rate if product.sale_price else converted_price,
                    'base_currency': currency,
                    'stock_quantity': product.stock_quantity,
                    'color_name': product.color_name,
                    'color_shade': product.color_shade,
                    'is_taxable': product.is_taxable,
                    'tax_rate': tax_rate,
                    'tax_amount': tax_amount,
                    'price_with_tax': price_with_tax,
                    'regional_tax_rates': regional_tax_rates,
                    'is_active': product.is_active,
                    'featured': product.featured,
            'is_grouped_product': product.is_grouped_product,
            'image_url': product.image_url,
            'thumbnail_url': product.thumbnail_url,
            'image1': product.image1,
            'image2': product.image2,
            'image3': product.image3,
            'image4': product.image4,
            'image5': product.image5,
            'health_benefits': health_benefits_data,
                    'created_at': product.created_at.isoformat() if product.created_at else None,
                    'updated_at': product.updated_at.isoformat() if product.updated_at else None
                })
            except Exception as product_error:
                # Skip this product if there's an error processing it
                print(f"[ERROR] Error processing product {product.id if product else 'unknown'}: {str(product_error)}")
                import traceback
                print(traceback.format_exc())
                continue  # Skip this product and continue with the next one
        
        return jsonify({
            'products': products_data,
            'count': len(products_data)
        }), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Products API error: {str(e)}")
        print(f"Full traceback:\n{error_trace}")
        
        # Provide more specific error messages
        error_msg = str(e)
        if 'health_benefit' in error_msg.lower() or 'HealthBenefit' in error_msg:
            error_msg = f"Error filtering by health benefit: {error_msg}"
        elif 'category' in error_msg.lower():
            error_msg = f"Error filtering by category: {error_msg}"
        
        return jsonify({
            'error': error_msg,
            'details': str(e) if str(e) else 'Unknown error occurred',
            'success': False
        }), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """Get single product"""
    try:
        product = db.session.get(Product, product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get health benefits
        health_benefits_data = [{
            'id': hb.id,
            'name': hb.name
        } for hb in product.health_benefits]
        
        # Get FAQs - handle case where table doesn't exist yet
        faqs_data = None
        try:
            product_faq = ProductFAQ.query.filter_by(product_id=product_id).first()
            faqs_data = product_faq.to_dict() if product_faq else None
        except Exception as faq_error:
            # Table doesn't exist yet or other database error - skip FAQs
            print(f"[WARNING] ProductFAQ table not available: {str(faq_error)}")
            faqs_data = None
        
        # Get key ingredients - handle case where table doesn't exist yet
        key_ingredients_data = []
        try:
            product_key_ingredients = ProductKeyIngredient.query.options(joinedload(ProductKeyIngredient.key_ingredient)).filter_by(product_id=product_id).order_by(ProductKeyIngredient.display_order.asc()).all()
            key_ingredients_data = [{
                'id': pki.key_ingredient.id,
                'name': pki.key_ingredient.name,
                'slug': pki.key_ingredient.slug,
                'description': pki.key_ingredient.description,
                'image_url': pki.key_ingredient.image_url,
                'thumbnail_url': pki.key_ingredient.thumbnail_url,
                'display_order': pki.display_order
            } for pki in product_key_ingredients if pki.key_ingredient and pki.key_ingredient.is_active]
        except Exception as ki_error:
            # Table doesn't exist yet or other database error - skip key ingredients
            print(f"[WARNING] KeyIngredients table not available: {str(ki_error)}")
            key_ingredients_data = []
        
        # Get feature cards - handle case where table doesn't exist yet
        feature_cards_data = []
        try:
            feature_cards = ProductFeatureCard.query.filter_by(product_id=product_id, is_active=True).order_by(ProductFeatureCard.display_order.asc()).all()
            feature_cards_data = [card.to_dict() for card in feature_cards]
        except Exception as fc_error:
            # Table doesn't exist yet or other database error - skip feature cards
            print(f"[WARNING] ProductFeatureCards table not available: {str(fc_error)}")
            feature_cards_data = []
        
        product_data = {
            'id': product.id,
            'name': product.name,
            'sku': product.sku,
            'description': product.description,
            'short_description': product.short_description,
            'category': {
                'id': product.category.id,
                'name': product.category.name
            } if product.category else None,
            'product_type': product.product_type,
            'base_price': product.base_price,
            'sale_price': product.sale_price,
            'base_currency': product.base_currency,
            'stock_quantity': product.stock_quantity,
            'min_order_quantity': product.min_order_quantity,
            'max_order_quantity': product.max_order_quantity,
            'color_name': product.color_name,
            'color_shade': product.color_shade,
            'is_taxable': product.is_taxable,
            'tax_rate': product.tax_rate,
            'is_active': product.is_active,
            'featured': product.featured,
            'is_grouped_product': product.is_grouped_product,
            'image_url': product.image_url,
            'thumbnail_url': product.thumbnail_url,
            'image1': product.image1,
            'image2': product.image2,
            'image3': product.image3,
            'image4': product.image4,
            'image5': product.image5,
            'reward_points': product.reward_points,
            'health_benefits': health_benefits_data,
            'faqs': faqs_data,
            'key_ingredients': key_ingredients_data,
            'feature_cards': feature_cards_data,
            'created_at': product.created_at.isoformat() if product.created_at else None,
            'updated_at': product.updated_at.isoformat() if product.updated_at else None
        }
        
        return jsonify({'product': product_data}), 200
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Error in get_product endpoint: {str(e)}")
        print(f"[ERROR] Traceback: {error_trace}")
        return jsonify({'error': str(e), 'details': error_trace}), 500

@app.route('/api/products/<int:product_id>/faqs', methods=['GET'])
@jwt_required(optional=True)
def get_product_faqs(product_id):
    """Get FAQs for a specific product"""
    try:
        try:
            product_faq = ProductFAQ.query.filter_by(product_id=product_id).first()
            
            if not product_faq:
                return jsonify({
                    'success': True,
                    'faqs': None,
                    'message': 'No FAQs found for this product'
                }), 200
            
            return jsonify({
                'success': True,
                'faqs': product_faq.to_dict()
            }), 200
        except Exception as db_error:
            # Table doesn't exist yet
            return jsonify({
                'success': True,
                'faqs': None,
                'message': 'FAQs table not available yet'
            }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/products/<int:product_id>/convert', methods=['GET'])
@jwt_required()
def get_product_converted_price(product_id):
    """Get product with converted prices for a specific currency/country"""
    try:
        product = db.session.get(Product, product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get request parameters
        target_currency = request.args.get('currency', 'INR')
        target_country = request.args.get('country_code', 'IN')
        
        # Get currency rate
        base_currency_code = product.base_currency or 'INR'
        conversion_rate = 1.0
        
        if target_currency != base_currency_code:
            target_currency_obj = db.session.query(Currency).filter_by(currency_code=target_currency).first()
            if target_currency_obj:
                conversion_rate = target_currency_obj.exchange_rate
        
        # Convert prices
        converted_price = float(product.base_price or 0) * conversion_rate
        converted_sale_price = float(product.sale_price or 0) * conversion_rate if product.sale_price else None
        
        # Check for regional price overrides
        regional_override = db.session.query(ProductRegionalOverride).filter_by(
            product_id=product_id,
            country_code=target_country
        ).first()
        
        if regional_override:
            if regional_override.base_price_override is not None:
                converted_price = float(regional_override.base_price_override)
            if regional_override.sale_price_override is not None:
                converted_sale_price = float(regional_override.sale_price_override)
        
        product_data = {
            'id': product.id,
            'name': product.name,
            'base_price': float(product.base_price or 0),
            'sale_price': float(product.sale_price or 0) if product.sale_price else None,
            'base_currency': base_currency_code,
            'converted_price': round(converted_price, 2),
            'converted_sale_price': round(converted_sale_price, 2) if converted_sale_price else None,
            'target_currency': target_currency,
            'target_country': target_country,
            'conversion_rate': conversion_rate,
            'has_regional_override': regional_override is not None
        }
        
        return jsonify({'product': product_data}), 200
        
    except Exception as e:
        print(f"Error converting product price: {e}")
        return jsonify({'error': 'Failed to convert product price'}), 500
@app.route('/api/products/', methods=['POST'])
@jwt_required()
def create_product():
    """Create new product"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Product name is required'}), 400
        
        # Auto-generate slug from name
        import re
        base_slug = re.sub(r'[^a-z0-9]+', '-', data.get('name', '').lower()).strip('-')
        slug = base_slug
        counter = 1
        while Product.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Auto-generate SKU if not provided
        sku = data.get('sku')
        if not sku:
            import uuid
            sku = str(uuid.uuid4())[:8].upper()
        
        # Handle regional tax rates
        regional_tax_rates = data.get('regional_tax_rates', {})
        
        # If regional tax rates are provided, use the first one as the default tax_rate
        default_tax_rate = 0.0
        if regional_tax_rates and isinstance(regional_tax_rates, dict):
            # Get the first non-null tax rate as default
            for country_code, tax_rate in regional_tax_rates.items():
                if tax_rate is not None and tax_rate > 0:
                    default_tax_rate = float(tax_rate)
                    break
        
        # Create product
        # Convert empty strings to None (NULL) for optional fields to match database schema
        description_value = data.get('description')
        description_value = description_value.strip() if description_value and description_value.strip() else None
        
        short_description_value = data.get('short_description')
        short_description_value = short_description_value.strip() if short_description_value and short_description_value.strip() else None
        
        product = Product(
            name=data.get('name'),
            slug=slug,
            sku=sku,
            description=description_value,  # NULL if empty
            short_description=short_description_value,  # NULL if empty
            category_id=data.get('category_id'),
            product_type=data.get('product_type', 'simple'),
            base_price=data.get('base_price'),
            sale_price=data.get('sale_price'),
            base_currency=data.get('base_currency', 'INR'),
            stock_quantity=data.get('stock_quantity', 0),
            min_order_quantity=data.get('min_order_quantity', 1),
            max_order_quantity=data.get('max_order_quantity'),
            color_name=data.get('color_name'),
            color_shade=data.get('color_shade'),
            is_taxable=data.get('is_taxable', True),
            tax_rate=default_tax_rate,
            is_active=data.get('is_active', True),
            featured=data.get('featured', False),
            is_grouped_product=data.get('is_grouped_product', False),
            image_url=data.get('image_url'),
            thumbnail_url=data.get('thumbnail_url'),
            reward_points=data.get('reward_points', 0)
        )
        
        # Add health benefits
        if data.get('health_benefit_ids'):
            health_benefits = HealthBenefit.query.filter(
                HealthBenefit.id.in_(data['health_benefit_ids'])
            ).all()
            product.health_benefits = health_benefits
        
        db.session.add(product)
        db.session.flush()  # Get product.id before commit
        
        # Update image1-image5 fields using raw SQL (after flush to get product.id)
        image_fields = {}
        max_url_length = 500  # Database column limit
        
        # Helper function to validate and truncate URLs
        def validate_image_url(url):
            if not url or url.strip() == '':
                return None
            url = url.strip()
            # Truncate if too long
            if len(url) > max_url_length:
                print(f"[WARNING] Image URL too long ({len(url)} chars), truncating to {max_url_length} chars")
                url = url[:max_url_length]
            # Validate URL format
            if not (url.startswith('http://') or url.startswith('https://')):
                print(f"[WARNING] Invalid URL format, skipping: {url[:50]}...")
                return None
            return url
        
        # Process image fields - allow NULL/empty values (optional fields)
        # Always process even if empty to allow setting fields to NULL
        for img_num in range(1, 6):
            img_key = f'image{img_num}'
            if img_key in data:
                validated_url = validate_image_url(data.get(img_key))
                # Add to image_fields even if None to allow clearing/setting to NULL
                if validated_url is not None:
                    image_fields[img_key] = validated_url
                else:
                    # Explicitly set to NULL for empty/invalid URLs
                    image_fields[img_key] = None
        
        # Always update image fields (even if all are NULL) to ensure they're set correctly
        if image_fields or any(f'image{i}' in data for i in range(1, 6)):
            try:
                update_parts = []
                params = {'product_id': product.id}
                for img_key, img_value in image_fields.items():
                    # Use NULL for None values to properly clear the field
                    if img_value is None:
                        update_parts.append(f"{img_key} = NULL")
                    else:
                        update_parts.append(f"{img_key} = :{img_key}")
                        params[img_key] = img_value
                
                if update_parts:
                    update_sql = f"UPDATE products SET {', '.join(update_parts)} WHERE id = :product_id"
                    db.session.execute(text(update_sql), params)
                    print(f"[SUCCESS] Set image fields for new product {product.id}: {list(image_fields.keys())}")
            except Exception as img_error:
                print(f"[WARNING] Could not set image fields for new product: {str(img_error)}")
                import traceback
                traceback.print_exc()
        
        # Handle FAQs if provided - handle case where table doesn't exist yet
        if data.get('faqs'):
            try:
                faqs_data = data.get('faqs', {})
                product_faq = ProductFAQ(
                    product_id=product.id,
                    faq1_question=faqs_data.get('faq1_question'),
                    faq1_answer=faqs_data.get('faq1_answer'),
                    faq2_question=faqs_data.get('faq2_question'),
                    faq2_answer=faqs_data.get('faq2_answer'),
                    faq3_question=faqs_data.get('faq3_question'),
                    faq3_answer=faqs_data.get('faq3_answer'),
                    faq4_question=faqs_data.get('faq4_question'),
                    faq4_answer=faqs_data.get('faq4_answer'),
                    faq5_question=faqs_data.get('faq5_question'),
                    faq5_answer=faqs_data.get('faq5_answer')
                )
                db.session.add(product_faq)
            except Exception as faq_error:
                print(f"[WARNING] Could not save FAQs - table may not exist: {str(faq_error)}")
                # Continue without failing the product creation
        
        # Handle key ingredients if provided - handle case where table doesn't exist yet
        if data.get('key_ingredients'):
            try:
                key_ingredients_data = data.get('key_ingredients', [])
                # Remove existing mappings
                ProductKeyIngredient.query.filter_by(product_id=product.id).delete()
                
                # Process each key ingredient
                for index, ki_data in enumerate(key_ingredients_data, start=1):
                    if not ki_data.get('name'):
                        continue  # Skip if no name provided
                    
                    # Generate slug from name
                    base_slug = re.sub(r'[^a-z0-9]+', '-', ki_data.get('name', '').lower()).strip('-')
                    slug = base_slug
                    counter = 1
                    while KeyIngredient.query.filter_by(slug=slug).first():
                        slug = f"{base_slug}-{counter}"
                        counter += 1
                    
                    # Handle image URL - validate and store if valid
                    image_url = ki_data.get('image_url', '').strip()
                    
                    # Validate URL: must be a valid URL, not base64, and within length limit
                    final_image_url = None
                    if image_url:
                        # Reject base64 images (they start with 'data:image')
                        if image_url.startswith('data:image'):
                            final_image_url = None
                        # Validate URL format and length
                        elif len(image_url) <= 500 and (image_url.startswith('http://') or image_url.startswith('https://')):
                            final_image_url = image_url
                        elif len(image_url) > 500:
                            print(f"[WARNING] Image URL too long for ingredient '{ki_data.get('name')}': {len(image_url)} characters")
                            final_image_url = None
                    
                    # Check if key ingredient already exists by name
                    existing_ki = KeyIngredient.query.filter_by(name=ki_data.get('name')).first()
                    
                    if existing_ki:
                        # Use existing key ingredient
                        key_ingredient = existing_ki
                        # Update description and image if provided
                        # Convert empty description to None (NULL)
                        if 'description' in ki_data:
                            description_value = ki_data.get('description', '')
                            key_ingredient.description = description_value.strip() if description_value and description_value.strip() else None
                        if final_image_url:
                            key_ingredient.image_url = final_image_url
                    else:
                        # Create new key ingredient
                        # Convert empty description to None (NULL) to match database schema
                        description_value = ki_data.get('description', '')
                        description_value = description_value.strip() if description_value and description_value.strip() else None
                        
                        key_ingredient = KeyIngredient(
                            name=ki_data.get('name'),
                            slug=slug,
                            description=description_value,  # NULL if empty
                            image_url=final_image_url,
                            is_active=True
                        )
                        db.session.add(key_ingredient)
                        db.session.flush()  # Get the ID
                    
                    # Create product-key ingredient mapping
                    product_key_ingredient = ProductKeyIngredient(
                        product_id=product.id,
                        key_ingredient_id=key_ingredient.id,
                        display_order=index
                    )
                    db.session.add(product_key_ingredient)
                    
            except Exception as ki_error:
                import traceback
                print(f"[WARNING] Could not save key ingredients - table may not exist: {str(ki_error)}")
                traceback.print_exc()
                # Continue without failing the product creation
        
        # Handle feature cards if provided - handle case where table doesn't exist yet
        if data.get('feature_cards'):
            try:
                feature_cards_data = data.get('feature_cards', [])
                # Remove existing cards for this product
                ProductFeatureCard.query.filter_by(product_id=product.id).delete()
                
                # Process each feature card
                for card_data in feature_cards_data:
                    if not card_data.get('card_text'):
                        continue  # Skip if no text provided
                    
                    # Validate image URL if provided
                    image_url = card_data.get('card_image_url', '').strip() if card_data.get('card_image_url') else None
                    final_image_url = None
                    if image_url:
                        # Reject base64 images
                        if image_url.startswith('data:image'):
                            final_image_url = None
                        # Validate URL format and length
                        elif len(image_url) <= 500 and (image_url.startswith('http://') or image_url.startswith('https://')):
                            final_image_url = image_url
                        elif len(image_url) > 500:
                            print(f"[WARNING] Image URL too long for feature card '{card_data.get('card_text')}': {len(image_url)} characters")
                            final_image_url = None
                    
                    # Create feature card
                    feature_card = ProductFeatureCard(
                        product_id=product.id,
                        card_text=card_data.get('card_text'),
                        card_image_url=final_image_url,
                        display_order=card_data.get('display_order', 0),
                        is_active=card_data.get('is_active', True)
                    )
                    db.session.add(feature_card)
                    
            except Exception as fc_error:
                import traceback
                print(f"[WARNING] Could not save feature cards - table may not exist: {str(fc_error)}")
                traceback.print_exc()
                # Continue without failing the product creation
        
        # Create regional price entry if pricing_country is specified
        if data.get('pricing_country') and data.get('pricing_currency'):
            try:
                pricing_country = data.get('pricing_country')
                pricing_currency = data.get('pricing_currency')
                regular_price = data.get('base_price')
                
                # Create entry in product_prices table for this specific country
                price_query = text("""
                    INSERT INTO product_prices 
                    (product_id, country_code, currency_code, price, pricing_type, is_active, created_at, updated_at)
                    VALUES (:product_id, :country, :currency, :price, 'base', 1, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE
                        price = :price,
                        currency_code = :currency,
                        updated_at = NOW()
                """)
                
                db.session.execute(price_query, {
                    'product_id': product.id,
                    'country': pricing_country,
                    'currency': pricing_currency,
                    'price': regular_price
                })
                
                print(f"[REGIONAL PRICING] Product {product.id} - {pricing_country} ({pricing_currency}): {regular_price}")
                
            except Exception as e:
                print(f"[REGIONAL PRICING ERROR] {str(e)}")
                # Don't fail the whole product creation if regional pricing fails
        
        db.session.commit()
        
        print(f"[SUCCESS] Product created: ID={product.id}, Name={product.name}")
        
        return jsonify({
            'message': 'Product created successfully',
            'product_id': product.id,
            'pricing_country': data.get('pricing_country'),
            'pricing_currency': data.get('pricing_currency')
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to create product: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to create product',
            'details': str(e),
            'type': type(e).__name__
        }), 500
@app.route('/api/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update product"""
    try:
        product = db.session.get(Product, product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        data = request.get_json()
        
        # Debug: Log image data received
        print(f"[DEBUG] Received image data for product {product_id}:")
        for img_num in range(1, 6):
            img_key = f'image{img_num}'
            if img_key in data:
                img_value = data[img_key]
                if img_value:
                    print(f"[DEBUG]   {img_key}: {img_value[:100]}... (length: {len(img_value)})")
                else:
                    print(f"[DEBUG]   {img_key}: {img_value} (empty/null)")
        
        # Update fields
        if 'name' in data:
            product.name = data['name']
        if 'sku' in data:
            product.sku = data['sku']
        if 'description' in data:
            # Convert empty strings to None (NULL) to match database schema
            product.description = data['description'].strip() if data['description'] and data['description'].strip() else None
        if 'short_description' in data:
            # Convert empty strings to None (NULL) to match database schema
            product.short_description = data['short_description'].strip() if data['short_description'] and data['short_description'].strip() else None
        if 'category_id' in data:
            product.category_id = data['category_id']
        if 'product_type' in data:
            product.product_type = data['product_type']
        if 'base_price' in data:
            product.base_price = data['base_price']
        if 'sale_price' in data:
            product.sale_price = data['sale_price']
        if 'stock_quantity' in data:
            product.stock_quantity = data['stock_quantity']
        if 'color_name' in data:
            product.color_name = data['color_name']
        if 'color_shade' in data:
            product.color_shade = data['color_shade']
        if 'is_taxable' in data:
            product.is_taxable = data['is_taxable']
        if 'tax_rate' in data:
            product.tax_rate = data['tax_rate']
        if 'is_active' in data:
            product.is_active = data['is_active']
        if 'featured' in data:
            product.featured = data['featured']
        if 'image_url' in data:
            product.image_url = data['image_url']
        
        # Prepare image1-image5 fields for update (will be processed at the end)
        image_updates = {}
        # Query actual column size from database to be safe
        try:
            col_info_sql = text("""
                SELECT CHARACTER_MAXIMUM_LENGTH 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'products' 
                AND COLUMN_NAME = 'image1'
            """)
            col_result = db.session.execute(col_info_sql).fetchone()
            if col_result and col_result[0]:
                actual_max_length = col_result[0]
                # Use 80% of actual max as safe limit (accounts for encoding differences)
                max_url_length = int(actual_max_length * 0.8)
                print(f"[DEBUG] Detected image1 column size: {actual_max_length}, using safe limit: {max_url_length}")
            else:
                # Fallback: use very conservative limit
                max_url_length = 400
                print(f"[DEBUG] Could not detect column size, using conservative limit: {max_url_length}")
        except Exception as col_check_error:
            # Fallback: use very conservative limit
            max_url_length = 400
            print(f"[DEBUG] Error checking column size: {col_check_error}, using conservative limit: {max_url_length}")
        
        # Helper function to validate and truncate URLs
        def validate_image_url(url, field_name):
            if not url or (isinstance(url, str) and url.strip() == ''):
                print(f"[DEBUG] {field_name} is empty, will be set to NULL")
                return None  # Return None to clear the field
            if not isinstance(url, str):
                print(f"[DEBUG] {field_name} is not a string: {type(url)}, converting...")
                url = str(url)
            url = url.strip()
            original_length = len(url)
            original_byte_length = len(url.encode('utf-8'))
            
            # CRITICAL: Truncate based on BOTH character length AND byte length
            # Use detected column size for byte limit (or 500 as fallback)
            byte_limit = int(max_url_length * 1.25) if max_url_length > 400 else 500  # Allow some byte overhead
            
            if len(url) > max_url_length:
                print(f"[WARNING] {field_name} URL too long ({original_length} chars, {original_byte_length} bytes), truncating to {max_url_length} chars")
                url = url[:max_url_length]
                # Double-check byte length after truncation
                byte_length = len(url.encode('utf-8'))
                print(f"[DEBUG] {field_name} after truncation: {len(url)} chars, {byte_length} bytes")
                
                # If byte length still exceeds limit, truncate more aggressively
                if byte_length > byte_limit:
                    # Truncate character by character until byte length is safe
                    while len(url.encode('utf-8')) > byte_limit and len(url) > 0:
                        url = url[:-1]
                    print(f"[WARNING] {field_name} byte length exceeded {byte_limit}, further truncated to {len(url)} chars ({len(url.encode('utf-8'))} bytes)")
            
            # Validate URL format AFTER truncation
            if not (url.startswith('http://') or url.startswith('https://')):
                print(f"[WARNING] {field_name} invalid URL format, skipping: {url[:50]}...")
                return None
            
            # Final safety check - ensure both char and byte length are safe
            final_char_len = len(url)
            final_byte_len = len(url.encode('utf-8'))
            if final_char_len > max_url_length or final_byte_len > byte_limit:
                print(f"[ERROR] {field_name} CRITICAL: Still too long after truncation! (chars: {final_char_len}, bytes: {final_byte_len})")
                # Emergency truncation to 70% of max_url_length
                emergency_limit = int(max_url_length * 0.7)
                url = url[:emergency_limit]
                # Ensure byte length is also safe
                while len(url.encode('utf-8')) > byte_limit and len(url) > 0:
                    url = url[:-1]
                print(f"[ERROR] {field_name} Emergency truncation to {len(url)} chars ({len(url.encode('utf-8'))} bytes)")
            
            print(f"[DEBUG] {field_name} validated successfully: chars={len(url)}, bytes={len(url.encode('utf-8'))}, preview: {url[:80]}...")
            return url
        
        # Process each image field - include even if empty to allow clearing
        for img_num in range(1, 6):
            field_name = f'image{img_num}'
            if field_name in data:
                raw_value = data[field_name]
                print(f"[DEBUG] Processing {field_name}, raw value type: {type(raw_value)}, value: {str(raw_value)[:100] if raw_value else 'None/Empty'}")
                validated_url = validate_image_url(raw_value, field_name)
                # Always add to updates (even if None) to allow clearing fields
                image_updates[field_name] = validated_url
                if validated_url:
                    print(f"[DEBUG] {field_name} will be updated: True, final value length: {len(validated_url)}, preview: {validated_url[:80]}...")
                else:
                    print(f"[DEBUG] {field_name} will be updated: False, final value: NULL")
            else:
                print(f"[DEBUG] {field_name} not in request data")
        
        if 'reward_points' in data:
            product.reward_points = data['reward_points']
        if 'is_grouped_product' in data:
            product.is_grouped_product = data['is_grouped_product']
        
        # Update health benefits
        if 'health_benefit_ids' in data:
            health_benefits = HealthBenefit.query.filter(
                HealthBenefit.id.in_(data['health_benefit_ids'])
            ).all()
            product.health_benefits = health_benefits
        
        # Handle FAQs update - handle case where table doesn't exist yet
        if 'faqs' in data:
            try:
                faqs_data = data.get('faqs', {})
                product_faq = ProductFAQ.query.filter_by(product_id=product_id).first()
                
                if product_faq:
                    # Update existing FAQs
                    product_faq.faq1_question = faqs_data.get('faq1_question')
                    product_faq.faq1_answer = faqs_data.get('faq1_answer')
                    product_faq.faq2_question = faqs_data.get('faq2_question')
                    product_faq.faq2_answer = faqs_data.get('faq2_answer')
                    product_faq.faq3_question = faqs_data.get('faq3_question')
                    product_faq.faq3_answer = faqs_data.get('faq3_answer')
                    product_faq.faq4_question = faqs_data.get('faq4_question')
                    product_faq.faq4_answer = faqs_data.get('faq4_answer')
                    product_faq.faq5_question = faqs_data.get('faq5_question')
                    product_faq.faq5_answer = faqs_data.get('faq5_answer')
                else:
                    # Create new FAQs entry
                    product_faq = ProductFAQ(
                        product_id=product_id,
                        faq1_question=faqs_data.get('faq1_question'),
                        faq1_answer=faqs_data.get('faq1_answer'),
                        faq2_question=faqs_data.get('faq2_question'),
                        faq2_answer=faqs_data.get('faq2_answer'),
                        faq3_question=faqs_data.get('faq3_question'),
                        faq3_answer=faqs_data.get('faq3_answer'),
                        faq4_question=faqs_data.get('faq4_question'),
                        faq4_answer=faqs_data.get('faq4_answer'),
                        faq5_question=faqs_data.get('faq5_question'),
                        faq5_answer=faqs_data.get('faq5_answer')
                    )
                    db.session.add(product_faq)
            except Exception as faq_error:
                print(f"[WARNING] Could not update FAQs - table may not exist: {str(faq_error)}")
                # Continue without failing the product update
        
        # Handle key ingredients update - handle case where table doesn't exist yet
        if 'key_ingredients' in data:
            try:
                key_ingredients_data = data.get('key_ingredients', [])
                # Remove existing mappings
                ProductKeyIngredient.query.filter_by(product_id=product_id).delete()
                
                # Process each key ingredient
                for index, ki_data in enumerate(key_ingredients_data, start=1):
                    if not ki_data.get('name'):
                        continue  # Skip if no name provided
                    
                    # Generate slug from name
                    base_slug = re.sub(r'[^a-z0-9]+', '-', ki_data.get('name', '').lower()).strip('-')
                    slug = base_slug
                    counter = 1
                    while KeyIngredient.query.filter_by(slug=slug).first():
                        slug = f"{base_slug}-{counter}"
                        counter += 1
                    
                    # Handle image URL - validate and store if valid
                    image_url = ki_data.get('image_url', '').strip()
                    
                    # Validate URL: must be a valid URL, not base64, and within length limit
                    final_image_url = None
                    if image_url:
                        # Reject base64 images (they start with 'data:image')
                        if image_url.startswith('data:image'):
                            final_image_url = None
                        # Validate URL format and length
                        elif len(image_url) <= 500 and (image_url.startswith('http://') or image_url.startswith('https://')):
                            final_image_url = image_url
                        elif len(image_url) > 500:
                            print(f"[WARNING] Image URL too long for ingredient '{ki_data.get('name')}': {len(image_url)} characters")
                            final_image_url = None
                    
                    # Check if key ingredient already exists by name
                    existing_ki = KeyIngredient.query.filter_by(name=ki_data.get('name')).first()
                    
                    if existing_ki:
                        # Use existing key ingredient
                        key_ingredient = existing_ki
                        # Update description and image if provided
                        # Convert empty description to None (NULL)
                        if 'description' in ki_data:
                            description_value = ki_data.get('description', '')
                            key_ingredient.description = description_value.strip() if description_value and description_value.strip() else None
                        if final_image_url:
                            key_ingredient.image_url = final_image_url
                    else:
                        # Create new key ingredient
                        # Convert empty description to None (NULL) to match database schema
                        description_value = ki_data.get('description', '')
                        description_value = description_value.strip() if description_value and description_value.strip() else None
                        
                        key_ingredient = KeyIngredient(
                            name=ki_data.get('name'),
                            slug=slug,
                            description=description_value,  # NULL if empty
                            image_url=final_image_url,
                            is_active=True
                        )
                        db.session.add(key_ingredient)
                        db.session.flush()  # Get the ID
                    
                    # Create product-key ingredient mapping
                    product_key_ingredient = ProductKeyIngredient(
                        product_id=product_id,
                        key_ingredient_id=key_ingredient.id,
                        display_order=index
                    )
                    db.session.add(product_key_ingredient)
                    
            except Exception as ki_error:
                import traceback
                print(f"[WARNING] Could not update key ingredients - table may not exist: {str(ki_error)}")
                traceback.print_exc()
                # Continue without failing the product update
        
        # Handle feature cards update - handle case where table doesn't exist yet
        if 'feature_cards' in data:
            try:
                feature_cards_data = data.get('feature_cards', [])
                # Remove existing cards for this product
                ProductFeatureCard.query.filter_by(product_id=product_id).delete()
                
                # Process each feature card
                for card_data in feature_cards_data:
                    if not card_data.get('card_text'):
                        continue  # Skip if no text provided
                    
                    # Validate image URL if provided
                    image_url = card_data.get('card_image_url', '').strip() if card_data.get('card_image_url') else None
                    final_image_url = None
                    if image_url:
                        # Reject base64 images
                        if image_url.startswith('data:image'):
                            final_image_url = None
                        # Validate URL format and length
                        elif len(image_url) <= 500 and (image_url.startswith('http://') or image_url.startswith('https://')):
                            final_image_url = image_url
                        elif len(image_url) > 500:
                            print(f"[WARNING] Image URL too long for feature card '{card_data.get('card_text')}': {len(image_url)} characters")
                            final_image_url = None
                    
                    # Create feature card
                    feature_card = ProductFeatureCard(
                        product_id=product_id,
                        card_text=card_data.get('card_text'),
                        card_image_url=final_image_url,
                        display_order=card_data.get('display_order', 0),
                        is_active=card_data.get('is_active', True)
                    )
                    db.session.add(feature_card)
                    
            except Exception as fc_error:
                import traceback
                print(f"[WARNING] Could not update feature cards - table may not exist: {str(fc_error)}")
                traceback.print_exc()
                # Continue without failing the product update
        
        # Handle regional tax rates if provided
        if 'regional_tax_rates' in data and data['regional_tax_rates']:
            print(f"📊 Updating regional tax rates for product {product_id}: {data['regional_tax_rates']}")
            try:
                for country_code, tax_rate in data['regional_tax_rates'].items():
                    # Validate country code
                    if not country_code or len(country_code) < 2:
                        print(f"  ⚠️  Skipping invalid country code: {country_code}")
                        continue
                    
                    # Find or create regional override
                    override = db.session.query(ProductRegionalOverride).filter_by(
                        product_id=product_id,
                        country_code=country_code
                    ).first()
                    
                    # Parse tax rate
                    parsed_tax_rate = None
                    if tax_rate not in [None, '', 'null', 'undefined']:
                        try:
                            parsed_tax_rate = float(tax_rate)
                        except (ValueError, TypeError):
                            print(f"  ⚠️  Invalid tax rate for {country_code}: {tax_rate}")
                            continue
                    
                    if override:
                        # Update existing
                        old_rate = override.tax_rate_override
                        override.tax_rate_override = parsed_tax_rate
                        override.updated_at = datetime.now(timezone.utc)
                        print(f"  ✅ Updated {country_code}: {old_rate} → {parsed_tax_rate}")
                    else:
                        # Create new - get country to find currency
                        country = db.session.query(Country).filter_by(country_code=country_code).first()
                        if country:
                            override = ProductRegionalOverride(
                                product_id=product_id,
                                country_code=country_code,
                                currency_code=country.currency_code,
                                tax_rate_override=parsed_tax_rate,
                                created_at=datetime.now(timezone.utc),
                                updated_at=datetime.now(timezone.utc)
                            )
                            db.session.add(override)
                            print(f"  ✅ Created new override for {country_code}: {parsed_tax_rate}")
                        else:
                            print(f"  ⚠️  Country {country_code} not found in database")
                
                # Flush to database
                db.session.flush()
                print(f"✅ Regional tax rates saved for product {product_id}")
            except Exception as e:
                print(f"❌ Error handling regional tax rates: {e}")
                import traceback
                traceback.print_exc()
                # Continue even if regional tax handling fails
        
        # Update image1-image5 fields using raw SQL - do this RIGHT BEFORE final commit
        print(f"[DEBUG] ========== IMAGE UPDATE PROCESSING ==========")
        print(f"[DEBUG] image_updates dictionary: {image_updates}")
        print(f"[DEBUG] Number of image fields to update: {len(image_updates)}")
        
        if image_updates:
            update_parts = []
            params = {}
            
            # Process each image field and ensure strict length enforcement
            for img_key, img_value in image_updates.items():
                print(f"[DEBUG] Processing {img_key}: value type={type(img_value)}, value={str(img_value)[:100] if img_value else 'None'}...")
                
                # Use NULL for None values to properly clear the field
                if img_value is None:
                    update_parts.append(f"{img_key} = NULL")
                    print(f"[DEBUG] {img_key} will be set to NULL")
                else:
                    # CRITICAL: Ensure the value is a string and STRICTLY within length limit
                    str_value = str(img_value).strip()
                    original_char_len = len(str_value)
                    original_byte_len = len(str_value.encode('utf-8'))
                    
                    # Force truncation if still too long (shouldn't happen, but safety check)
                    if len(str_value) > max_url_length:
                        print(f"[WARNING] {img_key} value still too long ({original_char_len} chars, {original_byte_len} bytes), forcing truncation to {max_url_length}")
                        str_value = str_value[:max_url_length]
                    
                    # Check byte length - MySQL VARCHAR counts characters but bytes matter for storage
                    # Calculate byte limit based on detected column size
                    byte_limit = int(max_url_length * 1.25) if max_url_length > 400 else 500
                    byte_len = len(str_value.encode('utf-8'))
                    if byte_len > byte_limit:
                        print(f"[WARNING] {img_key} byte length ({byte_len}) exceeds {byte_limit}, truncating further...")
                        # Truncate until byte length is safe
                        while len(str_value.encode('utf-8')) > byte_limit and len(str_value) > 0:
                            str_value = str_value[:-1]
                        print(f"[WARNING] {img_key} truncated to {len(str_value)} chars ({len(str_value.encode('utf-8'))} bytes)")
                    
                    # Final length verification - CRITICAL CHECK
                    final_char_len = len(str_value)
                    final_byte_len = len(str_value.encode('utf-8'))
                    if final_char_len > max_url_length or final_byte_len > byte_limit:
                        print(f"[ERROR] {img_key} CRITICAL: Value still exceeds limit! (chars: {final_char_len}, bytes: {final_byte_len})")
                        print(f"[ERROR] Skipping {img_key} to prevent database error.")
                        continue  # Skip this field to prevent the error
                    
                    # Validate URL format
                    if not (str_value.startswith('http://') or str_value.startswith('https://')):
                        print(f"[WARNING] {img_key} invalid URL format, skipping")
                        continue
                    
                    update_parts.append(f"{img_key} = :{img_key}")
                    params[img_key] = str_value
                    print(f"[DEBUG] {img_key} added to update: chars={final_char_len}, bytes={final_byte_len} (char limit: {max_url_length}, byte limit: 500) ✓")
            
            # Build and execute SQL update
            # Note: update_parts can include NULL assignments to clear fields
            if update_parts:
                # Build SQL with proper parameter binding
                update_sql = f"UPDATE products SET {', '.join(update_parts)} WHERE id = :product_id"
                params['product_id'] = product_id
                
                print(f"[DEBUG] ========== EXECUTING IMAGE UPDATE SQL ==========")
                print(f"[DEBUG] SQL: {update_sql}")
                print(f"[DEBUG] Parameters:")
                for key, val in params.items():
                    if key != 'product_id':
                        val_str = str(val) if val else 'NULL'
                        val_char_len = len(val_str)
                        val_byte_len = len(val_str.encode('utf-8')) if val_str != 'NULL' else 0
                        byte_limit_check = int(max_url_length * 1.25) if max_url_length > 400 else 500
                        print(f"[DEBUG]   {key}: chars={val_char_len}, bytes={val_byte_len} (char max: {max_url_length}, byte max: {byte_limit_check}), preview: {val_str[:80]}...")
                        # Final safety check before SQL execution
                        if val_char_len > max_url_length or val_byte_len > byte_limit_check:
                            print(f"[ERROR] CRITICAL: {key} exceeds limits! (chars: {val_char_len} > {max_url_length} OR bytes: {val_byte_len} > 500)")
                            raise ValueError(f"{key} parameter exceeds maximum length (chars: {val_char_len}, bytes: {val_byte_len})")
                print(f"[DEBUG] ================================================")
                
                try:
                    # Execute the SQL update using text() for proper parameter binding
                    # Use explicit parameter binding to ensure compatibility
                    sql_stmt = text(update_sql)
                    result = db.session.execute(sql_stmt, params)
                    rows_affected = result.rowcount
                    print(f"[SUCCESS] ✅ Image update SQL executed successfully")
                    print(f"[SUCCESS] Fields updated: {len(update_parts)}")
                    print(f"[SUCCESS] Rows affected: {rows_affected}")
                    
                    # CRITICAL: Expire the product object to force SQLAlchemy to reload from DB
                    # This ensures SQLAlchemy doesn't overwrite our raw SQL update
                    db.session.expire(product)
                    print(f"[SUCCESS] ✅ Product object expired to prevent SQLAlchemy from overwriting image updates")
                    
                    # IMPORTANT: Flush to ensure the update is in the session before commit
                    db.session.flush()
                    print(f"[SUCCESS] ✅ Session flushed after image update")
                    
                    # CRITICAL: Refresh the product object AFTER flush to ensure SQLAlchemy sees the updated values
                    # This prevents SQLAlchemy from overwriting our raw SQL update on commit
                    db.session.refresh(product)
                    print(f"[SUCCESS] ✅ Product object refreshed after flush to ensure SQLAlchemy sees image updates")
                    
                    # Double-check: Query immediately after flush to verify
                    check_sql = text("SELECT image1, image2, image3, image4, image5 FROM products WHERE id = :product_id")
                    check_result = db.session.execute(check_sql, {"product_id": product_id}).fetchone()
                    if check_result:
                        print(f"[VERIFY] Pre-commit check - Current values in DB:")
                        for i, img_val in enumerate(check_result, 1):
                            img_str = str(img_val) if img_val else 'NULL'
                            print(f"[VERIFY]   image{i}: {img_str[:60] if img_val else 'NULL'}...")
                    
                except Exception as sql_error:
                    error_msg = str(sql_error)
                    print(f"[ERROR] ❌ SQL execution failed: {error_msg}")
                    import traceback
                    traceback.print_exc()
                    
                    # If it's a data length error, try with more aggressive truncation
                    if "Data too long" in error_msg or "1406" in error_msg:
                        print(f"[ERROR] Data too long error detected. Attempting aggressive truncation...")
                        try:
                            # Retry with ultra-aggressive truncation
                            retry_parts = []
                            retry_params = {'product_id': product_id}
                            for img_key, img_value in image_updates.items():
                                if img_value is None:
                                    retry_parts.append(f"{img_key} = NULL")
                                else:
                                    # Ultra-aggressive: truncate to 70% of max_url_length for maximum safety
                                    safe_length = int(max_url_length * 0.7)
                                    str_value = str(img_value).strip()[:safe_length]
                                    # Ensure byte length is also safe
                                    while len(str_value.encode('utf-8')) > 400 and len(str_value) > 0:
                                        str_value = str_value[:-1]
                                    if str_value.startswith('http://') or str_value.startswith('https://'):
                                        retry_parts.append(f"{img_key} = :{img_key}")
                                        retry_params[img_key] = str_value
                                        print(f"[DEBUG] Retry: {img_key} truncated to {len(str_value)} chars ({len(str_value.encode('utf-8'))} bytes)")
                            
                            if retry_parts:
                                retry_sql = f"UPDATE products SET {', '.join(retry_parts)} WHERE id = :product_id"
                                db.session.execute(text(retry_sql), retry_params)
                                db.session.flush()
                                print(f"[SUCCESS] ✅ Image update retry succeeded")
                        except Exception as retry_error:
                            print(f"[ERROR] Retry also failed: {retry_error}")
                            # Rollback only the image update attempt
                            db.session.rollback()
                            raise Exception(f"Failed to update image fields: {error_msg}")
                    else:
                        # For other SQL errors, rollback and re-raise
                        db.session.rollback()
                        raise
            else:
                print(f"[WARNING] No valid image fields to update after validation")
        else:
            print(f"[DEBUG] No image fields in image_updates dictionary")
        
        print(f"[DEBUG] ================================================")
        
        # Update timestamp BEFORE commit (so it's part of the same transaction)
        try:
            product.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
            print(f"[DEBUG] ✅ Timestamp updated on product object (part of main transaction)")
        except Exception as ts_error:
            print(f"[WARNING] Timestamp update warning: {ts_error}")
        
        # Commit ALL changes including image updates and timestamp in ONE transaction
        print(f"[DEBUG] ========== COMMITTING ALL CHANGES ==========")
        try:
            db.session.commit()
            print(f"[SUCCESS] ✅ All changes committed for product {product_id}")
        except Exception as commit_error:
            error_msg = str(commit_error)
            print(f"[ERROR] ❌ Commit failed: {error_msg}")
            import traceback
            traceback.print_exc()
            # If commit fails, rollback and re-raise
            db.session.rollback()
            raise
        
        # Verify the image update by querying the database IMMEDIATELY after commit
        # Use a fresh query to ensure we're reading from disk, not cache
        if image_updates:
            print(f"[DEBUG] ========== VERIFYING IMAGE UPDATE ==========")
            try:
                # Force a fresh query by using a new execution context
                verify_sql = text("SELECT image1, image2, image3, image4, image5 FROM products WHERE id = :product_id")
                verify_result = db.session.execute(verify_sql, {"product_id": product_id}).fetchone()
                if verify_result:
                    print(f"[VERIFY] ✅ Current values in DB after commit:")
                    all_null = True
                    saved_images = {}
                    for i, img_val in enumerate(verify_result, 1):
                        img_str = str(img_val) if img_val else 'NULL'
                        saved_images[f'image{i}'] = img_val
                        print(f"[VERIFY]   image{i}: {img_str[:80] if img_val else 'NULL'}...")
                        if img_val:
                            all_null = False
                    
                    # Compare what we tried to save vs what's actually in DB
                    print(f"[VERIFY] Comparison - Expected vs Actual:")
                    for img_key, expected_val in image_updates.items():
                        actual_val = saved_images.get(img_key)
                        if expected_val is None:
                            expected_str = 'NULL'
                        else:
                            expected_str = str(expected_val)[:60] + '...' if len(str(expected_val)) > 60 else str(expected_val)
                        if actual_val is None:
                            actual_str = 'NULL'
                        else:
                            actual_str = str(actual_val)[:60] + '...' if len(str(actual_val)) > 60 else str(actual_val)
                        
                        match = (expected_val is None and actual_val is None) or (expected_val == actual_val)
                        status = "✅ MATCH" if match else "❌ MISMATCH"
                        print(f"[VERIFY]   {img_key}: {status}")
                        if not match:
                            print(f"[VERIFY]     Expected: {expected_str}")
                            print(f"[VERIFY]     Actual:   {actual_str}")
                    
                    if all_null and any(v is not None for v in image_updates.values()):
                        print(f"[WARNING] ⚠️  All image fields are NULL but we tried to update some!")
                        print(f"[WARNING] This suggests the update did not persist correctly.")
                    else:
                        print(f"[VERIFY] ✅ Image update verification complete")
                else:
                    print(f"[WARNING] Could not fetch product for verification")
            except Exception as verify_error:
                print(f"[WARNING] Could not verify image update: {verify_error}")
                import traceback
                traceback.print_exc()
        
        return jsonify({'message': 'Product updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Error in update_product endpoint: {str(e)}")
        print(f"[ERROR] Traceback: {error_trace}")
        return jsonify({
            'error': 'Failed to update product',
            'details': str(e),
            'type': type(e).__name__
        }), 500
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete product (or archive if it has orders)"""
    try:
        product = db.session.get(Product, product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        print(f"🗑️  Attempting to delete product ID: {product_id} (Name: {product.name})")
        
        # Check if product has any orders (order_items)image.pngimage.pngimage.png
        from sqlalchemy import text as sql_text
        order_count = db.session.execute(
            sql_text("SELECT COUNT(*) as cnt FROM order_items WHERE product_id = :pid"),
            {"pid": product_id}
        ).scalar()
        
        force_delete = request.args.get('force', 'false').lower() == 'true'
        
        if order_count > 0 and not force_delete:
            # Product has orders - offer soft delete (archive) instead
            print(f"⚠️  Product {product_id} has {order_count} order(s) - cannot delete permanently")
            print(f"  → Archiving product instead (setting is_active = False)")
            
            product.is_active = False
            db.session.commit()
            
            return jsonify({
                'message': f'Product has {order_count} order(s) and cannot be permanently deleted. Product has been archived instead.',
                'action': 'archived',
                'product_id': product_id,
                'order_count': order_count
            }), 200

        if order_count > 0 and force_delete:
            print(f"⚠️  Force deleting product {product_id} with {order_count} related order item(s)")
            order_items = OrderItem.query.filter_by(product_id=product_id).all()
            affected_orders = {}
            for item in order_items:
                order_total = item.total_price or (item.unit_price * item.quantity)
                affected_orders.setdefault(item.order_id, 0.0)
                affected_orders[item.order_id] += float(order_total or 0)
                db.session.delete(item)

            db.session.flush()

            for order_id, removed_total in affected_orders.items():
                order = db.session.get(Order, order_id)
                if not order:
                    continue
                remaining_items = OrderItem.query.filter_by(order_id=order_id).all()
                if not remaining_items:
                    print(f"  - Removing order {order_id} (no remaining items)")
                    db.session.delete(order)
                    continue

                new_subtotal = sum((itm.total_price or (itm.unit_price * itm.quantity)) for itm in remaining_items)
                order.subtotal = float(new_subtotal or 0)
                order.total_amount = max(
                    float(order.subtotal or 0)
                    - float(order.discount_amount or 0)
                    - float(order.coupon_discount or 0)
                    - float(order.group_discount or 0)
                    - float(order.wallet_used or 0)
                    + float(order.shipping_cost or 0)
                    + float(order.tax_amount or 0),
                    0.0
                )
                print(f"  - Updated order {order_id} totals after removing product {product_id}")
        
        # Product has no orders - safe to delete permanently
        print(f"✅ Product {product_id} has no orders - proceeding with permanent deletion")
        
        # Delete related regional overrides (CASCADE should handle this, but explicit is safer)
        try:
            regional_overrides = ProductRegionalOverride.query.filter_by(product_id=product_id).all()
            if regional_overrides:
                print(f"  - Found {len(regional_overrides)} regional overrides to delete")
                for override in regional_overrides:
                    db.session.delete(override)
                db.session.flush()
        except Exception as override_error:
            print(f"  ⚠️  Warning deleting regional overrides: {str(override_error)}")
            # Continue anyway - CASCADE should handle it
        
        # Delete the product
        db.session.delete(product)
        db.session.commit()
        
        print(f"✅ Product {product_id} permanently deleted successfully")
        return jsonify({
            'message': 'Product deleted successfully',
            'action': 'deleted',
            'product_id': product_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting product {product_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Provide helpful error messages
        error_msg = str(e)
        if 'foreign key constraint fails' in error_msg.lower():
            if 'order_items' in error_msg.lower():
                return jsonify({
                    'error': 'Cannot delete product: it has associated orders',
                    'suggestion': 'Archive the product instead by setting is_active=False',
                    'details': 'This product has been ordered by customers and cannot be permanently deleted to preserve order history.'
                }), 400
            else:
                return jsonify({
                    'error': 'Cannot delete product: it has associated records',
                    'details': str(e)
                }), 400
        
        return jsonify({'error': f'Failed to delete product: {str(e)}'}), 500

@app.route('/api/products/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all categories"""
    try:
        # Ensure essential category hierarchy
        try:
            specialized = Category.query.filter(Category.name.in_(['Specialized Supplements', 'Specialized Supplement'])).first()
            essential = Category.query.filter(Category.name.in_(['Essential Supplements', 'Essential Supplement'])).first()
            health = Category.query.filter(Category.name.in_(['Health Supplement', 'Health Supplements'])).first()

            update_required = False
            if health and essential and essential.parent_id != health.id:
                essential.parent_id = health.id
                update_required = True
            if health and specialized and specialized.parent_id != health.id:
                specialized.parent_id = health.id
                update_required = True
            if update_required:
                db.session.commit()
        except Exception as hierarchy_error:
            print(f"[Categories] Hierarchy check error: {str(hierarchy_error)}")
            db.session.rollback()
        
        # Get all categories (or only active ones based on query param)
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        if include_inactive:
            categories = Category.query.order_by(Category.display_order, Category.name).all()
        else:
            categories = Category.query.filter_by(is_active=True).order_by(Category.display_order, Category.name).all()
        
        categories_data = [{
            'id': cat.id,
            'name': cat.name,
            'slug': cat.slug,
            'description': cat.description,
            'parent_id': cat.parent_id,
            'is_active': cat.is_active,
            'display_order': cat.display_order,
            'created_at': cat.created_at.isoformat() if cat.created_at else None,
            'updated_at': cat.updated_at.isoformat() if cat.updated_at else None
        } for cat in categories]
        
        return jsonify({'categories': categories_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Create new category"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        # Auto-generate slug from name if not provided
        import re
        if data.get('slug'):
            base_slug = data['slug']
        else:
            base_slug = re.sub(r'[^a-z0-9]+', '-', data.get('name', '').lower()).strip('-')
        
        slug = base_slug
        counter = 1
        while Category.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        category = Category(
            name=data.get('name'),
            slug=slug,
            description=data.get('description'),
            parent_id=data.get('parent_id'),
            is_active=data.get('is_active', True),
            display_order=data.get('display_order', 0)
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category_id': category.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/categories/<int:category_id>', methods=['GET'])
@jwt_required()
def get_category(category_id):
    """Get single category"""
    try:
        category = db.session.get(Category, category_id)
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        category_data = {
            'id': category.id,
            'name': category.name,
            'slug': category.slug,
            'description': category.description,
            'parent_id': category.parent_id,
            'is_active': category.is_active,
            'display_order': category.display_order,
            'created_at': category.created_at.isoformat() if category.created_at else None,
            'updated_at': category.updated_at.isoformat() if category.updated_at else None
        }
        
        return jsonify({'category': category_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Update category"""
    try:
        category = db.session.get(Category, category_id)
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            category.name = data['name']
        if 'slug' in data:
            # Check if new slug conflicts with existing
            existing = Category.query.filter_by(slug=data['slug']).first()
            if existing and existing.id != category_id:
                return jsonify({'error': 'Category with this slug already exists'}), 400
            category.slug = data['slug']
        if 'description' in data:
            category.description = data['description']
        if 'parent_id' in data:
            category.parent_id = data['parent_id']
        if 'is_active' in data:
            category.is_active = data['is_active']
        if 'display_order' in data:
            category.display_order = data['display_order']
        
        category.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({'message': 'Category updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Delete category"""
    try:
        category = db.session.get(Category, category_id)
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Check if category has products
        products_count = Product.query.filter_by(category_id=category_id).count()
        if products_count > 0:
            return jsonify({
                'error': f'Cannot delete category. It has {products_count} product(s) associated with it.'
            }), 400
        
        # Check if category has subcategories
        subcategories_count = Category.query.filter_by(parent_id=category_id).count()
        if subcategories_count > 0:
            return jsonify({
                'error': f'Cannot delete category. It has {subcategories_count} subcategorie(s).'
            }), 400
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/categories/tree', methods=['GET'])
@jwt_required()
def get_categories_tree():
    """Get categories in hierarchical tree structure for filtering"""
    try:
        # Get all active categories
        all_categories = Category.query.filter_by(is_active=True).order_by(
            Category.display_order, Category.name
        ).all()
        
        # Build category dictionary
        categories_dict = {}
        for cat in all_categories:
            categories_dict[cat.id] = {
                'id': cat.id,
                'name': cat.name,
                'slug': cat.slug,
                'description': cat.description,
                'parent_id': cat.parent_id,
                'display_order': cat.display_order,
                'children': []
            }
        
        # Build tree structure
        tree = []
        for cat in all_categories:
            if cat.parent_id is None:
                # Root level category
                tree.append(categories_dict[cat.id])
            else:
                # Child category - add to parent's children
                if cat.parent_id in categories_dict:
                    categories_dict[cat.parent_id]['children'].append(categories_dict[cat.id])
        
        return jsonify({'categories': tree}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/products/categories/<int:category_id>/products-count', methods=['GET'])
@jwt_required()
def get_category_products_count(category_id):
    """Get count of products in a category (including subcategories)"""
    try:
        category = db.session.get(Category, category_id)
        
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        # Get all subcategory IDs recursively
        def get_subcategory_ids(cat_id):
            ids = [cat_id]
            subcats = Category.query.filter_by(parent_id=cat_id).all()
            for subcat in subcats:
                ids.extend(get_subcategory_ids(subcat.id))
            return ids
        
        category_ids = get_subcategory_ids(category_id)
        
        # Count products in this category and all subcategories
        total_count = Product.query.filter(Product.category_id.in_(category_ids)).count()
        active_count = Product.query.filter(
            Product.category_id.in_(category_ids),
            Product.is_active == True
        ).count()
        
        return jsonify({
            'category_id': category_id,
            'category_name': category.name,
            'total_products': total_count,
            'active_products': active_count,
            'includes_subcategories': len(category_ids) > 1,
            'subcategory_count': len(category_ids) - 1
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ORDER ROUTES ====================

@app.route('/api/orders/', methods=['GET'])
@jwt_required()
def get_orders():
    """Get all orders with filters"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', '')
        payment_status = request.args.get('payment_status', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        currency = request.args.get('currency', '')
        
        # Build query
        query = Order.query
        
        # Apply filters
        if search:
            # Remove # prefix that frontend may add for display purposes
            search_term = search.lstrip('#').strip()
            # Search in order number, customer name, and customer email
            query = query.join(User).filter(
                or_(
                    Order.order_number.ilike(f'%{search_term}%'),
                    User.full_name.ilike(f'%{search_term}%'),
                    User.email.ilike(f'%{search_term}%')
                )
            )
        
        if status:
            query = query.filter_by(status=status)
        
        if payment_status:
            query = query.filter_by(payment_status=payment_status)
        
        # Apply sorting
        if sort_by == 'order_number':
            query = query.order_by(Order.order_number.asc() if sort_order == 'asc' else Order.order_number.desc())
        elif sort_by == 'total_amount':
            query = query.order_by(Order.total_amount.asc() if sort_order == 'asc' else Order.total_amount.desc())
        elif sort_by == 'status':
            query = query.order_by(Order.status.asc() if sort_order == 'asc' else Order.status.desc())
        else:  # created_at
            query = query.order_by(Order.created_at.desc() if sort_order == 'desc' else Order.created_at.asc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        orders = pagination.items
        
        # Get currency for conversion
        if currency:
            currency_obj = Currency.query.filter_by(currency_code=currency).first()
            exchange_rate = currency_obj.exchange_rate if currency_obj else 1.0
            currency_symbol = currency_obj.currency_symbol if currency_obj else '₹'
        else:
            exchange_rate = 1.0
            currency_symbol = '₹'
        
        # Format orders
        orders_data = []
        for order in orders:
            # Get order items for accurate calculation
            items_data = []
            for item in order.items:
                items_data.append({
                    'id': item.id,
                    'product_id': item.product_id,
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price) if item.unit_price else 0,
                    'total_price': float(item.total_price) if item.total_price else 0,
                    'discount_amount': float(item.discount_amount) if item.discount_amount else 0,
                    'group_discount': float(item.group_discount) if item.group_discount else 0,
                    'currency': item.currency
                })
            
            # Convert amounts if needed (but keep original for display)
            orders_data.append({
                'id': order.id,
                'order_number': order.order_number,
                'user': {
                    'id': order.user.id,
                    'full_name': order.user.full_name,
                    'email': order.user.email
                } if order.user else None,
                'items': items_data,  # Include items for frontend calculation
                'status': order.status,
                'subtotal': order.subtotal,
                'discount_amount': order.discount_amount,
                'coupon_discount': order.coupon_discount,
                'group_discount': order.group_discount,
                'wallet_used': order.wallet_used,
                'reward_points_used': order.reward_points_used,
                'shipping_cost': order.shipping_cost,
                'tax_amount': order.tax_amount,
                'total_amount': order.total_amount,
                'currency': order.currency,
                'country_code': order.country_code,
                'coupon_code': order.coupon_code,
                'payment_method': order.payment_method,
                'payment_status': order.payment_status,
                'shipping_address': order.shipping_address,
                'billing_address': order.billing_address,
                'notes': order.notes,
                'created_at': order.created_at.isoformat() if order.created_at else None,
                'updated_at': order.updated_at.isoformat() if order.updated_at else None
            })
        
        return jsonify({
            'orders': orders_data,
            'page': page,
            'pages': pagination.pages,
            'total': pagination.total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get single order"""
    try:
        order = db.session.get(Order, order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Get order items
        items_data = []
        for item in order.items:
            items_data.append({
                'id': item.id,
                'product_id': item.product_id,
                'product_name': item.product_name,
                'product': {
                    'id': item.product.id,
                    'name': item.product.name,
                    'sku': item.product.sku
                } if item.product else None,
                'quantity': item.quantity,
                'unit_price': item.unit_price,
                'discount_amount': item.discount_amount,
                'group_discount': item.group_discount,
                'total_price': item.total_price,
                'currency': item.currency,
                'reward_points_earned': item.reward_points_earned,
                'created_at': item.created_at.isoformat() if item.created_at else None
            })
        
        order_data = {
            'id': order.id,
            'order_number': order.order_number,
            'user_id': order.user_id,
            'user': {
                'id': order.user.id,
                'full_name': order.user.full_name,
                'email': order.user.email
            } if order.user else None,
            'items': items_data,
            'status': order.status,
            'subtotal': order.subtotal,
            'discount_amount': order.discount_amount,
            'coupon_discount': order.coupon_discount,
            'group_discount': order.group_discount,
            'wallet_used': order.wallet_used,
            'reward_points_used': order.reward_points_used,
            'shipping_cost': order.shipping_cost,
            'tax_amount': order.tax_amount,
            'total_amount': order.total_amount,
            'currency': order.currency,
            'country_code': order.country_code,
            'coupon_code': order.coupon_code,
            'payment_method': order.payment_method,
            'payment_status': order.payment_status,
            'shipping_address': order.shipping_address,
            'billing_address': order.billing_address,
            'notes': order.notes,
            'created_at': order.created_at.isoformat() if order.created_at else None,
            'updated_at': order.updated_at.isoformat() if order.updated_at else None
        }
        
        return jsonify({'order': order_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/', methods=['POST'])
@jwt_required()
def create_order():
    """Create new order"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Generate order number
        order_number = generate_order_number()
        
        # Create order
        order = Order(
            order_number=order_number,
            user_id=data.get('user_id', current_user_id),
            status=data.get('status', 'pending'),
            subtotal=data.get('subtotal'),
            discount_amount=data.get('discount_amount', 0.0),
            coupon_discount=data.get('coupon_discount', 0.0),
            group_discount=data.get('group_discount', 0.0),
            wallet_used=data.get('wallet_used', 0.0),
            reward_points_used=data.get('reward_points_used', 0),
            shipping_cost=data.get('shipping_cost', 0.0),
            tax_amount=data.get('tax_amount', 0.0),
            total_amount=data.get('total_amount'),
            currency=data.get('currency', 'INR'),
            country_code=data.get('country_code'),
            coupon_code=data.get('coupon_code'),
            payment_method=data.get('payment_method'),
            payment_status=data.get('payment_status', 'pending'),
            shipping_address=data.get('shipping_address'),
            billing_address=data.get('billing_address'),
            notes=data.get('notes')
        )
        
        db.session.add(order)
        db.session.flush()  # Get order ID
        
        # Add order items
        for item_data in data.get('items', []):
            item = OrderItem(
                order_id=order.id,
                product_id=item_data['product_id'],
                product_name=item_data.get('product_name'),
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                discount_amount=item_data.get('discount_amount', 0.0),
                group_discount=item_data.get('group_discount', 0.0),
                total_price=item_data.get('total_price', item_data['unit_price'] * item_data['quantity']),
                currency=item_data.get('currency', 'INR'),
                reward_points_earned=item_data.get('reward_points_earned', 0)
            )
            db.session.add(item)
        
        db.session.commit()
        
        # Track analytics if order is paid (for Conversion Rate & Customer Distribution)
        if order.payment_status and order.payment_status.lower() == 'paid':
            track_order_analytics(order)
        
        return jsonify({
            'message': 'Order created successfully',
            'order_id': order.id,
            'order_number': order.order_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    """Update order status and track analytics"""
    try:
        order = db.session.get(Order, order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        data = request.get_json()
        old_status = order.status
        old_payment_status = order.payment_status
        
        if 'status' in data:
            order.status = data['status']
        if 'payment_status' in data:
            order.payment_status = data['payment_status']
        
        db.session.commit()
        
        # ========== AUTOMATIC ANALYTICS TRACKING ==========
        # Track analytics when:
        # 1. Payment status changes to 'paid' (most important)
        # 2. Order status changes from 'pending' to confirmed/paid
        old_paid = old_payment_status and old_payment_status.lower() == 'paid'
        new_paid = order.payment_status and order.payment_status.lower() == 'paid'
        payment_became_paid = not old_paid and new_paid
        status_became_confirmed = (old_status == 'pending' and 
                                   order.status in ['confirmed', 'processing', 'delivered', 'paid'])
        
        if payment_became_paid or status_became_confirmed:
            track_order_analytics(order)
        
        return jsonify({'message': 'Order status updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/bulk', methods=['DELETE'])
@jwt_required()
def bulk_delete_orders():
    """Bulk delete orders"""
    try:
        data = request.get_json()
        order_ids = data.get('order_ids', [])
        
        if not order_ids:
            return jsonify({'error': 'No order IDs provided'}), 400
        
        # Delete order items first
        OrderItem.query.filter(OrderItem.order_id.in_(order_ids)).delete(synchronize_session=False)
        
        # Delete orders
        deleted_count = Order.query.filter(Order.id.in_(order_ids)).delete(synchronize_session=False)
        
        db.session.commit()
        
        return jsonify({
            'message': f'{deleted_count} order(s) deleted successfully',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== USER ROUTES ====================

@app.route('/api/users/', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        is_active = request.args.get('is_active', type=lambda x: x.lower() == 'true')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Correct any negative reward balances before returning data
        corrected = False
        negative_users = User.query.filter(User.reward_points < 0).all()
        if negative_users:
            for neg_user in negative_users:
                neg_user.reward_points = 0
            corrected = True
        if corrected:
            db.session.commit()
        
        # Build query
        query = User.query
        
        # Apply filters
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    User.full_name.ilike(search_term),
                    User.email.ilike(search_term)
                )
            )
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        # Apply sorting
        if sort_by in ('name', 'full_name'):
            query = query.order_by(User.full_name.asc() if sort_order == 'asc' else User.full_name.desc())
        elif sort_by == 'email':
            query = query.order_by(User.email.asc() if sort_order == 'asc' else User.email.desc())
        elif sort_by == 'wallet_balance':
            query = query.order_by(User.wallet_balance.asc() if sort_order == 'asc' else User.wallet_balance.desc())
        elif sort_by == 'reward_points':
            query = query.order_by(User.reward_points.asc() if sort_order == 'asc' else User.reward_points.desc())
        else:  # created_at
            query = query.order_by(User.created_at.desc() if sort_order == 'desc' else User.created_at.asc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        users = pagination.items
        user_ids = [user.id for user in users]

        reward_summaries = {}
        if user_ids:
            summary_query = text("""
                SELECT user_id, available_points
                FROM user_reward_summary
                WHERE user_id IN :user_ids
            """).bindparams(bindparam('user_ids', expanding=True))
            summary_rows = db.session.execute(summary_query, {'user_ids': tuple(user_ids)}).fetchall()
            reward_summaries = {row.user_id: row.available_points for row in summary_rows}
        
        def get_reward_points(user_obj):
            summary_points = reward_summaries.get(user_obj.id)
            base_points = user_obj.reward_points or 0
            value = summary_points if summary_points is not None else base_points
            return max(int(value or 0), 0)
        
        users_data = [{
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'phone': user.phone,
            'country_code': user.country_code,
            'preferred_currency': user.preferred_currency,
            'wallet_balance': user.wallet_balance,
            'reward_points': get_reward_points(user),
            'reward_balance': {
                'available_points': get_reward_points(user)
            },
            'is_active': user.is_active,
            'email_verified': user.email_verified,
            'created_at': user.created_at.isoformat()
        } for user in users]
        
        return jsonify({
            'users': users_data,
            'page': page,
            'pages': pagination.pages,
            'total': pagination.total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/users/', methods=['POST'])
@jwt_required()
def create_user():
    """Create new user"""
    try:
        data = request.get_json()
        
        # Check if user exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create user
        user = User(
            email=data['email'],
            password_hash=generate_password_hash(data.get('password', 'Password123')),
            full_name=data.get('full_name'),
            phone=data.get('phone'),
            country_code=data.get('country_code', 'IND'),
            preferred_currency=data.get('preferred_currency', 'INR'),
            wallet_balance=data.get('wallet_balance', 0.0),
            reward_points=data.get('reward_points', 0),
            is_active=data.get('is_active', True),
            email_verified=data.get('email_verified', False)
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user"""
    try:
        user = db.session.get(User, user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        old_reward_points = user.reward_points or 0
        points_delta = 0
        new_reward_points = old_reward_points
        
        old_wallet_balance = float(user.wallet_balance or 0)
        wallet_delta = 0
        new_wallet_balance = old_wallet_balance
        
        # Update fields
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'email' in data:
            user.email = data['email']
        if 'phone' in data:
            user.phone = data['phone']
        if 'country_code' in data:
            user.country_code = data['country_code']
        if 'preferred_currency' in data:
            user.preferred_currency = data['preferred_currency']
        if 'wallet_balance' in data:
            try:
                new_wallet_balance = max(float(data['wallet_balance'] or 0), 0.0)
            except (ValueError, TypeError):
                return jsonify({'error': 'wallet_balance must be a number'}), 400
            wallet_delta = new_wallet_balance - old_wallet_balance
            user.wallet_balance = new_wallet_balance
        if 'reward_points' in data:
            try:
                new_reward_points = max(int(data['reward_points'] or 0), 0)
            except (ValueError, TypeError):
                return jsonify({'error': 'reward_points must be a number'}), 400
            points_delta = new_reward_points - old_reward_points
            user.reward_points = new_reward_points
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'email_verified' in data:
            user.email_verified = data['email_verified']

        if points_delta != 0:
            earned_delta = points_delta if points_delta > 0 else 0
            used_delta = abs(points_delta) if points_delta < 0 else 0

            summary_select = text("""
                SELECT available_points FROM user_reward_summary
                WHERE user_id = :user_id
            """)
            summary_row = db.session.execute(summary_select, {'user_id': user_id}).fetchone()

            if summary_row:
                summary_update = text("""
                    UPDATE user_reward_summary
                    SET 
                        available_points = :available_points,
                        points_earned = COALESCE(points_earned, 0) + :earned_delta,
                        points_used = COALESCE(points_used, 0) + :used_delta,
                        last_transaction_at = NOW(),
                        updated_at = NOW()
                    WHERE user_id = :user_id
                """)
                db.session.execute(summary_update, {
                    'available_points': new_reward_points,
                    'earned_delta': earned_delta,
                    'used_delta': used_delta,
                    'user_id': user_id
                })
            else:
                summary_insert = text("""
                    INSERT INTO user_reward_summary
                    (user_id, available_points, points_earned, points_used, created_at, updated_at, last_transaction_at)
                    VALUES (:user_id, :available_points, :points_earned, :points_used, NOW(), NOW(), NOW())
                """)
                db.session.execute(summary_insert, {
                    'user_id': user_id,
                    'available_points': new_reward_points,
                    'points_earned': max(new_reward_points, 0),
                    'points_used': 0
                })

            transaction_type = 'earned' if points_delta > 0 else 'redeemed'
            description = 'Reward balance updated via Users management'
            txn = RewardTransaction(
                user_id=user_id,
                transaction_type=transaction_type,
                points=abs(points_delta),
                balance_after=new_reward_points,
                reference_type='admin_profile_update',
                reference_id=None,
                description=description,
                expiry_date=None
            )
            db.session.add(txn)
        
        # Handle wallet balance change - create transaction record
        if wallet_delta != 0:
            transaction_type = 'credit' if wallet_delta > 0 else 'debit'
            wallet_txn = WalletTransaction(
                user_id=user_id,
                transaction_type=transaction_type,
                amount=abs(wallet_delta),
                currency=user.preferred_currency or 'INR',
                balance_after=new_wallet_balance,
                reference_type='admin_credit' if wallet_delta > 0 else 'admin_debit',
                reference_id=None,
                description=f'Wallet balance updated via Users management (Admin adjustment: {transaction_type} {abs(wallet_delta):.2f} {user.preferred_currency or "INR"})',
                status='completed'
            )
            db.session.add(wallet_txn)
            print(f"[Wallet Update] User {user_id}: {old_wallet_balance:.2f} → {new_wallet_balance:.2f} ({transaction_type} {abs(wallet_delta):.2f})")
        
        db.session.commit()
        
        return jsonify({'message': 'User updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def toggle_user_status(user_id):
    """Toggle user active status"""
    try:
        user = db.session.get(User, user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        user.is_active = data.get('is_active', not user.is_active)
        
        db.session.commit()
        
        return jsonify({
            'message': 'User status updated successfully',
            'is_active': user.is_active
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== COUPON ROUTES ====================

@app.route('/api/coupons/', methods=['GET'])
@jwt_required()
def get_coupons():
    """Get all coupons"""
    try:
        print("[COUPONS API] Request received")
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        print(f"[COUPONS API] Page: {page}, Per page: {per_page}")
        search = request.args.get('search', '')
        is_active = request.args.get('is_active', type=lambda x: x.lower() == 'true')
        
        # Build query
        query = Coupon.query
        
        # Apply filters
        if search:
            query = query.filter(Coupon.code.ilike(f'%{search}%'))
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        # Order by created date
        query = query.order_by(desc(Coupon.created_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        coupons = pagination.items
        print(f"[COUPONS API] Found {len(coupons)} coupons")
        
        coupons_data = [{
            'id': coupon.id,
            'code': coupon.code,
            'description': coupon.description,
            'discount_type': coupon.discount_type,
            'discount_value': coupon.discount_value,
            'currency': coupon.currency,
            'min_purchase_amount': coupon.min_purchase_amount,
            'max_discount_amount': coupon.max_discount_amount,
            'usage_limit': coupon.usage_limit,
            'usage_per_user': coupon.usage_per_user,
            'usage_count': coupon.usage_count,
            'valid_from': coupon.valid_from.isoformat() if coupon.valid_from else None,
            'valid_until': coupon.valid_until.isoformat() if coupon.valid_until else None,
            'applicable_countries': coupon.applicable_countries,
            'applicable_categories': coupon.applicable_categories,
            'applicable_products': coupon.applicable_products,
            'is_active': coupon.is_active,
            # Reward Points Integration
            'can_combine_with_reward_points': getattr(coupon, 'can_combine_with_reward_points', True),
            'reward_points_multiplier': getattr(coupon, 'reward_points_multiplier', 1.0),
            'created_by': coupon.created_by,
            'created_at': coupon.created_at.isoformat(),
            'updated_at': coupon.updated_at.isoformat() if coupon.updated_at else None
        } for coupon in coupons]
        
        print(f"[COUPONS API] Returning {len(coupons_data)} coupons successfully")
        return jsonify({
            'coupons': coupons_data,
            'page': page,
            'pages': pagination.pages,
            'total': pagination.total
        }), 200
        
    except Exception as e:
        print(f"[COUPONS API ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupons/', methods=['POST'])
@jwt_required()
def create_coupon():
    """Create new coupon"""
    try:
        data = request.get_json()
        current_user_id = get_jwt_identity()
        
        # Parse user ID to get admin user ID
        admin_user_id = None
        if current_user_id and current_user_id.startswith('admin_'):
            admin_user_id = int(current_user_id.replace('admin_', ''))
        
        # Check if coupon code exists
        if Coupon.query.filter_by(code=data['code']).first():
            return jsonify({'error': 'Coupon code already exists'}), 400
        
        # Parse dates using helper function
        valid_from = parse_date(data.get('valid_from'))
        valid_until = parse_date(data.get('valid_until'))
        
        # REWARD POINTS INTEGRATION - CRITICAL FIX
        can_combine = data.get('can_combine_with_reward_points', True)
        points_multiplier = data.get('reward_points_multiplier', 1.0)
        
        print(f"[CREATE COUPON] Code: {data['code']}")
        print(f"[CREATE COUPON] Can combine with points: {can_combine}")
        print(f"[CREATE COUPON] Points multiplier: {points_multiplier}")
        
        coupon = Coupon(
            code=data['code'],
            description=data.get('description'),
            discount_type=data['discount_type'],
            discount_value=data['discount_value'],
            currency=data.get('currency', 'INR'),
            min_purchase_amount=data.get('min_purchase_amount', 0.0),
            max_discount_amount=data.get('max_discount_amount'),
            usage_limit=data.get('usage_limit'),
            usage_per_user=data.get('usage_per_user'),
            valid_from=valid_from,
            valid_until=valid_until,
            applicable_countries=data.get('applicable_countries'),
            applicable_categories=data.get('applicable_categories'),
            applicable_products=data.get('applicable_products'),
            is_active=data.get('is_active', True),
            # REWARD POINTS FIELDS - NOW INCLUDED!
            can_combine_with_reward_points=can_combine,
            reward_points_multiplier=float(points_multiplier),
            created_by=admin_user_id
        )
        
        db.session.add(coupon)
        db.session.commit()
        
        print(f"[CREATE COUPON] ✅ Saved to DB - ID: {coupon.id}, Can combine: {coupon.can_combine_with_reward_points}")
        
        return jsonify({
            'message': 'Coupon created successfully',
            'coupon_id': coupon.id,
            'can_combine_with_reward_points': coupon.can_combine_with_reward_points,
            'reward_points_multiplier': coupon.reward_points_multiplier
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupons/<int:coupon_id>', methods=['PUT'])
@jwt_required()
def update_coupon(coupon_id):
    """Update coupon"""
    try:
        coupon = db.session.get(Coupon, coupon_id)
        
        if not coupon:
            return jsonify({'error': 'Coupon not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'code' in data:
            coupon.code = data['code']
        if 'description' in data:
            coupon.description = data['description']
        if 'discount_type' in data:
            coupon.discount_type = data['discount_type']
        if 'discount_value' in data:
            coupon.discount_value = data['discount_value']
        if 'currency' in data:
            coupon.currency = data['currency']
        if 'min_purchase_amount' in data:
            coupon.min_purchase_amount = data['min_purchase_amount']
        if 'max_discount_amount' in data:
            coupon.max_discount_amount = data['max_discount_amount']
        if 'usage_limit' in data:
            coupon.usage_limit = data['usage_limit']
        if 'usage_per_user' in data:
            coupon.usage_per_user = data['usage_per_user']
        if 'valid_from' in data:
            coupon.valid_from = parse_date(data['valid_from'])
        if 'valid_until' in data:
            coupon.valid_until = parse_date(data['valid_until'])
        if 'applicable_countries' in data:
            coupon.applicable_countries = data['applicable_countries']
        if 'applicable_categories' in data:
            coupon.applicable_categories = data['applicable_categories']
        if 'applicable_products' in data:
            coupon.applicable_products = data['applicable_products']
        if 'is_active' in data:
            coupon.is_active = data['is_active']
        
        # REWARD POINTS FIELDS - CRITICAL FIX!
        if 'can_combine_with_reward_points' in data:
            coupon.can_combine_with_reward_points = data['can_combine_with_reward_points']
            print(f"[UPDATE COUPON] Can combine with points: {data['can_combine_with_reward_points']}")
        if 'reward_points_multiplier' in data:
            coupon.reward_points_multiplier = float(data['reward_points_multiplier'])
            print(f"[UPDATE COUPON] Points multiplier: {data['reward_points_multiplier']}")
        
        coupon.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        print(f"[UPDATE COUPON] ✅ Updated coupon ID {coupon_id} - Can combine: {coupon.can_combine_with_reward_points}")
        
        return jsonify({
            'message': 'Coupon updated successfully',
            'can_combine_with_reward_points': coupon.can_combine_with_reward_points,
            'reward_points_multiplier': coupon.reward_points_multiplier
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupons/<int:coupon_id>', methods=['GET'])
@jwt_required()
def get_coupon(coupon_id):
    """Get single coupon"""
    try:
        coupon = db.session.get(Coupon, coupon_id)
        
        if not coupon:
            return jsonify({'error': 'Coupon not found'}), 404
        
        coupon_data = {
            'id': coupon.id,
            'code': coupon.code,
            'description': coupon.description,
            'discount_type': coupon.discount_type,
            'discount_value': coupon.discount_value,
            'currency': coupon.currency,
            'min_purchase_amount': coupon.min_purchase_amount,
            'max_discount_amount': coupon.max_discount_amount,
            'usage_limit': coupon.usage_limit,
            'usage_per_user': coupon.usage_per_user,
            'usage_count': coupon.usage_count,
            'valid_from': coupon.valid_from.isoformat() if coupon.valid_from else None,
            'valid_until': coupon.valid_until.isoformat() if coupon.valid_until else None,
            'applicable_countries': coupon.applicable_countries,
            'applicable_categories': coupon.applicable_categories,
            'applicable_products': coupon.applicable_products,
            'is_active': coupon.is_active,
            'created_by': coupon.created_by,
            'created_at': coupon.created_at.isoformat(),
            'updated_at': coupon.updated_at.isoformat() if coupon.updated_at else None
        }
        
        return jsonify({'coupon': coupon_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupons/<int:coupon_id>', methods=['DELETE'])
@jwt_required()
def delete_coupon(coupon_id):
    """Delete coupon"""
    try:
        coupon = db.session.get(Coupon, coupon_id)
        
        if not coupon:
            return jsonify({'error': 'Coupon not found'}), 404
        
        db.session.delete(coupon)
        db.session.commit()
        
        return jsonify({'message': 'Coupon deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@app.route('/api/coupons/validate', methods=['POST'])
@jwt_required()
def validate_coupon():
    """Validate a coupon code for checkout"""
    try:
        data = request.get_json()
        code = data.get('code')
        user_id = data.get('user_id')
        country_code = data.get('country_code')
        category_id = data.get('category_id')
        product_id = data.get('product_id')
        cart_total = data.get('cart_total', 0)
        
        if not code:
            return jsonify({'error': 'Coupon code is required'}), 400
        
        # Find coupon by code
        coupon = Coupon.query.filter_by(code=code.upper()).first()
        
        if not coupon:
            return jsonify({'valid': False, 'error': 'Invalid coupon code'}), 200
        
        # Check if active
        if not coupon.is_active:
            return jsonify({'valid': False, 'error': 'Coupon is not active'}), 200
        
        # Check date validity
        from datetime import date
        today = date.today()
        if coupon.valid_from and today < coupon.valid_from:
            return jsonify({'valid': False, 'error': 'Coupon is not yet valid'}), 200
        if coupon.valid_until and today > coupon.valid_until:
            return jsonify({'valid': False, 'error': 'Coupon has expired'}), 200
        
        # Check usage limit
        if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
            return jsonify({'valid': False, 'error': 'Coupon usage limit reached'}), 200
        
        # Check usage per user
        if coupon.usage_per_user and user_id:
            user_usage = CouponUsage.query.filter_by(
                coupon_id=coupon.id,
                user_id=user_id
            ).count()
            if user_usage >= coupon.usage_per_user:
                return jsonify({'valid': False, 'error': 'You have reached the usage limit for this coupon'}), 200
        
        # Check minimum purchase amount
        if coupon.min_purchase_amount and cart_total < coupon.min_purchase_amount:
            return jsonify({
                'valid': False,
                'error': f'Minimum purchase amount of {coupon.currency} {coupon.min_purchase_amount} required'
            }), 200
        
        # Check applicable countries
        import json
        if coupon.applicable_countries:
            try:
                # Parse countries list (can be JSON array or comma-separated string)
                if coupon.applicable_countries.startswith('['):
                    countries = json.loads(coupon.applicable_countries)
                else:
                    countries = [c.strip() for c in coupon.applicable_countries.split(',') if c.strip()]
                
                if countries and country_code not in countries:
                    return jsonify({'valid': False, 'error': 'Coupon not applicable in your country'}), 200
            except Exception as e:
                print(f"Error parsing applicable_countries: {e}")
                pass
        
        # Check applicable categories
        if coupon.applicable_categories and category_id:
            try:
                categories = json.loads(coupon.applicable_categories) if isinstance(coupon.applicable_categories, str) else []
                if categories and category_id not in categories:
                    return jsonify({'valid': False, 'error': 'Coupon not applicable for this category'}), 200
            except:
                pass
        
        # Check applicable products
        if coupon.applicable_products and product_id:
            try:
                products = json.loads(coupon.applicable_products) if isinstance(coupon.applicable_products, str) else []
                if products and product_id not in products:
                    return jsonify({'valid': False, 'error': 'Coupon not applicable for this product'}), 200
            except:
                pass
        
        # Calculate discount WITH CURRENCY CONVERSION
        # Get user's currency and country
        user_currency = data.get('currency', 'INR')
        
        # Convert coupon value to user's currency if needed
        discount_value_in_user_currency = coupon.discount_value
        if coupon.currency != user_currency and coupon.discount_type == 'fixed_amount':
            # Convert fixed amount discount to user's currency
            currency_obj = Currency.query.filter_by(currency_code=user_currency).first()
            coupon_currency_obj = Currency.query.filter_by(currency_code=coupon.currency).first()
            
            if currency_obj and coupon_currency_obj:
                # Convert: coupon currency → user currency
                # If coupon is ₹500 INR and user currency is AED
                # ₹500 / 83.5 (INR rate) × 4.1 (AED rate) = AED 24.55
                conversion_rate = currency_obj.exchange_rate / coupon_currency_obj.exchange_rate
                discount_value_in_user_currency = coupon.discount_value * conversion_rate
                print(f"💱 Coupon currency conversion: {coupon.currency} {coupon.discount_value} → {user_currency} {discount_value_in_user_currency:.2f}")
        
        # Calculate discount
        if coupon.discount_type == 'percentage':
            discount = (cart_total * coupon.discount_value) / 100
            if coupon.max_discount_amount:
                # Convert max discount to user currency too
                max_discount_in_user_currency = coupon.max_discount_amount
                if coupon.currency != user_currency:
                    currency_obj = Currency.query.filter_by(currency_code=user_currency).first()
                    coupon_currency_obj = Currency.query.filter_by(currency_code=coupon.currency).first()
                    if currency_obj and coupon_currency_obj:
                        conversion_rate = currency_obj.exchange_rate / coupon_currency_obj.exchange_rate
                        max_discount_in_user_currency = coupon.max_discount_amount * conversion_rate
                discount = min(discount, max_discount_in_user_currency)
        elif coupon.discount_type == 'fixed_amount':
            discount = discount_value_in_user_currency  # Use converted value
        else:
            discount = 0
        
        # Return valid coupon WITH CONVERSION INFO
        return jsonify({
            'valid': True,
            'coupon': {
                'id': coupon.id,
                'code': coupon.code,
                'description': coupon.description,
                'discount_type': coupon.discount_type,
                'discount_value': coupon.discount_value,
                'currency': coupon.currency,
                'max_discount_amount': coupon.max_discount_amount,
                'discount_value_in_user_currency': round(discount_value_in_user_currency, 2),
                'user_currency': user_currency,
                'was_converted': coupon.currency != user_currency
            },
            'discount_amount': round(discount, 2),
            'final_total': round(cart_total - discount, 2)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== COUPON USAGE ROUTES ====================

@app.route('/api/coupon-usage/', methods=['GET'])
@jwt_required()
def get_coupon_usages():
    """Get all coupon usage records"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        coupon_id = request.args.get('coupon_id', type=int)
        user_id = request.args.get('user_id', type=int)
        
        # Build query
        query = CouponUsage.query
        
        # Apply filters
        if coupon_id:
            query = query.filter_by(coupon_id=coupon_id)
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        # Order by most recent
        query = query.order_by(desc(CouponUsage.used_at))
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        usages = pagination.items
        
        usages_data = []
        for usage in usages:
            usages_data.append({
                'id': usage.id,
                'coupon': {
                    'id': usage.coupon.id,
                    'code': usage.coupon.code,
                    'discount_type': usage.coupon.discount_type,
                    'discount_value': usage.coupon.discount_value
                } if usage.coupon else None,
                'user': {
                    'id': usage.user.id,
                    'email': usage.user.email,
                    'full_name': usage.user.full_name
                } if usage.user else None,
                'order_id': usage.order_id,
                'discount_amount': usage.discount_amount,
                'currency': usage.currency,
                'used_at': usage.used_at.isoformat()
            })
        
        return jsonify({
            'coupon_usages': usages_data,
            'page': page,
            'pages': pagination.pages,
            'total': pagination.total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupon-usage/', methods=['POST'])
@jwt_required()
def create_coupon_usage():
    """Record a coupon usage"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('coupon_id') or not data.get('user_id'):
            return jsonify({'error': 'coupon_id and user_id are required'}), 400
        
        # Check if coupon exists and is valid
        coupon = db.session.get(Coupon, data['coupon_id'])
        if not coupon:
            return jsonify({'error': 'Coupon not found'}), 404
        
        if not coupon.is_active:
            return jsonify({'error': 'Coupon is not active'}), 400
        
        # Check usage limit
        if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
            return jsonify({'error': 'Coupon usage limit reached'}), 400
        
        # Create usage record
        usage = CouponUsage(
            coupon_id=data['coupon_id'],
            user_id=data['user_id'],
            order_id=data.get('order_id'),
            discount_amount=data.get('discount_amount', 0.0),
            currency=data.get('currency', 'INR')
        )
        
        db.session.add(usage)
        
        # Increment coupon usage count
        coupon.usage_count = coupon.usage_count + 1
        
        db.session.commit()
        
        return jsonify({
            'message': 'Coupon usage recorded successfully',
            'usage_id': usage.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupon-usage/<int:usage_id>', methods=['GET'])
@jwt_required()
def get_coupon_usage(usage_id):
    """Get single coupon usage record"""
    try:
        usage = db.session.get(CouponUsage, usage_id)
        
        if not usage:
            return jsonify({'error': 'Coupon usage record not found'}), 404
        
        usage_data = {
            'id': usage.id,
            'coupon': {
                'id': usage.coupon.id,
                'code': usage.coupon.code,
                'discount_type': usage.coupon.discount_type,
                'discount_value': usage.coupon.discount_value
            } if usage.coupon else None,
            'user': {
                'id': usage.user.id,
                'email': usage.user.email,
                'full_name': usage.user.full_name
            } if usage.user else None,
            'order': {
                'id': usage.order.id,
                'order_number': usage.order.order_number
            } if usage.order else None,
            'discount_amount': usage.discount_amount,
            'currency': usage.currency,
            'used_at': usage.used_at.isoformat()
        }
        
        return jsonify({'coupon_usage': usage_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupon-usage/<int:usage_id>', methods=['DELETE'])
@jwt_required()
def delete_coupon_usage(usage_id):
    """Delete coupon usage record"""
    try:
        usage = db.session.get(CouponUsage, usage_id)
        
        if not usage:
            return jsonify({'error': 'Coupon usage record not found'}), 404
        
        # Decrement coupon usage count
        coupon = usage.coupon
        if coupon and coupon.usage_count > 0:
            coupon.usage_count = coupon.usage_count - 1
        
        db.session.delete(usage)
        db.session.commit()
        
        return jsonify({'message': 'Coupon usage record deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/coupons/<int:coupon_id>/usage-stats', methods=['GET'])
@jwt_required()
def get_coupon_usage_stats(coupon_id):
    """Get usage statistics for a specific coupon"""
    try:
        coupon = db.session.get(Coupon, coupon_id)
        
        if not coupon:
            return jsonify({'error': 'Coupon not found'}), 404
        
        # Get all usage records for this coupon
        usages = CouponUsage.query.filter_by(coupon_id=coupon_id).all()
        
        # Calculate statistics
        total_usage = len(usages)
        total_discount = sum([usage.discount_amount for usage in usages])
        unique_users = len(set([usage.user_id for usage in usages]))
        
        # Get usage by currency
        usage_by_currency = {}
        for usage in usages:
            curr = usage.currency
            if curr not in usage_by_currency:
                usage_by_currency[curr] = {'count': 0, 'total_discount': 0}
            usage_by_currency[curr]['count'] += 1
            usage_by_currency[curr]['total_discount'] += usage.discount_amount
        
        return jsonify({
            'coupon_id': coupon_id,
            'coupon_code': coupon.code,
            'total_usage': total_usage,
            'usage_limit': coupon.usage_limit,
            'remaining_uses': (coupon.usage_limit - total_usage) if coupon.usage_limit else None,
            'unique_users': unique_users,
            'total_discount_given': round(total_discount, 2),
            'usage_by_currency': usage_by_currency
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
# ==================== CURRENCY ROUTES ====================

@app.route('/api/currencies/fetch-live-rates', methods=['POST'])
@jwt_required()
def fetch_live_exchange_rates():
    """Fetch live exchange rates from external API and update database"""
    try:
        import requests
        ensure_currency_schema()

        current_user = get_jwt_identity()
        fetch_log = CurrencyRateFetchLog(
            fetched_by=str(current_user) if current_user else 'system',
            status='pending'
        )
        db.session.add(fetch_log)
        db.session.flush()
        
        # Get base currency (INR)
        base_currency = Currency.query.filter_by(is_base_currency=True).first()
        if not base_currency:
            base_currency = Currency.query.filter_by(currency_code='INR').first()
        
        base_code = base_currency.currency_code if base_currency else 'INR'
        
        api_sources = [
            (
                f'https://api.exchangerate-api.com/v4/latest/{base_code}',
                'api.exchangerate-api.com'
            ),
            (
                f'https://api.exchangerate.host/latest?base={base_code}',
                'api.exchangerate.host'
            )
        ]

        response_data = None
        active_source = None

        for url, source_name in api_sources:
            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                response_data = response.json()
                active_source = source_name
                break
            except requests.RequestException:
                continue

        if not response_data:
            fetch_log.status = 'failure'
            fetch_log.base_currency = base_code
            fetch_log.provider = 'unavailable'
            fetch_log.message = 'Failed to fetch rates from all providers'
            db.session.commit()
            return jsonify({
                'success': False,
                'error': 'Failed to fetch rates from all providers'
            }), 500
        
        rates = response_data.get('rates', {})
        updated_count = 0
        unchanged_count = 0
        now_utc = datetime.now(timezone.utc)
        
        for currency in Currency.query.filter_by(is_active=True).all():
            if currency.currency_code == base_code:
                continue

            if currency.currency_code not in rates:
                unchanged_count += 1
                continue

            try:
                api_rate = float(rates[currency.currency_code])
            except (TypeError, ValueError):
                unchanged_count += 1
                continue

            currency.api_rate = api_rate

            effective_rate = calculate_effective_rate(currency, api_rate)

            old_rate = float(currency.exchange_rate or 0)
            change_percent = ((effective_rate - old_rate) / old_rate * 100) if old_rate else 100.0
            rate_changed = abs(effective_rate - old_rate) > 1e-6

            currency.exchange_rate = effective_rate
            currency.last_updated = now_utc
            currency.last_api_update = now_utc
            currency.rate_source = active_source
            currency.manual_override = False
            currency.manual_rate = None

            history_entry = CurrencyRateHistory(
                currency_code=currency.currency_code,
                old_rate=old_rate if old_rate else effective_rate,
                new_rate=effective_rate,
                rate_change_percent=change_percent if rate_changed else 0,
                change_source=f'api:{active_source}',
                changed_by=str(current_user) if current_user else 'system',
                change_reason='Live rate fetch'
            )
            db.session.add(history_entry)
            if rate_changed:
                updated_count += 1
            else:
                unchanged_count += 1

            audit_entry = PricingAuditLog(
                action_type='update',
                entity_type='currency',
                entity_id=currency.id,
                old_value=str(old_rate),
                new_value=str(effective_rate),
                performed_by=str(current_user) if current_user else 'system',
                notes='Live rate fetch via admin panel'
            )
            db.session.add(audit_entry)

        fetch_log.provider = active_source
        fetch_log.base_currency = base_code
        fetch_log.updated_count = updated_count
        fetch_log.unchanged_count = unchanged_count
        fetch_log.status = 'success'
        fetch_log.message = f'Fetched {len(rates)} rates'
        try:
            preview_rates = {k: rates[k] for k in list(rates.keys())[:20]}
        except Exception:
            preview_rates = {}
        fetch_log.raw_payload = json.dumps({
            'base': response_data.get('base', base_code),
            'timestamp': response_data.get('time_last_updated'),
            'rates_sample': preview_rates
        })

        db.session.commit()

        print(f"[Live Rate Fetch] base={base_code} provider={active_source} updated={updated_count} unchanged={unchanged_count}")

        return jsonify({
            'success': True,
            'message': f'Live rates processed. Updated: {updated_count}, unchanged: {unchanged_count}',
            'updated_count': updated_count,
            'unchanged_count': unchanged_count,
            'base_currency': base_code,
            'rates': rates,
            'provider': active_source,
            'fetched_at_local': format_timestamp(fetch_log.fetched_at)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        try:
            failure_log = CurrencyRateFetchLog(
                provider='unknown',
                base_currency=locals().get('base_code', None),
                fetched_by=str(locals().get('current_user')) if locals().get('current_user') else 'system',
                status='failure',
                message=str(e)[:255]
            )
            db.session.add(failure_log)
            db.session.commit()
        except Exception as log_error:
            print(f"[Live Rate Fetch] Failed to record failure log: {log_error}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/currencies/manual-update', methods=['POST'])
@jwt_required()
def manual_update_currency():
    """Manually update a currency's exchange rate and adjustments"""
    try:
        ensure_currency_schema()
        data = request.get_json()
        currency_code = data.get('currency_code')
        current_user = get_jwt_identity()
        
        currency = Currency.query.filter_by(currency_code=currency_code).first()
        if not currency:
            return jsonify({'error': 'Currency not found'}), 404
        
        old_rate = float(currency.exchange_rate or 0)

        base_rate = data.get('api_rate')
        if base_rate is None:
            base_rate = data.get('exchange_rate')
        if base_rate is None:
            base_rate = currency.api_rate if currency.api_rate else currency.exchange_rate
        base_rate = float(base_rate or 0)

        currency.api_rate = base_rate

        if 'custom_percentage_change' in data:
            currency.custom_percentage_change = float(data['custom_percentage_change'])
        if 'custom_value_factor' in data:
            currency.custom_value_factor = float(data['custom_value_factor'])
        if 'adjustment_factor' in data:
            currency.adjustment_factor = float(data['adjustment_factor'])
        if 'regional_tax_percent' in data:
            currency.regional_tax_percent = float(data['regional_tax_percent'])
        if 'is_active' in data:
            currency.is_active = bool(data['is_active'])
        
        manual_override_flag = data.get('manual_override')
        has_adjustments = any([
            abs(currency.custom_percentage_change or 0) > 1e-6,
            abs((currency.custom_value_factor or 1) - 1) > 1e-6,
            abs((currency.adjustment_factor or 1) - 1) > 1e-6
        ])
        currency.manual_override = bool(manual_override_flag) if manual_override_flag is not None else True

        effective_rate = calculate_effective_rate(currency, base_rate)
        currency.exchange_rate = effective_rate
        currency.manual_rate = effective_rate
        currency.last_updated = datetime.now(timezone.utc)
        currency.rate_source = 'manual:dashboard'
        currency.last_api_update = datetime.now(timezone.utc)

        new_rate = float(effective_rate)
        if old_rate != new_rate:
            change_percent = ((new_rate - old_rate) / old_rate * 100) if old_rate else None

            history_entry = CurrencyRateHistory(
                currency_code=currency.currency_code,
                old_rate=old_rate if old_rate else new_rate,
                new_rate=new_rate,
                rate_change_percent=change_percent,
                change_source='manual',
                changed_by=str(current_user) if current_user else 'admin',
                change_reason=data.get('change_reason')
            )
            db.session.add(history_entry)
        db.session.commit()

        log_pricing_action(
            action_type='currency_manual_update',
            entity_type='currency',
            entity_id=currency.id,
            old_value=json.dumps({'currency': currency.currency_code, 'old_rate': old_rate}),
            new_value=json.dumps({
                'currency': currency.currency_code,
                'new_rate': new_rate,
                'markup_pct': float(currency.custom_percentage_change or 0),
                'value_factor': float(currency.custom_value_factor or 1),
                'adjustment_factor': float(currency.adjustment_factor or 1)
            }),
            performed_by=str(current_user) if current_user else 'system',
            notes=data.get('change_reason') or 'Manual currency update'
        )
        
        return jsonify({
            'success': True,
            'message': 'Currency updated successfully',
            'currency': {
                'currency_code': currency.currency_code,
                'api_rate': float(currency.api_rate or 0),
                'exchange_rate': new_rate,
                'custom_percentage_change': float(currency.custom_percentage_change),
                'custom_value_factor': float(currency.custom_value_factor),
                'adjustment_factor': float(currency.adjustment_factor),
                'last_updated': currency.last_updated.isoformat(),
                'manual_override': currency.manual_override,
                'has_adjustments': has_adjustments
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/advanced/pricing/recalculate', methods=['POST'])
@jwt_required()
def recalculate_product_prices():
    """Recalculate product prices for all active currencies."""
    try:
        # Normalise existing pricing_type values to single-character codes before recalculation
        db.session.execute(
            text(
                """
                UPDATE product_prices
                SET pricing_type = :auto_type
                WHERE pricing_type IS NULL
                   OR TRIM(pricing_type) = ''
                   OR LOWER(pricing_type) IN ('auto', 'standard', 's')
                """
            ),
            {'auto_type': PRICING_TYPE_AUTO}
        )
        db.session.execute(
            text(
                """
                UPDATE product_prices
                SET pricing_type = :manual_type
                WHERE LOWER(pricing_type) IN ('manual', 'locked', 'm')
                """
            ),
            {'manual_type': PRICING_TYPE_MANUAL}
        )

        products = Product.query.all()
        currencies = Currency.query.filter_by(is_active=True).all()

        admin_identifier = str(get_jwt_identity() or 'system')

        recalculated_count = 0
        currency_totals = {}

        for product in products:
            try:
                base_price_in_inr = float(product.base_price or 0.0)
            except (TypeError, ValueError):
                base_price_in_inr = 0.0

            for currency in currencies:
                effective_rate = calculate_effective_rate(currency)
                converted_price = round(base_price_in_inr * effective_rate, 2)
                default_country_code = _default_country_code_for_currency(currency.currency_code)

                price_entry = ProductPrice.query.filter_by(
                    product_id=product.id,
                    currency_code=currency.currency_code
                ).order_by(ProductPrice.id.asc()).first()

                if price_entry:
                    if normalize_pricing_type(price_entry.pricing_type) != PRICING_TYPE_AUTO:
                        continue
                    old_price = float(price_entry.price or 0.0)
                    if price_entry.country_code in (None, '', 'GLOBAL', 'INT'):
                        price_entry.country_code = default_country_code
                    price_entry.price = converted_price
                    price_entry.pricing_type = PRICING_TYPE_AUTO
                    price_entry.updated_at = datetime.now(timezone.utc)
                else:
                    old_price = None
                    price_entry = ProductPrice(
                        product_id=product.id,
                        country_code=default_country_code,
                        currency_code=currency.currency_code,
                        price=converted_price,
                        pricing_type=PRICING_TYPE_AUTO,
                        is_active=True
                    )
                    db.session.add(price_entry)

                recalculated_count += 1
                currency_totals[currency.currency_code] = currency_totals.get(currency.currency_code, 0) + 1

                audit_entry = PricingAuditLog(
                    action_type='update',
                    entity_type='product_pricing',
                    entity_id=product.id,
                    old_value=f"{currency.currency_code}:{old_price}" if old_price is not None else None,
                    new_value=f"{currency.currency_code}:{converted_price}",
                    performed_by=admin_identifier,
                    notes=f'Automatic recalculation based on effective rate {effective_rate}'
                )
                db.session.add(audit_entry)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Recalculated prices for {len(products)} products across {len(currencies)} currencies',
            'data': {
                'recalculated_count': recalculated_count,
                'products_count': len(products),
                'currencies_count': len(currencies),
                'currency_totals': currency_totals,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/currencies/', methods=['GET'])
@jwt_required()
def get_currencies():
    """Get all currencies"""
    try:
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        if include_inactive:
            currencies = Currency.query.order_by(Currency.currency_code).all()
        else:
            currencies = Currency.query.filter_by(is_active=True).order_by(Currency.currency_code).all()
        
        currencies_data = [{
            'id': curr.id,
            'currency_code': curr.currency_code,
            'currency_name': curr.currency_name,
            'currency_symbol': curr.currency_symbol,
            'api_rate': curr.api_rate,
            'exchange_rate': curr.exchange_rate,
            'is_base_currency': curr.is_base_currency,
            'is_active': curr.is_active,
            'last_updated': curr.last_updated.isoformat() if curr.last_updated else None,
            'created_at': curr.created_at.isoformat() if curr.created_at else None,
            'adjustment_factor': curr.adjustment_factor,
            'custom_percentage_change': curr.custom_percentage_change,
            'custom_value_factor': curr.custom_value_factor,
            'regional_tax_percent': curr.regional_tax_percent
        } for curr in currencies]
        
        return jsonify({'currencies': currencies_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/currencies/', methods=['POST'])
@jwt_required()
def create_currency():
    """Create new currency"""
    try:
        data = request.get_json()
        
        # Check if currency code exists
        if Currency.query.filter_by(currency_code=data['currency_code']).first():
            return jsonify({'error': 'Currency code already exists'}), 400
        
        currency = Currency(
            currency_code=data.get('currency_code'),
            currency_name=data.get('currency_name'),
            currency_symbol=data.get('currency_symbol'),
            api_rate=data.get('api_rate', data.get('exchange_rate', 1.0)),
            exchange_rate=data.get('exchange_rate', 1.0),
            is_base_currency=data.get('is_base_currency', False),
            is_active=data.get('is_active', True),
            adjustment_factor=data.get('adjustment_factor', 1.0),
            custom_percentage_change=data.get('custom_percentage_change', 0.0),
            custom_value_factor=data.get('custom_value_factor', 1.0),
            regional_tax_percent=data.get('regional_tax_percent', 0.0)
        )
        currency.exchange_rate = calculate_effective_rate(currency)
        currency.rate_source = 'manual'
        
        db.session.add(currency)
        db.session.commit()
        
        return jsonify({
            'message': 'Currency created successfully',
            'currency_id': currency.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
def get_currency(currency_id):
    """Get single currency"""
    try:
        currency = db.session.get(Currency, currency_id)
        
        if not currency:
            return jsonify({'error': 'Currency not found'}), 404
        
        currency_data = {
            'id': currency.id,
            'currency_code': currency.currency_code,
            'currency_name': currency.currency_name,
            'currency_symbol': currency.currency_symbol,
            'api_rate': currency.api_rate,
            'exchange_rate': currency.exchange_rate,
            'is_base_currency': currency.is_base_currency,
            'is_active': currency.is_active,
            'last_updated': currency.last_updated.isoformat() if currency.last_updated else None,
            'created_at': currency.created_at.isoformat() if currency.created_at else None,
            'adjustment_factor': currency.adjustment_factor,
            'custom_percentage_change': currency.custom_percentage_change,
            'custom_value_factor': currency.custom_value_factor,
            'regional_tax_percent': currency.regional_tax_percent
        }
        
        return jsonify({'currency': currency_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/currencies/<int:currency_id>', methods=['PUT'])
@jwt_required()
def update_currency(currency_id):
    """Update currency"""
    try:
        currency = db.session.get(Currency, currency_id)
        
        if not currency:
            return jsonify({'error': 'Currency not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'currency_code' in data:
            # Check for duplicates
            existing = Currency.query.filter_by(currency_code=data['currency_code']).first()
            if existing and existing.id != currency_id:
                return jsonify({'error': 'Currency code already exists'}), 400
            currency.currency_code = data['currency_code']
        if 'currency_name' in data:
            currency.currency_name = data['currency_name']
        if 'currency_symbol' in data:
            currency.currency_symbol = data['currency_symbol']
        if 'exchange_rate' in data:
            currency.exchange_rate = data['exchange_rate']
            currency.last_updated = datetime.now(timezone.utc)
        if 'is_base_currency' in data:
            currency.is_base_currency = data['is_base_currency']
        if 'is_active' in data:
            currency.is_active = data['is_active']
        if 'adjustment_factor' in data:
            currency.adjustment_factor = data['adjustment_factor']
        if 'custom_percentage_change' in data:
            currency.custom_percentage_change = data['custom_percentage_change']
        if 'custom_value_factor' in data:
            currency.custom_value_factor = data['custom_value_factor']
        if 'regional_tax_percent' in data:
            currency.regional_tax_percent = data['regional_tax_percent']
        
        db.session.commit()
        
        # Return the updated currency data
        return jsonify({
            'message': 'Currency updated successfully',
            'currency': {
                'id': currency.id,
                'currency_code': currency.currency_code,
                'currency_name': currency.currency_name,
                'currency_symbol': currency.currency_symbol,
                'exchange_rate': float(currency.exchange_rate),
                'adjustment_factor': float(currency.adjustment_factor) if currency.adjustment_factor else 1.0,
                'is_active': currency.is_active,
                'auto_update': currency.auto_update if hasattr(currency, 'auto_update') else True,
                'last_updated': currency.last_updated.isoformat() if currency.last_updated else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@app.route('/api/manage/currencies/<string:currency_code>/', methods=['PUT'])
@jwt_required()
def update_currency_by_code(currency_code):
    """Update currency by code (for CurrencyManagement.js component)"""
    try:
        currency = Currency.query.filter_by(currency_code=currency_code).first()
        
        if not currency:
            return jsonify({'error': f'Currency {currency_code} not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            currency.currency_name = data['name']
        if 'symbol' in data:
            currency.currency_symbol = data['symbol']
        if 'exchange_rate' in data:
            currency.exchange_rate = float(data['exchange_rate'])
            currency.last_updated = datetime.now(timezone.utc)
        if 'adjustment_factor' in data:
            currency.adjustment_factor = float(data['adjustment_factor'])
        if 'enabled' in data:
            currency.is_active = bool(data['enabled'])
        
        db.session.commit()
        
        print(f"[Currency] Updated {currency_code}: adjustment_factor={currency.adjustment_factor}")
        
        # Return the updated currency data
        return jsonify({
            'success': True,
            'message': 'Currency updated successfully',
            'currency': {
                'currency_code': currency.currency_code,
                'currency_name': currency.currency_name,
                'currency_symbol': currency.currency_symbol,
                'exchange_rate': float(currency.exchange_rate),
                'adjustment_factor': float(currency.adjustment_factor) if currency.adjustment_factor else 1.0,
                'is_active': currency.is_active,
                'last_updated': currency.last_updated.isoformat() if currency.last_updated else None
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[Currency] Update error for {currency_code}: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/currencies/<int:currency_id>', methods=['DELETE'])
@jwt_required()
def delete_currency(currency_id):
    """Delete currency"""
    try:
        currency = db.session.get(Currency, currency_id)
        
        if not currency:
            return jsonify({'error': 'Currency not found'}), 404
        
        # Don't allow deleting base currency
        if currency.is_base_currency:
            return jsonify({'error': 'Cannot delete base currency'}), 400
        
        db.session.delete(currency)
        db.session.commit()
        
        return jsonify({'message': 'Currency deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@app.route('/api/convert-price', methods=['POST'])
@jwt_required()
def convert_price():
    """Convert product prices to different currency"""
    try:
        data = request.get_json()
        currency_code = data.get('currency', 'INR')
        items = data.get('items', [])
        
        # Get currency
        currency = Currency.query.filter_by(currency_code=currency_code).first()
        if not currency:
            return jsonify({'error': 'Currency not found'}), 404
        
        # Convert prices
        converted_items = []
        for item in items:
            base_price = float(item.get('base_price_in_inr', 0))
            converted_price = base_price * currency.exchange_rate * currency.adjustment_factor
            
            converted_items.append({
                'id': item.get('id'),
                'product_id': item.get('id'),
                'total': converted_price,
                'symbol': currency.currency_symbol,
                'tax_amount': 0.0
            })
        
        return jsonify({
            'currency': currency_code,
            'items': converted_items
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/currency-v2/convert-product', methods=['GET'])
@jwt_required()
def convert_product_v2():
    """Convert single product price to different currency (v2)"""
    try:
        product_id = request.args.get('product_id', type=int)
        currency_code = request.args.get('currency', 'INR')
        
        if not product_id:
            return jsonify({'error': 'product_id is required'}), 400
        
        # Get product
        product = db.session.get(Product, product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Get currency
        currency = Currency.query.filter_by(currency_code=currency_code).first()
        if not currency:
            # Default to INR if currency not found
            currency = Currency.query.filter_by(currency_code='INR').first()
            if not currency:
                return jsonify({'error': 'Currency not found'}), 404
        
        # Convert price
        exchange_rate = currency.exchange_rate if currency else 1.0
        adjustment_factor = currency.adjustment_factor if currency else 1.0
        
        converted_price = product.base_price * exchange_rate * adjustment_factor
        sale_price = product.sale_price * exchange_rate * adjustment_factor if product.sale_price else None
        
        return jsonify({
            'product_id': product_id,
            'currency': currency_code,
            'symbol': currency.currency_symbol,
            'base_price': round(converted_price, 2),
            'sale_price': round(sale_price, 2) if sale_price else None,
            'price': round(sale_price if sale_price else converted_price, 2)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/currencies/convert-batch', methods=['POST'])
@jwt_required()
def convert_batch():
    """Convert multiple product prices in batch"""
    try:
        data = request.get_json()
        currency_code = data.get('currency', 'INR')
        product_ids = data.get('product_ids', [])
        
        if not product_ids:
            return jsonify({'error': 'product_ids array is required'}), 400
        
        # Get currency
        currency = Currency.query.filter_by(currency_code=currency_code).first()
        if not currency:
            # Default to INR
            currency = Currency.query.filter_by(currency_code='INR').first()
            if not currency:
                return jsonify({'error': 'Currency not found'}), 404
        
        exchange_rate = currency.exchange_rate
        adjustment_factor = currency.adjustment_factor
        
        # Get all products
        products = Product.query.filter(Product.id.in_(product_ids)).all()
        
        # Convert prices
        converted_products = []
        for product in products:
            converted_price = product.base_price * exchange_rate * adjustment_factor
            sale_price = product.sale_price * exchange_rate * adjustment_factor if product.sale_price else None
            
            converted_products.append({
                'product_id': product.id,
                'base_price': round(converted_price, 2),
                'sale_price': round(sale_price, 2) if sale_price else None,
                'price': round(sale_price if sale_price else converted_price, 2)
            })
        
        return jsonify({
            'currency': currency_code,
            'symbol': currency.currency_symbol,
            'products': converted_products
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== DYNAMIC PRICING SYSTEM ROUTES ====================

@app.route('/api/dynamic-pricing/dashboard', methods=['GET'])
@jwt_required()
def get_dynamic_pricing_dashboard():
    """Get comprehensive pricing overview for dashboard"""
    try:
        # Get all active currencies with their rates
        currencies = Currency.query.filter_by(is_active=True).all()
        currencies_data = [{
            'code': c.currency_code,
            'name': c.currency_name,
            'symbol': c.currency_symbol,
            'exchange_rate': c.exchange_rate,
            'manual_override': c.manual_override,
            'manual_rate': c.manual_rate,
            'is_auto_update': c.is_auto_update,
            'adjustment_factor': c.adjustment_factor,
            'last_updated': c.last_updated.isoformat() if c.last_updated else None,
            'rate_source': c.rate_source
        } for c in currencies]
        
        # Get countries with tax info
        countries = Country.query.filter_by(is_active=True).all()
        countries_data = [{
            'code': c.country_code,
            'name': c.country_name,
            'currency_code': c.currency_code,
            'default_tax_rate': c.default_tax_rate,
            'tax_display_name': c.tax_display_name
        } for c in countries]
        
        # Get regional overrides count
        overrides_count = ProductRegionalOverride.query.filter_by(is_active=True).count()
        
        # Get recent rate changes (last 10)
        recent_changes = CurrencyRateHistory.query.order_by(desc(CurrencyRateHistory.timestamp)).limit(10).all()
        changes_data = [{
            'currency_code': h.currency_code,
            'old_rate': h.old_rate,
            'new_rate': h.new_rate,
            'change_percent': h.rate_change_percent,
            'source': h.change_source,
            'changed_by': h.changed_by,
            'timestamp': h.timestamp.isoformat()
        } for h in recent_changes]
        
        return jsonify({
            'currencies': currencies_data,
            'countries': countries_data,
            'regional_overrides_count': overrides_count,
            'recent_rate_changes': changes_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# TAX RATE TEMPLATES

@app.route('/api/tax-templates/', methods=['GET'])
@jwt_required(optional=True)
def get_tax_templates():
    """Get all tax rate templates, optionally filter by country"""
    try:
        country_code = request.args.get('country_code')
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        query = TaxRateTemplate.query
        
        if country_code:
            query = query.filter_by(country_code=country_code)
        
        if not include_inactive:
            query = query.filter_by(is_active=True)
        
        templates = query.order_by(TaxRateTemplate.country_code, TaxRateTemplate.tax_rate).all()
        
        templates_data = [{
            'id': t.id,
            'country_code': t.country_code,
            'country_name': t.country_name,
            'tax_type': t.tax_type,
            'tax_rate': t.tax_rate,
            'display_name': t.display_name,
            'is_default': t.is_default,
            'is_active': t.is_active,
            'effective_from': t.effective_from.isoformat() if t.effective_from else None,
            'effective_until': t.effective_until.isoformat() if t.effective_until else None
        } for t in templates]
        
        return jsonify({'tax_templates': templates_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tax-templates/', methods=['POST'])
@jwt_required()
def create_tax_template():
    """Create new tax rate template"""
    try:
        data = request.get_json()
        
        template = TaxRateTemplate(
            country_code=data['country_code'],
            country_name=data['country_name'],
            tax_type=data['tax_type'],
            tax_rate=data['tax_rate'],
            display_name=data['display_name'],
            is_default=data.get('is_default', False),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'message': 'Tax template created successfully',
            'id': template.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/tax-templates/<int:template_id>', methods=['PUT'])
@jwt_required()
def update_tax_template(template_id):
    """Update tax rate template"""
    try:
        template = db.session.get(TaxRateTemplate, template_id)
        if not template:
            return jsonify({'error': 'Tax template not found'}), 404
        
        data = request.get_json()
        
        if 'tax_rate' in data:
            template.tax_rate = data['tax_rate']
        if 'display_name' in data:
            template.display_name = data['display_name']
        if 'is_default' in data:
            template.is_default = data['is_default']
        if 'is_active' in data:
            template.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({'message': 'Tax template updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
# PRODUCT REGIONAL OVERRIDES

@app.route('/api/product-regional-overrides/', methods=['GET'])
@jwt_required()
def get_product_regional_overrides():
    """Get all regional price overrides, optionally filter by product or country"""
    try:
        product_id = request.args.get('product_id', type=int)
        country_code = request.args.get('country_code')
        
        print(f"📊 Getting regional overrides - Product ID: {product_id}, Country: {country_code}")
        
        query = ProductRegionalOverride.query
        
        if product_id:
            query = query.filter_by(product_id=product_id)
        if country_code:
            query = query.filter_by(country_code=country_code)
        
        overrides = query.filter_by(is_active=True).all()
        
        print(f"✅ Found {len(overrides)} regional overrides")
        
        overrides_data = [{
            'id': o.id,
            'product_id': o.product_id,
            'product_name': o.product.name if o.product else None,
            'country_code': o.country_code,
            'currency_code': o.currency_code,
            'override_type': o.override_type,
            'base_price_override': o.base_price_override,
            'sale_price_override': o.sale_price_override,
            'adjustment_percentage': o.adjustment_percentage,
            'tax_rate_override': o.tax_rate_override,
            'use_country_default_tax': o.use_country_default_tax,
            'price_locked': o.price_locked,
            'lock_reason': o.lock_reason,
            'created_by': o.created_by,
            'updated_at': o.updated_at.isoformat()
        } for o in overrides]
        
        if overrides_data:
            print(f"Sample override: Country={overrides_data[0]['country_code']}, Tax={overrides_data[0]['tax_rate_override']}")
        
        return jsonify({'regional_overrides': overrides_data}), 200
        
    except Exception as e:
        print(f"❌ Error getting regional overrides: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/product-regional-overrides/', methods=['POST'])
@jwt_required()
def create_product_regional_override():
    """Create new regional price override for a product"""
    try:
        data = request.get_json()
        current_user = get_jwt_identity()
        
        # Check if override already exists
        existing = ProductRegionalOverride.query.filter_by(
            product_id=data['product_id'],
            country_code=data['country_code']
        ).first()
        
        if existing:
            return jsonify({'error': 'Regional override already exists for this product/country'}), 400
        
        override = ProductRegionalOverride(
            product_id=data['product_id'],
            country_code=data['country_code'],
            currency_code=data['currency_code'],
            override_type=normalize_pricing_type(data.get('override_type')),
            base_price_override=data.get('base_price_override'),
            sale_price_override=data.get('sale_price_override'),
            adjustment_percentage=data.get('adjustment_percentage', 0.0),
            tax_rate_override=data.get('tax_rate_override'),
            use_country_default_tax=data.get('use_country_default_tax', True),
            price_locked=data.get('price_locked', False),
            lock_reason=data.get('lock_reason'),
            created_by=current_user
        )
        
        db.session.add(override)
        db.session.commit()
        
        # Log the action
        log_pricing_action(
            action_type='create_regional_override',
            entity_type='product_regional_override',
            entity_id=override.id,
            new_value=f"Product {data['product_id']} - {data['country_code']}",
            performed_by=current_user
        )
        
        return jsonify({
            'message': 'Regional override created successfully',
            'id': override.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/product-regional-overrides/<int:override_id>', methods=['PUT'])
@jwt_required()
def update_product_regional_override(override_id):
    """Update regional price override"""
    try:
        override = db.session.get(ProductRegionalOverride, override_id)
        if not override:
            return jsonify({'error': 'Regional override not found'}), 404
        
        data = request.get_json()
        current_user = get_jwt_identity()
        
        # Store old values for audit
        old_values = {
            'base_price_override': override.base_price_override,
            'sale_price_override': override.sale_price_override,
            'tax_rate_override': override.tax_rate_override
        }
        
        # Update fields
        if 'override_type' in data:
            override.override_type = normalize_pricing_type(data['override_type'])
        if 'base_price_override' in data:
            override.base_price_override = data['base_price_override']
        if 'sale_price_override' in data:
            override.sale_price_override = data['sale_price_override']
        if 'adjustment_percentage' in data:
            override.adjustment_percentage = data['adjustment_percentage']
        if 'tax_rate_override' in data:
            override.tax_rate_override = data['tax_rate_override']
        if 'use_country_default_tax' in data:
            override.use_country_default_tax = data['use_country_default_tax']
        if 'price_locked' in data:
            override.price_locked = data['price_locked']
        if 'lock_reason' in data:
            override.lock_reason = data['lock_reason']
        
        # IMPORTANT: Explicitly update timestamp
        override.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Log the action
        log_pricing_action(
            action_type='update_regional_override',
            entity_type='product_regional_override',
            entity_id=override_id,
            old_value=str(old_values),
            new_value=str(data),
            performed_by=current_user
        )
        
        return jsonify({'message': 'Regional override updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/product-regional-overrides/<int:override_id>', methods=['DELETE'])
@jwt_required()
def delete_product_regional_override(override_id):
    """Delete regional price override"""
    try:
        override = db.session.get(ProductRegionalOverride, override_id)
        if not override:
            return jsonify({'error': 'Regional override not found'}), 404
        
        current_user = get_jwt_identity()
        
        db.session.delete(override)
        db.session.commit()
        
        # Log the action
        log_pricing_action(
            action_type='delete_regional_override',
            entity_type='product_regional_override',
            entity_id=override_id,
            performed_by=current_user
        )
        
        return jsonify({'message': 'Regional override deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
# CURRENCY RATE HISTORY

@app.route('/api/currency-rate-history/', methods=['GET'])
@jwt_required()
def get_currency_rate_history():
    """Get currency rate change history"""
    try:
        currency_code = request.args.get('currency_code')
        limit = request.args.get('limit', 50, type=int)
        
        query = CurrencyRateHistory.query
        
        if currency_code:
            query = query.filter_by(currency_code=currency_code)
        
        history = query.order_by(desc(CurrencyRateHistory.timestamp)).limit(limit).all()
        
        history_data = [{
            'id': h.id,
            'currency_code': h.currency_code,
            'old_rate': h.old_rate,
            'new_rate': h.new_rate,
            'rate_change_percent': h.rate_change_percent,
            'change_source': h.change_source,
            'changed_by': h.changed_by,
            'change_reason': h.change_reason,
            'timestamp': h.timestamp.isoformat()
        } for h in history]
        
        return jsonify({'rate_history': history_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# PRICING AUDIT LOGS

def _fetch_pricing_audit_logs(action_type=None, entity_type=None, limit=100):
    query = PricingAuditLog.query
    if action_type:
        query = query.filter_by(action_type=action_type)
    if entity_type:
        query = query.filter_by(entity_type=entity_type)

    logs = query.order_by(desc(PricingAuditLog.timestamp)).limit(limit).all()
    return [{
        'id': log.id,
        'action_type': log.action_type,
        'entity_type': log.entity_type,
        'entity_id': log.entity_id,
        'old_value': log.old_value,
        'new_value': log.new_value,
        'performed_by': log.performed_by,
        'notes': log.notes,
        'timestamp': log.timestamp.isoformat()
    } for log in logs]
        
@app.route('/api/pricing-audit-logs/', methods=['GET'])
@jwt_required()
def get_pricing_audit_logs():
    """Get pricing audit logs (legacy endpoint)"""
    try:
        action_type = request.args.get('action_type')
        entity_type = request.args.get('entity_type')
        limit = request.args.get('limit', 100, type=int)
        
        logs_data = _fetch_pricing_audit_logs(action_type, entity_type, limit)
        return jsonify({
            'success': True,
            'data': {'logs': logs_data},
            'audit_logs': logs_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pricing/admin/audit-logs', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_pricing_audit_logs_admin():
    """Get pricing audit logs for enterprise pricing UI"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200
        
        action_type = request.args.get('action_type')
        entity_type = request.args.get('entity_type')
        limit = request.args.get('limit', 100, type=int)
        
        logs_data = _fetch_pricing_audit_logs(action_type, entity_type, limit)
        return jsonify({
            'success': True,
            'data': {'logs': logs_data},
            'audit_logs': logs_data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper function for logging pricing actions
def log_pricing_action(action_type, entity_type, entity_id=None, old_value=None, new_value=None, performed_by=None, notes=None):
    """Log pricing-related actions for audit trail"""
    try:
        log = PricingAuditLog(
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            performed_by=performed_by,
            notes=notes
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        # Don't fail the main action if logging fails
        db.session.rollback()

# ==================== GROUP ORDER DISCOUNT ROUTES ====================

@app.route('/api/group-order-discounts/', methods=['GET'])
@jwt_required()
def get_group_order_discounts():
    """Get all group order discounts"""
    try:
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        query = GroupOrderDiscount.query
        
        if not include_inactive:
            query = query.filter_by(is_active=True)
        
        # Order by priority (higher priority first)
        discounts = query.order_by(desc(GroupOrderDiscount.priority), GroupOrderDiscount.min_quantity).all()
        
        discounts_data = [{
            'id': disc.id,
            'name': disc.name,
            'description': disc.description,
            'min_quantity': disc.min_quantity,
            'max_quantity': disc.max_quantity,
            'discount_type': disc.discount_type,
            'discount_value': disc.discount_value,
            'applicable_products': disc.applicable_products,
            'applicable_categories': disc.applicable_categories,
            'priority': disc.priority,
            'is_active': disc.is_active,
            'valid_from': disc.valid_from.isoformat() if disc.valid_from else None,
            'valid_until': disc.valid_until.isoformat() if disc.valid_until else None,
            'created_at': disc.created_at.isoformat() if disc.created_at else None,
            'updated_at': disc.updated_at.isoformat() if disc.updated_at else None
        } for disc in discounts]
        
        return jsonify({'group_order_discounts': discounts_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/group-order-discounts/', methods=['POST'])
@jwt_required()
def create_group_order_discount():
    """Create new group order discount"""
    try:
        data = request.get_json()
        
        # Parse dates using helper function
        valid_from = parse_date(data.get('valid_from'))
        valid_until = parse_date(data.get('valid_until'))
        
        discount = GroupOrderDiscount(
            name=data.get('name'),
            description=data.get('description'),
            min_quantity=data.get('min_quantity'),
            max_quantity=data.get('max_quantity'),
            discount_type=data.get('discount_type'),
            discount_value=data.get('discount_value'),
            applicable_products=data.get('applicable_products'),
            applicable_categories=data.get('applicable_categories'),
            priority=data.get('priority', 0),
            is_active=data.get('is_active', True),
            valid_from=valid_from,
            valid_until=valid_until
        )
        
        db.session.add(discount)
        db.session.commit()
        
        return jsonify({
            'message': 'Group order discount created successfully',
            'discount_id': discount.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@app.route('/api/group-order-discounts/<int:discount_id>', methods=['GET'])
@jwt_required()
def get_group_order_discount(discount_id):
    """Get single group order discount"""
    try:
        discount = db.session.get(GroupOrderDiscount, discount_id)
        
        if not discount:
            return jsonify({'error': 'Group order discount not found'}), 404
        
        discount_data = {
            'id': discount.id,
            'name': discount.name,
            'description': discount.description,
            'min_quantity': discount.min_quantity,
            'max_quantity': discount.max_quantity,
            'discount_type': discount.discount_type,
            'discount_value': discount.discount_value,
            'applicable_products': discount.applicable_products,
            'applicable_categories': discount.applicable_categories,
            'priority': discount.priority,
            'is_active': discount.is_active,
            'valid_from': discount.valid_from.isoformat() if discount.valid_from else None,
            'valid_until': discount.valid_until.isoformat() if discount.valid_until else None,
            'created_at': discount.created_at.isoformat() if discount.created_at else None,
            'updated_at': discount.updated_at.isoformat() if discount.updated_at else None
        }
        
        return jsonify({'group_order_discount': discount_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/group-order-discounts/<int:discount_id>', methods=['PUT'])
@jwt_required()
def update_group_order_discount(discount_id):
    """Update group order discount"""
    try:
        discount = db.session.get(GroupOrderDiscount, discount_id)
        
        if not discount:
            return jsonify({'error': 'Group order discount not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            discount.name = data['name']
        if 'description' in data:
            discount.description = data['description']
        if 'min_quantity' in data:
            discount.min_quantity = data['min_quantity']
        if 'max_quantity' in data:
            discount.max_quantity = data['max_quantity']
        if 'discount_type' in data:
            discount.discount_type = data['discount_type']
        if 'discount_value' in data:
            discount.discount_value = data['discount_value']
        if 'applicable_products' in data:
            discount.applicable_products = data['applicable_products']
        if 'applicable_categories' in data:
            discount.applicable_categories = data['applicable_categories']
        if 'priority' in data:
            discount.priority = data['priority']
        if 'is_active' in data:
            discount.is_active = data['is_active']
        if 'valid_from' in data:
            discount.valid_from = parse_date(data['valid_from'])
        if 'valid_until' in data:
            discount.valid_until = parse_date(data['valid_until'])
        
        discount.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({'message': 'Group order discount updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/group-order-discounts/<int:discount_id>', methods=['DELETE'])
@jwt_required()
def delete_group_order_discount(discount_id):
    """Delete group order discount"""
    try:
        discount = db.session.get(GroupOrderDiscount, discount_id)
        
        if not discount:
            return jsonify({'error': 'Group order discount not found'}), 404
        
        db.session.delete(discount)
        db.session.commit()
        
        return jsonify({'message': 'Group order discount deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/group-order-discounts/calculate', methods=['POST'])
@jwt_required()
def calculate_group_discount():
    """Calculate applicable group order discount for cart"""
    try:
        data = request.get_json()
        items = data.get('items', [])  # [{ product_id, category_id, quantity, unit_price }]
        
        if not items:
            return jsonify({'discount_amount': 0, 'applicable_discount': None}), 200
        
        # Calculate total quantity
        total_quantity = sum([item.get('quantity', 0) for item in items])
        
        # Get all active discounts ordered by priority
        from datetime import date
        today = date.today()
        
        active_discounts = GroupOrderDiscount.query.filter_by(is_active=True).filter(
            or_(
                GroupOrderDiscount.valid_from == None,
                GroupOrderDiscount.valid_from <= today
            ),
            or_(
                GroupOrderDiscount.valid_until == None,
                GroupOrderDiscount.valid_until >= today
            )
        ).order_by(desc(GroupOrderDiscount.priority)).all()
        
        # Find best applicable discount
        import json
        best_discount = None
        best_discount_amount = 0
        
        for discount in active_discounts:
            # Check quantity range
            if total_quantity < discount.min_quantity:
                continue
            if discount.max_quantity and total_quantity > discount.max_quantity:
                continue
            
            # Check if applicable to products/categories
            applicable = False
            
            if not discount.applicable_products and not discount.applicable_categories:
                # Applies to all
                applicable = True
            else:
                # Check each item
                for item in items:
                    product_id = item.get('product_id')
                    category_id = item.get('category_id')
                    
                    # Check applicable products
                    if discount.applicable_products:
                        try:
                            products = json.loads(discount.applicable_products) if isinstance(discount.applicable_products, str) else []
                            if product_id in products:
                                applicable = True
                                break
                        except:
                            pass
                    
                    # Check applicable categories
                    if discount.applicable_categories:
                        try:
                            categories = json.loads(discount.applicable_categories) if isinstance(discount.applicable_categories, str) else []
                            if category_id in categories:
                                applicable = True
                                break
                        except:
                            pass
            
            if not applicable:
                continue
            
            # Calculate discount for this rule
            cart_total = sum([item.get('quantity', 0) * item.get('unit_price', 0) for item in items])
            
            if discount.discount_type == 'percentage':
                discount_amount = (cart_total * discount.discount_value) / 100
            elif discount.discount_type == 'fixed_amount':
                discount_amount = discount.discount_value
            else:
                discount_amount = 0
            
            # Use highest priority (or highest discount if same priority)
            if discount_amount > best_discount_amount:
                best_discount_amount = discount_amount
                best_discount = discount
        
        if best_discount:
            return jsonify({
                'discount_amount': round(best_discount_amount, 2),
                'applicable_discount': {
                    'id': best_discount.id,
                    'name': best_discount.name,
                    'description': best_discount.description,
                    'discount_type': best_discount.discount_type,
                    'discount_value': best_discount.discount_value,
                    'min_quantity': best_discount.min_quantity
                }
            }), 200
        else:
            return jsonify({
                'discount_amount': 0,
                'applicable_discount': None
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== COUNTRY ROUTES ====================

@app.route('/api/countries/', methods=['GET'])
@jwt_required()
def get_countries():
    """Get all countries"""
    try:
        # Optional: filter by active status
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        if include_inactive:
            countries = Country.query.order_by(Country.country_name).all()
        else:
            countries = Country.query.filter_by(is_active=True).order_by(Country.country_name).all()
        
        countries_data = [{
            'id': country.id,
            'country_code': country.country_code,
            'country_name': country.country_name,
            'currency_code': country.currency_code,
            'is_active': country.is_active,
            'created_at': country.created_at.isoformat() if country.created_at else None
        } for country in countries]
        
        return jsonify({'countries': countries_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/countries/', methods=['POST'])
@jwt_required()
def create_country():
    """Create new country"""
    try:
        data = request.get_json()
        
        # Check if country code already exists
        if Country.query.filter_by(country_code=data['country_code']).first():
            return jsonify({'error': 'Country with this code already exists'}), 400
        
        country = Country(
            country_code=data.get('country_code'),
            country_name=data.get('country_name'),
            currency_code=data.get('currency_code'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(country)
        db.session.commit()
        
        return jsonify({
            'message': 'Country created successfully',
            'country_id': country.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/countries/<int:country_id>', methods=['GET'])
@jwt_required()
def get_country(country_id):
    """Get single country"""
    try:
        country = db.session.get(Country, country_id)
        
        if not country:
            return jsonify({'error': 'Country not found'}), 404
        
        country_data = {
            'id': country.id,
            'country_code': country.country_code,
            'country_name': country.country_name,
            'currency_code': country.currency_code,
            'is_active': country.is_active,
            'created_at': country.created_at.isoformat() if country.created_at else None
        }
        
        return jsonify({'country': country_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/countries/<int:country_id>', methods=['PUT'])
@jwt_required()
def update_country(country_id):
    """Update country"""
    try:
        country = db.session.get(Country, country_id)
        
        if not country:
            return jsonify({'error': 'Country not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'country_code' in data:
            # Check if new code conflicts with existing
            existing = Country.query.filter_by(country_code=data['country_code']).first()
            if existing and existing.id != country_id:
                return jsonify({'error': 'Country with this code already exists'}), 400
            country.country_code = data['country_code']
        if 'country_name' in data:
            country.country_name = data['country_name']
        if 'currency_code' in data:
            country.currency_code = data['currency_code']
        if 'is_active' in data:
            country.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({'message': 'Country updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/countries/<int:country_id>', methods=['DELETE'])
@jwt_required()
def delete_country(country_id):
    """Delete country"""
    try:
        country = db.session.get(Country, country_id)
        
        if not country:
            return jsonify({'error': 'Country not found'}), 404
        
        db.session.delete(country)
        db.session.commit()
        
        return jsonify({'message': 'Country deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== TAX ROUTES ====================

@app.route('/api/taxes/countries', methods=['GET'])
@jwt_required()
def get_tax_countries():
    """Get all tax countries (legacy endpoint for tax-specific data)"""
    try:
        countries = TaxCountry.query.filter_by(is_active=True).all()
        
        countries_data = [{
            'id': country.id,
            'country_code': country.country_code,
            'country_name': country.country_name,
            'currency_code': country.currency_code,
            'default_tax_rate': country.default_tax_rate,
            'is_active': country.is_active
        } for country in countries]
        
        return jsonify({'countries': countries_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== ADVANCED/ENTERPRISE ROUTES ====================

@app.route('/api/advanced/currencies', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_advanced_currencies():
    """Get currencies with advanced details for enterprise management"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        currencies = Currency.query.filter_by(is_active=True).order_by(Currency.currency_code).all()
        
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        if include_inactive:
            currencies = Currency.query.order_by(Currency.currency_code).all()

        currencies_data = []
        for curr in currencies:
            adjustment_factor = curr.adjustment_factor or 1.0
            custom_value_factor = curr.custom_value_factor or 1.0
            api_rate = float(curr.api_rate or 0.0)
            effective_rate = float(curr.exchange_rate or 0.0)
            if not effective_rate and api_rate:
                effective_rate = api_rate
                effective_rate *= (1 + (curr.custom_percentage_change or 0) / 100.0)
                effective_rate *= custom_value_factor
                effective_rate *= adjustment_factor
            markup_percentage = float(curr.custom_percentage_change or 0)
            manual_override = (adjustment_factor != 1.0) or (custom_value_factor != 1.0)

            currencies_data.append({
            'id': curr.id,
            'currency_code': curr.currency_code,
            'currency_name': curr.currency_name,
            'currency_symbol': curr.currency_symbol,
                'api_rate': api_rate,
                'exchange_rate': effective_rate,
                'effective_rate': round(effective_rate, 6),
            'is_base_currency': curr.is_base_currency,
            'is_active': curr.is_active,
                'status': 'active' if curr.is_active else 'inactive',
                'last_updated': format_timestamp(curr.last_updated),
                'last_api_update': format_timestamp(curr.last_api_update),
                'last_updated_raw': curr.last_updated.isoformat() if curr.last_updated else None,
                'last_api_update_raw': curr.last_api_update.isoformat() if curr.last_api_update else None,
            'created_at': curr.created_at.isoformat() if curr.created_at else None,
                'adjustment_factor': adjustment_factor,
                'custom_percentage_change': markup_percentage,
                'custom_value_factor': custom_value_factor,
                'regional_tax_percent': curr.regional_tax_percent or 0.0,
                'manual_override': manual_override,
                'override_rate': round(effective_rate, 6) if manual_override else None,
                'markup_percentage': markup_percentage,
                'markup_amount': 0.0,
                'auto_update_enabled': True,
                'has_custom_override': manual_override,
                'formula': {
                    'api_rate': api_rate,
                    'markup_percentage': markup_percentage,
                    'custom_value_factor': custom_value_factor,
                    'adjustment_factor': adjustment_factor,
                    'effective_rate': round(effective_rate, 6)
                }
            })

        return jsonify({
            'success': True,
            'data': {
                'currencies': currencies_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/advanced/currencies/fetch-rates', methods=['POST'])
@jwt_required()
def fetch_live_exchange_rates_advanced():
    """Fetch live exchange rates - redirects to main endpoint"""
    try:
        import requests
        ensure_currency_schema()

        current_user = get_jwt_identity()
        
        data = request.get_json()
        base_currency_code = data.get('base_currency', 'INR')
        
        # Get base currency
        base_currency = Currency.query.filter_by(currency_code=base_currency_code).first()
        if not base_currency:
            return jsonify({'success': False, 'error': 'Base currency not found'}), 404
        
        fetch_log = CurrencyRateFetchLog(
            fetched_by=str(current_user) if current_user else 'system',
            base_currency=base_currency_code,
            status='pending'
        )
        db.session.add(fetch_log)
        db.session.flush()
        
        # Fetch live rates from exchangerate-api.com
        api_url = f'https://api.exchangerate-api.com/v4/latest/{base_currency_code}'
        
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        api_data = response.json()
        
        rates = api_data.get('rates', {})
        updated_count = 0
        unchanged_count = 0
        now_utc = datetime.now(timezone.utc)
        
        # Update all currencies with live rates
        for currency in Currency.query.filter_by(is_active=True).all():
            if currency.currency_code == base_currency_code:
                continue  # Skip base currency
            
            if currency.currency_code in rates:
                api_rate = float(rates[currency.currency_code])
                currency.api_rate = api_rate

                effective_rate = calculate_effective_rate(currency, api_rate)

                old_rate = float(currency.exchange_rate or 0)
                rate_changed = abs(effective_rate - old_rate) > 1e-6
                change_percent = ((effective_rate - old_rate) / old_rate * 100) if old_rate else 100.0

                currency.exchange_rate = effective_rate
                currency.last_updated = now_utc
                currency.last_api_update = now_utc
                currency.rate_source = 'enterprise_api:exchangerate-api.com'
                currency.manual_override = False
                currency.manual_rate = None

                history_entry = CurrencyRateHistory(
                    currency_code=currency.currency_code,
                    old_rate=old_rate if old_rate else effective_rate,
                    new_rate=effective_rate,
                    rate_change_percent=change_percent if rate_changed else 0,
                    change_source='enterprise_api:exchangerate-api.com',
                    changed_by=str(current_user) if current_user else 'system',
                    change_reason='Enterprise live rate fetch'
                )
                db.session.add(history_entry)

                audit_entry = PricingAuditLog(
                    action_type='update',
                    entity_type='currency',
                    entity_id=currency.id,
                    old_value=str(old_rate),
                    new_value=str(effective_rate),
                    performed_by=str(current_user) if current_user else 'system',
                    notes='Enterprise pricing live rate fetch'
                )
                db.session.add(audit_entry)

                updated_count += 1 if rate_changed else 0
                unchanged_count += 0 if rate_changed else 1
        
        fetch_log.provider = 'enterprise_api:exchangerate-api.com'
        fetch_log.updated_count = updated_count
        fetch_log.unchanged_count = unchanged_count
        fetch_log.status = 'success'
        fetch_log.message = f'Fetched {len(rates)} rates'
        fetch_log.raw_payload = json.dumps({
            'base': api_data.get('base', base_currency_code),
            'timestamp': api_data.get('time_last_updated'),
            'rates_sample': {k: rates[k] for k in list(rates.keys())[:20]}
        })
        
        db.session.commit()

        print(f"[Enterprise Live Rate Fetch] base={base_currency_code} updated={updated_count} unchanged={unchanged_count}")
        
        return jsonify({
            'success': True,
            'message': f'Updated {updated_count} currency rates',
            'data': {
                'updated_count': updated_count,
                'unchanged_count': unchanged_count,
                'base_currency': base_currency_code,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'fetched_at_local': format_timestamp(fetch_log.fetched_at)
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        try:
            failure_log = CurrencyRateFetchLog(
                provider='enterprise_api:exchangerate-api.com',
                base_currency=locals().get('base_currency_code', None),
                fetched_by=str(locals().get('current_user')) if locals().get('current_user') else 'system',
                status='failure',
                message=str(e)[:255]
            )
            db.session.add(failure_log)
            db.session.commit()
        except Exception as log_error:
            print(f"[Enterprise Live Rate Fetch] Failed to record failure log: {log_error}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/advanced/currencies', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_advanced_currency():
    """Create a currency via the enterprise management view"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        data = request.get_json() or {}
        current_user = get_jwt_identity()

        code = data.get('currency_code')
        if not code:
            return jsonify({'success': False, 'error': 'currency_code is required'}), 400

        existing = Currency.query.filter_by(currency_code=code).first()
        if existing:
            return jsonify({'success': False, 'error': 'Currency code already exists'}), 400

        manual_override = bool(data.get('manual_override'))
        override_rate = data.get('override_rate')
        exchange_rate = float(data.get('exchange_rate', 1.0))
        api_rate = float(data.get('api_rate', exchange_rate) or exchange_rate or 1.0)

        if manual_override and override_rate is not None:
            exchange_rate = float(override_rate)

        currency = Currency(
            currency_code=code.upper(),
            currency_name=data.get('currency_name'),
            currency_symbol=data.get('currency_symbol'),
            is_base_currency=data.get('is_base_currency', False),
            is_active=data.get('is_active', True),
            adjustment_factor=float(data.get('adjustment_factor', 1.0) or 1.0),
            custom_percentage_change=float(data.get('markup_percentage', data.get('custom_percentage_change', 0.0)) or 0.0),
            custom_value_factor=float(data.get('custom_value_factor', 1.0) or 1.0),
            regional_tax_percent=float(data.get('regional_tax_percent', 0.0) or 0.0)
        )

        currency.api_rate = api_rate
        currency.manual_override = manual_override
        currency.manual_rate = exchange_rate if manual_override else None
        calculated_effective = calculate_effective_rate(currency, api_rate)
        currency.exchange_rate = exchange_rate if manual_override else calculated_effective
        currency.last_updated = datetime.now(timezone.utc)
        currency.last_api_update = datetime.now(timezone.utc)
        currency.rate_source = 'manual:create' if manual_override else 'configured'

        db.session.add(currency)
        db.session.commit()

        log_pricing_action(
            action_type='currency_create',
            entity_type='currency',
            entity_id=currency.id,
            new_value=json.dumps({
                'currency': currency.currency_code,
                'api_rate': currency.api_rate,
                'exchange_rate': currency.exchange_rate
            }),
            performed_by=str(current_user) if current_user else 'system',
            notes='Currency created via enterprise management'
        )

        return jsonify({
            'success': True,
            'message': 'Currency created successfully',
            'data': {
                'currency_id': currency.id
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/advanced/currencies/<string:currency_code>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_advanced_currency(currency_code):
    """Update currency details from enterprise management view"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        currency = Currency.query.filter_by(currency_code=currency_code.upper()).first()
        if not currency:
            return jsonify({'success': False, 'error': 'Currency not found'}), 404

        data = request.get_json() or {}
        current_user = get_jwt_identity()

        manual_override = bool(data.get('manual_override'))
        override_rate = data.get('override_rate')

        old_snapshot = {
            'api_rate': float(currency.api_rate or 0),
            'exchange_rate': float(currency.exchange_rate or 0),
            'markup_pct': float(currency.custom_percentage_change or 0),
            'value_factor': float(currency.custom_value_factor or 1),
            'adjustment_factor': float(currency.adjustment_factor or 1),
            'manual_override': bool(currency.manual_override),
            'manual_rate': float(currency.manual_rate or 0) if currency.manual_rate else None
        }
        old_rate = float(currency.exchange_rate or 0)

        if 'currency_name' in data:
            currency.currency_name = data['currency_name']
        if 'currency_symbol' in data:
            currency.currency_symbol = data['currency_symbol']
        if 'api_rate' in data:
            currency.api_rate = float(data.get('api_rate') or 0.0)
            currency.last_api_update = datetime.now(timezone.utc)
        if 'exchange_rate' in data:
            currency.exchange_rate = float(data['exchange_rate'])
        if manual_override and override_rate is not None:
            currency.exchange_rate = float(override_rate)
        if 'adjustment_factor' in data:
            currency.adjustment_factor = float(data.get('adjustment_factor', 1.0) or 1.0)
        if 'custom_value_factor' in data:
            currency.custom_value_factor = float(data.get('custom_value_factor', 1.0) or 1.0)
        if 'markup_percentage' in data or 'custom_percentage_change' in data:
            currency.custom_percentage_change = float(data.get('markup_percentage', data.get('custom_percentage_change', 0.0)) or 0.0)
        if 'regional_tax_percent' in data:
            currency.regional_tax_percent = float(data.get('regional_tax_percent', 0.0) or 0.0)
        if 'status' in data:
            currency.is_active = data['status'] == 'active'
        if 'is_active' in data:
            currency.is_active = bool(data['is_active'])

        currency.manual_override = manual_override
        if manual_override:
            if override_rate is not None:
                currency.manual_rate = float(override_rate)
                currency.exchange_rate = float(override_rate)
            else:
                if currency.manual_rate is None:
                    currency.manual_rate = float(currency.exchange_rate or 0)
        else:
            currency.manual_rate = None
            recalculated_effective = calculate_effective_rate(currency)
            if 'exchange_rate' not in data or data.get('exchange_rate') in (None, ''):
                currency.exchange_rate = recalculated_effective

        currency.last_updated = datetime.now(timezone.utc)

        new_rate = float(currency.exchange_rate or 0)
        change_percent = None
        if old_rate:
            change_percent = ((new_rate - old_rate) / old_rate) * 100

        if abs(new_rate - old_rate) > 1e-9:
            history_entry = CurrencyRateHistory(
                currency_code=currency.currency_code,
                old_rate=old_rate if old_rate else new_rate,
                new_rate=new_rate,
                rate_change_percent=change_percent,
                change_source='enterprise_ui',
                changed_by=str(current_user) if current_user else 'system',
                change_reason=data.get('change_reason', 'Enterprise currency update')
            )
            db.session.add(history_entry)

        db.session.commit()

        new_snapshot = {
            'api_rate': float(currency.api_rate or 0),
            'exchange_rate': new_rate,
            'markup_pct': float(currency.custom_percentage_change or 0),
            'value_factor': float(currency.custom_value_factor or 1),
            'adjustment_factor': float(currency.adjustment_factor or 1),
            'manual_override': bool(currency.manual_override),
            'manual_rate': float(currency.manual_rate or 0) if currency.manual_rate else None
        }

        log_pricing_action(
            action_type='currency_update',
            entity_type='currency',
            entity_id=currency.id,
            old_value=json.dumps(old_snapshot),
            new_value=json.dumps(new_snapshot),
            performed_by=str(current_user) if current_user else 'system',
            notes=data.get('change_reason', 'Enterprise currency update')
        )

        return jsonify({
            'success': True,
            'message': 'Currency updated successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/advanced/currencies/<string:currency_code>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_advanced_currency(currency_code):
    """Delete a currency via the enterprise management view"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        currency = Currency.query.filter_by(currency_code=currency_code.upper()).first()
        if not currency:
            return jsonify({'success': False, 'error': 'Currency not found'}), 404

        db.session.delete(currency)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Currency deleted successfully'
        }), 200

    except IntegrityError:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Currency is in use and cannot be deleted'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/advanced/taxes', methods=['GET', 'POST', 'OPTIONS'])
@jwt_required()
def manage_advanced_taxes():
    """Handle enterprise tax rules (list or create)"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        if request.method == 'GET':
            tax_rules = TaxCountry.query.order_by(TaxCountry.country_code).all()
            taxes_data = []
            for rule in tax_rules:
                taxes_data.append({
                    'id': rule.id,
                    'country_code': rule.country_code,
                    'country_name': rule.country_name,
                    'region': 'Global',
                    'tax_type': 'VAT',
                    'tax_name': 'Tax',
                    'tax_rate': float(rule.default_tax_rate or 0.0),
                    'calculation_type': 'percentage',
                    'price_inclusive': False,
                    'fixed_amount': 0.0,
                    'is_active': bool(rule.is_active),
                    'created_at': rule.created_at.isoformat() if rule.created_at else None
                })

            return jsonify({
                'success': True,
            'data': {
                    'taxes': taxes_data
            }
        }), 200
        
        # POST - create or upsert
        data = request.get_json() or {}
        country_code = (data.get('country_code') or '').upper()
        if not country_code:
            return jsonify({'success': False, 'error': 'country_code is required'}), 400

        country_name = data.get('country_name') or country_code
        country = Country.query.filter_by(country_code=country_code).first()
        currency_code = data.get('currency_code') or (country.currency_code if country else 'INR')
        tax_rate = float(data.get('tax_rate') or 0.0)
        is_active = bool(data.get('is_active', True))

        rule = TaxCountry.query.filter_by(country_code=country_code).first()
        if not rule:
            rule = TaxCountry(
                country_code=country_code,
                country_name=country_name,
                currency_code=currency_code
            )
            db.session.add(rule)

        rule.country_name = country_name
        rule.currency_code = currency_code
        rule.default_tax_rate = tax_rate
        rule.is_active = is_active

        db.session.flush()

        audit_log = PricingAuditLog(
            action_type='create',
            entity_type='regional_tax',
            entity_id=rule.id,
            new_value=f'{country_code}:{tax_rate}',
            performed_by=str(get_jwt_identity()),
            notes=data.get('reason', 'Created via enterprise tax management')
        )
        db.session.add(audit_log)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Tax rule saved successfully',
            'data': {'tax_id': rule.id}
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/advanced/taxes/<int:tax_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
@jwt_required()
def update_advanced_tax(tax_id):
    """Update or delete enterprise tax rules"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        rule = db.session.get(TaxCountry, tax_id)
        if not rule:
            return jsonify({'success': False, 'error': 'Tax rule not found'}), 404

        if request.method == 'DELETE':
            old_value = f'{rule.country_code}:{rule.default_tax_rate}'
            db.session.delete(rule)
            audit_log = PricingAuditLog(
                action_type='delete',
                entity_type='regional_tax',
                entity_id=tax_id,
                old_value=old_value,
                performed_by=str(get_jwt_identity()),
                notes='Deleted via enterprise tax management'
            )
            db.session.add(audit_log)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Tax rule deleted'}), 200

        data = request.get_json() or {}
        old_rate = rule.default_tax_rate

        if 'country_name' in data:
            rule.country_name = data['country_name']
        if 'tax_rate' in data:
            try:
                rule.default_tax_rate = float(data['tax_rate'])
            except (ValueError, TypeError):
                return jsonify({'success': False, 'error': 'tax_rate must be numeric'}), 400
        if 'currency_code' in data:
            rule.currency_code = data['currency_code']
        if 'is_active' in data:
            rule.is_active = bool(data['is_active'])

        db.session.flush()

        audit_log = PricingAuditLog(
            action_type='update',
            entity_type='regional_tax',
            entity_id=tax_id,
            old_value=f'{rule.country_code}:{old_rate}',
            new_value=f'{rule.country_code}:{rule.default_tax_rate}',
            performed_by=str(get_jwt_identity()),
            notes=data.get('reason', 'Updated via enterprise tax management')
        )
        db.session.add(audit_log)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Tax rule updated'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/advanced/pricing/products', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_advanced_pricing_products():
    """Return product pricing data for enterprise management"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        country_code = request.args.get('country_code', 'IN').upper()
        include_tax = request.args.get('include_tax', 'true').lower() == 'true'

        country = Country.query.filter_by(country_code=country_code).first()
        currency_code = country.currency_code if country else 'INR'

        currency = Currency.query.filter_by(currency_code=currency_code).first()
        exchange_rate = currency.exchange_rate if currency else 1.0
        currency_symbol = currency.currency_symbol if currency else '₹'
        regional_tax = currency.regional_tax_percent if currency else 0.0

        products = Product.query.filter_by(is_active=True).order_by(Product.id).limit(50).all()

        product_prices = ProductPrice.query.filter_by(country_code=country_code).all()
        prices_by_product = {price.product_id: price for price in product_prices}

        items = []
        for product in products:
            base_price_inr = float(product.base_price or 0)
            converted_subtotal = base_price_inr * float(exchange_rate or 1.0)
            tax_amount = converted_subtotal * (float(regional_tax or 0.0) / 100.0) if include_tax else 0.0
            final_price = converted_subtotal + tax_amount

            override_entry = prices_by_product.get(product.id)
            price_locked = False
            override_price = None
            price_id = None

            if override_entry:
                price_id = override_entry.id
                override_price = float(override_entry.price or 0.0)
                final_price = override_price
                price_locked = normalize_pricing_type(override_entry.pricing_type) == PRICING_TYPE_MANUAL

            items.append({
                'product_id': product.id,
                'name': product.name,
                'sku': product.sku,
                'base_price_inr': round(base_price_inr, 2),
                'converted_subtotal': round(converted_subtotal, 2),
                'tax_amount': round(tax_amount, 2),
                'final_price': round(final_price, 2),
                'currency_symbol': currency_symbol,
                'currency_code': currency_code,
                'price_locked': price_locked,
                'price_id': price_id,
                'override_price': override_price,
                'tax_rate': float(regional_tax or 0.0),
                'updated_at': override_entry.updated_at.isoformat() if override_entry and override_entry.updated_at else None
            })
        
        return jsonify({
            'success': True,
            'data': {
                'products': items,
                'country_code': country_code,
                'currency_code': currency_code,
                'currency_symbol': currency_symbol
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/advanced/pricing/products/<int:product_id>/pricing', methods=['POST', 'OPTIONS'])
@jwt_required()
def update_advanced_product_pricing(product_id):
    """Create or update regional pricing overrides for a product"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        data = request.get_json() or {}
        country_code = (data.get('country_code') or 'IN').upper()
        override_price = data.get('override_price')
        price_locked = bool(data.get('price_locked', True))
        markup_percentage = float(data.get('markup_percentage', 0) or 0.0)
        fixed_adjustment = float(data.get('fixed_adjustment', 0) or 0.0)
        reason = data.get('reason', 'Manual price update via enterprise pricing')

        product = db.session.get(Product, product_id)
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404

        country = Country.query.filter_by(country_code=country_code).first()
        currency_code = country.currency_code if country else 'INR'
        currency = Currency.query.filter_by(currency_code=currency_code).first()
        exchange_rate = currency.exchange_rate if currency else 1.0
        currency_symbol = currency.currency_symbol if currency else '₹'
        regional_tax = currency.regional_tax_percent if currency else 0.0

        base_price_inr = float(product.base_price or 0)
        auto_price = base_price_inr * float(exchange_rate or 1.0)
        
        if markup_percentage:
            auto_price = auto_price * (1 + markup_percentage / 100.0)
        if fixed_adjustment:
            auto_price = auto_price + fixed_adjustment

        if override_price is not None:
            try:
                override_price = float(override_price)
            except (ValueError, TypeError):
                return jsonify({'success': False, 'error': 'override_price must be numeric'}), 400
        else:
            override_price = auto_price

        price_entry = ProductPrice.query.filter_by(
            product_id=product_id,
            country_code=country_code
        ).first()

        if price_locked or override_price:
            if not price_entry:
                price_entry = ProductPrice(
                    product_id=product_id,
                    country_code=country_code,
                    currency_code=currency_code
                )
                db.session.add(price_entry)

            price_entry.price = override_price
            price_entry.pricing_type = PRICING_TYPE_MANUAL if price_locked else PRICING_TYPE_AUTO
            price_entry.is_active = True
            price_entry.updated_at = datetime.now(timezone.utc)
        else:
            if price_entry:
                db.session.delete(price_entry)

        # Record audit log entry
        audit_log = PricingAuditLog(
            action_type='update',
            entity_type='product_pricing',
            entity_id=product_id,
            old_value=None,
            new_value=f'{currency_symbol}{override_price}',
            performed_by=str(get_jwt_identity()),
            notes=reason
        )
        db.session.add(audit_log)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product pricing updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/realtime/changes', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_realtime_changes():
    """Return recent pricing and currency changes for enterprise dashboard polling"""
    try:
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        since_param = request.args.get('since')
        entity_type = request.args.get('entity_type')

        since_dt = None
        if since_param:
            try:
                since_dt = datetime.fromisoformat(since_param.replace('Z', '+00:00'))
            except ValueError:
                since_dt = datetime.utcnow() - timedelta(hours=1)

        if not since_dt:
            since_dt = datetime.utcnow() - timedelta(hours=6)

        changes = []

        currency_query = CurrencyRateHistory.query
        if since_dt:
            currency_query = currency_query.filter(CurrencyRateHistory.timestamp >= since_dt)
        currency_events = currency_query.order_by(CurrencyRateHistory.timestamp.desc()).limit(50).all()

        for event in currency_events:
            changes.append({
                'id': f'currency-{event.id}',
                'entity_type': 'currency',
                'entity_code': event.currency_code,
                'action_type': 'update',
                'performed_by': event.changed_by or 'system',
                'timestamp': (event.timestamp or datetime.utcnow()).isoformat(),
                'changed_fields': ['exchange_rate'],
                'reason': event.change_reason or event.change_source,
                'summary': f"{event.old_rate} → {event.new_rate} ({event.change_source})"
            })

        price_query = ProductPrice.query
        if since_dt:
            price_query = price_query.filter(
                or_(
                    ProductPrice.updated_at != None,
                    ProductPrice.created_at != None
                )
            )

        order_expression = func.coalesce(ProductPrice.updated_at, ProductPrice.created_at).desc()
        price_events = price_query.order_by(order_expression).limit(50).all()
        for price in price_events:
            timestamp = price.updated_at or price.created_at or datetime.utcnow()
            normalized_type = normalize_pricing_type(price.pricing_type)
            label = pricing_type_label(price.pricing_type)
            changes.append({
                'id': f'price-{price.id}',
                'entity_type': 'product_pricing',
                'entity_code': f'{price.product_id}:{price.currency_code}',
                'action_type': 'update',
                'performed_by': 'system',
                'timestamp': timestamp.isoformat(),
                'changed_fields': ['price', 'pricing_type'],
                'reason': 'Manual override' if normalized_type == PRICING_TYPE_MANUAL else 'Automatic update',
                'summary': f"{label} → {price.price:.2f}"
            })

        audit_query = PricingAuditLog.query
        if entity_type:
            audit_query = audit_query.filter_by(entity_type=entity_type)
        if since_dt:
            audit_query = audit_query.filter(PricingAuditLog.timestamp >= since_dt)

        audit_logs = audit_query.order_by(PricingAuditLog.timestamp.desc()).limit(50).all()
        for log in audit_logs:
            changes.append({
                'id': f'audit-{log.id}',
                'entity_type': log.entity_type,
                'entity_code': str(log.entity_id) if log.entity_id else None,
                'action_type': log.action_type,
                'performed_by': log.performed_by or 'system',
                'timestamp': log.timestamp.isoformat() if log.timestamp else datetime.utcnow().isoformat(),
                'changed_fields': [],
                'reason': log.notes,
                'summary': log.new_value
            })

        if entity_type:
            changes = [change for change in changes if change['entity_type'] == entity_type]

        changes.sort(key=lambda item: item['timestamp'], reverse=True)

        return jsonify({
            'success': True,
            'data': {
                'changes': changes[:50]
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/pricing/products/converted', methods=['GET'])
@jwt_required(optional=True)
def get_converted_product_prices():
    """Get products with converted prices for a specific country"""
    try:
        country_code = request.args.get('country_code', 'IN')
        include_tax = request.args.get('include_tax', 'true').lower() == 'true'
        
        # Map country code to currency
        country = Country.query.filter_by(country_code=country_code).first()
        currency_code = country.currency_code if country else 'INR'
        
        # Get currency
        currency = Currency.query.filter_by(currency_code=currency_code).first()
        exchange_rate = currency.exchange_rate if currency else 1.0
        currency_symbol = currency.currency_symbol if currency else '₹'
        regional_tax = currency.regional_tax_percent if currency else 0.0
        
        # Get all products
        products = Product.query.filter_by(is_active=True).limit(20).all()
        
        items = []
        for product in products:
            base_price = product.base_price
            converted = base_price * exchange_rate
            tax = converted * (regional_tax / 100) if include_tax else 0
            final = converted + tax
            
            items.append({
                'product_id': product.id,
                'name': product.name,
                'base_price': base_price,
                'converted_subtotal': round(converted, 2),
                'tax_amount': round(tax, 2),
                'final_price': round(final, 2),
                'currency': currency_symbol
            })
        
        return jsonify({'data': {'items': items}}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pricing/taxes', methods=['GET'])
@jwt_required(optional=True)
def get_pricing_taxes():
    """Get tax rates for regional pricing page"""
    try:
        # Get all countries with their default tax rates
        countries = Country.query.filter_by(is_active=True).all()
        
        taxes_data = []
        for country in countries:
            # Check if there's a specific tax rate for this country in TaxCountry
            tax_country = TaxCountry.query.filter_by(country_code=country.country_code).first()
            
            taxes_data.append({
                'country_code': country.country_code,
                'country_name': country.country_name,
                'tax_name': 'TAX',  # Default tax name
                'tax_rate': tax_country.default_tax_rate if tax_country else 0.0
            })
        
        return jsonify({'data': {'taxes': taxes_data}}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pricing/admin/tax/update', methods=['POST'])
@jwt_required()
def update_pricing_tax():
    """Update tax rate from pricing page"""
    try:
        data = request.get_json()
        country_code = data.get('country_code')
        tax_rate = data.get('tax_rate')
        tax_name = data.get('tax_name', 'TAX')
        
        # Find or create TaxCountry entry
        tax_country = TaxCountry.query.filter_by(country_code=country_code).first()
        
        if not tax_country:
            # Create new tax country entry
            country = Country.query.filter_by(country_code=country_code).first()
            if not country:
                return jsonify({'error': 'Country not found'}), 404
            
            tax_country = TaxCountry(
                country_code=country_code,
                country_name=country.country_name,
                currency_code=country.currency_code,
                default_tax_rate=float(tax_rate),
                is_active=True
            )
            db.session.add(tax_country)
        else:
            # Update existing
            tax_country.default_tax_rate = float(tax_rate)
        
        db.session.commit()
        
        return jsonify({'message': 'Tax rate updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== PRODUCT PRICE ROUTES ====================

@app.route('/api/product-prices/', methods=['GET'])
@jwt_required()
def get_product_prices():
    """Get all product prices (regional pricing)"""
    try:
        product_id = request.args.get('product_id', type=int)
        country_code = request.args.get('country_code')
        
        query = ProductPrice.query
        
        if product_id:
            query = query.filter_by(product_id=product_id)
        if country_code:
            query = query.filter_by(country_code=country_code)
        
        prices = query.filter_by(is_active=True).all()
        
        prices_data = [{
            'id': price.id,
            'product_id': price.product_id,
            'country_code': price.country_code,
            'currency_code': price.currency_code,
            'price': price.price,
            'pricing_type': pricing_type_label(price.pricing_type),
            'is_active': price.is_active,
            'created_at': price.created_at.isoformat() if price.created_at else None,
            'updated_at': price.updated_at.isoformat() if price.updated_at else None
        } for price in prices]
        
        return jsonify({'product_prices': prices_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/product-prices/', methods=['POST'])
@jwt_required()
def create_product_price():
    """Create regional price for a product"""
    try:
        data = request.get_json()
        
        price = ProductPrice(
            product_id=data.get('product_id'),
            country_code=data.get('country_code'),
            currency_code=data.get('currency_code'),
            price=data.get('price'),
            pricing_type=normalize_pricing_type(data.get('pricing_type')),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(price)
        db.session.commit()
        
        return jsonify({
            'message': 'Product price created successfully',
            'price_id': price.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/product-prices/<int:price_id>', methods=['PUT'])
@jwt_required()
def update_product_price(price_id):
    """Update product price"""
    try:
        price = db.session.get(ProductPrice, price_id)
        
        if not price:
            return jsonify({'error': 'Product price not found'}), 404
        
        data = request.get_json()
        
        if 'price' in data:
            price.price = data['price']
        if 'pricing_type' in data:
            price.pricing_type = normalize_pricing_type(data['pricing_type'])
        if 'is_active' in data:
            price.is_active = data['is_active']
        
        price.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        return jsonify({'message': 'Product price updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/product-prices/<int:price_id>', methods=['DELETE'])
@jwt_required()
def delete_product_price(price_id):
    """Delete product price"""
    try:
        price = db.session.get(ProductPrice, price_id)
        
        if not price:
            return jsonify({'error': 'Product price not found'}), 404
        
        db.session.delete(price)
        db.session.commit()
        
        return jsonify({'message': 'Product price deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== REWARD TRANSACTION ROUTES ====================

@app.route('/api/rewards-v2/analytics', methods=['GET'])
@jwt_required()
def get_rewards_analytics():
    """Get rewards analytics for rewards management dashboard"""
    try:
        total_issued = 0
        total_redeemed = 0
        total_expired = 0
        total_users = 0
        
        try:
            # Get total points issued
            total_issued = db.session.query(func.sum(RewardTransaction.points)).filter(
                RewardTransaction.transaction_type == 'earned'
            ).scalar() or 0
            
            # Get total points redeemed
            total_redeemed = db.session.query(func.sum(RewardTransaction.points)).filter(
                RewardTransaction.transaction_type == 'redeemed'
            ).scalar() or 0
            
            # Get total expired points
            total_expired = db.session.query(func.sum(RewardTransaction.points)).filter(
                RewardTransaction.transaction_type == 'expired'
            ).scalar() or 0
        except Exception as trans_error:
            print(f"[Analytics] Transactions error: {str(trans_error)}")
            # Fallback: try to calculate from user table
            total_issued = db.session.query(func.sum(User.reward_points)).scalar() or 0
        
        try:
            # Get active users with reward points
            total_users = User.query.filter(User.reward_points > 0).count()
        except Exception as user_error:
            print(f"[Analytics] User count error: {str(user_error)}")
            total_users = 0
        
        print(f"[Analytics] Issued: {total_issued}, Redeemed: {total_redeemed}, Expired: {total_expired}, Users: {total_users}")
        
        return jsonify({
            'total_issued': int(total_issued),
            'total_redeemed': int(total_redeemed),
            'total_expired': int(total_expired),
            'total_users': int(total_users)
        }), 200
        
    except Exception as e:
        print(f"[Analytics] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'total_issued': 0,
            'total_redeemed': 0,
            'total_expired': 0,
            'total_users': 0
        }), 200
@app.route('/api/rewards-v2/admin/adjust', methods=['POST'])
@jwt_required()
def admin_adjust_reward_points():
    """Admin manually adjust user reward points"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        target_user_id = data.get('user_id')
        points_delta = int(data.get('points_delta', 0))
        reason = data.get('reason', 'Manual adjustment by admin')
        
        if not target_user_id:
            return jsonify({'error': 'user_id required'}), 400
        
        if points_delta == 0:
            return jsonify({'error': 'points_delta cannot be zero'}), 400
        
        # Get target user
        user = User.query.get(target_user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Calculate new balance
        current_points = user.reward_points or 0
        new_balance = current_points + points_delta
        
        if new_balance < 0:
            return jsonify({'error': 'Resulting points would be negative'}), 400
        
        # Update user points
        user.reward_points = new_balance
        
        # Create transaction record with proper reference_type
        transaction_type = 'earned' if points_delta > 0 else 'redeemed'
        txn = RewardTransaction(
            user_id=target_user_id,
            transaction_type=transaction_type,
            points=abs(points_delta),
            balance_after=new_balance,
            reference_type='admin',  # Set reference_type for manual adjustments
            reference_id=None,
            description=reason,
            expiry_date=None
        )
        
        db.session.add(txn)
        
        # Update user_reward_summary
        summary_update = text("""
            UPDATE user_reward_summary 
            SET 
                available_points = :new_balance,
                points_earned = points_earned + CASE WHEN :points_delta > 0 THEN :points_delta ELSE 0 END,
                points_used = points_used + CASE WHEN :points_delta < 0 THEN ABS(:points_delta) ELSE 0 END,
                last_transaction_at = NOW(),
                updated_at = NOW()
            WHERE user_id = :user_id
        """)
        db.session.execute(summary_update, {
            'new_balance': new_balance,
            'points_delta': points_delta,
            'user_id': target_user_id
        })
        
        db.session.commit()
        
        print(f"[Rewards] Adjusted points for user {target_user_id}: {points_delta} → {new_balance}")
        return jsonify({
            'success': True,
            'user_id': target_user_id,
            'reward_points': new_balance,
            'balance': new_balance
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[Rewards] Adjust points error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
@app.route('/api/rewards-v2/user/<int:user_id>', methods=['GET'])
def get_user_reward_details_public(user_id):
    """Get detailed reward information for a specific user (public endpoint for frontend)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Try to get or create user summary
        summary = None
        transactions = []
        
        try:
            summary_query = text("""
                SELECT points_earned, points_used, points_expired, available_points, 
                       lifetime_spend, user_tier
                FROM user_reward_summary
                WHERE user_id = :user_id
            """)
            summary = db.session.execute(summary_query, {'user_id': user_id}).fetchone()
            
            if not summary:
                # Create default summary
                insert_query = text("""
                    INSERT INTO user_reward_summary (user_id, available_points)
                    VALUES (:user_id, :points)
                """)
                db.session.execute(insert_query, {
                    'user_id': user_id,
                    'points': user.reward_points or 0
                })
                db.session.commit()
                summary = (0, 0, 0, user.reward_points or 0, 0.00, 'bronze')
        except Exception as summary_error:
            print(f"[User Details] Summary table error: {str(summary_error)}")
            # Use fallback values from user table
            summary = (user.reward_points or 0, 0, 0, user.reward_points or 0, 0.00, 'bronze')
        
        # Try to get transactions
        try:
            trans_query = text("""
                SELECT id, transaction_type, points, balance_after, 
                       reference_type, description, created_at
                FROM reward_transactions
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 50
            """)
            transactions = db.session.execute(trans_query, {'user_id': user_id}).fetchall()
        except Exception as trans_error:
            print(f"[User Details] Transactions table error: {str(trans_error)}")
            transactions = []
        
        return jsonify({
            'balance': {
                'available_points': int(summary[3] or 0),
                'points_earned': int(summary[0] or 0),
                'points_used': int(summary[1] or 0),
                'points_expired': int(summary[2] or 0),
                'user_tier': str(summary[5] or 'bronze'),
                'lifetime_spend': float(summary[4] or 0)
            },
            'transactions': [{
                'id': t[0],
                'type': t[1],
                'points': t[2],
                'balance_after': t[3],
                'reference': t[4],
                'description': t[5],
                'date': t[6].isoformat() if t[6] else None
            } for t in transactions]
        }), 200
    except Exception as e:
        print(f"[User Details] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/rewards-v2/user-details/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_reward_details(user_id):
    """Get detailed reward information for a specific user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get or create user summary
        summary_query = text("""
            SELECT points_earned, points_used, points_expired, available_points, 
                   lifetime_spend, user_tier
            FROM user_reward_summary
            WHERE user_id = :user_id
        """)
        summary = db.session.execute(summary_query, {'user_id': user_id}).fetchone()
        
        if not summary:
            # Create default summary
            insert_query = text("""
                INSERT INTO user_reward_summary (user_id, available_points)
                VALUES (:user_id, :points)
            """)
            db.session.execute(insert_query, {
                'user_id': user_id,
                'points': user.reward_points or 0
            })
            db.session.commit()
            summary = (0, 0, 0, user.reward_points or 0, 0.00, 'bronze')
        
        # Get transactions
        trans_query = text("""
            SELECT id, transaction_type, points, balance_after, 
                   reference_type, description, created_at
            FROM reward_transactions
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 50
        """)
        transactions = db.session.execute(trans_query, {'user_id': user_id}).fetchall()
        
        return jsonify({
            'balance': {
                'available_points': int(summary[3] or 0),
                'points_earned': int(summary[0] or 0),
                'points_used': int(summary[1] or 0),
                'points_expired': int(summary[2] or 0),
                'user_tier': str(summary[5] or 'bronze'),
                'lifetime_spend': float(summary[4] or 0)
            },
            'transactions': [{
                'id': t[0],
                'type': t[1],
                'points': t[2],
                'balance_after': t[3],
                'reference': t[4],
                'description': t[5],
                'date': t[6].isoformat() if t[6] else None
            } for t in transactions]
        }), 200
    except Exception as e:
        print(f"[User Details] Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/rewards-v2/users-with-rewards', methods=['GET'])
@jwt_required()
def get_users_with_rewards():
    """Get all users with their reward point balances"""
    try:
        users = User.query.order_by(desc(User.reward_points)).all()
        
        users_data = []
        for user in users:
            # Get recent transactions
            recent_transactions = RewardTransaction.query.filter_by(user_id=user.id).order_by(
                desc(RewardTransaction.created_at)
            ).limit(5).all()
            
            users_data.append({
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'country_code': user.country_code,
                'reward_points': user.reward_points,
                'wallet_balance': user.wallet_balance,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'reward_balance': {
                    'available_points': user.reward_points,
                    'pending_points': 0,  # Can be enhanced later
                    'lifetime_earned': db.session.query(func.sum(RewardTransaction.points)).filter(
                        RewardTransaction.user_id == user.id,
                        RewardTransaction.transaction_type == 'earned'
                    ).scalar() or 0
                },
                'recent_transactions': [{
                    'id': txn.id,
                    'type': txn.transaction_type,
                    'points': txn.points,
                    'description': txn.description,
                    'created_at': txn.created_at.isoformat() if txn.created_at else None
                } for txn in recent_transactions]
            })
        
        return jsonify({'users': users_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rewards-v2/campaigns', methods=['GET'])
@jwt_required()
def get_reward_campaigns():
    """Get all reward campaigns"""
    try:
        # Query from reward_campaigns table
        campaigns_query = text("""
            SELECT 
                id, name, description, campaign_type, bonus_multiplier, bonus_points,
                min_purchase_amount, applicable_tiers, valid_from, valid_until,
                is_active, created_at, updated_at
            FROM reward_campaigns
            ORDER BY created_at DESC
        """)
        
        result = db.session.execute(campaigns_query).fetchall()
        campaigns = []
        
        for row in result:
            campaigns.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'campaign_type': row[3] if row[3] in ['multiplier', 'bonus_points', 'cashback'] else 'multiplier',
                'bonus_multiplier': float(row[4]) if row[4] else 1.0,
                'bonus_points': int(row[5]) if row[5] else 0,
                'multiplier_value': float(row[4]) if row[4] else 1.0,  # Add for frontend compatibility
                'min_purchase_amount': float(row[6]) if row[6] else 0,
                'applicable_tiers': row[7] or '',
                'valid_from': row[8].isoformat() if row[8] else None,
                'valid_until': row[9].isoformat() if row[9] else None,
                'is_active': bool(row[10]),
                'created_at': row[11].isoformat() if row[11] else None,
                'updated_at': row[12].isoformat() if row[12] else None
            })
        
        print(f"[Campaigns] Returning {len(campaigns)} campaigns")
        return jsonify({'campaigns': campaigns}), 200
    except Exception as e:
        print(f"[Campaigns] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'campaigns': []}), 200  # Return empty array

# Add missing transaction endpoint
@app.route('/api/rewards-v2/transactions', methods=['GET'])
@jwt_required()
def get_rewards_v2_transactions():
    """Get reward transactions for rewards-v2 page"""
    try:
        limit = request.args.get('limit', 100, type=int)
        user_id_filter = request.args.get('user_id', type=int)
        
        # Use raw SQL to join with users table
        query = text("""
            SELECT 
                rt.id, rt.user_id, rt.transaction_type, rt.points,
                rt.balance_after, rt.description, rt.created_at,
                u.full_name, u.email
            FROM reward_transactions rt
            LEFT JOIN users u ON rt.user_id = u.id
            WHERE (:user_id IS NULL OR rt.user_id = :user_id)
            ORDER BY rt.created_at DESC
            LIMIT :limit
        """)
        
        result = db.session.execute(query, {
            'user_id': user_id_filter,
            'limit': limit
        }).fetchall()
        
        transactions_data = [{
            'id': row[0],
            'user_id': row[1],
            'transaction_type': row[2],
            'points': row[3],
            'balance_after': row[4],
            'description': row[5],
            'created_at': row[6].isoformat() if row[6] else None,
            'user_name': row[7] or f'User #{row[1]}',
            'full_name': row[7],
            'user_email': row[8] or '',
            'value_in_currency': row[3] * 0.1 if row[3] else 0  # Assuming 10 points = ₹1
        } for row in result]
        
        print(f"[Transactions] Returning {len(transactions_data)} transactions with user names")
        return jsonify({'transactions': transactions_data}), 200
    except Exception as e:
        print(f"[Transactions] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'transactions': []}), 200

# Add stacking endpoints  
@app.route('/api/reward-stacking/stacked-transactions', methods=['GET'])
@jwt_required()
def get_stacked_transactions():
    """Get transactions where both coupon and rewards were used"""
    try:
        query = text("""
            SELECT o.id, o.order_number, o.user_id, o.coupon_discount,
                   o.reward_points_used, o.total_amount, o.created_at,
                   u.full_name, u.email,
                   COALESCE(urs.user_tier, 'bronze') as user_tier,
                   COALESCE(o.coupon_code, c.code, 
                       CASE 
                           WHEN o.coupon_discount > 0 THEN CONCAT('DISCOUNT', CAST(o.coupon_discount AS CHAR))
                           ELSE NULL
                       END
                   ) as coupon_code,
                   o.payment_status
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN user_reward_summary urs ON o.user_id = urs.user_id
            LEFT JOIN coupons c ON o.coupon_id = c.id
            WHERE o.coupon_discount > 0 AND o.reward_points_used > 0
            ORDER BY o.created_at DESC
            LIMIT 100
        """)
        result = db.session.execute(query).fetchall()
        
        transactions = [{
            'order_id': row[0], 
            'order_number': row[1], 
            'user_id': row[2],
            'coupon_discount': float(row[3]) if row[3] else 0.0, 
            'reward_points_used': int(row[4]) if row[4] else 0,
            'total_amount': float(row[5]) if row[5] else 0.0,
            'created_at': row[6].isoformat() if row[6] else None,
            'user': row[7] or 'Unknown User',
            'user_email': row[8] or '',
            'tier': row[9] or 'bronze',
            'coupon_code': row[10] or 'N/A',
            'status': row[11] or 'pending',
            'reward_value': (int(row[4]) if row[4] else 0) * 0.1  # 10 points = ₹1
        } for row in result]
        
        print(f"[Stacking] Found {len(transactions)} stacked transactions")
        return jsonify({'transactions': transactions}), 200
    except Exception as e:
        print(f"[Stacking] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'transactions': []}), 200

@app.route('/api/reward-stacking/stacking-analytics', methods=['GET'])
@jwt_required()
def get_stacking_analytics():
    """Get analytics for stacked rewards"""
    try:
        # Get all stacked orders data
        query = text("""
            SELECT 
                COUNT(*) as total_stacked,
                SUM(o.coupon_discount + (o.reward_points_used * 0.1)) as total_savings,
                AVG(o.coupon_discount + (o.reward_points_used * 0.1)) as avg_discount_per_order,
                (COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM orders WHERE LOWER(payment_status) = 'paid'), 0)) as stacked_percentage
            FROM orders o
            WHERE o.coupon_discount > 0 AND o.reward_points_used > 0
        """)
        result = db.session.execute(query).fetchone()
        
        if result:
            return jsonify({
                'overview': {
                    'total_stacked': int(result[0] or 0),
                    'average_discount_per_order': float(result[2] or 0),
                    'stacked_percentage': round(float(result[3] or 0), 2)
                },
                'total_savings_generated': float(result[1] or 0)
            }), 200
        else:
            return jsonify({
                'overview': {
                    'total_stacked': 0,
                    'average_discount_per_order': 0.0,
                    'stacked_percentage': 0.0
                },
                'total_savings_generated': 0.0
            }), 200
    except Exception as e:
        print(f"[Stacking Analytics] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'overview': {
                'total_stacked': 0,
                'average_discount_per_order': 0.0,
                'stacked_percentage': 0.0
            },
            'total_savings_generated': 0.0
        }), 200

# ==================== CAMPAIGN MANAGEMENT ENDPOINTS ====================

@app.route('/api/reward-campaigns/campaigns', methods=['POST'])
@jwt_required()
def create_reward_campaign():
    """Create a new reward campaign"""
    try:
        data = request.get_json()
        
        query = text("""
            INSERT INTO reward_campaigns (
                name, description, campaign_type, bonus_multiplier, bonus_points,
                min_purchase_amount, applicable_tiers, valid_from, valid_until, is_active
            ) VALUES (
                :name, :description, :campaign_type, :bonus_multiplier, :bonus_points,
                :min_purchase, :tiers, :valid_from, :valid_until, :is_active
            )
        """)
        
        db.session.execute(query, {
            'name': data.get('name'),
            'description': data.get('description'),
            'campaign_type': data.get('campaign_type', 'multiplier'),
            'bonus_multiplier': float(data.get('multiplier_value', 1.0)),
            'bonus_points': int(data.get('bonus_points', 0)),
            'min_purchase': float(data.get('min_purchase_amount', 0)),
            'tiers': ','.join(data.get('applicable_tiers', [])) if isinstance(data.get('applicable_tiers'), list) else data.get('applicable_tiers', ''),
            'valid_from': data.get('valid_from'),
            'valid_until': data.get('valid_until'),
            'is_active': bool(data.get('is_active', True))
        })
        
        db.session.commit()
        print(f"[Campaigns] Created campaign: {data.get('name')}")
        return jsonify({'success': True, 'message': 'Campaign created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        print(f"[Campaigns] Create error: {str(e)}")
        return jsonify({'error': str(e)}), 500
@app.route('/api/reward-campaigns/campaigns/<int:campaign_id>', methods=['PUT'])
@jwt_required()
def update_reward_campaign(campaign_id):
    """Update an existing reward campaign"""
    try:
        data = request.get_json()
        
        query = text("""
            UPDATE reward_campaigns SET
                name = :name, description = :description,
                campaign_type = :campaign_type, 
                bonus_multiplier = :bonus_multiplier,
                bonus_points = :bonus_points,
                min_purchase_amount = :min_purchase, 
                applicable_tiers = :tiers,
                valid_from = :valid_from, valid_until = :valid_until,
                is_active = :is_active, updated_at = NOW()
            WHERE id = :campaign_id
        """)
        
        db.session.execute(query, {
            'campaign_id': campaign_id,
            'name': data.get('name'),
            'description': data.get('description'),
            'campaign_type': data.get('campaign_type', 'multiplier'),
            'bonus_multiplier': float(data.get('multiplier_value', 1.0)),
            'bonus_points': int(data.get('bonus_points', 0)),
            'min_purchase': float(data.get('min_purchase_amount', 0)),
            'tiers': ','.join(data.get('applicable_tiers', [])) if isinstance(data.get('applicable_tiers'), list) else data.get('applicable_tiers', ''),
            'valid_from': data.get('valid_from'),
            'valid_until': data.get('valid_until'),
            'is_active': bool(data.get('is_active', True))
        })
        
        db.session.commit()
        print(f"[Campaigns] Updated campaign {campaign_id}")
        return jsonify({'success': True, 'message': 'Campaign updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[Campaigns] Update error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reward-campaigns/campaigns/<int:campaign_id>', methods=['DELETE'])
@jwt_required()
def delete_reward_campaign(campaign_id):
    """Delete a reward campaign"""
    try:
        query = text("DELETE FROM reward_campaigns WHERE id = :campaign_id")
        db.session.execute(query, {'campaign_id': campaign_id})
        db.session.commit()
        
        print(f"[Campaigns] Deleted campaign {campaign_id}")
        return jsonify({'success': True, 'message': 'Campaign deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[Campaigns] Delete error: {str(e)}")
        return jsonify({'error': str(e)}), 500
@app.route('/api/reward-transactions/', methods=['GET'])
@jwt_required()
def get_reward_transactions():
    """Get reward transactions"""
    try:
        user_id = request.args.get('user_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = RewardTransaction.query
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        query = query.order_by(desc(RewardTransaction.created_at))
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        transactions = pagination.items
        
        transactions_data = [{
            'id': txn.id,
            'user_id': txn.user_id,
            'transaction_type': txn.transaction_type,
            'points': txn.points,
            'balance_after': txn.balance_after,
            'reference_type': txn.reference_type,
            'reference_id': txn.reference_id,
            'description': txn.description,
            'expiry_date': txn.expiry_date.isoformat() if txn.expiry_date else None,
            'created_at': txn.created_at.isoformat() if txn.created_at else None
        } for txn in transactions]
        
        return jsonify({
            'reward_transactions': transactions_data,
            'page': page,
            'pages': pagination.pages,
            'total': pagination.total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reward-transactions/', methods=['POST'])
@jwt_required()
def create_reward_transaction():
    """Create reward transaction (earn/redeem points)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        # Get user
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        points = data.get('points', 0)
        transaction_type = data.get('transaction_type', 'earned')
        
        # Update user balance
        if transaction_type == 'earned':
            user.reward_points += points
        elif transaction_type == 'redeemed':
            if user.reward_points < points:
                return jsonify({'error': 'Insufficient reward points'}), 400
            user.reward_points -= points
        
        # Create transaction record
        transaction = RewardTransaction(
            user_id=user_id,
            transaction_type=transaction_type,
            points=points,
            balance_after=user.reward_points,
            reference_type=data.get('reference_type'),
            reference_id=data.get('reference_id'),
            description=data.get('description'),
            expiry_date=parse_date(data.get('expiry_date'))
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Reward transaction created successfully',
            'transaction_id': transaction.id,
            'new_balance': user.reward_points
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
# ==================== WALLET TRANSACTION ROUTES ====================
@app.route('/api/wallet-transactions/', methods=['GET'])
@jwt_required()
def get_wallet_transactions():
    """Get wallet transactions"""
    try:
        user_id = request.args.get('user_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        query = WalletTransaction.query
        
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        query = query.order_by(desc(WalletTransaction.created_at))
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        transactions = pagination.items
        
        transactions_data = [{
            'id': txn.id,
            'user_id': txn.user_id,
            'transaction_type': txn.transaction_type,
            'amount': txn.amount,
            'currency': txn.currency,
            'balance_after': txn.balance_after,
            'reference_type': txn.reference_type,
            'reference_id': txn.reference_id,
            'description': txn.description,
            'status': txn.status,
            'created_at': txn.created_at.isoformat() if txn.created_at else None
        } for txn in transactions]
        
        return jsonify({
            'wallet_transactions': transactions_data,
            'page': page,
            'pages': pagination.pages,
            'total': pagination.total
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wallet-transactions/', methods=['POST'])
@jwt_required()
def create_wallet_transaction():
    """Create wallet transaction (credit/debit)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        # Get user
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        amount = data.get('amount', 0)
        transaction_type = data.get('transaction_type', 'credit')
        
        # Update user wallet balance
        if transaction_type == 'credit' or transaction_type == 'refund':
            user.wallet_balance += amount
        elif transaction_type == 'debit':
            if user.wallet_balance < amount:
                return jsonify({'error': 'Insufficient wallet balance'}), 400
            user.wallet_balance -= amount
        
        # Create transaction record
        transaction = WalletTransaction(
            user_id=user_id,
            transaction_type=transaction_type,
            amount=amount,
            currency=data.get('currency', 'INR'),
            balance_after=user.wallet_balance,
            reference_type=data.get('reference_type'),
            reference_id=data.get('reference_id'),
            description=data.get('description'),
            status=data.get('status', 'completed')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Wallet transaction created successfully',
            'transaction_id': transaction.id,
            'new_balance': user.wallet_balance
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH BENEFIT ROUTES ====================

@app.route('/api/health-benefits/', methods=['GET'])
@jwt_required()
def get_health_benefits():
    """Get all health benefits"""
    try:
        is_active = request.args.get('is_active', type=lambda x: x.lower() == 'true')
        
        query = HealthBenefit.query
        
        if is_active is not None:
            query = query.filter_by(is_active=is_active)
        
        health_benefits = query.all()
        
        benefits_data = [{
            'id': hb.id,
            'name': hb.name,
            'description': hb.description,
            'icon': hb.icon,
            'is_active': hb.is_active
        } for hb in health_benefits]
        
        return jsonify({'health_benefits': benefits_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health-benefits/', methods=['POST'])
@jwt_required()
def create_health_benefit():
    """Create new health benefit"""
    try:
        data = request.get_json()
        
        health_benefit = HealthBenefit(
            name=data.get('name'),
            description=data.get('description'),
            icon=data.get('icon'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(health_benefit)
        db.session.commit()
        
        return jsonify({
            'message': 'Health benefit created successfully',
            'health_benefit_id': health_benefit.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/health-benefits/<int:hb_id>', methods=['PUT'])
@jwt_required()
def update_health_benefit(hb_id):
    """Update health benefit"""
    try:
        health_benefit = db.session.get(HealthBenefit, hb_id)
        
        if not health_benefit:
            return jsonify({'error': 'Health benefit not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            health_benefit.name = data['name']
        if 'description' in data:
            health_benefit.description = data['description']
        if 'icon' in data:
            health_benefit.icon = data['icon']
        if 'is_active' in data:
            health_benefit.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({'message': 'Health benefit updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/health-benefits/<int:hb_id>', methods=['DELETE'])
@jwt_required()
def delete_health_benefit(hb_id):
    """Delete health benefit"""
    try:
        health_benefit = db.session.get(HealthBenefit, hb_id)
        
        if not health_benefit:
            return jsonify({'error': 'Health benefit not found'}), 404
        
        db.session.delete(health_benefit)
        db.session.commit()
        
        return jsonify({'message': 'Health benefit deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== SIZE ROUTES ====================

@app.route('/api/sizes/', methods=['GET'])
@jwt_required()
def get_sizes():
    """Get all sizes"""
    try:
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        if include_inactive:
            sizes = Size.query.order_by(Size.sort_order).all()
        else:
            sizes = Size.query.filter_by(is_active=True).order_by(Size.sort_order).all()
        
        sizes_data = [{
            'id': size.id,
            'name': size.name,
            'description': size.description,
            'sort_order': size.sort_order,
            'is_active': size.is_active,
            'created_at': size.created_at.isoformat() if size.created_at else None
        } for size in sizes]
        
        return jsonify({'sizes': sizes_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/sizes/', methods=['POST'])
@jwt_required()
def create_size():
    """Create new size"""
    try:
        data = request.get_json()
        
        # Check if size name exists
        if Size.query.filter_by(name=data['name']).first():
            return jsonify({'error': 'Size with this name already exists'}), 400
        
        size = Size(
            name=data.get('name'),
            description=data.get('description'),
            sort_order=data.get('sort_order', 0),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(size)
        db.session.commit()
        
        return jsonify({
            'message': 'Size created successfully',
            'size_id': size.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/sizes/<int:size_id>', methods=['PUT'])
@jwt_required()
def update_size(size_id):
    """Update size"""
    try:
        size = db.session.get(Size, size_id)
        
        if not size:
            return jsonify({'error': 'Size not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            # Check if new name conflicts with existing
            existing = Size.query.filter_by(name=data['name']).first()
            if existing and existing.id != size_id:
                return jsonify({'error': 'Size with this name already exists'}), 400
            size.name = data['name']
        if 'description' in data:
            size.description = data['description']
        if 'sort_order' in data:
            size.sort_order = data['sort_order']
        if 'is_active' in data:
            size.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({'message': 'Size updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/sizes/<int:size_id>', methods=['DELETE'])
@jwt_required()
def delete_size(size_id):
    """Delete size"""
    try:
        size = db.session.get(Size, size_id)
        
        if not size:
            return jsonify({'error': 'Size not found'}), 404
        
        db.session.delete(size)
        db.session.commit()
        
        return jsonify({'message': 'Size deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== MESSAGE ROUTES ====================

@app.route('/api/messages/', methods=['GET'])
@jwt_required()
def get_messages():
    """Get all messages"""
    try:
        status = request.args.get('status', '')
        
        query = Message.query
        
        if status:
            query = query.filter_by(status=status)
        
        messages = query.order_by(desc(Message.created_at)).all()
        
        messages_data = [{
            'id': msg.id,
            'name': msg.name,
            'email': msg.email,
            'phone': msg.phone,
            'subject': msg.subject,
            'message': msg.message,
            'status': msg.status,
            'is_starred': msg.is_starred,
            'replied_at': msg.replied_at.isoformat() if msg.replied_at else None,
            'created_at': msg.created_at.isoformat()
        } for msg in messages]
        
        return jsonify({'messages': messages_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/', methods=['POST'])
def create_message():
    """Create new message (public endpoint)"""
    try:
        data = request.get_json()
        
        message = Message(
            name=data.get('name'),
            email=data.get('email'),
            phone=data.get('phone'),
            subject=data.get('subject'),
            message=data.get('message')
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'message': 'Message sent successfully',
            'message_id': message.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/messages/<int:message_id>/status', methods=['PUT'])
@jwt_required()
def update_message_status(message_id):
    """Update message status"""
    try:
        message = db.session.get(Message, message_id)
        
        if not message:
            return jsonify({'error': 'Message not found'}), 404
        
        data = request.get_json()
        
        if 'status' in data:
            message.status = data['status']
        if 'is_starred' in data:
            message.is_starred = data['is_starred']
        
        if data.get('status') == 'replied':
            message.replied_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({'message': 'Message status updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
# ==================== SETTINGS ROUTES ====================

@app.route('/api/settings/profile', methods=['PUT'])
@jwt_required()
def update_settings_profile():
    """Update user profile settings"""
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'email' in data:
            user.email = data['email']
        if 'full_name' in data:
            user.full_name = data['full_name']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': {
                'email': user.email,
                'full_name': user.full_name
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== REVENUE SETTINGS ROUTES ====================

@app.route('/api/settings/revenue', methods=['GET'])
@jwt_required()
def get_revenue_settings():
    """Get revenue settings for the current admin user"""
    try:
        user_id = get_jwt_identity()
        
        # Query settings from database
        query = text("""
            SELECT 
                currency, tax_rate, monthly_target, quarterly_target, yearly_target,
                alert_threshold, reporting_frequency, revenue_alerts_enabled,
                email_notifications_enabled, sms_notifications_enabled,
                data_retention_days, low_stock_threshold, auto_reorder_enabled
            FROM revenue_settings
            WHERE admin_id = :admin_id
        """)
        
        result = db.session.execute(query, {'admin_id': user_id}).fetchone()
        
        if result:
            settings = {
                'currency': result[0], 'taxRate': float(result[1] or 0),
                'monthlyTarget': float(result[2] or 0), 'quarterlyTarget': float(result[3] or 0),
                'yearlyTarget': float(result[4] or 0), 'alertThreshold': int(result[5] or 80),
                'reportingFrequency': result[6] or 'daily',
                'revenueAlerts': bool(result[7]), 'emailNotifications': bool(result[8]),
                'smsNotifications': bool(result[9]), 'dataRetention': int(result[10] or 365),
                'lowStockThreshold': int(result[11] or 10), 'autoReorder': bool(result[12])
            }
        else:
            settings = {
                'currency': 'INR', 'taxRate': 8.5, 'monthlyTarget': 10000.00,
                'quarterlyTarget': 30000.00, 'yearlyTarget': 120000.00,
                'alertThreshold': 80, 'reportingFrequency': 'daily',
                'revenueAlerts': True, 'emailNotifications': True,
                'smsNotifications': False, 'dataRetention': 365,
                'lowStockThreshold': 10, 'autoReorder': False
            }
        
        return jsonify({'settings': settings}), 200
    except Exception as e:
        print(f"Error fetching revenue settings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/settings/revenue', methods=['PUT'])
@jwt_required()
def update_revenue_settings():
    """Update revenue settings for the current admin user"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        print(f"[Revenue Settings] Updating for admin {user_id}")
        
        # Check if settings exist
        check_query = text("SELECT id FROM revenue_settings WHERE admin_id = :admin_id")
        existing = db.session.execute(check_query, {'admin_id': user_id}).fetchone()
        
        if existing:
            # Update
            query = text("""
                UPDATE revenue_settings SET
                    currency = :currency, tax_rate = :tax_rate,
                    monthly_target = :monthly_target, quarterly_target = :quarterly_target,
                    yearly_target = :yearly_target, alert_threshold = :alert_threshold,
                    reporting_frequency = :reporting_frequency,
                    revenue_alerts_enabled = :revenue_alerts_enabled,
                    email_notifications_enabled = :email_notifications_enabled,
                    sms_notifications_enabled = :sms_notifications_enabled,
                    data_retention_days = :data_retention_days,
                    low_stock_threshold = :low_stock_threshold,
                    auto_reorder_enabled = :auto_reorder_enabled
                WHERE admin_id = :admin_id
            """)
        else:
            # Insert
            query = text("""
                INSERT INTO revenue_settings (
                    admin_id, currency, tax_rate, monthly_target, quarterly_target,
                    yearly_target, alert_threshold, reporting_frequency,
                    revenue_alerts_enabled, email_notifications_enabled,
                    sms_notifications_enabled, data_retention_days,
                    low_stock_threshold, auto_reorder_enabled
                ) VALUES (
                    :admin_id, :currency, :tax_rate, :monthly_target, :quarterly_target,
                    :yearly_target, :alert_threshold, :reporting_frequency,
                    :revenue_alerts_enabled, :email_notifications_enabled,
                    :sms_notifications_enabled, :data_retention_days,
                    :low_stock_threshold, :auto_reorder_enabled
                )
            """)
        
        db.session.execute(query, {
            'admin_id': user_id, 'currency': data.get('currency', 'INR'),
            'tax_rate': float(data.get('taxRate', 0)),
            'monthly_target': float(data.get('monthlyTarget', 0)),
            'quarterly_target': float(data.get('quarterlyTarget', 0)),
            'yearly_target': float(data.get('yearlyTarget', 0)),
            'alert_threshold': int(data.get('alertThreshold', 80)),
            'reporting_frequency': data.get('reportingFrequency', 'daily'),
            'revenue_alerts_enabled': bool(data.get('revenueAlerts', False)),
            'email_notifications_enabled': bool(data.get('emailNotifications', False)),
            'sms_notifications_enabled': bool(data.get('smsNotifications', False)),
            'data_retention_days': int(data.get('dataRetention', 365)),
            'low_stock_threshold': int(data.get('lowStockThreshold', 10)),
            'auto_reorder_enabled': bool(data.get('autoReorder', False))
        })
        
        db.session.commit()
        print(f"[Revenue Settings] Updated successfully")
        return jsonify({'success': True, 'message': 'Revenue settings updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[Revenue Settings] Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ==================== REPORTS ROUTES ====================

@app.route('/api/reports/customers/export', methods=['GET'])
@jwt_required()
def export_customers():
    """Export customer report - FIXED: Wide columns, proper currency, phone validation"""
    try:
        users = User.query.all()
        
        # Create WIDE column headers for dates to prevent ###
        csv_lines = ['Name,Email,Phone Number,Country Code,Country,Currency,Wallet Balance,Reward Points,Status,Joined Date     ']
        
        for user in users:
            status = "Active" if user.is_active else "Blocked"
            
            # Format phone - validate and clean
            phone = user.phone or "N/A"
            if phone and phone != "N/A":
                phone_str = str(phone).strip()
                # Ensure it has + prefix
                if not phone_str.startswith('+'):
                    phone_str = f"+{phone_str}"
                # Use ="..." to force text in Excel
                phone = f'="{phone_str}"'
            else:
                phone = '"N/A"'
            
            # Get country info
            country_code = user.country_code or "N/A"
            country_name = "N/A"
            country_currency = user.preferred_currency or "INR"
            
            if country_code and country_code != "N/A":
                country_obj = Country.query.filter_by(country_code=country_code).first()
                if country_obj:
                    country_name = country_obj.country_name
                    country_currency = country_obj.currency_code
            
            # Format date - SHORTENED to fit
            date_str = user.created_at.strftime("%d-%b-%y") if user.created_at else "N/A"
            
            # Wallet balance in customer's currency
            wallet_amount = float(user.wallet_balance) if user.wallet_balance else 0.0
            wallet = f"{country_currency} {wallet_amount:.2f}"
            
            # Format reward points
            points = int(user.reward_points) if user.reward_points else 0
            
            # Build CSV row - add extra spaces to date column
            csv_lines.append(
                f'"{user.full_name}","{user.email}",{phone},"{country_code}","{country_name}",'
                f'"{country_currency}",{wallet_amount:.2f},{points},"{status}","{date_str}          "'
            )
        
        csv_content = '\n'.join(csv_lines)
        
        from flask import Response
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f'customers_report_{timestamp}.csv'
        
        return Response(
            csv_content,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename={filename}'}
        )
        
    except Exception as e:
        print(f"[ERROR] Export customers failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
# ==================== INITIALIZATION ====================
def init_analytics_tables():
    """Create analytics tables if they don't exist"""
    try:
        # Check if user_sessions table exists and has correct schema
        try:
            result = db.session.execute(text("""
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'user_sessions'
            """)).fetchall()
            existing_columns = [row[0] for row in result] if result else []
            
            # If table exists but doesn't have our expected columns, drop and recreate
            if existing_columns and 'session_id' not in existing_columns:
                print(f"[WARNING] user_sessions table exists with different schema: {existing_columns}")
                print(f"[INFO] Dropping and recreating user_sessions table with correct schema...")
                db.session.execute(text("DROP TABLE IF EXISTS user_sessions"))
                db.session.commit()
                print(f"[SUCCESS] Dropped old user_sessions table")
        except Exception as check_error:
            print(f"[INFO] Could not check user_sessions schema: {str(check_error)}")
        
        # Create user_sessions table (for users who haven't purchased)
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id VARCHAR(255) UNIQUE NOT NULL,
                user_id INT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                referrer_url TEXT,
                landing_page VARCHAR(500),
                current_page VARCHAR(500),
                device_type VARCHAR(50),
                browser VARCHAR(100),
                os VARCHAR(100),
                screen_resolution VARCHAR(50),
                language VARCHAR(10),
                timezone VARCHAR(50),
                pages_viewed INT DEFAULT 0,
                clicks INT DEFAULT 0,
                time_spent_seconds INT DEFAULT 0,
                entry_time DATETIME,
                last_activity DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_session_id (session_id),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            )
        """))
        
        # Create customer_sessions table (for users who have purchased)
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS customer_sessions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id VARCHAR(255) UNIQUE NOT NULL,
                user_id INT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                referrer_url TEXT,
                landing_page VARCHAR(500),
                current_page VARCHAR(500),
                device_type VARCHAR(50),
                browser VARCHAR(100),
                os VARCHAR(100),
                screen_resolution VARCHAR(50),
                language VARCHAR(10),
                timezone VARCHAR(50),
                pages_viewed INT DEFAULT 0,
                clicks INT DEFAULT 0,
                time_spent_seconds INT DEFAULT 0,
                is_converted BOOLEAN DEFAULT FALSE,
                conversion_value DECIMAL(12, 2),
                order_id INT,
                entry_time DATETIME,
                last_activity DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_session_id (session_id),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            )
        """))
        
        # Create page_views table
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS page_views (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id VARCHAR(255) NOT NULL,
                page_url VARCHAR(500) NOT NULL,
                page_title VARCHAR(500),
                time_on_page INT DEFAULT 0,
                viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_session_id (session_id),
                INDEX idx_viewed_at (viewed_at)
            )
        """))
        
        # Create click_events table
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS click_events (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id VARCHAR(255) NOT NULL,
                user_id INT,
                page_url VARCHAR(500),
                element_type VARCHAR(50),
                element_id VARCHAR(255),
                element_class TEXT,
                element_text TEXT,
                click_x INT,
                click_y INT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_session_id (session_id),
                INDEX idx_timestamp (timestamp)
            )
        """))
        
        # Create user_actions table
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS user_actions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id VARCHAR(255) NOT NULL,
                user_id INT,
                action_type VARCHAR(100) NOT NULL,
                action_details TEXT,
                page_url VARCHAR(500),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_session_id (session_id),
                INDEX idx_action_type (action_type),
                INDEX idx_timestamp (timestamp)
            )
        """))
        
        # Create session_errors table
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS session_errors (
                id INT PRIMARY KEY AUTO_INCREMENT,
                session_id VARCHAR(255) NOT NULL,
                user_id INT,
                error_type VARCHAR(100),
                error_message TEXT,
                error_stack TEXT,
                page_url VARCHAR(500),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_session_id (session_id),
                INDEX idx_timestamp (timestamp)
            )
        """))
        
        # Create customer_type_log table
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS customer_type_log (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                order_id INT,
                customer_type ENUM('new', 'returning') NOT NULL,
                previous_orders_count INT DEFAULT 0,
                logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_order (user_id, order_id),
                INDEX idx_user_id (user_id),
                INDEX idx_logged_at (logged_at)
            )
        """))
        
        db.session.commit()
        print("[SUCCESS] Analytics tables created/verified successfully")
        print("[INFO] Created tables: user_sessions, customer_sessions, user_actions, page_views, click_events, session_errors, customer_type_log")
    except Exception as e:
        print(f"[ERROR] Analytics tables creation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()

def init_cities_table():
    """Create cities table and populate with Indian cities by state"""
    try:
        # Create cities table
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS cities (
                id INT PRIMARY KEY AUTO_INCREMENT,
                city_name VARCHAR(100) NOT NULL,
                state_name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_state (state_name),
                INDEX idx_city (city_name)
            )
        """))
        
        # Check if cities already exist - we'll still add missing ones
        existing_cities = db.session.execute(text("SELECT COUNT(*) as count FROM cities")).fetchone()
        if existing_cities and existing_cities[0] > 0:
            print(f"[INFO] Cities table already has {existing_cities[0]} cities. Adding missing cities...")
        
        # Indian cities by state (common cities)
        indian_cities = [
            # Rajasthan
            ('Jaipur', 'Rajasthan'), ('Jodhpur', 'Rajasthan'), ('Udaipur', 'Rajasthan'),
            ('Kota', 'Rajasthan'), ('Bikaner', 'Rajasthan'), ('Ajmer', 'Rajasthan'),
            ('Bhilwara', 'Rajasthan'), ('Alwar', 'Rajasthan'), ('Bharatpur', 'Rajasthan'),
            ('Sikar', 'Rajasthan'), ('Pali', 'Rajasthan'), ('Tonk', 'Rajasthan'),
            
            # Maharashtra
            ('Mumbai', 'Maharashtra'), ('Pune', 'Maharashtra'), ('Nagpur', 'Maharashtra'),
            ('Nashik', 'Maharashtra'), ('Aurangabad', 'Maharashtra'), ('Solapur', 'Maharashtra'),
            ('Thane', 'Maharashtra'), ('Kalyan', 'Maharashtra'), ('Vasai', 'Maharashtra'),
            ('Navi Mumbai', 'Maharashtra'), ('Sangli', 'Maharashtra'), ('Kolhapur', 'Maharashtra'),
            
            # Delhi
            ('New Delhi', 'Delhi'), ('Delhi', 'Delhi'),
            
            # Karnataka
            ('Bangalore', 'Karnataka'), ('Mysore', 'Karnataka'), ('Hubli', 'Karnataka'),
            ('Mangalore', 'Karnataka'), ('Belgaum', 'Karnataka'), ('Gulbarga', 'Karnataka'),
            ('Davangere', 'Karnataka'), ('Bellary', 'Karnataka'), ('Bijapur', 'Karnataka'),
            
            # Tamil Nadu
            ('Chennai', 'Tamil Nadu'), ('Coimbatore', 'Tamil Nadu'), ('Madurai', 'Tamil Nadu'),
            ('Tiruchirappalli', 'Tamil Nadu'), ('Salem', 'Tamil Nadu'), ('Tirunelveli', 'Tamil Nadu'),
            ('Erode', 'Tamil Nadu'), ('Vellore', 'Tamil Nadu'), ('Thanjavur', 'Tamil Nadu'),
            
            # Gujarat
            ('Ahmedabad', 'Gujarat'), ('Surat', 'Gujarat'), ('Vadodara', 'Gujarat'),
            ('Rajkot', 'Gujarat'), ('Bhavnagar', 'Gujarat'), ('Jamnagar', 'Gujarat'),
            ('Gandhinagar', 'Gujarat'), ('Anand', 'Gujarat'), ('Bharuch', 'Gujarat'),
            
            # Uttar Pradesh
            ('Lucknow', 'Uttar Pradesh'), ('Kanpur', 'Uttar Pradesh'), ('Agra', 'Uttar Pradesh'),
            ('Varanasi', 'Uttar Pradesh'), ('Allahabad', 'Uttar Pradesh'), ('Meerut', 'Uttar Pradesh'),
            ('Ghaziabad', 'Uttar Pradesh'), ('Noida', 'Uttar Pradesh'), ('Bareilly', 'Uttar Pradesh'),
            
            # West Bengal
            ('Kolkata', 'West Bengal'), ('Howrah', 'West Bengal'), ('Durgapur', 'West Bengal'),
            ('Asansol', 'West Bengal'), ('Siliguri', 'West Bengal'), ('Kharagpur', 'West Bengal'),
            
            # Madhya Pradesh
            ('Bhopal', 'Madhya Pradesh'), ('Indore', 'Madhya Pradesh'), ('Gwalior', 'Madhya Pradesh'),
            ('Jabalpur', 'Madhya Pradesh'), ('Ujjain', 'Madhya Pradesh'), ('Raipur', 'Madhya Pradesh'),
            
            # Punjab
            ('Chandigarh', 'Punjab'), ('Ludhiana', 'Punjab'), ('Amritsar', 'Punjab'),
            ('Jalandhar', 'Punjab'), ('Patiala', 'Punjab'), ('Bathinda', 'Punjab'),
            
            # Haryana
            ('Gurgaon', 'Haryana'), ('Faridabad', 'Haryana'), ('Panipat', 'Haryana'),
            ('Ambala', 'Haryana'), ('Yamunanagar', 'Haryana'), ('Karnal', 'Haryana'),
            
            # Andhra Pradesh
            ('Hyderabad', 'Andhra Pradesh'), ('Visakhapatnam', 'Andhra Pradesh'), ('Vijayawada', 'Andhra Pradesh'),
            ('Guntur', 'Andhra Pradesh'), ('Nellore', 'Andhra Pradesh'), ('Rajahmundry', 'Andhra Pradesh'),
            
            # Kerala
            ('Kochi', 'Kerala'), ('Thiruvananthapuram', 'Kerala'), ('Kozhikode', 'Kerala'),
            ('Thrissur', 'Kerala'), ('Kollam', 'Kerala'), ('Alappuzha', 'Kerala'),
            
            # Odisha
            ('Bhubaneswar', 'Odisha'), ('Cuttack', 'Odisha'), ('Rourkela', 'Odisha'),
            ('Berhampur', 'Odisha'), ('Sambalpur', 'Odisha'),
            
            # Bihar
            ('Patna', 'Bihar'), ('Gaya', 'Bihar'), ('Bhagalpur', 'Bihar'),
            ('Muzaffarpur', 'Bihar'), ('Darbhanga', 'Bihar'),
            
            # Assam
            ('Guwahati', 'Assam'), ('Silchar', 'Assam'), ('Dibrugarh', 'Assam'),
            ('Jorhat', 'Assam'), ('Nagaon', 'Assam'),
            
            # Arunachal Pradesh
            ('Itanagar', 'Arunachal Pradesh'), ('Naharlagun', 'Arunachal Pradesh'), ('Pasighat', 'Arunachal Pradesh'),
            ('Tawang', 'Arunachal Pradesh'), ('Bomdila', 'Arunachal Pradesh'),
            
            # Chhattisgarh
            ('Raipur', 'Chhattisgarh'), ('Bhilai', 'Chhattisgarh'), ('Bilaspur', 'Chhattisgarh'),
            ('Durg', 'Chhattisgarh'), ('Korba', 'Chhattisgarh'), ('Raigarh', 'Chhattisgarh'),
            
            # Goa
            ('Panaji', 'Goa'), ('Margao', 'Goa'), ('Vasco da Gama', 'Goa'),
            ('Mapusa', 'Goa'), ('Ponda', 'Goa'),
            
            # Himachal Pradesh
            ('Shimla', 'Himachal Pradesh'), ('Mandi', 'Himachal Pradesh'), ('Solan', 'Himachal Pradesh'),
            ('Dharamshala', 'Himachal Pradesh'), ('Kullu', 'Himachal Pradesh'), ('Manali', 'Himachal Pradesh'),
            
            # Jharkhand
            ('Ranchi', 'Jharkhand'), ('Jamshedpur', 'Jharkhand'), ('Dhanbad', 'Jharkhand'),
            ('Bokaro', 'Jharkhand'), ('Hazaribagh', 'Jharkhand'), ('Deoghar', 'Jharkhand'),
            
            # Manipur
            ('Imphal', 'Manipur'), ('Thoubal', 'Manipur'), ('Bishnupur', 'Manipur'),
            ('Churachandpur', 'Manipur'),
            
            # Meghalaya
            ('Shillong', 'Meghalaya'), ('Tura', 'Meghalaya'), ('Jowai', 'Meghalaya'),
            ('Nongpoh', 'Meghalaya'),
            
            # Mizoram
            ('Aizawl', 'Mizoram'), ('Lunglei', 'Mizoram'), ('Saiha', 'Mizoram'),
            ('Champhai', 'Mizoram'),
            
            # Nagaland
            ('Kohima', 'Nagaland'), ('Dimapur', 'Nagaland'), ('Mokokchung', 'Nagaland'),
            ('Tuensang', 'Nagaland'),
            
            # Sikkim
            ('Gangtok', 'Sikkim'), ('Namchi', 'Sikkim'), ('Mangan', 'Sikkim'),
            ('Gyalshing', 'Sikkim'),
            
            # Telangana
            ('Hyderabad', 'Telangana'), ('Warangal', 'Telangana'), ('Nizamabad', 'Telangana'),
            ('Karimnagar', 'Telangana'), ('Khammam', 'Telangana'), ('Ramagundam', 'Telangana'),
            
            # Tripura
            ('Agartala', 'Tripura'), ('Udaipur', 'Tripura'), ('Dharmanagar', 'Tripura'),
            ('Kailasahar', 'Tripura'),
            
            # Uttarakhand
            ('Dehradun', 'Uttarakhand'), ('Haridwar', 'Uttarakhand'), ('Roorkee', 'Uttarakhand'),
            ('Haldwani', 'Uttarakhand'), ('Rudrapur', 'Uttarakhand'), ('Kashipur', 'Uttarakhand'),
            
            # Andaman and Nicobar Islands
            ('Port Blair', 'Andaman and Nicobar Islands'), ('Diglipur', 'Andaman and Nicobar Islands'),
            
            # Chandigarh
            ('Chandigarh', 'Chandigarh'),
            
            # Dadra and Nagar Haveli and Daman and Diu
            ('Daman', 'Dadra and Nagar Haveli and Daman and Diu'), ('Diu', 'Dadra and Nagar Haveli and Daman and Diu'),
            ('Silvassa', 'Dadra and Nagar Haveli and Daman and Diu'),
            
            # Jammu and Kashmir
            ('Srinagar', 'Jammu and Kashmir'), ('Jammu', 'Jammu and Kashmir'), ('Anantnag', 'Jammu and Kashmir'),
            ('Baramulla', 'Jammu and Kashmir'), ('Udhampur', 'Jammu and Kashmir'),
            
            # Ladakh
            ('Leh', 'Ladakh'), ('Kargil', 'Ladakh'),
            
            # Lakshadweep
            ('Kavaratti', 'Lakshadweep'), ('Agatti', 'Lakshadweep'),
            
            # Puducherry
            ('Puducherry', 'Puducherry'), ('Karaikal', 'Puducherry'), ('Mahe', 'Puducherry'),
            ('Yanam', 'Puducherry'),
        ]
        
        # Insert cities (skip duplicates by checking first)
        inserted_count = 0
        skipped_count = 0
        
        for city_name, state_name in indian_cities:
            try:
                # Check if city already exists for this state
                check_query = text("""
                    SELECT id FROM cities 
                    WHERE city_name = :city_name AND state_name = :state_name
                """)
                existing = db.session.execute(check_query, {
                    'city_name': city_name,
                    'state_name': state_name
                }).fetchone()
                
                if not existing:
                    insert_query = text("""
                        INSERT INTO cities (city_name, state_name, is_active)
                        VALUES (:city_name, :state_name, 1)
                    """)
                    db.session.execute(insert_query, {
                        'city_name': city_name,
                        'state_name': state_name
                    })
                    inserted_count += 1
                else:
                    skipped_count += 1
            except Exception as e:
                # Skip on any error
                skipped_count += 1
                pass
        
        db.session.commit()
        print(f"[SUCCESS] Cities table updated: {inserted_count} new cities added, {skipped_count} duplicates skipped (total available: {len(indian_cities)} cities)")
    except Exception as e:
        print(f"[WARNING] Cities table creation/population skipped: {str(e)}")
        db.session.rollback()

def init_cart_table():
    """Create cart table if it doesn't exist"""
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS cart (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_product (user_id, product_id),
                INDEX idx_user_id (user_id),
                INDEX idx_product_id (product_id)
            )
        """))
        db.session.commit()
        print("[INFO] Cart table created/verified successfully")
    except Exception as e:
        print(f"[ERROR] Cart table creation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()

def init_reviews_table():
    """Create reviews table if it doesn't exist"""
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS reviews (
                id INT PRIMARY KEY AUTO_INCREMENT,
                product_id INT NOT NULL,
                user_id INT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(120) NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                review_text TEXT,
                image_url VARCHAR(500),
                video_url VARCHAR(500),
                is_verified BOOLEAN DEFAULT FALSE,
                is_approved BOOLEAN DEFAULT TRUE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_product_id (product_id),
                INDEX idx_user_id (user_id),
                INDEX idx_rating (rating),
                INDEX idx_is_approved (is_approved),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """))
        db.session.commit()
        print("[INFO] Reviews table created/verified successfully")
    except Exception as e:
        print(f"[ERROR] Reviews table creation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        db.session.rollback()

def init_database():
    """Initialize database with default data"""
    with app.app_context():
        ensure_currency_schema()
        init_analytics_tables()  # Create analytics tables
        init_cities_table()  # Create and populate cities table
        init_cart_table()  # Create cart table
        init_reviews_table()  # Create reviews table
        # Don't create tables - they already exist
        # Just ensure admin user exists in admin_users table
        admin_exists = AdminUser.query.filter_by(username='admin').first()
        if not admin_exists:
            admin = AdminUser(
                username='admin',
                email='admin@example.com',
                password_hash=generate_password_hash('Admin@123'),
                full_name='Admin User',
                role='admin',
                is_active=True
            )
            db.session.add(admin)
        
        # Create default currencies for all required countries
        default_currencies = [
            {'code': 'INR', 'name': 'Indian Rupee', 'symbol': '₹', 'rate': 1.0, 'is_base': True},
            {'code': 'USD', 'name': 'US Dollar', 'symbol': '$', 'rate': 0.012, 'is_base': False},
            {'code': 'EUR', 'name': 'Euro', 'symbol': '€', 'rate': 0.011, 'is_base': False},
            {'code': 'GBP', 'name': 'British Pound', 'symbol': '£', 'rate': 0.0095, 'is_base': False},
            {'code': 'AED', 'name': 'UAE Dirham', 'symbol': 'د.إ', 'rate': 0.044, 'is_base': False},
            {'code': 'CAD', 'name': 'Canadian Dollar', 'symbol': 'C$', 'rate': 0.016, 'is_base': False},
        ]
        
        for curr_data in default_currencies:
            existing = Currency.query.filter_by(currency_code=curr_data['code']).first()
            if not existing:
                currency = Currency(
                    currency_code=curr_data['code'],
                    currency_name=curr_data['name'],
                    currency_symbol=curr_data['symbol'],
                    api_rate=curr_data['rate'],
                    exchange_rate=curr_data['rate'],
                    is_base_currency=curr_data.get('is_base', False),
                    is_active=True,
                    adjustment_factor=1.0,
                    custom_percentage_change=0.0,
                    custom_value_factor=1.0,
                    regional_tax_percent=0.0
                )
                currency.exchange_rate = calculate_effective_rate(currency)
                db.session.add(currency)
            else:
                # Update INR to be base currency if not already
                if curr_data['code'] == 'INR' and not existing.is_base_currency:
                    existing.is_base_currency = True
                    existing.exchange_rate = 1.0
                if existing.api_rate is None:
                    existing.api_rate = existing.exchange_rate or curr_data['rate']
        
        # Create default countries (all 7 required)
        default_countries_list = [
            {'code': 'IND', 'name': 'India', 'currency': 'INR'},
            {'code': 'USA', 'name': 'United States', 'currency': 'USD'},
            {'code': 'GBR', 'name': 'United Kingdom', 'currency': 'GBP'},
            {'code': 'DEU', 'name': 'Germany', 'currency': 'EUR'},
            {'code': 'ESP', 'name': 'Spain', 'currency': 'EUR'},
            {'code': 'ARE', 'name': 'United Arab Emirates', 'currency': 'AED'},
            {'code': 'CAN', 'name': 'Canada', 'currency': 'CAD'},
        ]
        
        for country_data in default_countries_list:
            if not Country.query.filter_by(country_code=country_data['code']).first():
                country = Country(
                    country_code=country_data['code'],
                    country_name=country_data['name'],
                    currency_code=country_data['currency'],
                    is_active=True
                )
                db.session.add(country)
        
        # Create default tax countries (legacy for tax-specific settings)
        default_tax_countries = [
            {'code': 'IND', 'name': 'India', 'currency': 'INR', 'tax': 18.0},
            {'code': 'USA', 'name': 'United States', 'currency': 'USD', 'tax': 10.0},
            {'code': 'GBR', 'name': 'United Kingdom', 'currency': 'GBP', 'tax': 20.0},
            {'code': 'AUS', 'name': 'Australia', 'currency': 'AUD', 'tax': 10.0},
        ]
        
        for country_data in default_tax_countries:
            if not TaxCountry.query.filter_by(country_code=country_data['code']).first():
                country = TaxCountry(
                    country_code=country_data['code'],
                    country_name=country_data['name'],
                    currency_code=country_data['currency'],
                    default_tax_rate=country_data['tax'],
                    is_active=True
                )
                db.session.add(country)
        
        # Create default categories
        default_categories = [
            {'name': 'Health Supplements', 'slug': 'health-supplements'},
            {'name': 'Cosmetics', 'slug': 'cosmetics'},
            {'name': 'Honey', 'slug': 'honey'},
        ]
        
        for cat_data in default_categories:
            if not Category.query.filter_by(slug=cat_data['slug']).first():
                category = Category(
                    name=cat_data['name'],
                    slug=cat_data['slug'],
                    is_active=True
                )
                db.session.add(category)
        
        # Create default health benefits
        default_benefits = [
            'Immunity Booster', 'Sleep Support', 'Stress & Anxiety Relief',
            "Men's Health", "Women's Health", 'Beauty & Radiance',
            'Healthy Ageing', 'Sports & Fitness'
        ]
        
        for benefit_name in default_benefits:
            if not HealthBenefit.query.filter_by(name=benefit_name).first():
                benefit = HealthBenefit(
                    name=benefit_name,
                    is_active=True
                )
                db.session.add(benefit)
        
        db.session.commit()

# ==================== HEALTH CHECK ====================

@app.route('/api/public/check-tables', methods=['GET'])
def check_tables():
    """Check if analytics tables exist (for debugging)"""
    try:
        tables_to_check = ['user_sessions', 'user_actions', 'customer_sessions']
        results = {}
        
        for table_name in tables_to_check:
            try:
                # Try to query the table
                result = db.session.execute(
                    text(f"SELECT COUNT(*) as count FROM {table_name} LIMIT 1")
                ).fetchone()
                results[table_name] = {
                    'exists': True,
                    'row_count': result[0] if result else 0
                }
            except Exception as e:
                results[table_name] = {
                    'exists': False,
                    'error': str(e)
                }
        
        return jsonify({
            'success': True,
            'tables': results
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'E-Commerce Admin API is running',
        'timestamp': datetime.now(timezone.utc).isoformat()
    }), 200

@app.route('/api/', methods=['GET'])
def api_root():
    """API root endpoint"""
    return jsonify({
        'message': 'E-Commerce Admin API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/login',
            'dashboard': '/api/dashboard/stats',
            'products': '/api/products/',
            'orders': '/api/orders/',
            'users': '/api/users/',
            'coupons': '/api/coupons/',
            'currencies': '/api/currencies/',
            'health': '/api/health'
        }
    }), 200
# ==================== ERROR HANDLERS ====================

# REMOVED - Multi-tenancy removed
# @app.route('/api/sites', methods=['GET'])
# @jwt_required()
# def get_sites():
#     ... (removed)

# @app.route('/api/sites/<int:site_id>', methods=['GET'])
# @jwt_required()
# def get_site_details(site_id):
#     """Get site details"""
    try:
        site = db.session.get(Site, site_id)
        if not site:
            return jsonify({'error': 'Site not found'}), 404
        
        return jsonify({
            'site': {
                'id': site.id,
                'site_name': site.site_name,
                'site_domain': site.site_domain,
                'site_subdomain': site.site_subdomain,
                'logo_url': site.logo_url,
                'primary_color': site.primary_color,
                'is_active': site.is_active,
                'settings': site.settings
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# REMOVED - Multi-tenancy removed
# @app.route('/api/sites', methods=['POST'])
# @app.route('/api/sites/<int:site_id>', methods=['PUT'])
# @app.route('/api/sites/<int:site_id>', methods=['DELETE'])
# ... (all site routes removed)

# ==================== ADMIN NOTIFICATIONS ====================

@app.route('/api/admin/notifications', methods=['GET'])
@jwt_required()
def get_admin_notifications():
    """Get admin notifications"""
    try:
        limit = request.args.get('limit', type=int) or 20
        # Return empty notifications for now (feature not fully implemented)
        return jsonify({
            'notifications': [],
            'unread_count': 0
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        # Placeholder - feature not fully implemented
        return jsonify({'message': 'Notification marked as read'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read"""
    try:
        # Placeholder - feature not fully implemented
        return jsonify({'message': 'All notifications marked as read'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== UNIFIED TAX & CURRENCY MANAGEMENT ====================

@app.route('/api/tax/rates', methods=['GET'])
@jwt_required(optional=True)
def get_tax_rates():
    """Get all regional tax rates - synced with DB"""
    try:
        country_code = request.args.get('country_code')
        is_active = request.args.get('is_active')
        
        query = TaxCountry.query
        if country_code:
            query = query.filter(TaxCountry.country_code == country_code.upper())
        if is_active is not None:
            query = query.filter(TaxCountry.is_active == (is_active.lower() == 'true'))
        
        taxes = query.all()
        data = []
        for tax in taxes:
            data.append({
                'id': tax.id,
                'country_code': tax.country_code,
                'country_name': tax.country_name,
                'tax_type': 'GST',
                'tax_name': 'GST',
                'tax_rate': float(tax.default_tax_rate or 0.0),
                'is_active': bool(tax.is_active),
                'created_at': tax.created_at.isoformat() if tax.created_at else None
            })
        
        return jsonify({
            'success': True,
            'data': {'taxes': data}
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f"Error fetching tax rates: {str(e)}"
        }), 500

@app.route('/api/tax/rates', methods=['POST'])
@jwt_required()
def create_tax_rate():
    """Create a new regional tax rate"""
    try:
        data = request.get_json() or {}
        country_code = (data.get('country_code') or '').upper()
        country_name = data.get('country_name') or country_code
        tax_rate = float(data.get('tax_rate') or 0.0)
        tax_name = data.get('tax_name', 'GST')
        
        if not country_code:
            return jsonify({'success': False, 'message': 'country_code is required'}), 400
        
        # Check if exists
        existing = TaxCountry.query.filter_by(country_code=country_code).first()
        if existing:
            existing.default_tax_rate = tax_rate
            existing.is_active = True
        else:
            country = Country.query.filter_by(country_code=country_code).first()
            currency_code = country.currency_code if country else 'INR'
            existing = TaxCountry(
                country_code=country_code,
                country_name=country_name,
                currency_code=currency_code,
                default_tax_rate=tax_rate,
                is_active=True
            )
            db.session.add(existing)
        
        db.session.commit()
        
        # Trigger price recalculation for this country
        try:
            from app.services.price_recalculation_service import PriceRecalculationService  # type: ignore
            from app.models import Country  # type: ignore
            
            # Recalculate all products for this country
            result = PriceRecalculationService.recalculate_all_products_for_country(
                country_code, existing.currency_code if hasattr(existing, 'currency_code') else None
            )
            print(f"✅ Triggered price recalculation for country {country_code}: {result.get('success', 0)} products updated")
        except Exception as e:
            print(f"⚠️  Error triggering price recalculation: {str(e)}")
            import traceback
            traceback.print_exc()
            # Don't fail the request if recalculation fails
        
        return jsonify({
            'success': True,
            'data': {'tax': {
                'id': existing.id,
                'country_code': existing.country_code,
                'country_name': existing.country_name,
                'tax_rate': float(existing.default_tax_rate)
            }},
            'message': 'Tax rate saved successfully. Product prices have been recalculated.'
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/tax/category', methods=['POST', 'OPTIONS'])
@jwt_required()
def set_category_tax():
    """Set tax rate for a category - applies to all products in that category"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'success': True})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        data = request.get_json() or {}
        category_id = data.get('category_id')
        category_name = data.get('category_name', '')
        tax_rate = float(data.get('tax_rate') or 0.0)
        
        print(f"\n{'='*60}")
        print(f"💾 SETTING CATEGORY TAX")
        print(f"{'='*60}")
        print(f"Category ID: {category_id}")
        print(f"Category Name: {category_name}")
        print(f"Tax Rate: {tax_rate}%")
        print(f"{'='*60}\n")
        
        if not category_id:
            return jsonify({'success': False, 'message': 'category_id is required'}), 400
        
        # Check if category exists
        from sqlalchemy import text
        category_check = db.session.execute(
            text("SELECT id, name FROM categories WHERE id = :cat_id"),
            {'cat_id': category_id}
        ).fetchone()
        
        if not category_check:
            return jsonify({'success': False, 'message': 'Category not found'}), 404
        
        # Store category tax - try TaxRule model first, fallback to direct product update
        try:
            # Try to use TaxRule model if available
            from app.models import TaxRule  # type: ignore
            existing_rule = TaxRule.query.filter_by(category_id=category_id).first()
            
            if existing_rule:
                existing_rule.tax_value = tax_rate
                existing_rule.updated_at = datetime.utcnow()
                print(f"✅ Updated existing TaxRule for category {category_id}")
            else:
                new_rule = TaxRule(
                    rule_name=f'Tax for {category_name or category_check.name}',
                    category_id=category_id,
                    country_code='IN',  # Default
                    tax_calculation_type='percentage',
                    tax_value=tax_rate,
                    tax_applies_to='product',
                    is_active=True
                )
                db.session.add(new_rule)
                print(f"✅ Created new TaxRule for category {category_id}")
            
            db.session.commit()
            
        except (ImportError, AttributeError) as e:
            print(f"⚠️  TaxRule model not available, using direct product update: {str(e)}")
            # TaxRule model not available, continue with direct product update
        
        # Update all products in this category to have this tax rate
        result = db.session.execute(
            text("""
                UPDATE products 
                SET tax_rate = :tax_rate, updated_at = NOW()
                WHERE category_id = :cat_id
            """),
            {'tax_rate': tax_rate, 'cat_id': category_id}
        )
        updated_products = result.rowcount
        db.session.commit()
        
        print(f"✅ Updated {updated_products} products in category {category_id} with tax rate {tax_rate}%")
        
        # Trigger price recalculation for all products in this category
        try:
            from app.services.price_recalculation_service import PriceRecalculationService  # type: ignore
            from app.models import Country  # type: ignore
            
            # Get all countries
            countries = Country.query.filter_by(is_active=True).all()
            total_recalculated = 0
            
            # Get all products in this category
            products = db.session.execute(
                text("SELECT id FROM products WHERE category_id = :cat_id"),
                {'cat_id': category_id}
            ).fetchall()
            
            for (product_id,) in products:
                for country in countries:
                    try:
                        result = PriceRecalculationService.recalculate_product_price(
                            product_id, country.country_code, country.currency_code
                        )
                        if result.get('success'):
                            total_recalculated += 1
                    except Exception as e:
                        print(f"⚠️  Error recalculating product {product_id} for {country.country_code}: {str(e)}")
            
            print(f"✅ Recalculated prices for {total_recalculated} product-country combinations")
        except Exception as e:
            print(f"⚠️  Error triggering price recalculation: {str(e)}")
            import traceback
            traceback.print_exc()
            # Don't fail the request if recalculation fails
        
        return jsonify({
            'success': True,
            'message': f'Category tax rate set to {tax_rate}% for all products in category. Prices recalculated.',
            'data': {
                'category_id': category_id,
                'category_name': category_name or category_check.name,
                'tax_rate': tax_rate,
                'products_updated': updated_products
            }
        }), 200
            
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        print(f"❌ Error setting category tax: {str(e)}")
        return jsonify({'success': False, 'message': f"Error setting category tax: {str(e)}"}), 500

@app.route('/api/tax/rates/<int:tax_id>', methods=['PUT'])
@jwt_required()
def update_tax_rate(tax_id):
    """Update a tax rate - synced with DB"""
    try:
        tax = TaxCountry.query.get(tax_id)
        if not tax:
            return jsonify({'success': False, 'message': 'Tax rate not found'}), 404
        
        data = request.get_json() or {}
        if 'tax_rate' in data:
            tax.default_tax_rate = float(data['tax_rate'])
        if 'tax_name' in data:
            pass  # Not stored in TaxCountry model
        if 'is_active' in data:
            tax.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        # Trigger price recalculation for this country
        try:
            # Optional import - may not be available in all setups
            try:
                from app.services.price_recalculation_service import PriceRecalculationService  # type: ignore
                from app.models import Country  # type: ignore
                
                # Recalculate all products for this country
                result = PriceRecalculationService.recalculate_all_products_for_country(
                    tax.country_code, tax.currency_code if hasattr(tax, 'currency_code') else None
                )
                print(f"✅ Triggered price recalculation for country {tax.country_code}: {result.get('success', 0)} products updated")
            except ImportError:
                # Service not available, skip recalculation
                print("⚠️  Price recalculation service not available")
                pass
        except Exception as e:
            print(f"⚠️  Error triggering price recalculation: {str(e)}")
            import traceback
            traceback.print_exc()
        
        return jsonify({
            'success': True,
            'data': {
                'tax': {
                    'id': tax.id,
                    'country_code': tax.country_code,
                    'country_name': tax.country_name,
                    'tax_rate': float(tax.default_tax_rate),
                    'is_active': tax.is_active
                }
            },
            'message': 'Tax rate updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/tax/products/<int:product_id>', methods=['GET'])
@jwt_required(optional=True)
def get_product_tax(product_id):
    """Get tax configuration for a product"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        return jsonify({
            'success': True,
            'data': {
                'product_tax': {
                    'product_id': product.id,
                    'is_taxable': product.is_taxable if hasattr(product, 'is_taxable') else True,
                    'tax_rate': float(product.tax_rate) if hasattr(product, 'tax_rate') and product.tax_rate else None
                }
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/tax/products/<int:product_id>', methods=['POST'])
@jwt_required()
def set_product_tax(product_id):
    """Set tax configuration for a product - Updates products table in DB"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        data = request.get_json() or {}
        
        # Store old values for logging
        old_is_taxable = product.is_taxable if hasattr(product, 'is_taxable') else None
        old_tax_rate = float(product.tax_rate) if hasattr(product, 'tax_rate') and product.tax_rate else None
        
        # Update fields - Force update even if value is the same
        if 'is_taxable' in data:
            if hasattr(product, 'is_taxable'):
                product.is_taxable = bool(data['is_taxable'])
            else:
                # If column doesn't exist, log warning but continue
                print(f"⚠️  Warning: Product model doesn't have 'is_taxable' attribute")
        
        if 'tax_rate' in data:
            if hasattr(product, 'tax_rate'):
                # Convert to Decimal for precision, then to float for storage
                tax_rate_value = data['tax_rate']
                if tax_rate_value is not None and tax_rate_value != '':
                    try:
                        product.tax_rate = float(tax_rate_value)
                    except (ValueError, TypeError):
                        product.tax_rate = None
                else:
                    product.tax_rate = None
            else:
                print(f"⚠️  Warning: Product model doesn't have 'tax_rate' attribute")
        
        # Explicitly update the updated_at timestamp - use UTC timezone
        if hasattr(product, 'updated_at'):
            from datetime import timezone
            product.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Force flush to ensure changes are in session
        db.session.flush()
        
        # Commit to database with explicit error handling
        try:
            db.session.commit()
            # Verify the commit by refreshing the object
            db.session.refresh(product)
            # Force a second commit to ensure timestamp is persisted
            db.session.commit()
        except Exception as commit_error:
            db.session.rollback()
            print(f"❌ Database commit failed: {str(commit_error)}")
            import traceback
            traceback.print_exc()
            raise commit_error
        
        # Log the update for verification
        print(f"\n{'='*60}")
        print(f"✅ PRODUCT TAX UPDATED IN DATABASE")
        print(f"{'='*60}")
        print(f"Product ID: {product_id}")
        print(f"Product Name: {product.name}")
        print(f"Table: products")
        print(f"Changes:")
        if 'is_taxable' in data:
            print(f"  - is_taxable: {old_is_taxable} → {product.is_taxable}")
        if 'tax_rate' in data:
            print(f"  - tax_rate: {old_tax_rate} → {product.tax_rate}")
        print(f"  - updated_at: {product.updated_at if hasattr(product, 'updated_at') else 'N/A'}")
        print(f"\n📋 SQL Query to verify in MySQL Workbench:")
        print(f"   SELECT id, name, is_taxable, tax_rate, updated_at")
        print(f"   FROM products")
        print(f"   WHERE id = {product_id};")
        print(f"{'='*60}\n")
        
        # Trigger price recalculation
        try:
            # Optional import - may not be available in all setups
            try:
                from app.services.price_recalculation_service import on_product_tax_changed  # type: ignore
                on_product_tax_changed(product_id)
            except ImportError:
                # Service not available, skip recalculation
                pass
        except Exception as e:
            print(f"Note: Price recalculation service not available: {str(e)}")
        
        return jsonify({
            'success': True,
            'data': {
                'product_id': product_id,
                'product_name': product.name,
                'is_taxable': product.is_taxable if hasattr(product, 'is_taxable') else None,
                'tax_rate': float(product.tax_rate) if hasattr(product, 'tax_rate') and product.tax_rate else None,
                'updated_at': product.updated_at.isoformat() if hasattr(product, 'updated_at') else None
            },
            'message': 'Product tax saved to database. Prices will be recalculated automatically.'
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        print(f"❌ Error in set_product_tax: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/currency/rates', methods=['GET'])
@jwt_required(optional=True)
def get_currency_rates():
    """Get all currency exchange rates"""
    try:
        base_currency = request.args.get('base_currency')
        target_currency = request.args.get('target_currency')
        is_active = request.args.get('is_active')
        
        query = Currency.query
        if base_currency:
            query = query.filter(Currency.currency_code != base_currency.upper())
        if target_currency:
            query = query.filter(Currency.currency_code == target_currency.upper())
        if is_active is not None:
            query = query.filter(Currency.is_active == (is_active.lower() == 'true'))
        
        currencies = query.all()
        data = []
        for curr in currencies:
            adjustment_factor = float(curr.adjustment_factor) if curr.adjustment_factor else 1.0
            # Calculate markup percentage from adjustment factor
            # adjustment_factor = 1.05 means 5% markup, 0.95 means -5% markup
            markup_percentage = (adjustment_factor - 1.0) * 100.0
            
            data.append({
                'id': curr.id,
                'currency_code': curr.currency_code,
                'currency_name': curr.currency_name,
                'currency_symbol': curr.currency_symbol,
                'base_currency': 'INR',
                'target_currency': curr.currency_code,
                'api_rate': float(curr.api_rate) if curr.api_rate else 1.0,
                'exchange_rate': float(curr.exchange_rate) if curr.exchange_rate else 1.0,
                'admin_adjustment': adjustment_factor,
                'markup_percentage': markup_percentage,  # New field: calculated from adjustment_factor
                'final_rate': float((curr.exchange_rate or 1.0) * adjustment_factor),
                'is_base_currency': curr.is_base_currency,
                'is_active': curr.is_active,
                'manual_override': curr.manual_override or (curr.rate_source == 'admin'),
                'rate_source': curr.rate_source or 'api',
                'last_updated': curr.last_updated.isoformat() if curr.last_updated else None,
                'last_api_update': curr.last_api_update.isoformat() if curr.last_api_update else None,
                'created_at': curr.created_at.isoformat() if curr.created_at else None
            })
        
        return jsonify({
            'success': True,
            'data': {'rates': data}
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Error fetching currency rates: {str(e)}"
        }), 500

@app.route('/api/currency/rates/<int:currency_id>', methods=['PUT'])
@jwt_required()
def update_currency_rate(currency_id):
    """Update currency exchange rate - API rate should NOT be changed, only exchange_rate"""
    try:
        currency = Currency.query.get(currency_id)
        if not currency:
            return jsonify({'success': False, 'message': 'Currency not found'}), 404
        
        data = request.get_json() or {}
        
        # IMPORTANT: Never update api_rate - it should always reflect the original API rate
        # Only update exchange_rate (current/effective rate) based on adjustments
        
        # Store old values for audit logging
        old_exchange_rate = float(currency.exchange_rate) if currency.exchange_rate else None
        old_adjustment_factor = float(currency.adjustment_factor) if currency.adjustment_factor else 1.0
        current_user = get_jwt_identity()
        
        # Handle adjustment_factor
        if 'adjustment_factor' in data:
            currency.adjustment_factor = float(data['adjustment_factor'])
            # Recalculate exchange_rate based on api_rate and adjustment_factor
            # Keep api_rate unchanged - it's the base rate from external API
            base_api_rate = float(currency.api_rate or currency.exchange_rate or 1)
            currency.exchange_rate = base_api_rate * float(currency.adjustment_factor)
            # If manual_override is set, keep it; otherwise set based on adjustment
            if 'manual_override' not in data:
                currency.manual_override = float(data['adjustment_factor']) != 1.0
        
        # Handle direct exchange_rate override (effective rate from frontend)
        if 'exchange_rate' in data:
            new_exchange_rate = float(data['exchange_rate'])
            # Update exchange_rate but NEVER touch api_rate
            currency.exchange_rate = new_exchange_rate
            # Recalculate adjustment_factor based on new exchange_rate and existing api_rate
            if currency.api_rate and currency.api_rate > 0:
                currency.adjustment_factor = new_exchange_rate / currency.api_rate
            else:
                # If no api_rate exists, set it to the exchange_rate and mark as manual
                currency.api_rate = new_exchange_rate
                currency.rate_source = 'admin'
                currency.manual_override = True
        
        # Handle manual_override flag
        if 'manual_override' in data:
            currency.manual_override = bool(data['manual_override'])
            if currency.manual_override:
                currency.rate_source = 'admin'
        
        if 'is_active' in data:
            currency.is_active = bool(data['is_active'])
        
        currency.last_updated = datetime.utcnow()
        
        # Create audit log entry if exchange rate changed
        new_exchange_rate = float(currency.exchange_rate) if currency.exchange_rate else None
        if old_exchange_rate is not None and new_exchange_rate is not None:
            if abs(old_exchange_rate - new_exchange_rate) > 0.0001:  # Only log if significant change
                try:
                    change_percent = ((new_exchange_rate - old_exchange_rate) / old_exchange_rate * 100) if old_exchange_rate > 0 else 0
                    
                    # Build change reason with details
                    change_reason_parts = []
                    if 'adjustment_factor' in data:
                        change_reason_parts.append(f'adjustment_factor: {old_adjustment_factor:.4f} → {currency.adjustment_factor:.4f}')
                    if 'exchange_rate' in data:
                        change_reason_parts.append(f'exchange_rate: {old_exchange_rate:.6f} → {new_exchange_rate:.6f}')
                    if currency.manual_override:
                        change_reason_parts.append('manual override enabled')
                    
                    change_reason = 'Manual adjustment: ' + ', '.join(change_reason_parts) if change_reason_parts else 'Manual currency rate adjustment'
                    
                    # Create CurrencyRateHistory entry
                    history_entry = CurrencyRateHistory(
                        currency_code=currency.currency_code,
                        old_rate=old_exchange_rate,
                        new_rate=new_exchange_rate,
                        rate_change_percent=change_percent,
                        change_source='admin_manual',
                        changed_by=str(current_user) if current_user else 'admin',
                        change_reason=change_reason
                    )
                    db.session.add(history_entry)
                    print(f"\n{'='*60}")
                    print(f"📝 AUDIT LOG CREATED - Currency Rate Change")
                    print(f"{'='*60}")
                    print(f"Currency: {currency.currency_code}")
                    print(f"Old Rate: {old_exchange_rate:.6f}")
                    print(f"New Rate: {new_exchange_rate:.6f}")
                    print(f"Change: {change_percent:+.2f}%")
                    print(f"Source: admin_manual")
                    print(f"Reason: {change_reason}")
                    print(f"{'='*60}\n")
                except Exception as e:
                    print(f"⚠️  Error creating audit log: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    # Don't fail the update if audit log fails
        
        db.session.commit()
        
        # Trigger price recalculation
        try:
            # Optional import - may not be available in all setups
            try:
                from app.services.price_recalculation_service import on_currency_rate_changed  # type: ignore
                on_currency_rate_changed(currency.currency_code)
            except ImportError:
                # Service not available, skip recalculation
                pass
        except Exception as e:
            print(f"Error triggering price recalculation: {str(e)}")
        
        return jsonify({
            'success': True,
            'data': {
                'currency': {
                    'id': currency.id,
                    'currency_code': currency.currency_code,
                    'api_rate': float(currency.api_rate or 1),  # Original API rate (unchanged)
                    'exchange_rate': float(currency.exchange_rate or 1),  # Effective rate (adjusted)
                    'adjustment_factor': float(currency.adjustment_factor or 1),
                    'manual_override': currency.manual_override
                }
            },
            'message': 'Currency rate updated successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/currency/fetch-rates', methods=['POST'])
@jwt_required()
def fetch_live_rates():
    """Fetch live exchange rates from external API"""
    try:
        import requests
        data = request.get_json() or {}
        base_currency = (data.get('base_currency') or 'INR').upper()
        
        # Try exchangerate.host first, fallback to exchangerate-api.com
        url = f"https://api.exchangerate.host/latest?base={base_currency}"
        print(f"🌐 Fetching rates from: {url}")
        response = requests.get(url, timeout=10)
        
        rates = {}
        if response.status_code == 200:
            rates_data = response.json()
            print(f"📊 API Response structure: {list(rates_data.keys())}")
            
            # exchangerate.host returns: {"success": true, "rates": {...}, "base": "INR", "date": "..."}
            if rates_data.get('success', False):
                rates = rates_data.get('rates', {})
                active_source = 'exchangerate.host'
                print(f"✅ Fetched {len(rates)} rates from exchangerate.host")
                # Debug: Print AED rate specifically
                if 'AED' in rates:
                    print(f"💰 AED rate from API: {rates['AED']}")
                elif 'aed' in rates:
                    print(f"💰 aed rate from API: {rates['aed']}")
            else:
                print(f"⚠️  exchangerate.host returned success=false: {rates_data}")
        
        # Fallback to exchangerate-api.com if first API fails
        if not rates:
            try:
                url2 = f"https://api.exchangerate-api.com/v4/latest/{base_currency}"
                print(f"🌐 Trying fallback API: {url2}")
                response2 = requests.get(url2, timeout=10)
                if response2.status_code == 200:
                    rates_data2 = response2.json()
                    # exchangerate-api.com returns: {"rates": {...}, "base": "INR", "date": "..."}
                    rates = rates_data2.get('rates', {})
                    active_source = 'exchangerate-api.com'
                    print(f"✅ Fetched {len(rates)} rates from exchangerate-api.com")
                    # Debug: Print AED rate specifically
                    if 'AED' in rates:
                        print(f"💰 AED rate from fallback API: {rates['AED']}")
            except Exception as e:
                print(f"⚠️  Fallback API failed: {str(e)}")
                import traceback
                traceback.print_exc()
                pass
        
        if not rates:
            return jsonify({'success': False, 'message': 'Failed to fetch rates from external APIs'}), 500
        
        # Create fetch log entry
        current_user = get_jwt_identity()
        active_source = None  # Will be set after we know which API succeeded
        fetch_log = CurrencyRateFetchLog(
            fetched_by=str(current_user) if current_user else 'system',
            status='pending',
            provider='unknown',
            base_currency=base_currency
        )
        db.session.add(fetch_log)
        db.session.flush()
        
        updated_count = 0
        unchanged_count = 0
        skipped_count = 0
        
        # Debug: Print all available rates from API
        print(f"\n📋 Available currencies in API response: {list(rates.keys())[:10]}... (showing first 10)")
        
        # Get all currencies from database for comparison
        all_db_currencies = Currency.query.all()
        db_currency_codes = {c.currency_code.upper() for c in all_db_currencies}
        print(f"📋 Currencies in database: {sorted(list(db_currency_codes))}")
        
        for currency_code, rate_value in rates.items():
            # Normalize currency code (handle AED, USD, etc.)
            normalized_code = currency_code.upper()
            
            # Find currency in database
            currency = Currency.query.filter_by(currency_code=normalized_code).first()
            
            if not currency:
                # Skip if currency doesn't exist in our database
                skipped_count += 1
                if skipped_count <= 5:  # Only log first 5 to avoid spam
                    print(f"⏭️  Skipping {normalized_code} (not in database)")
                continue
            
            # CRITICAL FIX: Always update api_rate, even if manual_override is true
            # The api_rate should always reflect the latest API value
            # Only exchange_rate should respect manual_override
            try:
                old_api_rate = float(currency.api_rate) if currency.api_rate else None
                old_exchange_rate = float(currency.exchange_rate) if currency.exchange_rate else None
                new_rate = float(rate_value)
                
                # Validate rate is reasonable (not 0 or negative, and not too large)
                if new_rate <= 0 or new_rate > 1000000:
                    print(f"⚠️  Skipping invalid rate for {normalized_code}: {new_rate}")
                    skipped_count += 1
                    continue
                
                # ALWAYS update api_rate with the fresh API value
                currency.api_rate = new_rate
                currency.last_api_update = datetime.utcnow()
                
                # Only update exchange_rate if NOT manually overridden
                if not currency.manual_override:
                    adjustment = float(currency.adjustment_factor) if currency.adjustment_factor else 1.0
                    currency.exchange_rate = new_rate * adjustment
                    currency.rate_source = 'api'
                    currency.last_updated = datetime.utcnow()
                else:
                    # If manually overridden, keep exchange_rate as is, but still update api_rate
                    print(f"ℹ️  {normalized_code} has manual override - updating api_rate only: {old_api_rate or 'N/A'} → {new_rate}")
                
                # Check if api_rate actually changed
                if old_api_rate is None or abs(old_api_rate - new_rate) > 0.0001:
                    updated_count += 1
                    adjustment = float(currency.adjustment_factor) if currency.adjustment_factor else 1.0
                    print(f"✅ Updated {normalized_code} api_rate: {old_api_rate or 'N/A'} → {new_rate} (exchange_rate: {currency.exchange_rate}, adjustment: {adjustment})")
                else:
                    unchanged_count += 1
                    if unchanged_count <= 5:  # Only log first 5
                        print(f"➡️  {normalized_code} api_rate unchanged: {new_rate}")
            except (ValueError, TypeError) as e:
                print(f"⚠️  Error processing rate for {normalized_code}: {str(e)}, value: {rate_value}")
                import traceback
                traceback.print_exc()
                skipped_count += 1
                continue
        
        # Update fetch log with results
        fetch_log.provider = active_source or 'unknown'
        fetch_log.updated_count = updated_count
        fetch_log.unchanged_count = unchanged_count
        fetch_log.status = 'success'
        fetch_log.message = f'Fetched {len(rates)} rates, updated {updated_count} currencies'
        try:
            preview_rates = {k: rates[k] for k in list(rates.keys())[:20]}
            fetch_log.raw_payload = json.dumps({
                'base': base_currency,
                'provider': active_source or 'unknown',
                'rates_sample': preview_rates,
                'total_rates': len(rates)
            })
        except Exception as e:
            print(f"⚠️  Error creating fetch log payload: {str(e)}")
        
        db.session.commit()
        
        # Log summary
        print(f"\n{'='*60}")
        print(f"✅ LIVE RATES FETCHED AND UPDATED")
        print(f"{'='*60}")
        print(f"Base Currency: {base_currency}")
        print(f"Total rates fetched from API: {len(rates)}")
        print(f"Currencies updated: {updated_count}")
        print(f"Currencies unchanged: {unchanged_count}")
        print(f"Currencies skipped: {skipped_count}")
        print(f"Fetch Log ID: {fetch_log.id}")
        print(f"{'='*60}\n")
        
        return jsonify({
            'success': True,
            'data': {
                'updated_count': updated_count,
                'unchanged_count': unchanged_count,
                'skipped_count': skipped_count,
                'fetched_at': datetime.utcnow().isoformat(),
                'base_currency': base_currency,
                'total_rates': len(rates),
                'fetch_log_id': fetch_log.id
            },
            'message': f'Fetched {len(rates)} exchange rates. Updated {updated_count} currencies.'
        }), 200
    except Exception as e:
        db.session.rollback()
        # Update fetch log with error if it exists
        try:
            if 'fetch_log' in locals():
                fetch_log.status = 'failure'
                fetch_log.message = str(e)
                db.session.commit()
        except:
            pass
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f"Error fetching live rates: {str(e)}"}), 500

@app.route('/api/currency/audit-logs', methods=['GET'])
@jwt_required(optional=True)
def get_currency_audit_logs():
    """Get currency rate fetch audit logs"""
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        # Get fetch logs
        fetch_logs = CurrencyRateFetchLog.query.order_by(
            CurrencyRateFetchLog.fetched_at.desc()
        ).limit(limit).offset(offset).all()
        
        # Get currency rate history
        history_logs = CurrencyRateHistory.query.order_by(
            CurrencyRateHistory.timestamp.desc()
        ).limit(limit).offset(offset).all()
        
        logs = []
        
        # Format fetch logs
        for log in fetch_logs:
            logs.append({
                'id': log.id,
                'type': 'fetch',
                'timestamp': log.fetched_at.isoformat() if log.fetched_at else None,
                'fetched_by': log.fetched_by,
                'provider': log.provider,
                'base_currency': log.base_currency,
                'updated_count': log.updated_count,
                'unchanged_count': log.unchanged_count,
                'status': log.status,
                'message': log.message,
                'raw_payload': json.loads(log.raw_payload) if log.raw_payload else None
            })
        
        # Format history logs
        for log in history_logs:
            logs.append({
                'id': log.id,
                'type': 'rate_change',
                'timestamp': log.timestamp.isoformat() if log.timestamp else None,
                'currency_code': log.currency_code,
                'old_rate': float(log.old_rate) if log.old_rate else None,
                'new_rate': float(log.new_rate) if log.new_rate else None,
                'rate_change_percent': float(log.rate_change_percent) if log.rate_change_percent else None,
                'change_source': log.change_source,
                'changed_by': log.changed_by,
                'change_reason': log.change_reason
            })
        
        # Sort by timestamp descending
        logs.sort(key=lambda x: x['timestamp'] or '', reverse=True)
        
        return jsonify({
            'success': True,
            'data': {
                'logs': logs[:limit],  # Return only requested limit
                'total': len(logs),
                'fetch_logs_count': len(fetch_logs),
                'history_logs_count': len(history_logs)
            }
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f"Error fetching audit logs: {str(e)}"
        }), 500

@app.route('/api/pricing/recalculate', methods=['POST'])
@jwt_required()
def recalculate_prices():
    """Manually trigger price recalculation"""
    try:
        data = request.get_json() or {}
        product_id = data.get('product_id')
        country_code = data.get('country_code')
        
        # If no product_id or country_code, recalculate all
        if not product_id and not country_code:
            # Recalculate all products for all countries
            # Country model is already defined in this file, no need to import
            countries = Country.query.filter_by(is_active=True).all()
            total_recalculated = 0
            
            for country in countries:
                try:
                    # Optional import - may not be available in all setups
                    from app.services.price_recalculation_service import PriceRecalculationService  # type: ignore
                    result = PriceRecalculationService.recalculate_all_products_for_country(
                        country.country_code, country.currency_code
                    )
                    total_recalculated += result.get('success', 0)
                except (ImportError, Exception) as e:
                    # Service not available or error occurred, skip
                    if isinstance(e, ImportError):
                        pass  # Service not available
                    else:
                        print(f"Error recalculating for {country.country_code}: {str(e)}")
            
            return jsonify({
                'success': True,
                'data': {
                    'success': total_recalculated,
                    'total': len(countries)
                },
                'message': f'Recalculated prices for {total_recalculated} countries'
            }), 200
        
        # Handle specific product, country, or category
        # Optional import - may not be available in all setups
        try:
            from app.services.price_recalculation_service import PriceRecalculationService  # type: ignore
            
            category_id = data.get('category_id')
            
            if product_id and country_code:
                result = PriceRecalculationService.recalculate_product_price(
                    product_id, country_code
                )
            elif product_id:
                result = PriceRecalculationService.recalculate_product_for_all_countries(product_id)
            elif country_code:
                result = PriceRecalculationService.recalculate_all_products_for_country(country_code)
            elif category_id:
                # Recalculate all products in a category
                from sqlalchemy import text
                products = db.session.execute(
                    text("SELECT id FROM products WHERE category_id = :cat_id"),
                    {'cat_id': category_id}
                ).fetchall()
                
                total_recalculated = 0
                for (product_id_val,) in products:
                    try:
                        result = PriceRecalculationService.recalculate_product_for_all_countries(product_id_val)
                        if result.get('success'):
                            total_recalculated += 1
                    except Exception as e:
                        print(f"Error recalculating product {product_id_val}: {str(e)}")
                
                return jsonify({
                    'success': True,
                    'data': {
                        'success': total_recalculated,
                        'total': len(products)
                    },
                    'message': f'Recalculated prices for {total_recalculated} products in category'
                }), 200
            else:
                return jsonify({'success': False, 'message': 'Invalid parameters'}), 400
            
            return jsonify({
                'success': True,
                'data': result,
                'message': 'Prices recalculated successfully'
            }), 200
        except ImportError:
            # Fallback if service not available
            return jsonify({
                'success': True,
                'message': 'Price recalculation triggered (service not available)'
            }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/regions/countries', methods=['GET'])
@jwt_required(optional=True)
def get_regions_countries():
    """Get all countries for regional management"""
    try:
        countries = Country.query.filter_by(is_active=True).all()
        data = []
        for country in countries:
            data.append({
                'id': country.id,
                'country_code': country.country_code,
                'country_name': country.country_name,
                'currency_code': country.currency_code,
                'is_active': country.is_active
            })
        
        return jsonify({
            'success': True,
            'data': {'countries': data}
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== KEY INGREDIENTS ROUTES ====================

@app.route('/api/key-ingredients', methods=['GET'])
@jwt_required(optional=True)
def get_key_ingredients():
    """Get all key ingredients"""
    try:
        # Check if table exists - handle case where table doesn't exist yet
        try:
            is_active_param = request.args.get('is_active', '').lower()
            is_active = None
            if is_active_param == 'true':
                is_active = True
            elif is_active_param == 'false':
                is_active = False
            
            query = KeyIngredient.query
            if is_active is not None:
                query = query.filter_by(is_active=is_active)
            
            key_ingredients = query.order_by(KeyIngredient.name.asc()).all()
            
            return jsonify({
                'success': True,
                'key_ingredients': [ki.to_dict() for ki in key_ingredients]
            }), 200
        except Exception as db_error:
            # Table doesn't exist yet or other database error
            import traceback
            error_trace = traceback.format_exc()
            print(f"[WARNING] KeyIngredients table not available: {str(db_error)}")
            print(f"[WARNING] Traceback: {error_trace}")
            # Return empty list instead of error
            return jsonify({
                'success': True,
                'key_ingredients': []
            }), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] Error in get_key_ingredients endpoint: {str(e)}")
        print(f"[ERROR] Traceback: {error_trace}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/key-ingredients', methods=['POST'])
@jwt_required()
def create_key_ingredient():
    """Create new key ingredient"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        
        # Generate slug from name
        import re
        base_slug = re.sub(r'[^a-z0-9]+', '-', data.get('name', '').lower()).strip('-')
        slug = base_slug
        counter = 1
        while KeyIngredient.query.filter_by(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        key_ingredient = KeyIngredient(
            name=data.get('name'),
            slug=slug,
            description=data.get('description'),
            image_url=data.get('image_url'),
            thumbnail_url=data.get('thumbnail_url'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(key_ingredient)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'key_ingredient': key_ingredient.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/key-ingredients/<int:ingredient_id>', methods=['PUT'])
@jwt_required()
def update_key_ingredient(ingredient_id):
    """Update key ingredient"""
    try:
        key_ingredient = KeyIngredient.query.get(ingredient_id)
        
        if not key_ingredient:
            return jsonify({'error': 'Key ingredient not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            key_ingredient.name = data['name']
            # Update slug if name changed
            import re
            base_slug = re.sub(r'[^a-z0-9]+', '-', data['name'].lower()).strip('-')
            slug = base_slug
            counter = 1
            while KeyIngredient.query.filter(KeyIngredient.slug == slug, KeyIngredient.id != ingredient_id).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            key_ingredient.slug = slug
        
        if 'description' in data:
            key_ingredient.description = data['description']
        if 'image_url' in data:
            key_ingredient.image_url = data['image_url']
        if 'thumbnail_url' in data:
            key_ingredient.thumbnail_url = data['thumbnail_url']
        if 'is_active' in data:
            key_ingredient.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'key_ingredient': key_ingredient.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/key-ingredients/<int:ingredient_id>', methods=['DELETE'])
@jwt_required()
def delete_key_ingredient(ingredient_id):
    """Delete key ingredient"""
    try:
        key_ingredient = KeyIngredient.query.get(ingredient_id)
        
        if not key_ingredient:
            return jsonify({'error': 'Key ingredient not found'}), 404
        
        db.session.delete(key_ingredient)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Key ingredient deleted successfully'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/key-ingredients/product/<int:product_id>', methods=['GET'])
@jwt_required(optional=True)
def get_product_key_ingredients(product_id):
    """Get key ingredients for a specific product"""
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        try:
            product_key_ingredients = ProductKeyIngredient.query.options(joinedload(ProductKeyIngredient.key_ingredient)).filter_by(product_id=product_id).order_by(ProductKeyIngredient.display_order.asc()).all()
            key_ingredients = [{
                'id': pki.key_ingredient.id,
                'name': pki.key_ingredient.name,
                'slug': pki.key_ingredient.slug,
                'description': pki.key_ingredient.description,
                'image_url': pki.key_ingredient.image_url,
                'thumbnail_url': pki.key_ingredient.thumbnail_url,
                'display_order': pki.display_order
            } for pki in product_key_ingredients if pki.key_ingredient and pki.key_ingredient.is_active]
        except Exception as ki_error:
            print(f"[WARNING] KeyIngredients table not available: {str(ki_error)}")
            key_ingredients = []
        
        return jsonify({
            'success': True,
            'key_ingredients': key_ingredients
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== REQUEST LOGGING ====================

@app.before_request
def log_request_info():
    """
    Minimal logging: only track start time for API calls.
    We keep the actual terminal output in a single clean line
    in the after_request handler.
    """
    import time
    g.start_time = time.time()

@app.after_request
def log_response_info(response):
    """
    Minimal logging: print a single clean line per API call.
    Example:
      API CALL: GET /api/products -> 200 (12.34ms)
    """
    if request.path.startswith('/api/'):
        import time
        duration = (time.time() - g.start_time) * 1000  # ms
        print(f"API CALL: {request.method} {request.path} -> {response.status_code} ({duration:.2f}ms)")
    return response

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================
# PUBLIC FRONTEND API (CLIENT-FACING, NON-ADMIN)
# NOTE:
# - These endpoints are used by the public storefront frontend.
# - They are intentionally kept separate from the admin APIs above.
# - They operate directly on the same MySQL database using pymysql.
# - Existing admin functionality is NOT modified by this section.
# ============================================================

import urllib.parse
import pymysql


def _public_get_db_config():
    """
    Get MySQL connection config from environment variables.
    Supports both individual DB_* variables and DATABASE_URL for compatibility.
    This is a COPY of the logic from backend.py, prefixed for public API use.
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
            "cursorclass": pymysql.cursors.DictCursor,
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
        "cursorclass": pymysql.cursors.DictCursor,
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


def _public_open_db():
    """
    Open a MySQL connection for the public API section.
    """
    config = _public_get_db_config()
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


def _public_serialize_product(row):
    """
    Serialize DB row to the structure the current public frontend expects.
    This is copied from backend.py to keep the same response format.
    """
    # Map base_price to price for frontend compatibility
    base_price = float(row.get("base_price") or 0) if row.get("base_price") is not None else None
    sale_price = float(row.get("sale_price")) if row.get("sale_price") is not None else None

    # Fetch images from image1, image2, image3, image4, image5 columns (no underscores)
    # Fallback to image_url (comma-separated) if new columns don't exist
    image_urls = []

    # Try new columns first (image1 through image5 - no underscores)
    has_new_columns = any(row.get(f"image{i}") is not None for i in range(1, 6))

    if has_new_columns:
        # Use new column structure (image1, image2, image3, image4, image5)
        for i in range(1, 6):
            image_col = row.get(f"image{i}")
            if image_col and str(image_col).strip():
                image_urls.append(str(image_col).strip())
    else:
        # Fallback to old image_url (comma-separated)
        image_url_raw = row.get("image_url")
        if image_url_raw:
            raw_str = str(image_url_raw).strip()
            if raw_str:
                image_urls = [url.strip() for url in raw_str.split(",") if url and url.strip()]

    # Get thumbnail_url (first image or thumbnail_url column if exists)
    thumbnail_url = row.get("thumbnail_url") or (image_urls[0] if image_urls else None)

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
        "image_urls": image_urls,  # Array of all images from image_1 to image_5
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


@app.route("/api/public/products", methods=["GET", "OPTIONS"])
def public_products():
    """
    Public products listing API for the storefront frontend.
    This is a copy of backend.py logic, adapted to live inside the main app.
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200
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

        conn = _public_open_db()
        params = []
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

        # Check what image columns exist in the database
        cursor.execute("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'products' 
              AND COLUMN_NAME IN ('thumbnail_url', 'image1', 'image2', 'image3', 'image4', 'image5', 'image_url')
        """)
        available_image_columns = [col['COLUMN_NAME'] for col in cursor.fetchall()]

        # Build image column selection - use image1, image2, image3, image4, image5 (no underscores)
        image_select = ""
        if 'thumbnail_url' in available_image_columns:
            image_select += "p.thumbnail_url, "
        else:
            image_select += "NULL AS thumbnail_url, "

        # Add image1 through image5 if they exist (no underscores)
        for i in range(1, 6):
            col_name = f'image{i}'
            if col_name in available_image_columns:
                image_select += f"p.{col_name}, "
            else:
                image_select += f"NULL AS {col_name}, "

        # Fallback to image_url if new columns don't exist
        if 'image_url' in available_image_columns and not any(f'image{i}' in available_image_columns for i in range(1, 6)):
            image_select += "p.image_url, "
        else:
            image_select += "NULL AS image_url, "

        cursor.execute(
            f"""
            SELECT DISTINCT p.id, p.name, p.slug, p.base_price, p.sale_price, p.base_currency, 
                   p.description, p.short_description, p.stock_quantity, p.featured, 
                   p.category_id, p.created_at, 
                   {image_select}p.sku,
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

        products = [_public_serialize_product(r) for r in rows]

        # Compute total pages similar to backend the frontend expects
        pages = max((total + per_page - 1) // per_page, 1) if total else 1
        return jsonify({"products": products, "total": total, "pages": pages})
    except ConnectionError:
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


@app.route("/api/public/categories", methods=["GET", "OPTIONS"])
def public_categories():
    """
    Public categories API for storefront.
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200
    try:
        conn = _public_open_db()
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
        return jsonify({
            "categories": [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "product_count": r["product_count"] or 0
                } for r in rows
            ]
        })
    except Exception as e:
        return jsonify({"error": "Failed to fetch categories", "message": str(e)}), 500


@app.route("/api/public/health-benefits", methods=["GET", "OPTIONS"])
def public_health_benefits():
    """
    Public health benefits API for storefront.
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200
    try:
        conn = _public_open_db()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM health_benefits ORDER BY name ASC")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({
            "health_benefits": [
                {"id": r["id"], "name": r["name"]} for r in rows
            ]
        })
    except Exception as e:
        return jsonify({"error": "Failed to fetch health benefits", "message": str(e)}), 500


@app.route("/api/public/product/<int:product_id>", methods=["GET", "OPTIONS"])
def public_product_detail(product_id):
    """
    Public product detail API for storefront.
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200
    conn = _public_open_db()
    cursor = conn.cursor()

    # Check what image columns exist in the database
    cursor.execute("""
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'products' 
          AND COLUMN_NAME IN ('thumbnail_url', 'image1', 'image2', 'image3', 'image4', 'image5', 'image_url')
    """)
    available_image_columns = [col['COLUMN_NAME'] for col in cursor.fetchall()]

    # Build image column selection - use image1, image2, image3, image4, image5 (no underscores)
    image_select = ""
    if 'thumbnail_url' in available_image_columns:
        image_select += "p.thumbnail_url, "
    else:
        image_select += "NULL AS thumbnail_url, "

    # Add image1 through image5 if they exist (no underscores)
    for i in range(1, 6):
        col_name = f'image{i}'
        if col_name in available_image_columns:
            image_select += f"p.{col_name}, "
        else:
            image_select += f"NULL AS {col_name}, "

    # Fallback to image_url if new columns don't exist
    if 'image_url' in available_image_columns and not any(f'image{i}' in available_image_columns for i in range(1, 6)):
        image_select += "p.image_url, "
    else:
        image_select += "NULL AS image_url, "

    # Get product with category, health benefits, and all dynamic content fields
    cursor.execute(
        f"""
        SELECT p.id, p.name, p.slug, p.base_price, p.sale_price, p.base_currency, 
               p.description, p.short_description, p.stock_quantity, p.featured, 
               p.category_id, p.created_at, 
               {image_select}p.sku,
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
                 p.category_id, p.created_at, p.sku,
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
    product = _public_serialize_product(row)
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

    # Fetch product feature cards from product_feature_cards table
    # These cards provide key benefit highlights with text and optional image URL
    try:
        cursor.execute(
            """
            SELECT id, card_text, card_image_url, display_order
            FROM product_feature_cards
            WHERE product_id = %s AND is_active = 1
            ORDER BY display_order ASC, id ASC
            """,
            (product_id,),
        )
        feature_rows = cursor.fetchall()
        feature_cards = [
            {
                "id": r["id"],
                "card_text": r.get("card_text"),
                "card_image_url": r.get("card_image_url"),
                "display_order": r.get("display_order", 0),
            }
            for r in feature_rows
        ]
        if feature_cards:
            product["feature_cards"] = feature_cards
    except Exception:
        # If feature cards table is missing or query fails, continue without breaking the API
        pass

    # Fetch key ingredients from key_ingredients table via product_key_ingredients junction table
    try:
        cursor.execute(
            """
            SELECT ki.id, ki.name, ki.slug, ki.description, ki.image_url, ki.thumbnail_url,
                   pki.display_order
            FROM product_key_ingredients pki
            INNER JOIN key_ingredients ki ON pki.key_ingredient_id = ki.id
            WHERE pki.product_id = %s AND ki.is_active = 1
            ORDER BY pki.display_order ASC, ki.name ASC
            """,
            (product_id,),
        )
        key_ingredient_rows = cursor.fetchall()
        key_ingredients = [
            {
                "id": r["id"],
                "name": r.get("name"),
                "slug": r.get("slug"),
                "description": r.get("description"),
                "image_url": r.get("image_url"),
                "thumbnail_url": r.get("thumbnail_url"),
                "display_order": r.get("display_order", 0),
            }
            for r in key_ingredient_rows
        ]
        if key_ingredients:
            product["key_ingredients"] = key_ingredients
    except Exception:
        # If key ingredients tables are missing or query fails, continue without breaking the API
        pass

    # Fetch FAQs from product_faqs table
    # Updated schema: product_id, question, answer, display_order, id, created_at, updated_at
    try:
        # Check if display_order column exists, if not, order by id
        cursor.execute(
            """
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'product_faqs' 
              AND COLUMN_NAME = 'display_order'
            """
        )
        has_display_order = cursor.fetchone() is not None
        
        # Build query based on available columns
        if has_display_order:
            cursor.execute(
                """
                SELECT id, question, answer, display_order
                FROM product_faqs
                WHERE product_id = %s
                ORDER BY display_order ASC, id ASC
                """,
                (product_id,),
            )
        else:
            cursor.execute(
                """
                SELECT id, question, answer
                FROM product_faqs
                WHERE product_id = %s
                ORDER BY id ASC
                """,
                (product_id,),
            )
        
        faq_rows = cursor.fetchall()
        faqs = []
        for row in faq_rows:
            question = (row.get("question") or "").strip()
            answer = (row.get("answer") or "").strip()
            # Only add FAQs that have both question and answer
            if question and answer:
                faqs.append({
                    "id": row.get("id"),
                    "question": question,
                    "answer": answer,
                    "display_order": row.get("display_order", 0) if has_display_order else 0,
                })
        if faqs:
            product["faqs"] = faqs
    except Exception as e:
        # If product_faqs table is missing or query fails, continue without breaking the API
        # Uncomment for debugging: print(f"[DEBUG] FAQ fetch error: {str(e)}")
        pass

    cursor.close()
    conn.close()
    return jsonify({"product": product})


@app.route("/api/public/register", methods=["POST", "OPTIONS"])
def public_register():
    """
    Public user registration endpoint for storefront.
    Stores user data in the users table.
    """
    if request.method == "OPTIONS":
        # Handle CORS preflight
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    print(f"[DEBUG] Registration request received")
    try:
        data = request.get_json()
        print(f"[DEBUG] Request data: {data}")
        
        # Validate required fields
        if not data:
            print(f"[ERROR] No data provided in request")
            return jsonify({"error": "No data provided"}), 400
        
        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        phone = (data.get("mobile_number") or data.get("phone") or "").strip()
        password = data.get("password")
        
        # Validation
        if not first_name:
            return jsonify({"error": "First name is required"}), 400
        if not last_name:
            return jsonify({"error": "Last name is required"}), 400
        if not email:
            return jsonify({"error": "Email is required"}), 400
        # Password is optional - if not provided, generate a temporary one
        if not password:
            import secrets
            import string
            # Generate a random temporary password (user will set password later)
            password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 409
        
        # Combine first and last name for full_name
        full_name = f"{first_name} {last_name}".strip()
        
        # Hash password (either provided or generated temporary password)
        password_hash = generate_password_hash(password)
        
        # Extract country code from phone if provided (optional)
        country_code = None
        if phone:
            # Try to extract country code (simple logic - can be enhanced)
            # For now, default to empty or extract from phone format
            if phone.startswith('+'):
                parts = phone.split(' ', 1)
                if len(parts) > 1:
                    country_code = parts[0].replace('+', '')
                    phone = parts[1]
        
        # Create new user
        new_user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            phone=phone if phone else None,
            country_code=country_code,
            preferred_currency='INR',  # Default currency
            wallet_balance=0.0,
            reward_points=0,
            is_active=True,
            email_verified=False
        )
        
        print(f"[DEBUG] Creating user with email: {email}, full_name: {full_name}")
        
        db.session.add(new_user)
        print(f"[DEBUG] User added to session")
        
        try:
            db.session.flush()  # Flush to get the ID without committing
            user_id = new_user.id
            print(f"[DEBUG] User flushed, got ID: {user_id}")
        except Exception as flush_error:
            db.session.rollback()
            print(f"[ERROR] Flush failed: {str(flush_error)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Registration failed during save", "details": str(flush_error)}), 500
        
        # Commit the transaction
        try:
            db.session.commit()
            print(f"[DEBUG] Transaction committed successfully for user ID: {user_id}")
        except Exception as commit_error:
            db.session.rollback()
            print(f"[ERROR] Commit failed: {str(commit_error)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Registration failed - could not save to database", "details": str(commit_error)}), 500
        
        # Verify the user exists in database after commit
        try:
            verify_user = User.query.filter_by(id=user_id).first()
            if not verify_user:
                print(f"[ERROR] User {user_id} not found after commit!")
                return jsonify({"error": "Registration failed - user not saved"}), 500
            print(f"[DEBUG] User verified in database: {verify_user.email}")
        except Exception as verify_error:
            print(f"[ERROR] Verification query failed: {str(verify_error)}")
            import traceback
            traceback.print_exc()
            # Don't fail registration if verification fails, but log it
        
        # Create session entry in user_sessions (new users haven't purchased yet)
        try:
            session_id = data.get('session_id')
            if not session_id:
                # Generate a session ID if not provided
                import os
                generated_suffix = os.urandom(4).hex()
                session_id = f"session_{int(datetime.utcnow().timestamp()*1000)}_{generated_suffix}"
            
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent', '')
            page_url = data.get('page_url', '/register')
            
            # Check if session already exists
            existing_session = db.session.execute(
                text("SELECT id FROM user_sessions WHERE session_id = :session_id"),
                {'session_id': session_id}
            ).fetchone()
            
            if not existing_session:
                # Create new session entry in user_sessions
                insert_session_query = text("""
                    INSERT INTO user_sessions 
                    (session_id, user_id, ip_address, user_agent, landing_page, 
                     current_page, entry_time, last_activity, created_at, updated_at)
                    VALUES (:session_id, :user_id, :ip_address, :user_agent, :landing_page,
                            :current_page, NOW(), NOW(), NOW(), NOW())
                """)
                db.session.execute(insert_session_query, {
                    'session_id': session_id,
                    'user_id': user_id,
                    'ip_address': ip_address,
                    'user_agent': user_agent,
                    'landing_page': page_url,
                    'current_page': page_url
                })
                db.session.commit()
                print(f"[SUCCESS] Created user_sessions entry for new user {user_id} with session_id: {session_id}")
            else:
                # Update existing session with user_id
                update_session_query = text("""
                    UPDATE user_sessions 
                    SET user_id = :user_id,
                        last_activity = NOW(),
                        updated_at = NOW()
                    WHERE session_id = :session_id
                """)
                db.session.execute(update_session_query, {
                    'session_id': session_id,
                    'user_id': user_id
                })
                db.session.commit()
                print(f"[SUCCESS] Updated user_sessions entry with user_id {user_id} for session_id: {session_id}")
        except Exception as session_error:
            error_msg = f"[ERROR] Failed to create user_sessions entry: {str(session_error)}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            # Don't fail registration if session creation fails, but log it
            try:
                db.session.rollback()
            except:
                pass
            # Also print to help debug
            print(f"[DEBUG] Session ID was: {session_id}")
            print(f"[DEBUG] User ID was: {user_id}")
            print(f"[DEBUG] Table 'user_sessions' might not exist. Check backend startup logs.")
        
        # Generate password reset token for the new user
        import secrets
        reset_token = secrets.token_urlsafe(32)
        
        # Store token in user record (we'll add a field for this or use a separate table)
        # For now, we'll generate it and include it in the email link
        # The token will be validated when user clicks the link
        
        # Send welcome email to the user
        try:
            send_registration_email(email, full_name, reset_token)
            print(f"[DEBUG] Registration email sent to {email}")
        except Exception as email_error:
            print(f"[ERROR] Failed to send registration email: {str(email_error)}")
            import traceback
            traceback.print_exc()
            # Don't fail registration if email fails, but log it
        
        # Return success response (without password)
        response = jsonify({
            "success": True,
            "message": "Thank you for registering. Before you can login we need you to activate your account by clicking the activation link in the email we just sent you.",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "full_name": new_user.full_name,
                "phone": new_user.phone,
            }
        })
        # Add CORS headers explicitly
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 201
        
    except IntegrityError as e:
        db.session.rollback()
        print(f"[ERROR] IntegrityError during registration: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "User with this email already exists", "details": str(e)}), 409
    except Exception as e:
        db.session.rollback()
        # Log the error for debugging
        error_msg = str(e)
        print(f"[ERROR] Registration failed: {error_msg}")
        import traceback
        traceback.print_exc()
        # Return more detailed error message
        return jsonify({
            "error": "Registration failed", 
            "message": error_msg,
            "details": "Please check backend logs for more information"
        }), 500


def send_registration_email(to_email, user_name, reset_token):
    """
    Send registration email to the user with password setup link.
    Uses SMTP configuration from environment variables.
    """
    # Get SMTP configuration from environment variables
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', 'bhagishruti1901@gmail.com')
    smtp_password = os.environ.get('SMTP_PASSWORD', 'zaff sbug ilsa jfsj')
    smtp_from_email = os.environ.get('SMTP_FROM_EMAIL', 'bhagishruti1901@gmail.com')
    app_name = os.environ.get('APP_NAME', 'RasayanaBio')
    
    # Get frontend URL from environment variable
    # This MUST be set for emails to work on other devices
    # For local development on same machine: http://localhost:3000
    # For other devices on same network: http://YOUR_IP_ADDRESS:3000 (e.g., http://192.168.1.100:3000)
    # For production: https://yourdomain.com
    frontend_url = os.environ.get('FRONTEND_URL', '').strip()
    
    if not frontend_url:
        # Try to get server IP as fallback (for same network access)
        try:
            import socket
            # Get the hostname
            hostname = socket.gethostname()
            # Get the IP address
            ip_address = socket.gethostbyname(hostname)
            # Use IP address with port 3000 as fallback
            frontend_url = f'http://{ip_address}:3000'
            print(f"[WARNING] FRONTEND_URL not set in environment.")
            print(f"[INFO] Using detected IP address: {frontend_url}")
            print(f"[INFO] For production, set FRONTEND_URL in .env file (e.g., FRONTEND_URL=https://rasayanabio.com)")
            print(f"[INFO] For local network access, use: FRONTEND_URL=http://{ip_address}:3000")
        except Exception as e:
            # Final fallback to localhost (only works on same machine)
            frontend_url = 'http://localhost:3000'
            print(f"[ERROR] Could not detect IP address: {str(e)}")
            print(f"[WARNING] Using localhost (will only work on same machine): {frontend_url}")
            print(f"[IMPORTANT] To fix for other devices, add to .env file:")
            print(f"[IMPORTANT] FRONTEND_URL=http://YOUR_IP_ADDRESS:3000")
            print(f"[IMPORTANT] Or for production: FRONTEND_URL=https://yourdomain.com")
    else:
        print(f"[INFO] Using FRONTEND_URL from environment: {frontend_url}")
    
    # Create password reset link
    reset_link = f"{frontend_url}/password-reset?token={reset_token}&act=reset_password&email={to_email}"
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['From'] = f"{app_name} <{smtp_from_email}>"
    msg['To'] = to_email
    msg['Subject'] = f'Welcome to {app_name}!'
    
    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .header h1 {{
                color: #0c6a1f;
                font-size: 28px;
                margin: 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 20px;
            }}
            .button {{
                display: inline-block;
                background-color: #4a4a4a;
                color: #ffffff;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .button:hover {{
                background-color: #333333;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
            }}
            .contact-info {{
                margin-top: 20px;
                font-size: 12px;
                color: #888;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{app_name}</h1>
        </div>
        <div class="content">
            <h2 style="color: #0c6a1f; margin-top: 0;">Thank you for signing up!</h2>
            <p>Your account is now active.</p>
            <div style="text-align: center;">
                <a href="{reset_link}" class="button">Set your password</a>
            </div>
        </div>
        <div class="footer">
            <p>Thank you!<br>The {app_name} Team</p>
            <div class="contact-info">
                <p>If you have any problems, please contact us at {smtp_from_email}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_body = f"""
    Thank you for signing up!
    
    Your account is now active.
    
    Set your password by clicking the following link:
    {reset_link}
    
    Thank you!
    The {app_name} Team
    
    If you have any problems, please contact us at {smtp_from_email}
    """
    
    # Attach both HTML and plain text versions
    part1 = MIMEText(text_body, 'plain')
    part2 = MIMEText(html_body, 'html')
    
    msg.attach(part1)
    msg.attach(part2)
    
    # Send email via SMTP
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()  # Enable TLS encryption
        server.login(smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_from_email, to_email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"[ERROR] SMTP error: {str(e)}")
        raise


@app.route("/api/public/login", methods=["POST", "OPTIONS"])
def public_login():
    """
    Public user login endpoint for storefront.
    Allows regular users (from users table) to login with email and password.
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = (data.get("email") or "").strip().lower()
        password = data.get("password")
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        if not password:
            return jsonify({"error": "Password is required"}), 400
        
        # Find user in users table
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({"error": "User not found. Please register first."}), 401
        
        # Check password
        if not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Check if account is active
        if not user.is_active:
            return jsonify({"error": "Account is disabled. Please contact support."}), 403
        
        # Create access token
        user_id = f"user_{user.id}"
        access_token = create_access_token(identity=user_id)
        
        # Update last login timestamp
        try:
            user.updated_at = datetime.now(timezone.utc)
            db.session.commit()
        except:
            db.session.rollback()
        
        # Create or update session in user_sessions or customer_sessions
        try:
            session_id = data.get('session_id')
            if not session_id:
                # Generate a session ID if not provided
                import os
                generated_suffix = os.urandom(4).hex()
                session_id = f"session_{int(datetime.utcnow().timestamp()*1000)}_{generated_suffix}"
            
            # Check if user has purchased to determine which table to use
            has_purchased = has_user_purchased(user.id)
            table_name = 'customer_sessions' if has_purchased else 'user_sessions'
            
            ip_address = request.remote_addr
            user_agent = request.headers.get('User-Agent', '')
            page_url = data.get('page_url', '/login')
            
            # Check if session exists in either table
            check_customer = db.session.execute(
                text("SELECT id FROM customer_sessions WHERE session_id = :session_id"),
                {'session_id': session_id}
            ).fetchone()
            
            check_user = db.session.execute(
                text("SELECT id FROM user_sessions WHERE session_id = :session_id"),
                {'session_id': session_id}
            ).fetchone()
            
            # Use the table where session exists, or the appropriate table based on purchase status
            if check_customer:
                table_name = 'customer_sessions'
            elif check_user:
                table_name = 'user_sessions'
            # else use table_name based on purchase status (already set above)
            
            # Check if session exists in the determined table
            existing_session = db.session.execute(
                text(f"SELECT id FROM {table_name} WHERE session_id = :session_id"),
                {'session_id': session_id}
            ).fetchone()
            
            if existing_session:
                # Update existing session
                update_query = text(f"""
                    UPDATE {table_name} 
                    SET user_id = :user_id,
                        last_activity = NOW(),
                        current_page = :page_url,
                        updated_at = NOW()
                    WHERE session_id = :session_id
                """)
                db.session.execute(update_query, {
                    'session_id': session_id,
                    'user_id': user.id,
                    'page_url': page_url
                })
            else:
                # Create new session entry
                insert_query = text(f"""
                    INSERT INTO {table_name} 
                    (session_id, user_id, ip_address, user_agent, landing_page, 
                     current_page, entry_time, last_activity, created_at, updated_at)
                    VALUES (:session_id, :user_id, :ip_address, :user_agent, :landing_page,
                            :current_page, NOW(), NOW(), NOW(), NOW())
                """)
                db.session.execute(insert_query, {
                    'session_id': session_id,
                    'user_id': user.id,
                    'ip_address': ip_address,
                    'user_agent': user_agent,
                    'landing_page': page_url,
                    'current_page': page_url
                })
            
            db.session.commit()
            print(f"[SUCCESS] Created/updated {table_name} entry for user {user.id} with session_id: {session_id}")
        except Exception as session_error:
            error_msg = f"[ERROR] Failed to create/update session entry during login: {str(session_error)}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            # Don't fail login if session creation fails, but log it
            try:
                db.session.rollback()
            except:
                pass
            # Also print to help debug
            print(f"[DEBUG] Session ID was: {session_id}")
            print(f"[DEBUG] User ID was: {user.id}")
            print(f"[DEBUG] Table '{table_name}' might not exist. Check backend startup logs.")
        
        # Parse full_name into first_name and last_name
        first_name = ""
        last_name = ""
        if user.full_name:
            name_parts = user.full_name.strip().split(" ", 1)
            first_name = name_parts[0] if len(name_parts) > 0 else ""
            last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        return jsonify({
            "success": True,
            "access_token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": first_name,
                "last_name": last_name,
                "full_name": user.full_name,
                "mobile_number": user.phone or "",
                "phone": user.phone,
                "role": "user"
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Login failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Login failed", "message": str(e)}), 500


@app.route("/api/public/set-password", methods=["POST", "OPTIONS"])
def public_set_password():
    """
    Set password for a user using token from registration email.
    """
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = (data.get("email") or "").strip().lower()
        token = data.get("token")
        password = data.get("password")
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        if not token:
            return jsonify({"error": "Token is required"}), 400
        if not password:
            return jsonify({"error": "Password is required"}), 400
        
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # For now, we'll accept any token for new registrations (users without password set)
        # In production, you should validate the token properly
        # Check if user has a temporary password (new registration)
        # We can check if password_hash matches a pattern or store token separately
        
        print(f"[DEBUG] Setting password for user: {email}")
        
        # Update password
        password_hash = generate_password_hash(password)
        user.password_hash = password_hash
        user.updated_at = datetime.now(timezone.utc)
        
        try:
            db.session.commit()
            print(f"[DEBUG] Password updated successfully for user: {email}")
            
            # Verify the password was saved by querying the database again
            db.session.expire_all()  # Clear session cache
            verified_user = User.query.filter_by(email=email).first()
            if verified_user and verified_user.password_hash:
                # Test that the password hash works
                if check_password_hash(verified_user.password_hash, password):
                    print(f"[DEBUG] Password verified successfully in database for user: {email}")
                else:
                    print(f"[WARNING] Password verification failed after commit for user: {email}")
            else:
                print(f"[ERROR] User not found after commit for user: {email}")
        except Exception as commit_error:
            db.session.rollback()
            print(f"[ERROR] Failed to commit password update: {str(commit_error)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Failed to update password in database", "details": str(commit_error)}), 500
        
        return jsonify({
            "success": True,
            "message": "Password set successfully. You can now login."
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Set password failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to set password", "message": str(e)}), 500


@app.route("/api/public/cities", methods=["GET", "OPTIONS"])
def public_get_cities():
    """
    Get cities by state for checkout form dropdown.
    Query parameter: ?state=StateName
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
    try:
        state_name = request.args.get('state', '').strip()
        
        if not state_name:
            return jsonify({"error": "State parameter is required"}), 400
        
        # Query cities for the given state (case-insensitive match)
        cities_query = text("""
            SELECT DISTINCT city_name 
            FROM cities 
            WHERE LOWER(TRIM(state_name)) = LOWER(TRIM(:state_name)) AND is_active = 1
            ORDER BY city_name ASC
        """)
        
        result = db.session.execute(cities_query, {'state_name': state_name}).fetchall()
        
        cities = [row[0] for row in result] if result else []
        
        # Debug logging if no cities found
        if not cities:
            print(f"[DEBUG] No cities found for state: '{state_name}'. Checking available states...")
            debug_query = text("SELECT DISTINCT state_name FROM cities ORDER BY state_name")
            available_states = db.session.execute(debug_query).fetchall()
            available_state_names = [row[0] for row in available_states] if available_states else []
            print(f"[DEBUG] Available states in database: {available_state_names[:10]}...")  # Show first 10
        
        return jsonify({
            "success": True,
            "state": state_name,
            "cities": cities
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch cities: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch cities", "message": str(e)}), 500


@app.route("/api/public/my-orders", methods=["GET", "OPTIONS"])
@jwt_required(optional=True)  # Make JWT optional but validate if present
def public_get_user_orders():
    """
    Get all orders for the logged-in user.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        print(f"[DEBUG] JWT user_id from token: {jwt_user_id}")
        
        if not jwt_user_id:
            print("[ERROR] No JWT token found in request")
            return jsonify({"error": "Authentication required", "message": "Please login to view your orders"}), 401
        
        # Extract user ID from JWT identity (format: "user_123")
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        print(f"[DEBUG] Extracted user_id: {user_id}")
        
        # Query orders for this user
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        
        print(f"[DEBUG] Found {len(orders)} orders for user_id {user_id}")
        
        orders_list = []
        for order in orders:
            # Get order items
            order_items = OrderItem.query.filter_by(order_id=order.id).all()
            items_list = [{
                'id': item.id,
                'product_id': item.product_id,
                'product_name': item.product_name,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'total_price': float(item.total_price),
            } for item in order_items]
            
            orders_list.append({
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status,
                'payment_status': order.payment_status,
                'payment_method': order.payment_method,
                'subtotal': float(order.subtotal),
                'shipping_cost': float(order.shipping_cost),
                'tax_amount': float(order.tax_amount),
                'total_amount': float(order.total_amount),
                'currency': order.currency,
                'shipping_address': order.shipping_address,
                'billing_address': order.billing_address,
                'created_at': order.created_at.isoformat() if order.created_at else None,
                'items': items_list
            })
        
        return jsonify({
            "success": True,
            "orders": orders_list
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch user orders: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch orders", "message": str(e)}), 500


@app.route("/api/public/my-addresses", methods=["GET", "OPTIONS"])
@jwt_required(optional=True)  # Make JWT optional but validate if present
def public_get_user_addresses():
    """
    Get all addresses for the logged-in user.
    Extracts addresses from orders (shipping and billing).
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        print(f"[DEBUG] JWT user_id from token (addresses): {jwt_user_id}")
        
        if not jwt_user_id:
            print("[ERROR] No JWT token found in request (addresses)")
            return jsonify({"error": "Authentication required", "message": "Please login to view your addresses"}), 401
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        print(f"[DEBUG] Extracted user_id (addresses): {user_id}")
        
        # Query orders to extract unique addresses
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        
        print(f"[DEBUG] Found {len(orders)} orders for user_id {user_id} (addresses)")
        
        addresses_set = set()
        addresses_list = []
        
        for order in orders:
            # Add shipping address if exists
            if order.shipping_address:
                addr_key = order.shipping_address.strip()
                if addr_key and addr_key not in addresses_set:
                    addresses_set.add(addr_key)
                    addresses_list.append({
                        'type': 'shipping',
                        'address': order.shipping_address,
                        'order_id': order.id,
                        'order_number': order.order_number,
                        'created_at': order.created_at.isoformat() if order.created_at else None
                    })
            
            # Add billing address if exists and different from shipping
            if order.billing_address and order.billing_address.strip() != (order.shipping_address or '').strip():
                addr_key = order.billing_address.strip()
                if addr_key and addr_key not in addresses_set:
                    addresses_set.add(addr_key)
                    addresses_list.append({
                        'type': 'billing',
                        'address': order.billing_address,
                        'order_id': order.id,
                        'order_number': order.order_number,
                        'created_at': order.created_at.isoformat() if order.created_at else None
                    })
        
        return jsonify({
            "success": True,
            "addresses": addresses_list
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch user addresses: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch addresses", "message": str(e)}), 500


@app.route("/api/public/wishlist", methods=["GET", "OPTIONS"])
@jwt_required(optional=True)
def public_get_wishlist():
    """
    Get all wishlist items for the logged-in user.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        print(f"[DEBUG] Wishlist GET - JWT user_id: {jwt_user_id}")
        
        if not jwt_user_id:
            print("[DEBUG] No JWT token found")
            return jsonify({"error": "Authentication required", "message": "Please login to view your wishlist"}), 401
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        print(f"[DEBUG] Extracted user_id: {user_id}")
        
        # First, check if wishlist table exists and has data
        try:
            check_query = text("SELECT COUNT(*) as count FROM wishlist WHERE user_id = :user_id")
            count_result = db.session.execute(check_query, {'user_id': user_id}).fetchone()
            print(f"[DEBUG] Wishlist items count for user {user_id}: {count_result[0] if count_result else 0}")
        except Exception as check_error:
            print(f"[DEBUG] Error checking wishlist count: {str(check_error)}")
        
        # Query wishlist items for this user with product details
        # NOTE: Some older databases don't have the "image_url" column on products,
        # so we only select image1-5 and thumbnail_url here.
        wishlist_query = text("""
            SELECT w.id, w.product_id, w.created_at,
                   p.name, p.slug, p.base_price, p.sale_price,
                   p.image1, p.image2, p.image3, p.image4, p.image5,
                   p.thumbnail_url, p.is_active
            FROM wishlist w
            INNER JOIN products p ON w.product_id = p.id
            WHERE w.user_id = :user_id AND p.is_active = 1
            ORDER BY w.created_at DESC
        """)
        
        print(f"[DEBUG] Executing wishlist query for user_id: {user_id}")
        result = db.session.execute(wishlist_query, {'user_id': user_id}).fetchall()
        print(f"[DEBUG] Query returned {len(result)} rows")
        
        wishlist_items = []
        for row in result:
            try:
                # Handle both Row and tuple access
                if hasattr(row, '_mapping'):
                    # SQLAlchemy Row object (access by column name)
                    row_id = row.id
                    product_id = row.product_id
                    product_name = row.name
                    product_slug = row.slug
                    base_price = row.base_price
                    sale_price = row.sale_price
                    image1 = row.image1
                    image2 = row.image2
                    image3 = row.image3
                    image4 = row.image4
                    image5 = row.image5
                    thumbnail_url = row.thumbnail_url
                    created_at = row.created_at
                else:
                    # Tuple access (by index) – keep in sync with SELECT above
                    row_id = row[0]
                    product_id = row[1]
                    created_at = row[2]
                    product_name = row[3]
                    product_slug = row[4]
                    base_price = row[5]
                    sale_price = row[6]
                    image1 = row[7]
                    image2 = row[8]
                    image3 = row[9]
                    image4 = row[10]
                    image5 = row[11]
                    thumbnail_url = row[12]
                
                # Get first available image
                image_url = image1 or image2 or image3 or image4 or image5 or thumbnail_url or ''
                
                wishlist_items.append({
                    'id': row_id,
                    'product_id': product_id,
                    'product_name': product_name,
                    'product_slug': product_slug,
                    'base_price': float(base_price) if base_price else 0.0,
                    'sale_price': float(sale_price) if sale_price else None,
                    'image_url': image_url,
                    'created_at': created_at.isoformat() if hasattr(created_at, 'isoformat') and created_at else (str(created_at) if created_at else None)
                })
            except Exception as row_error:
                print(f"[ERROR] Error processing wishlist row: {str(row_error)}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"[DEBUG] Returning {len(wishlist_items)} wishlist items")
        
        return jsonify({
            "success": True,
            "wishlist": wishlist_items
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch wishlist: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch wishlist", "message": str(e)}), 500


@app.route("/api/public/wishlist", methods=["POST", "OPTIONS"])
@jwt_required(optional=True)
def public_add_to_wishlist():
    """
    Add a product to user's wishlist.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        
        if not product_id:
            return jsonify({"error": "product_id is required"}), 400
        
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        if not jwt_user_id:
            return jsonify({"error": "Authentication required", "message": "Please login to add items to wishlist"}), 401
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        # Check if product exists and is active.
        # IMPORTANT: We use a raw SQL query here instead of the SQLAlchemy Product
        # model, because some databases don't have all columns defined on the
        # Product model (e.g. missing image_url), which can cause SELECT * queries
        # to fail with "Unknown column" errors.
        product_check_query = text("""
            SELECT id
            FROM products
            WHERE id = :product_id AND is_active = 1
            LIMIT 1
        """)
        product_row = db.session.execute(product_check_query, {"product_id": product_id}).fetchone()
        if not product_row:
            return jsonify({"error": "Product not found or inactive"}), 404
        
        # Check if already in wishlist
        existing = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            return jsonify({
                "success": True,
                "message": "Product already in wishlist",
                "wishlist_id": existing.id
            }), 200
        
        # Add to wishlist
        wishlist_item = Wishlist(
            user_id=user_id,
            product_id=product_id
        )
        db.session.add(wishlist_item)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Product added to wishlist",
            "wishlist_id": wishlist_item.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to add to wishlist: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to add to wishlist", "message": str(e)}), 500


@app.route("/api/public/wishlist/<int:product_id>", methods=["DELETE", "OPTIONS"])
@jwt_required(optional=True)
def public_remove_from_wishlist(product_id):
    """
    Remove a product from user's wishlist.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
        return response, 200
    
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        if not jwt_user_id:
            return jsonify({"error": "Authentication required", "message": "Please login to remove items from wishlist"}), 401
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        # Find and delete wishlist item
        wishlist_item = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()
        if not wishlist_item:
            return jsonify({"error": "Item not found in wishlist"}), 404
        
        db.session.delete(wishlist_item)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Product removed from wishlist"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to remove from wishlist: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to remove from wishlist", "message": str(e)}), 500


@app.route("/api/public/wishlist/debug", methods=["GET", "OPTIONS"])
@jwt_required(optional=True)
def public_wishlist_debug():
    """
    Debug endpoint to check wishlist table and user data.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
    try:
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        debug_info = {
            "jwt_user_id": str(jwt_user_id) if jwt_user_id else None,
            "authenticated": jwt_user_id is not None
        }
        
        if jwt_user_id:
            if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
                user_id = int(jwt_user_id.replace('user_', ''))
            else:
                user_id = int(jwt_user_id)
            
            debug_info["extracted_user_id"] = user_id
            
            # Check wishlist table
            try:
                count_query = text("SELECT COUNT(*) as count FROM wishlist WHERE user_id = :user_id")
                count_result = db.session.execute(count_query, {'user_id': user_id}).fetchone()
                debug_info["wishlist_count"] = count_result[0] if count_result else 0
                
                # Get all wishlist items for this user
                all_items_query = text("SELECT * FROM wishlist WHERE user_id = :user_id")
                all_items = db.session.execute(all_items_query, {'user_id': user_id}).fetchall()
                debug_info["wishlist_items"] = [
                    {
                        "id": item.id,
                        "user_id": item.user_id,
                        "product_id": item.product_id,
                        "created_at": str(item.created_at) if item.created_at else None
                    }
                    for item in all_items
                ]
                
                # Check if products exist
                if all_items:
                    product_ids = [item.product_id for item in all_items]
                    products_query = text("SELECT id, name, is_active FROM products WHERE id IN :product_ids")
                    # Convert list to tuple for IN clause
                    products_result = db.session.execute(
                        text("SELECT id, name, is_active FROM products WHERE id IN (" + ",".join(map(str, product_ids)) + ")")
                    ).fetchall()
                    debug_info["products"] = [
                        {"id": p.id, "name": p.name, "is_active": bool(p.is_active)}
                        for p in products_result
                    ]
            except Exception as db_error:
                debug_info["database_error"] = str(db_error)
                import traceback
                debug_info["traceback"] = traceback.format_exc()
        
        return jsonify({
            "success": True,
            "debug": debug_info
        }), 200
        
    except Exception as e:
        import traceback
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500


@app.route("/api/public/wishlist/check/<int:product_id>", methods=["GET", "OPTIONS"])
@jwt_required(optional=True)
def public_check_wishlist(product_id):
    """
    Check if a product is in user's wishlist.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        if not jwt_user_id:
            return jsonify({
                "success": True,
                "in_wishlist": False
            }), 200
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        # Check if product is in wishlist
        wishlist_item = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()
        
        return jsonify({
            "success": True,
            "in_wishlist": wishlist_item is not None,
            "wishlist_id": wishlist_item.id if wishlist_item else None
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to check wishlist: {str(e)}")
        return jsonify({
            "success": True,
            "in_wishlist": False
        }), 200


@app.route("/api/public/cart", methods=["GET", "OPTIONS"])
@jwt_required(optional=True)
def public_get_cart():
    """
    Get all cart items for the logged-in user.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        print(f"[DEBUG] Cart GET - JWT user_id: {jwt_user_id}")
        
        if not jwt_user_id:
            print("[DEBUG] No JWT token found - returning empty cart")
            return jsonify({
                "success": True,
                "cart": []
            }), 200
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        print(f"[DEBUG] Extracted user_id: {user_id}")
        
        # Query cart items for this user with product details
        cart_query = text("""
            SELECT c.id, c.product_id, c.quantity, c.created_at,
                   p.name, p.slug, p.base_price, p.sale_price, p.image1, p.image2, p.image3, 
                   p.image4, p.image5, p.thumbnail_url, p.is_active
            FROM cart c
            INNER JOIN products p ON c.product_id = p.id
            WHERE c.user_id = :user_id AND p.is_active = 1
            ORDER BY c.created_at DESC
        """)
        
        print(f"[DEBUG] Executing cart query for user_id: {user_id}")
        result = db.session.execute(cart_query, {'user_id': user_id}).fetchall()
        print(f"[DEBUG] Query returned {len(result)} rows")
        
        cart_items = []
        for row in result:
            try:
                # Handle both Row and tuple access
                if hasattr(row, '_mapping'):
                    row_id = row.id
                    product_id = row.product_id
                    quantity = row.quantity
                    product_name = row.name
                    product_slug = row.slug
                    base_price = row.base_price
                    sale_price = row.sale_price
                    image1 = row.image1
                    image2 = row.image2
                    image3 = row.image3
                    image4 = row.image4
                    image5 = row.image5
                    thumbnail_url = row.thumbnail_url
                    created_at = row.created_at
                else:
                    row_id = row[0]
                    product_id = row[1]
                    quantity = row[2]
                    created_at = row[3]
                    product_name = row[4]
                    product_slug = row[5]
                    base_price = row[6]
                    sale_price = row[7]
                    image1 = row[8]
                    image2 = row[9]
                    image3 = row[10]
                    image4 = row[11]
                    image5 = row[12]
                    thumbnail_url = row[13]
                
                # Get first available image
                image_url = image1 or image2 or image3 or image4 or image5 or thumbnail_url or ''
                
                cart_items.append({
                    'id': row_id,
                    'product_id': product_id,
                    'product_name': product_name,
                    'product_slug': product_slug,
                    'quantity': int(quantity),
                    'base_price': float(base_price) if base_price else 0.0,
                    'sale_price': float(sale_price) if sale_price else None,
                    'image_url': image_url,
                    'created_at': created_at.isoformat() if hasattr(created_at, 'isoformat') and created_at else (str(created_at) if created_at else None)
                })
            except Exception as row_error:
                print(f"[ERROR] Error processing cart row: {str(row_error)}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"[DEBUG] Returning {len(cart_items)} cart items")
        
        return jsonify({
            "success": True,
            "cart": cart_items
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch cart: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch cart", "message": str(e)}), 500


@app.route("/api/public/cart", methods=["POST", "OPTIONS"])
@jwt_required(optional=True)
def public_add_to_cart():
    """
    Add a product to user's cart or update quantity if already exists.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        if not product_id:
            return jsonify({"error": "product_id is required"}), 400
        
        if quantity <= 0:
            return jsonify({"error": "quantity must be greater than 0"}), 400
        
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        if not jwt_user_id:
            return jsonify({"error": "Authentication required", "message": "Please login to add items to cart"}), 401
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        # Check if product exists and is active using raw SQL
        product_check = text("SELECT id FROM products WHERE id = :product_id AND is_active = 1 LIMIT 1")
        product_result = db.session.execute(product_check, {'product_id': product_id}).fetchone()
        if not product_result:
            return jsonify({"error": "Product not found or inactive"}), 404
        
        # Check if already in cart
        existing = Cart.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            # Update quantity
            existing.quantity = existing.quantity + quantity
            db.session.commit()
            return jsonify({
                "success": True,
                "message": "Cart item quantity updated",
                "cart_id": existing.id,
                "quantity": existing.quantity
            }), 200
        
        # Add to cart
        cart_item = Cart(
            user_id=user_id,
            product_id=product_id,
            quantity=quantity
        )
        db.session.add(cart_item)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Product added to cart",
            "cart_id": cart_item.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to add to cart: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to add to cart", "message": str(e)}), 500


@app.route("/api/public/cart/<int:cart_id>", methods=["PUT", "OPTIONS"])
@jwt_required(optional=True)
def public_update_cart_item(cart_id):
    """
    Update quantity of a cart item.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'PUT, OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        quantity = data.get('quantity')
        
        if quantity is None:
            return jsonify({"error": "quantity is required"}), 400
        
        if quantity <= 0:
            return jsonify({"error": "quantity must be greater than 0"}), 400
        
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        if not jwt_user_id:
            return jsonify({"error": "Authentication required", "message": "Please login to update cart"}), 401
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        # Find cart item
        cart_item = Cart.query.filter_by(id=cart_id, user_id=user_id).first()
        if not cart_item:
            return jsonify({"error": "Cart item not found"}), 404
        
        # Update quantity
        cart_item.quantity = quantity
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Cart item updated",
            "quantity": cart_item.quantity
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to update cart item: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to update cart item", "message": str(e)}), 500


@app.route("/api/public/cart/<int:cart_id>", methods=["DELETE", "OPTIONS"])
@jwt_required(optional=True)
def public_remove_from_cart(cart_id):
    """
    Remove a cart item.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
        return response, 200
    
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        if not jwt_user_id:
            return jsonify({"error": "Authentication required", "message": "Please login to remove items from cart"}), 401
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        # Find and delete cart item
        cart_item = Cart.query.filter_by(id=cart_id, user_id=user_id).first()
        if not cart_item:
            return jsonify({"error": "Cart item not found"}), 404
        
        db.session.delete(cart_item)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Product removed from cart"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to remove from cart: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to remove from cart", "message": str(e)}), 500


@app.route("/api/public/cart/product/<int:product_id>", methods=["DELETE", "OPTIONS"])
@jwt_required(optional=True)
def public_remove_from_cart_by_product(product_id):
    """
    Remove a cart item by product_id (alternative endpoint).
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
        return response, 200
    
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        if not jwt_user_id:
            return jsonify({"error": "Authentication required", "message": "Please login to remove items from cart"}), 401
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        # Find and delete cart item by product_id and user_id
        cart_item = Cart.query.filter_by(user_id=user_id, product_id=product_id).first()
        if not cart_item:
            return jsonify({"error": "Cart item not found"}), 404
        
        db.session.delete(cart_item)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Product removed from cart"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to remove from cart by product_id: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to remove from cart", "message": str(e)}), 500


@app.route("/api/public/cart", methods=["DELETE", "OPTIONS"])
@jwt_required(optional=True)
def public_clear_cart():
    """
    Clear all items from user's cart.
    Requires JWT authentication.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
        return response, 200
    
    try:
        # Get user_id from JWT token
        from flask_jwt_extended import get_jwt_identity
        jwt_user_id = get_jwt_identity()
        
        print(f"[DEBUG] Clear cart - JWT user_id: {jwt_user_id}")
        
        if not jwt_user_id:
            return jsonify({"error": "Authentication required", "message": "Please login to clear cart"}), 401
        
        # Extract user ID from JWT identity
        if isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
            user_id = int(jwt_user_id.replace('user_', ''))
        else:
            user_id = int(jwt_user_id)
        
        print(f"[DEBUG] Clearing cart for user_id: {user_id}")
        
        # Delete all cart items for this user
        deleted_count = Cart.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        
        print(f"[DEBUG] Deleted {deleted_count} cart items for user {user_id}")
        
        return jsonify({
            "success": True,
            "message": "Cart cleared",
            "deleted_items": deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to clear cart: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to clear cart", "message": str(e)}), 500


# ==================== REVIEW ENDPOINTS ====================

@app.route("/api/public/products/<int:product_id>/reviews", methods=["GET", "OPTIONS"])
def public_get_product_reviews(product_id):
    """
    Get all approved reviews for a specific product.
    Public endpoint - no authentication required.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        return response, 200
    
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        # Query reviews for the product
        reviews_query = Review.query.filter_by(
            product_id=product_id,
            is_approved=True,
            is_active=True
        ).order_by(Review.created_at.desc())
        
        # Paginate results
        reviews_pagination = reviews_query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        reviews_list = []
        for review in reviews_pagination.items:
            review_dict = review.to_dict()
            # Don't expose email in public API
            review_dict.pop('email', None)
            reviews_list.append(review_dict)
        
        # Calculate review statistics
        all_reviews = Review.query.filter_by(
            product_id=product_id,
            is_approved=True,
            is_active=True
        ).all()
        
        total_reviews = len(all_reviews)
        if total_reviews > 0:
            average_rating = sum(r.rating for r in all_reviews) / total_reviews
            rating_distribution = {i: 0 for i in range(1, 6)}
            for review in all_reviews:
                rating_distribution[review.rating] += 1
        else:
            average_rating = 0
            rating_distribution = {i: 0 for i in range(1, 6)}
        
        return jsonify({
            "success": True,
            "reviews": reviews_list,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": reviews_pagination.total,
                "pages": reviews_pagination.pages,
                "has_next": reviews_pagination.has_next,
                "has_prev": reviews_pagination.has_prev
            },
            "statistics": {
                "total_reviews": total_reviews,
                "average_rating": round(average_rating, 1),
                "rating_distribution": rating_distribution
            }
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to fetch product reviews: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch reviews", "message": str(e)}), 500


@app.route("/api/public/products/<int:product_id>/reviews", methods=["POST", "OPTIONS"])
@jwt_required(optional=True)
def public_create_product_review(product_id):
    """
    Create a new review for a product.
    Authentication is optional - supports both logged-in users and guests.
    Supports file uploads for images and videos.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        print(f"[DEBUG] Review submission for product {product_id}")
        print(f"[DEBUG] Content type: {request.content_type}")
        
        # Handle both JSON and FormData
        if request.content_type and 'multipart/form-data' in request.content_type:
            # FormData (with file uploads)
            data = request.form.to_dict()
            files = request.files
            print(f"[DEBUG] FormData received: {list(data.keys())}")
            print(f"[DEBUG] Files received: {list(files.keys())}")
        else:
            # JSON data (no file uploads)
            data = request.get_json()
            files = {}
            print(f"[DEBUG] JSON data received: {list(data.keys()) if data else 'None'}")
        
        if not data:
            print("[ERROR] No data provided in request")
            return jsonify({"error": "No data provided"}), 400
        
        # Get user_id if authenticated
        user_id = None
        try:
            from flask_jwt_extended import get_jwt_identity
            jwt_user_id = get_jwt_identity()
            if jwt_user_id and isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
                user_id = int(jwt_user_id.replace('user_', ''))
        except:
            pass  # Guest review
        
        # Validate required fields
        required_fields = ['name', 'email', 'rating']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Validate rating
        rating = data.get('rating')
        try:
            rating = int(rating)
        except (ValueError, TypeError):
            return jsonify({"error": "Rating must be a valid number"}), 400
        
        if rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
        
        # Validate email format
        import re
        email = data.get('email').strip().lower()
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Check if product exists
        product = Product.query.filter_by(id=product_id, is_active=True).first()
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        # Handle file uploads
        image_url = None
        video_url = None
        
        print(f"[DEBUG] Processing file uploads...")
        
        if 'image' in files:
            image_file = files['image']
            print(f"[DEBUG] Image file: {image_file.filename}")
            if image_file.filename:
                try:
                    # Create upload directory if it doesn't exist
                    upload_dir = os.path.join(os.getcwd(), 'static', 'uploads', 'reviews')
                    print(f"[DEBUG] Upload directory: {upload_dir}")
                    os.makedirs(upload_dir, exist_ok=True)
                    
                    # Generate unique filename
                    import uuid
                    file_extension = os.path.splitext(image_file.filename)[1]
                    unique_filename = f"review_image_{uuid.uuid4().hex}{file_extension}"
                    file_path = os.path.join(upload_dir, unique_filename)
                    
                    # Save file
                    print(f"[DEBUG] Saving image to: {file_path}")
                    image_file.save(file_path)
                    image_url = f"/static/uploads/reviews/{unique_filename}"
                    print(f"[DEBUG] Image saved successfully: {image_url}")
                except Exception as e:
                    print(f"[ERROR] Failed to save image: {str(e)}")
                    # Continue without image - don't fail the entire review
                    pass
        
        if 'video' in files:
            video_file = files['video']
            if video_file.filename:
                try:
                    # Create upload directory if it doesn't exist
                    upload_dir = os.path.join(os.getcwd(), 'static', 'uploads', 'reviews')
                    os.makedirs(upload_dir, exist_ok=True)
                    
                    # Generate unique filename
                    import uuid
                    file_extension = os.path.splitext(video_file.filename)[1]
                    unique_filename = f"review_video_{uuid.uuid4().hex}{file_extension}"
                    file_path = os.path.join(upload_dir, unique_filename)
                    
                    # Save file
                    print(f"[DEBUG] Saving video to: {file_path}")
                    video_file.save(file_path)
                    video_url = f"/static/uploads/reviews/{unique_filename}"
                    print(f"[DEBUG] Video saved successfully: {video_url}")
                except Exception as e:
                    print(f"[ERROR] Failed to save video: {str(e)}")
                    # Continue without video - don't fail the entire review
                    pass
        
        # Check if user already reviewed this product (prevent duplicate reviews)
        if user_id:
            existing_review = Review.query.filter_by(
                product_id=product_id,
                user_id=user_id
            ).first()
            if existing_review:
                return jsonify({"error": "You have already reviewed this product"}), 400
        
        # Check if user has purchased this product (for verified reviews)
        is_verified = False
        if user_id:
            # Check if user has ordered this product
            user_orders = Order.query.filter_by(user_id=user_id).all()
            for order in user_orders:
                for item in order.items:
                    if item.product_id == product_id:
                        is_verified = True
                        break
                if is_verified:
                    break
        
        # Create new review
        print(f"[DEBUG] Creating review with data:")
        print(f"[DEBUG] - product_id: {product_id}")
        print(f"[DEBUG] - user_id: {user_id}")
        print(f"[DEBUG] - name: {data.get('name')}")
        print(f"[DEBUG] - email: {email}")
        print(f"[DEBUG] - rating: {rating}")
        print(f"[DEBUG] - image_url: {image_url}")
        print(f"[DEBUG] - video_url: {video_url}")
        
        review = Review(
            product_id=product_id,
            user_id=user_id,
            name=data.get('name').strip(),
            email=email,
            rating=rating,
            review_text=data.get('review_text', '').strip() if data.get('review_text') else None,
            image_url=image_url,
            video_url=video_url,
            is_verified=is_verified,
            is_approved=True,  # Auto-approve for now
            is_active=True
        )
        
        print(f"[DEBUG] Adding review to database...")
        db.session.add(review)
        db.session.commit()
        print(f"[DEBUG] Review saved successfully with ID: {review.id}")
        
        print(f"[SUCCESS] Created review {review.id} for product {product_id} by {review.name}")
        
        return jsonify({
            "success": True,
            "message": "Review submitted successfully",
            "review": review.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to create review: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to submit review", "message": str(e)}), 500


# ==================== PASSWORD RESET ENDPOINTS ====================

@app.route("/api/public/forgot-password", methods=["POST", "OPTIONS"])
def public_forgot_password():
    """
    Send password reset email to user.
    Public endpoint - no authentication required.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email_or_username = data.get('email_or_username', '').strip().lower()
        
        if not email_or_username:
            return jsonify({"error": "Email or username is required"}), 400
        
        # Find user by email or username
        user = None
        if '@' in email_or_username:
            # It's an email
            user = User.query.filter_by(email=email_or_username).first()
        else:
            # It's a username - check if you have username field, otherwise use email
            user = User.query.filter_by(email=email_or_username).first()
        
        if not user:
            # Don't reveal if user exists or not for security
            return jsonify({
                "success": True,
                "message": "If an account with that email exists, password reset instructions have been sent."
            }), 200
        
        # Generate password reset token
        import secrets
        reset_token = secrets.token_urlsafe(32)
        
        # Store the reset token (you might want to add a field to User model for this)
        # For now, we'll include it in the email and validate it when used
        
        # Send password reset email
        try:
            send_password_reset_email(user.email, user.full_name or 'User', reset_token)
            print(f"[SUCCESS] Password reset email sent to {user.email}")
        except Exception as email_error:
            print(f"[ERROR] Failed to send password reset email: {str(email_error)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": "Failed to send reset email. Please try again later."}), 500
        
        return jsonify({
            "success": True,
            "message": "If an account with that email exists, password reset instructions have been sent."
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to process password reset request: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to process request", "message": str(e)}), 500


@app.route("/api/public/set-password", methods=["POST", "OPTIONS"])
def public_set_password():
    """
    Set new password using reset token.
    Public endpoint - no authentication required.
    """
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        token = data.get('token', '').strip()
        email = data.get('email', '').strip().lower()
        new_password = data.get('password', '').strip()
        
        if not all([token, email, new_password]):
            return jsonify({"error": "Token, email, and password are required"}), 400
        
        if len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Invalid reset token or email"}), 400
        
        # In a production system, you'd validate the token against a stored value
        # For now, we'll accept any token for simplicity (you should improve this)
        
        # Hash the new password
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        print(f"[SUCCESS] Password reset completed for user {user.email}")
        
        return jsonify({
            "success": True,
            "message": "Password has been reset successfully. You can now log in with your new password."
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to set new password: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to reset password", "message": str(e)}), 500


def send_password_reset_email(to_email, user_name, reset_token):
    """
    Send password reset email to the user.
    Uses SMTP configuration from environment variables.
    """
    # Get SMTP configuration from environment variables (same as registration email)
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', 'bhagishruti1901@gmail.com')
    smtp_password = os.environ.get('SMTP_PASSWORD', 'zaff sbug ilsa jfsj')
    smtp_from_email = os.environ.get('SMTP_FROM_EMAIL', 'bhagishruti1901@gmail.com')
    app_name = os.environ.get('APP_NAME', 'RasayanaBio')
    
    # Get frontend URL from environment variable
    frontend_url = os.environ.get('FRONTEND_URL')
    
    if not frontend_url:
        # Try to detect server IP for local development
        try:
            import socket
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            frontend_url = f"http://{local_ip}:3000"
            print(f"[INFO] Auto-detected frontend URL: {frontend_url}")
            print(f"[IMPORTANT] For password reset to work on other devices:")
            print(f"[IMPORTANT] Set FRONTEND_URL in .env file:")
            print(f"[IMPORTANT] FRONTEND_URL=http://{local_ip}:3000")
        except:
            frontend_url = "http://localhost:3000"
            print(f"[WARNING] Could not detect IP. Using {frontend_url}")
            print(f"[IMPORTANT] For password reset to work on other devices:")
            print(f"[IMPORTANT] Set FRONTEND_URL in .env file:")
            print(f"[IMPORTANT] FRONTEND_URL=http://YOUR_IP_ADDRESS:3000")
    else:
        print(f"[INFO] Using FRONTEND_URL from environment: {frontend_url}")
    
    # Create password reset link
    reset_link = f"{frontend_url}/password-reset?token={reset_token}&act=reset_password&email={to_email}"
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['From'] = f"{app_name} <{smtp_from_email}>"
    msg['To'] = to_email
    msg['Subject'] = f'Password Reset - {app_name}'
    
    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #0c6a1f;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 5px 5px;
            }}
            .button {{
                display: inline-block;
                background-color: #0c6a1f;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #666;
                font-size: 14px;
            }}
            .contact-info {{
                margin-top: 15px;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1 style="margin: 0;">{app_name}</h1>
        </div>
        <div class="content">
            <h2 style="color: #0c6a1f; margin-top: 0;">Password Reset Request</h2>
            <p>Hello {user_name},</p>
            <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <div style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Your Password</a>
            </div>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 3px; font-family: monospace;">{reset_link}</p>
        </div>
        <div class="footer">
            <p>Thank you!<br>The {app_name} Team</p>
            <div class="contact-info">
                <p>If you have any problems, please contact us at {smtp_from_email}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_body = f"""
    Password Reset Request - {app_name}
    
    Hello {user_name},
    
    We received a request to reset your password. If you didn't make this request, you can ignore this email.
    
    To reset your password, click the following link:
    {reset_link}
    
    This link will expire in 24 hours for security reasons.
    
    Thank you!
    The {app_name} Team
    
    If you have any problems, please contact us at {smtp_from_email}
    """
    
    # Create message parts
    text_part = MIMEText(text_body, 'plain')
    html_part = MIMEText(html_body, 'html')
    
    msg.attach(text_part)
    msg.attach(html_part)
    
    # Send email
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)


@app.route('/static/uploads/<path:filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    upload_dir = os.path.join(os.getcwd(), 'static', 'uploads')
    return send_from_directory(upload_dir, filename)


def send_order_confirmation_email(order, order_items, customer_email):
    """
    Send order confirmation email to customer.
    """
    try:
        # Use the same SMTP configuration as registration emails
        smtp_server = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_username = os.environ.get('SMTP_USER', 'bhagishruti1901@gmail.com')
        smtp_password = os.environ.get('SMTP_PASSWORD', 'zaff sbug ilsa jfsj')
        from_email = os.environ.get('SMTP_FROM_EMAIL', smtp_username or 'bhagishruti1901@gmail.com')
        
        print(f"[DEBUG] Using SMTP server: {smtp_server}:{smtp_port}")
        print(f"[DEBUG] Using SMTP user: {smtp_username}")
        print(f"[DEBUG] From email: {from_email}")
        
        if not smtp_username or not smtp_password:
            print("[WARNING] SMTP credentials not configured. Email will not be sent.")
            print("[INFO] To enable emails, set SMTP_USER and SMTP_PASSWORD in .env file")
            return
        
        # Get customer name
        customer_name = order.shipping_address.split(',')[0] if order.shipping_address else 'Customer'
        if hasattr(order, 'user') and order.user:
            # Use full_name field instead of first_name and last_name
            customer_name = order.user.full_name.strip() if order.user.full_name else customer_name
        
        # Build email content
        subject = f"Order Confirmation - Order #{order.order_number} - RasayanaBio"
        
        # HTML email template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2d6a4f; color: white; padding: 20px; text-align: center; }}
                .header h1 {{ margin: 0; }}
                .content {{ background-color: #f9f9f9; padding: 20px; }}
                .order-info {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2d6a4f; }}
                .order-items {{ margin: 20px 0; }}
                .order-item {{ background-color: white; padding: 15px; margin: 10px 0; border: 1px solid #ddd; }}
                .order-item h3 {{ margin: 0 0 10px 0; color: #2d6a4f; }}
                .order-summary {{ background-color: white; padding: 20px; margin: 20px 0; }}
                .summary-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }}
                .summary-row.total {{ font-weight: bold; font-size: 1.2em; border-top: 2px solid #2d6a4f; margin-top: 10px; padding-top: 10px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .button {{ display: inline-block; background-color: #2d6a4f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>RasayanaBio</h1>
                    <p>Premium Health Products</p>
                </div>
                
                <div class="content">
                    <h2>Thank You for Your Order!</h2>
                    <p>Dear {customer_name},</p>
                    <p>We have received your order and are processing it. Your order details are below:</p>
                    
                    <div class="order-info">
                        <h3>Order Information</h3>
                        <p><strong>Order Number:</strong> #{order.order_number}</p>
                        <p><strong>Order Date:</strong> {order.created_at.strftime('%B %d, %Y at %I:%M %p') if order.created_at else 'N/A'}</p>
                        <p><strong>Order Status:</strong> {order.status.title()}</p>
                        <p><strong>Payment Status:</strong> {order.payment_status.title() if order.payment_status else 'Pending'}</p>
                    </div>
                    
                    <div class="order-items">
                        <h3>Order Items</h3>
        """
        
        # Add order items
        for item in order_items:
            html_content += f"""
                        <div class="order-item">
                            <h3>{item.product_name}</h3>
                            <p>Quantity: {item.quantity} × {order.currency} {item.unit_price:.2f}</p>
                            <p><strong>Subtotal: {order.currency} {item.total_price:.2f}</strong></p>
                        </div>
            """
        
        # Add order summary
        html_content += f"""
                    </div>
                    
                    <div class="order-summary">
                        <h3>Order Summary</h3>
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>{order.currency} {order.subtotal:.2f}</span>
                        </div>
        """
        
        if order.discount_amount > 0:
            html_content += f"""
                        <div class="summary-row">
                            <span>Discount:</span>
                            <span>-{order.currency} {order.discount_amount:.2f}</span>
                        </div>
            """
        
        if order.shipping_cost > 0:
            html_content += f"""
                        <div class="summary-row">
                            <span>Shipping:</span>
                            <span>{order.currency} {order.shipping_cost:.2f}</span>
                        </div>
            """
        
        if order.tax_amount > 0:
            html_content += f"""
                        <div class="summary-row">
                            <span>Tax (GST):</span>
                            <span>{order.currency} {order.tax_amount:.2f}</span>
                        </div>
            """
        
        html_content += f"""
                        <div class="summary-row total">
                            <span>Total Amount:</span>
                            <span>{order.currency} {order.total_amount:.2f}</span>
                        </div>
                    </div>
                    
                    <div class="order-info">
                        <h3>Shipping Address</h3>
                        <p>{order.shipping_address.replace(',', '<br>') if order.shipping_address else 'N/A'}</p>
                    </div>
                    
                    <p>We will send you another email once your order has been shipped.</p>
                    <p>If you have any questions, please contact us at <a href="mailto:support@rasayanabio.com">support@rasayanabio.com</a></p>
                    
                    <p>Thank you for choosing RasayanaBio!</p>
                    <p>Best regards,<br>The RasayanaBio Team</p>
                </div>
                
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>&copy; {datetime.now().year} RasayanaBio. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_content = f"""
Thank You for Your Order!

Dear {customer_name},

We have received your order and are processing it. Your order details are below:

Order Information:
- Order Number: #{order.order_number}
- Order Date: {order.created_at.strftime('%B %d, %Y at %I:%M %p') if order.created_at else 'N/A'}
- Order Status: {order.status.title()}
- Payment Status: {order.payment_status.title() if order.payment_status else 'Pending'}

Order Items:
"""
        
        for item in order_items:
            text_content += f"- {item.product_name} (Qty: {item.quantity}) - {order.currency} {item.total_price:.2f}\n"
        
        text_content += f"""
Order Summary:
- Subtotal: {order.currency} {order.subtotal:.2f}
"""
        
        if order.discount_amount > 0:
            text_content += f"- Discount: -{order.currency} {order.discount_amount:.2f}\n"
        
        if order.shipping_cost > 0:
            text_content += f"- Shipping: {order.currency} {order.shipping_cost:.2f}\n"
        
        if order.tax_amount > 0:
            text_content += f"- Tax (GST): {order.currency} {order.tax_amount:.2f}\n"
        
        text_content += f"""
- Total Amount: {order.currency} {order.total_amount:.2f}

Shipping Address:
{order.shipping_address if order.shipping_address else 'N/A'}

We will send you another email once your order has been shipped.
If you have any questions, please contact us at support@rasayanabio.com

Thank you for choosing RasayanaBio!

Best regards,
The RasayanaBio Team
"""
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = customer_email
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        print(f"[SUCCESS] Order confirmation email sent to {customer_email} for order #{order.order_number}")
        
    except Exception as e:
        print(f"[ERROR] Failed to send order confirmation email: {str(e)}")
        import traceback
        traceback.print_exc()
        raise  # Re-raise to be caught by caller


@app.route("/api/public/orders", methods=["POST", "OPTIONS"])
def public_create_order():
    """
    Public order creation endpoint for storefront.
    Creates order in orders table and order items in order_items table.
    REQUIRES USER TO BE LOGGED IN - no guest orders allowed.
    """
    if request.method == "OPTIONS":
        # Handle CORS preflight
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response, 200
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Get user_id from request or from JWT token (REQUIRED)
        user_id = data.get('user_id')
        
        # Try to get from JWT token (if user is logged in)
        try:
            from flask_jwt_extended import get_jwt_identity
            jwt_user_id = get_jwt_identity()
            if jwt_user_id and isinstance(jwt_user_id, str) and jwt_user_id.startswith('user_'):
                jwt_user_id = int(jwt_user_id.replace('user_', ''))
                if not user_id:
                    user_id = jwt_user_id
        except:
            pass  # JWT might not be present
        
        # If user_id still not found, try to find by email
        if not user_id and data.get('customer_email'):
            try:
                user = User.query.filter_by(email=data.get('customer_email').lower().strip()).first()
                if user:
                    user_id = user.id
            except:
                pass
        
        # REQUIRE USER TO BE LOGGED IN - reject guest orders
        if not user_id:
            return jsonify({
                "error": "You must be logged in to place an order. Please register or login first."
            }), 401
        
        # Verify user exists and is active
        try:
            user = User.query.filter_by(id=user_id).first()
            if not user:
                return jsonify({"error": "User not found. Please login again."}), 401
            if not user.is_active:
                return jsonify({"error": "Your account is disabled. Please contact support."}), 403
        except Exception as user_check_error:
            print(f"[ERROR] Failed to verify user: {str(user_check_error)}")
            return jsonify({"error": "Failed to verify user. Please login again."}), 401
        
        # Validate required fields
        if not data.get('items') or len(data.get('items', [])) == 0:
            return jsonify({"error": "Order must have at least one item"}), 400
        
        # Calculate totals from items
        subtotal = 0.0
        items_data = []
        for item in data.get('items', []):
            # Handle different item formats (frontend sends 'price', backend expects 'unit_price')
            product_id = item.get('product_id') or item.get('id')
            product_name = item.get('product_name') or item.get('name', '')
            quantity = int(item.get('quantity', 1))
            # Frontend sends 'price', backend uses 'unit_price'
            unit_price = float(item.get('unit_price') or item.get('price', 0))
            discount_amount_item = float(item.get('discount_amount', 0))
            group_discount_item = float(item.get('group_discount', 0))
            # Calculate total_price if not provided
            total_price_item = float(item.get('total_price') or item.get('subtotal', (unit_price * quantity) - discount_amount_item - group_discount_item))
            
            if not product_id:
                return jsonify({"error": "product_id is required for all items"}), 400
            
            subtotal += total_price_item
            items_data.append({
                'product_id': product_id,
                'product_name': product_name,
                'quantity': quantity,
                'unit_price': unit_price,
                'discount_amount': discount_amount_item,
                'group_discount': group_discount_item,
                'total_price': total_price_item,
                'currency': item.get('currency', 'INR'),
                'reward_points_earned': int(item.get('reward_points_earned', 0))
            })
        
        # Get other order fields (support both formats)
        discount_amount = float(data.get('discount_amount', 0.0))
        coupon_discount = float(data.get('coupon_discount', 0.0))
        group_discount = float(data.get('group_discount', 0.0))
        wallet_used = float(data.get('wallet_used', 0.0))
        reward_points_used = int(data.get('reward_points_used', 0))
        
        # Calculate shipping cost (frontend might send shipping_method, we calculate from it)
        shipping_cost = float(data.get('shipping_cost') or data.get('shipping', 0.0))
        if shipping_cost == 0 and data.get('shipping_method'):
            # Default shipping cost based on method
            if data.get('shipping_method') == 'flat_rate':
                shipping_cost = 1.00
            else:
                shipping_cost = 0.0
        
        # Calculate tax amount (if not provided, calculate from subtotal + shipping)
        tax_amount = float(data.get('tax_amount') or data.get('tax', 0.0))
        if tax_amount == 0:
            # Calculate GST (CGST + SGST = 18% total)
            taxable_amount = subtotal + shipping_cost
            tax_amount = taxable_amount * 0.18  # 9% CGST + 9% SGST
        
        # Calculate total
        total_amount = subtotal - discount_amount - coupon_discount - group_discount - wallet_used + shipping_cost + tax_amount
        
        # Get currency (support both currency and currency_symbol)
        currency = data.get('currency', 'INR')
        if not currency or currency == 'INR':
            currency_symbol = data.get('currency_symbol', '₹')
            if currency_symbol == '₹':
                currency = 'INR'
            elif currency_symbol == '$':
                currency = 'USD'
            elif currency_symbol == '€':
                currency = 'EUR'
        
        # Get addresses
        shipping_address = data.get('shipping_address') or data.get('shippingAddress', '')
        billing_address = data.get('billing_address') or data.get('billingAddress') or shipping_address
        
        # Generate order number
        order_number = generate_order_number()
        
        # Create order
        order = Order(
            order_number=order_number,
            user_id=user_id,  # Can be None for guest orders
            status=data.get('status', 'pending'),
            subtotal=subtotal,
            discount_amount=discount_amount,
            coupon_discount=coupon_discount,
            group_discount=group_discount,
            wallet_used=wallet_used,
            reward_points_used=reward_points_used,
            shipping_cost=shipping_cost,
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency=currency,
            country_code=data.get('country_code'),
            coupon_code=data.get('coupon_code'),
            payment_method=data.get('payment_method') or data.get('paymentMethod', 'pending'),
            payment_status=data.get('payment_status') or data.get('paymentStatus', 'pending'),
            shipping_address=shipping_address,
            billing_address=billing_address,
            notes=data.get('notes') or data.get('order_notes')
        )
        
        db.session.add(order)
        db.session.flush()  # Get order ID without committing
        
        # Create order items
        order_items = []
        for item_data in items_data:
            item = OrderItem(
                order_id=order.id,
                product_id=item_data['product_id'],
                product_name=item_data['product_name'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                discount_amount=item_data['discount_amount'],
                group_discount=item_data['group_discount'],
                total_price=item_data['total_price'],
                currency=item_data['currency'],
                reward_points_earned=item_data['reward_points_earned']
            )
            db.session.add(item)
            order_items.append(item)
        
        # Commit the transaction
        db.session.commit()
        
        print(f"[SUCCESS] Created order {order.id} (order_number: {order.order_number}) with {len(order_items)} items")
        
        # Track analytics if order is paid
        if order.payment_status and order.payment_status.lower() == 'paid':
            track_order_analytics(order)
        
        # Send order confirmation email
        try:
            customer_email = data.get('customer_email') or (user.email if user else None)
            print(f"[DEBUG] Order created for user {user_id}, checking email...")
            print(f"[DEBUG] customer_email from data: {data.get('customer_email')}")
            print(f"[DEBUG] user.email: {user.email if user else 'No user object'}")
            print(f"[DEBUG] Final customer_email: {customer_email}")
            
            if customer_email:
                print(f"[DEBUG] Attempting to send order confirmation email to: {customer_email}")
                send_order_confirmation_email(order, order_items, customer_email)
                print(f"[SUCCESS] Order confirmation email process completed for {customer_email}")
            else:
                print(f"[WARNING] No email found for order {order.id}, skipping email notification")
                print(f"[DEBUG] Available data keys: {list(data.keys())}")
        except Exception as email_error:
            print(f"[ERROR] Failed to send order confirmation email: {str(email_error)}")
            import traceback
            traceback.print_exc()
            # Don't fail the order if email fails
        
        # Return success response
        return jsonify({
            "success": True,
            "message": "Order created successfully",
            "order": {
                "id": order.id,
                "order_number": order.order_number,
                "total_amount": float(order.total_amount),
                "currency": order.currency,
                "status": order.status,
                "payment_status": order.payment_status,
                "items_count": len(order_items)
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Failed to create order: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to create order", "message": str(e)}), 500


# ==================== MAIN ====================

if __name__ == '__main__':
    # Initialize database
    init_database()
    
    # Run app
    app.run(host='0.0.0.0', port=8800, debug=True)