from flask import Flask,request,session,flash,jsonify
from flask_cors import CORS
import psycopg2
import bcrypt
from dotenv import load_dotenv
load_dotenv()
import os
import random
from psycopg2.extras import RealDictCursor
import secrets
from helper.generate_token import generate_refresh_token,decode_token,generate_access_token



import jwt
from datetime import datetime, timedelta


app = Flask(__name__)
app.secret_key = 'MY_SECRET_KEY'

frontend_origin = ["http://localhost:5173"]
CORS(app,supports_credentials=True,origins=frontend_origin)

JWT_SECRET = os.getenv("JWT_KEY", "MY_SECRET_KEY")  # store this in .env
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_MINUTES = 60



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


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')


    try:
        if not all([email,password]):
            return jsonify({"message":"Both Email and Password are required"}),404
        
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT hash_password FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"message": "User not found"}), 404

        hash_password = user['hash_password'].encode('utf-8') if isinstance(user['hash_password'], str) else user['hash_password']

        if bcrypt.checkpw(password.encode('utf-8'), hash_password):
            access_token = generate_access_token(email)
            refresh_token = generate_refresh_token(email)

            response = jsonify({"message": "Login successful", "access_token": access_token})
            response.set_cookie(
                'refresh_token',
                refresh_token,
                httponly=True,
                secure=True,  # Set False for localhost dev; True for production
                samesite='None',
                max_age=7 * 24 * 60 * 60  # 7 days
            )
            response.set_cookie(
                'access_token',
                access_token,
                httponly=True,
                secure=True,  # Set False for localhost dev; True for production
                samesite='None',
                max_age= 15  * 60  # 15 minutes
            )
            
            return response
        else:
            return jsonify({"message": "Incorrect password"}), 401

    except Exception as e:
        return jsonify({"message": "Database error", "error": str(e)}), 500

    finally:
        cursor.close()
        db.close()



@app.route('/refresh', methods=['POST'])
def refresh():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({"message": "Refresh token missing"}), 401

    decoded = decode_token(refresh_token, is_refresh=True)
    if not decoded:
        return jsonify({"message": "Invalid or expired refresh token"}), 401

    new_access_token = generate_access_token(decoded['email'])
    response = jsonify({"access_token": new_access_token}) 
    response.set_cookie(    
        'access_token',
        new_access_token,
        httponly=True,
        secure=True,  # Set False for localhost dev; True for production
        samesite='None',
        max_age= 15  * 60  # 15 minutes
    )  
    return response




@app.route('/signup', methods=['POST'])
def signup():
    if request.is_json:
        data = request.get_json()
        firstname = data.get('firstname')
        lastname = data.get('lastname')
        email = data.get('email')
        password = data.get('password')
        confirmpassword = data.get('confirmpassword')
    else:
        return jsonify({"message": "Request must be JSON", "status": "error"}), 400

    if not all([firstname, lastname, email, password, confirmpassword]):
        return jsonify({"message": "All fields are required", "status": "error"}), 400

    if password != confirmpassword:
        return jsonify({"message": "Passwords do not match", "status": "error"}), 400

    try:
        hashword = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        cursor.execute("SELECT email FROM login_users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "Email already exists", "status": "error"}), 409

        cursor.execute(
            "INSERT INTO login_users (first_name, last_name, email, hash_password) VALUES (%s, %s, %s, %s)",
            (firstname, lastname, email, hashword)
        )
        db.commit()
        return jsonify({"message": "Signup successful", "status": "success"}), 201

    except psycopg2.Error as e:
        return jsonify({"message": "Database error", "error": str(e), "status": "error"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful", "status": "success"}), 200





if __name__ == '__main__':
    app.run(debug=True)