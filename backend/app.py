import os
import json
from datetime import timedelta
from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
import bcrypt
import redis
from dotenv import load_dotenv
# Import shared modules
from shared.database import db
from shared.utils import success_response, error_response
load_dotenv()
app = Flask(__name__)

# -----------------
# PRODUCTION CONFIG
# -----------------
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL', 
    'postgresql://user:password@localhost:5432/storefront'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': int(os.environ.get('DB_POOL_RECYCLE', 300)),
    'pool_size': int(os.environ.get('DB_POOL_SIZE', 10)),
    'max_overflow': int(os.environ.get('DB_MAX_OVERFLOW', 20)),
}

app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
jwt_expires_seconds = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_SECONDS', 86400))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=jwt_expires_seconds)

# Enable CORS for production & dev frontend origins
allowed_origins_raw = os.environ.get('CORS_ALLOWED_ORIGINS', '*')
allowed_origins = [o.strip() for o in allowed_origins_raw.split(',')] if ',' in allowed_origins_raw else allowed_origins_raw
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Initialize DB & JWT
db.init_app(app)
jwt = JWTManager(app)

# Resilient Redis Client
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
try:
    redis_client = redis.StrictRedis.from_url(
        redis_url, 
        decode_responses=True, 
        socket_timeout=2, 
        socket_connect_timeout=2
    )
except Exception as e:
    app.logger.warning(f"Failed to initialize Redis client: {e}")
    redis_client = None


def safe_redis_get(key):
    try:
        if redis_client:
            return redis_client.get(key)
    except Exception as e:
        app.logger.warning(f"Redis get failed for key '{key}': {e}")
    return None


def safe_redis_setex(key, time, value):
    try:
        if redis_client:
            redis_client.setex(key, time, value)
    except Exception as e:
        app.logger.warning(f"Redis setex failed for key '{key}': {e}")


def safe_redis_flush():
    try:
        if redis_client:
            redis_client.flushdb()
    except Exception as e:
        app.logger.warning(f"Redis flush failed: {e}")


# -----------------
# MODELS
# -----------------

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())


class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(500))
    category = db.Column(db.String(100), nullable=False)
    stock_quantity = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image_url': self.image_url,
            'category': self.category,
            'stock_quantity': self.stock_quantity
        }


class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    product_id = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, server_default=db.func.now())


class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False, index=True)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Pending')  # Pending, Confirmed, Shipped, Delivered
    created_at = db.Column(db.DateTime, server_default=db.func.now())


class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)


# Initialize DB Schema safely
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        app.logger.error(f"Error creating database tables: {e}")


# -----------------
# HEALTH CHECK
# -----------------
@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    db_status = "ok"
    try:
        db.session.execute(db.text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    redis_status = "ok"
    try:
        if redis_client:
            redis_client.ping()
        else:
            redis_status = "disabled"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"

    status_code = 200 if db_status == "ok" else 503
    return {
        'status': 'healthy' if status_code == 200 else 'unhealthy',
        'database': db_status,
        'redis': redis_status
    }, status_code


# -----------------
# ROUTES
# -----------------

# -- Identity / Auth --
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return error_response('Missing required fields')
    
    if User.query.filter_by(email=data['email']).first():
        return error_response('Email already registered')
        
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    
    new_user = User(
        name=data['name'], 
        email=data['email'], 
        password_hash=hashed_password.decode('utf-8')
    )
    db.session.add(new_user)
    db.session.commit()
    
    return success_response({
        'user': {'id': new_user.id, 'name': new_user.name, 'email': new_user.email}
    }, 'User registered successfully', 201)


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return error_response('Missing email or password')
        
    user = User.query.filter_by(email=data['email']).first()
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return error_response('Invalid email or password', 401)
        
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return success_response({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {'id': user.id, 'name': user.name, 'email': user.email}
    }, 'Login successful')


@app.route('/api/users/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', 404)
        
    if request.method == 'GET':
        return success_response({
            'user': {'id': user.id, 'name': user.name, 'email': user.email}
        })
        
    elif request.method == 'PUT':
        data = request.get_json()
        if data.get('name'):
            user.name = data['name']
        db.session.commit()
        return success_response({
            'user': {'id': user.id, 'name': user.name, 'email': user.email}
        }, 'Profile updated')


# -- Catalog / Products --
@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    search = request.args.get('search')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    cache_key = f"products:cat:{category}:search:{search}:p:{page}:pp:{per_page}"
    cached = safe_redis_get(cache_key)
    if cached:
        return success_response(json.loads(cached), "Products retrieved from cache")

    query = Product.query
    if category:
        query = query.filter(Product.category == category)
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))
        
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    data = {
        'items': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }
    
    safe_redis_setex(cache_key, 60, json.dumps(data))
    return success_response(data, "Products retrieved")


@app.route('/api/products/<int:id>', methods=['GET'])
def get_product(id):
    cached = safe_redis_get(f"product:{id}")
    if cached:
        return success_response(json.loads(cached), "Product retrieved from cache")
        
    product = Product.query.get(id)
    if not product:
        return error_response('Product not found', 404)
        
    data = product.to_dict()
    safe_redis_setex(f"product:{id}", 300, json.dumps(data))
    return success_response(data, "Product retrieved")


@app.route('/api/categories', methods=['GET'])
def get_categories():
    cached = safe_redis_get('categories')
    if cached:
        return success_response(json.loads(cached), "Categories retrieved from cache")
        
    categories = db.session.query(Product.category).distinct().all()
    data = [c[0] for c in categories if c[0]]
    
    safe_redis_setex('categories', 3600, json.dumps(data))
    return success_response(data, "Categories retrieved")


@app.route('/api/products/seed', methods=['POST'])
def seed_products():
    if Product.query.count() > 0:
        return success_response(None, "Products already seeded")
        
    categories = ['Electronics', 'Audio', 'Gaming', 'Productivity', 'Accessories']
    for i in range(1, 51):
        cat = categories[i % len(categories)]
        product = Product(
            name=f"Premium {cat} Item {i}",
            description=f"This is a fantastic product in the {cat} category with high-end features.",
            price=99.99 + (i * 10),
            image_url=f"https://picsum.photos/seed/{i}/400/400",
            category=cat,
            stock_quantity=100
        )
        db.session.add(product)
    
    db.session.commit()
    safe_redis_flush()
    return success_response(None, "Seeded 50 products")


# -- Commerce / Cart & Orders --
@app.route('/api/cart', methods=['GET', 'POST'])
@jwt_required()
def cart():
    user_id = int(get_jwt_identity())
    
    if request.method == 'GET':
        items = CartItem.query.filter_by(user_id=user_id).all()
        return success_response([{
            'id': item.id,
            'product_id': item.product_id,
            'quantity': item.quantity
        } for item in items])
        
    elif request.method == 'POST':
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        if not product_id:
            return error_response('Product ID required')
            
        existing = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            existing.quantity += quantity
        else:
            new_item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
            db.session.add(new_item)
            
        db.session.commit()
        return success_response(None, 'Item added to cart')


@app.route('/api/cart/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_cart(id):
    user_id = int(get_jwt_identity())
    item = CartItem.query.filter_by(id=id, user_id=user_id).first()
    
    if not item:
        return error_response('Item not found', 404)
        
    if request.method == 'PUT':
        data = request.get_json()
        item.quantity = data.get('quantity', item.quantity)
        db.session.commit()
        return success_response(None, 'Item updated')
        
    elif request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return success_response(None, 'Item removed')


@app.route('/api/orders', methods=['GET', 'POST'])
@jwt_required()
def orders():
    user_id = int(get_jwt_identity())
    
    if request.method == 'GET':
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        return success_response([{
            'id': o.id, 'total_amount': o.total_amount, 'status': o.status, 'created_at': o.created_at
        } for o in orders])
        
    elif request.method == 'POST':
        cart_items = CartItem.query.filter_by(user_id=user_id).all()
        if not cart_items:
            return error_response('Cart is empty', 400)
            
        data = request.get_json()
        
        new_order = Order(user_id=user_id, total_amount=data.get('total_amount', 0))
        db.session.add(new_order)
        db.session.flush() 
        
        for item in cart_items:
            order_item = OrderItem(order_id=new_order.id, product_id=item.product_id, quantity=item.quantity, price=0)
            db.session.add(order_item)
            db.session.delete(item)
            
        db.session.commit()
        return success_response({'order_id': new_order.id}, 'Order placed successfully')


@app.route('/api/orders/<int:id>', methods=['GET'])
@jwt_required()
def get_order(id):
    user_id = int(get_jwt_identity())
    order = Order.query.filter_by(id=id, user_id=user_id).first()
    if not order:
        return error_response('Order not found', 404)
        
    items = OrderItem.query.filter_by(order_id=order.id).all()
    return success_response({
        'id': order.id,
        'total_amount': order.total_amount,
        'status': order.status,
        'created_at': order.created_at,
        'items': [{'product_id': i.product_id, 'quantity': i.quantity, 'price': i.price} for i in items]
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
