from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import sqlite3
import jwt
import datetime
import bcrypt
import os

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

SECRET_KEY = "supersecretkey"  # Use env variable in production
DB_NAME = "bank.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    # Create users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 customer_id TEXT UNIQUE,
                 customer_name TEXT,
                 email TEXT,
                 password TEXT,
                 balance REAL DEFAULT 1000.0)''')
    # Create tokens table
    c.execute('''CREATE TABLE IF NOT EXISTS tokens (
                 token_id INTEGER PRIMARY KEY AUTOINCREMENT,
                 token_value TEXT,
                 customer_id TEXT,
                 expiry_time INTEGER,
                 created_at DATETIME DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()

@app.route('/')
def home():
    return "Kodbank Backend (Python/Flask) is Running. Access the frontend at http://localhost:5173"

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    customer_id = data.get('customer_id')
    customer_name = data.get('customer_name')
    email = data.get('email')
    password = data.get('password')

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    conn = get_db_connection()
    try:
        conn.execute("INSERT INTO users (customer_id, customer_name, email, password, balance) VALUES (?, ?, ?, ?, ?)",
                     (customer_id, customer_name, email, hashed_password, 1000.0))
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Customer ID already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    customer_id = data.get('customer_id')
    password = data.get('password')

    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE customer_id = ?", (customer_id,)).fetchone()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        expiry_time = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        token = jwt.encode({
            'customer_id': customer_id,
            'id': user['id'],
            'exp': expiry_time
        }, SECRET_KEY, algorithm="HS256")
        
        # In Python 3, jwt.encode returns a string (PyJWT >= 2.0.0)
        
        expiry_timestamp = int(expiry_time.timestamp() * 1000)
        
        try:
            conn.execute("INSERT INTO tokens (token_value, customer_id, expiry_time) VALUES (?, ?, ?)",
                         (token, customer_id, expiry_timestamp))
            conn.commit()
            
            resp = make_response(jsonify({"message": "Login successful", "customer_name": user['customer_name']}))
            # max_age in seconds
            resp.set_cookie('token', token, httponly=True, max_age=3600)
            return resp
        except Exception as e:
            return jsonify({"error": "Token storage failed: " + str(e)}), 500
        finally:
            conn.close()
    
    conn.close()
    return jsonify({"error": "Invalid credentials"}), 401

def authenticate(f):
    def wrapper(*args, **kwargs):
        token = request.cookies.get('token')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401
        
        try:
            # Verify JWT signature
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            
            # Verify token in DB
            conn = get_db_connection()
            token_record = conn.execute("SELECT * FROM tokens WHERE token_value = ?", (token,)).fetchone()
            conn.close()
            
            if not token_record:
                return jsonify({"error": "Token invalid or expired"}), 403
            
            # Check expiry time from DB (optional as JWT handles it but requested)
            if token_record['expiry_time'] < int(datetime.datetime.utcnow().timestamp() * 1000):
                 return jsonify({"error": "Token expired"}), 403

            request.user = decoded
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 403
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 403
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    wrapper.__name__ = f.__name__
    return wrapper

@app.route('/balance', methods=['GET'])
@authenticate
def get_balance():
    conn = get_db_connection()
    user = conn.execute("SELECT balance FROM users WHERE customer_id = ?", (request.user['customer_id'],)).fetchone()
    conn.close()
    if user:
        return jsonify({"balance": user['balance']})
    return jsonify({"error": "User not found"}), 404

@app.route('/transfer', methods=['POST'])
@authenticate
def transfer():
    data = request.get_json()
    to_customer_id = data.get('to_customer_id')
    try:
        amount = float(data.get('amount'))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400
        
    from_customer_id = request.user['customer_id']
    
    if amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400
        
    conn = get_db_connection()
    try:
        sender = conn.execute("SELECT balance FROM users WHERE customer_id = ?", (from_customer_id,)).fetchone()
        if not sender or sender['balance'] < amount:
            return jsonify({"error": "Insufficient funds"}), 400
            
        receiver = conn.execute("SELECT customer_id FROM users WHERE customer_id = ?", (to_customer_id,)).fetchone()
        if not receiver:
            return jsonify({"error": "Recipient not found"}), 404
            
        conn.execute("UPDATE users SET balance = balance - ? WHERE customer_id = ?", (amount, from_customer_id))
        conn.execute("UPDATE users SET balance = balance + ? WHERE customer_id = ?", (amount, to_customer_id))
        conn.commit()
        
        return jsonify({"message": "Transfer successful"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/users', methods=['GET'])
def get_users():
    conn = get_db_connection()
    users = conn.execute("SELECT id, customer_id, customer_name, email, balance FROM users").fetchall()
    conn.close()
    
    users_list = [dict(user) for user in users]
    return jsonify(users_list)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
