from flask import Flask, request, session, jsonify
from flask_cors import CORS
import psycopg2
import bcrypt
from dotenv import load_dotenv
import os
from psycopg2.extras import RealDictCursor
from helper.generate_token import generate_refresh_token, decode_token, generate_access_token

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "MY_SECRET_KEY")

# Allowed frontend origins
frontend_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://q0smnp61-5000.uks1.devtunnels.ms"
]

# CORS setup
CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": frontend_origins}},
    expose_headers=["Set-Cookie"],
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"]
)

JWT_SECRET = os.getenv("JWT_KEY", "MY_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_MINUTES = 60

# ---------- DATABASE CONNECTION ----------
def database_connection():
    try:
        return psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            dbname=os.getenv('DB_NAME')
        )
    except psycopg2.Error as e:
        print("Database connection failed:", e)
        raise

# ---------- COOKIE SETTINGS ----------
def get_cookie_settings():
    """Dynamic cookie settings for local vs production."""
    secure_cookie = False if "localhost" in request.host else True
    samesite_cookie = "Lax" if "localhost" in request.host else "None"
    return secure_cookie, samesite_cookie

# ---------- SIGNUP ----------
@app.route('/signup', methods=['POST'])
def signup():
    if not request.is_json:
        return jsonify({"message": "Request must be JSON", "status": "error", "user": None}), 400

    data = request.get_json()
    firstname = data.get('firstname')
    lastname = data.get('lastname')
    email = data.get('email')
    password = data.get('password')
    confirmpassword = data.get('confirmpassword')

    if not all([firstname, lastname, email, password, confirmpassword]):
        return jsonify({"message": "All fields are required", "status": "error", "user": None}), 400
    if password != confirmpassword:
        return jsonify({"message": "Passwords do not match", "status": "error", "user": None}), 400

    try:
        hashword = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        cursor.execute("SELECT email FROM login_users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "Email already exists", "status": "error", "user": None}), 409

        cursor.execute(
            "INSERT INTO login_users (first_name, last_name, email, hash_password) VALUES (%s, %s, %s, %s)",
            (firstname, lastname, email, hashword)
        )
        db.commit()

        access_token = generate_access_token(email)
        refresh_token = generate_refresh_token(email)
        secure_cookie, samesite_cookie = get_cookie_settings()

        user = {"first_name": firstname, "last_name": lastname, "email": email}
        response = jsonify({"message": "Signup successful", "status": "success", "user": user})

        response.set_cookie(
            'refresh_token',
            refresh_token,
            httponly=True,
            secure=secure_cookie,
            samesite=samesite_cookie,
            max_age=7 * 24 * 60 * 60
        )
        response.set_cookie(
            'access_token',
            access_token,
            httponly=True,
            secure=secure_cookie,
            samesite=samesite_cookie,
            max_age=15 * 60
        )
        return response, 201

    except psycopg2.Error as e:
        return jsonify({"message": "Database error", "error": str(e), "status": "error", "user": None}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()

# ---------- LOGIN ----------
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({"message": "Both Email and Password are required"}), 400

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT hash_password FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 404

        hash_password = user['hash_password'].encode('utf-8') if isinstance(user['hash_password'], str) else user['hash_password']
        if not bcrypt.checkpw(password.encode('utf-8'), hash_password):
            return jsonify({"message": "Incorrect password"}), 401

        access_token = generate_access_token(email)
        refresh_token = generate_refresh_token(email)
        secure_cookie, samesite_cookie = get_cookie_settings()

        response = jsonify({"message": "Login successful", "access_token": access_token})
        response.set_cookie('refresh_token', refresh_token, httponly=True, secure=secure_cookie, samesite=samesite_cookie, max_age=7*24*60*60)
        response.set_cookie('access_token', access_token, httponly=True, secure=secure_cookie, samesite=samesite_cookie, max_age=15*60)
        return response

    except Exception as e:
        return jsonify({"message": "Database error", "error": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()

# ---------- REFRESH ----------
@app.route('/refresh', methods=['POST'])
def refresh():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({"message": "Refresh token missing"}), 401

    decoded = decode_token(refresh_token, is_refresh=True)
    if not decoded:
        return jsonify({"message": "Invalid or expired refresh token"}), 401

    new_access_token = generate_access_token(decoded['email'])
    secure_cookie, samesite_cookie = get_cookie_settings()
    response = jsonify({"access_token": new_access_token})
    response.set_cookie('access_token', new_access_token, httponly=True, secure=secure_cookie, samesite=samesite_cookie, max_age=15*60)
    return response

# ---------- LOGOUT ----------
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    secure_cookie, samesite_cookie = get_cookie_settings()
    response = jsonify({"message": "Logout successful", "status": "success"})
    response.set_cookie('access_token', '', expires=0, secure=secure_cookie, samesite=samesite_cookie)
    response.set_cookie('refresh_token', '', expires=0, secure=secure_cookie, samesite=samesite_cookie)
    return response

# ---------- CURRENT USER ----------
@app.route('/me', methods=['GET'])
def me():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No token", "user": None}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid token", "user": None}), 401

    email = decoded.get('email')
    db = database_connection()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT first_name, last_name, email FROM login_users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    db.close()

    if user:
        return jsonify({"user": user}), 200
    return jsonify({"user": None}), 404

# ---------- RUN ----------
if __name__ == '__main__':
    app.run(debug=True)
