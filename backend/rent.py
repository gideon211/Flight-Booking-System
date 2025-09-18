from flask import Flask,render_template,redirect,request,session,url_for,flash,jsonify
from flask_cors import CORS
import psycopg2
import bcrypt
from dotenv import load_dotenv
load_dotenv()
import os

app = Flask(__name__)
app.secret_key = 'MY_SECRET_KEY'
CORS(app,supports_credentials=True)



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


@app.route('/', methods=['POST'])
def login():
    if request.is_json:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
    else:
        return jsonify({"message": "Request must be JSON", "status": "error"}), 400

    if not email or not password:
        return jsonify({"message": "Email and password are required", "status": "error"}), 400

    try:
        db = database_connection()
        cursor = db.cursor()

        cursor.execute("SELECT hash_password FROM login_users WHERE email = %s", (email,))
        result = cursor.fetchone()

        if not result:
            return jsonify({"message": "User not found", "status": "error"}), 404

        hash_password = result[0]
        if isinstance(hash_password, str):
            hash_password = hash_password.encode('utf-8')

        if bcrypt.checkpw(password.encode('utf-8'), hash_password):
            session['email'] = email
            return jsonify({"message": "Login successful", "status": "success"}), 200
        else:
            return jsonify({"message": "Incorrect password", "status": "error"}), 401

    except psycopg2.Error as e:
        return jsonify({"message": "Database error", "error": str(e), "status": "error"}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


@app.route('/signup', methods=['POST'])
def signup():
    if request.is_json:
        data = request.get_json()
        firstname = data.get('firstname')
        lastname = data.get('lastname')
        email = data.get('email')
        password = data.get('password')
        userword = data.get('userword')
    else:
        return jsonify({"message": "Request must be JSON", "status": "error"}), 400

    if not all([firstname, lastname, email, password, userword]):
        return jsonify({"message": "All fields are required", "status": "error"}), 400

    if password != userword:
        return jsonify({"message": "Passwords do not match", "status": "error"}), 400

    try:
        hashword = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        db = database_connection()
        cursor = db.cursor()

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