from flask import Flask, request, session, jsonify
from flask_cors import CORS
import psycopg2
import bcrypt
from dotenv import load_dotenv
import os
from psycopg2.extras import RealDictCursor
from helper.generate_token import generate_refresh_token, decode_token, generate_access_token


import jwt
from datetime import datetime, timedelta
import requests
import json


load_dotenv()


app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "MY_SECRET_KEY")


API_KEY = os.getenv("API_KEY")


frontend_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://q0smnp61-5000.uks1.devtunnels.ms"
]


CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": frontend_origins}},
    expose_headers=["Set-Cookie"],
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
)

JWT_SECRET = os.getenv("JWT_KEY", "MY_SECRET_KEY")  
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_MINUTES = 60


# Ensure admin-related columns exist on startup
def ensure_admin_columns():
    try:
        db = database_connection()
        cursor = db.cursor()
        cursor.execute("""
            ALTER TABLE login_users
            ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
        """)
        cursor.execute("""
            ALTER TABLE login_users
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;
        """)
        cursor.execute("""
            ALTER TABLE login_users
            ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'active';
        """)
        db.commit()
    except Exception:
        # Silent fail to avoid blocking app start; operational errors will surface on use
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        try:
            db.close()
        except Exception:
            pass

ensure_admin_columns()


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



def get_cookie_settings():
    is_local = ("localhost" in request.host) or ("127.0.0.1" in request.host)
    secure_cookie = False if is_local else True
    samesite_cookie = "Lax" if is_local else "None"
    return secure_cookie, samesite_cookie


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

        access_token = generate_access_token(email,role='user')
        refresh_token = generate_refresh_token(email,role='user')
        secure_cookie, samesite_cookie = get_cookie_settings()

        user = {"first_name": firstname, "last_name": lastname, "email": email}
        response = jsonify({"message": "Signup successful", "status": "success", "user": user})

        response.set_cookie(
            'refresh_token',
            refresh_token,
            httponly=True, 
            secure=True,
            samesite='None',
            max_age=7 * 24 * 60 * 60
        )
        response.set_cookie(
            'access_token',
            access_token,
            httponly=True,
            secure=True,
            samesite='None',
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
        cursor.execute("SELECT hash_password,role,email FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"message": "User not found"}), 404

        hash_password = user['hash_password'].encode('utf-8') if isinstance(user['hash_password'], str) else user['hash_password']
        
        if not bcrypt.checkpw(password.encode('utf-8'), hash_password):
            return jsonify({"message": "Incorrect password"}), 404

        role = user.get('role','user')

        # Track last login for admins and superadmins
        try:
            cursor.execute("""
                UPDATE login_users SET last_login = NOW()
                WHERE email = %s AND role IN ('admin','superadmin')
            """, (email,))
            db.commit()
        except Exception:
            db.rollback()
        
        access_token = generate_access_token(email,role)
        refresh_token = generate_refresh_token(email,role)
        secure_cookie, samesite_cookie = get_cookie_settings()

        response = jsonify({"message": "Login successful",
                            "access_token": access_token,
                           "user":{
                               "email":user["email"],
                               "role":role
                           }})

        
        
        response.set_cookie('refresh_token', refresh_token,
                            httponly=True, 
                            secure=True, 
                            samesite='None',
                            max_age=7*24*60*60
                            )
        
        response.set_cookie('access_token', access_token,
                            httponly=True, 
                            secure=True, 
                            samesite='None', 
                            max_age=15*60
                            )
        return response

    except Exception as e:
        return jsonify({"message": "Database error", "error": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


@app.route('/refresh', methods=['POST'])
def refresh():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({"message": "Refresh token missing"}), 401

    decoded = decode_token(refresh_token, is_refresh=True)
    if not decoded:
        return jsonify({"message": "Invalid or expired refresh token"}), 401

    new_access_token = generate_access_token(decoded['email'],decoded['role'])
    secure_cookie, samesite_cookie = get_cookie_settings()
    response = jsonify({"access_token": new_access_token})
    response.set_cookie('access_token', new_access_token,
                        httponly=True, 
                        secure=True, 
                        samesite='None',
                        max_age=15*60
                        )
    return response


@app.route('/logout', methods=['POST'])
def logout():
    secure_cookie, samesite_cookie = get_cookie_settings()
    response = jsonify({"message": "Logout successful", "status": "success"})

    response.set_cookie('access_token', '', expires=0, httponly=True, secure=secure_cookie, samesite=samesite_cookie, path='/')
    response.set_cookie('refresh_token', '', expires=0, httponly=True, secure=secure_cookie, samesite=samesite_cookie, path='/')
    return response, 200



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
    cursor.execute("SELECT first_name, last_name, email,role FROM login_users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    db.close()

    if user:
        return jsonify({"user": user}), 200
    return jsonify({"user": None}), 404





@app.route("/admin/flights", methods=["POST"])
def create_flight():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message":"No Token"}),401
    
    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401
     
    if decoded.get("role") != "admin":
        return jsonify({"message": "Forbidden: Admins only"}), 403
    
    data = request.get_json()
    required_fields = [
        "flight_id",
        "trip_type",
        "airline",
        "departure_city",
        "arrival_city",
        "departure_datetime",
        "price",
        "cabin_class",
        "seats_available",
        "flight_status"
    ]

    missing = [field for field in required_fields if field not in data or data[field] in (None, "")]
    if missing:
        return jsonify({
            "error": f"Missing required field(s): {', '.join(missing)}"
        }), 400

   
    try:

        
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        
        cursor.execute("""
            SELECT city_id, city_name, longitude::float AS longitude, latitude::float AS latitude, country
            FROM cities WHERE city_name = %s
        """, (data["departure_city"],))
        departure_city = cursor.fetchone()
        
        if not departure_city:
            return jsonify({"message":"Departure City not found"}),400

        cursor.execute("""
            SELECT city_id, city_name, longitude::float AS longitude, latitude::float AS latitude, country
            FROM cities WHERE city_name = %s
        """, (data["arrival_city"],))
        arrival_city = cursor.fetchone()

        if not arrival_city:
            return jsonify({"message":"Invalid arrival city name"}),400
        
        
        cursor.execute("SELECT airline_id FROM airlines WHERE airline_name = %s", (data["airline"],))
        airline = cursor.fetchone()
        if not airline:
            return jsonify({"message": "Invalid airline"}), 400
        airline_id = airline["airline_id"]

        
        headers = {
            'Authorization': API_KEY,
            'Content-Type': 'application/json'
        }

        
        body = {
            "coordinates": [
            [departure_city["longitude"],departure_city["latitude"]],      
            [arrival_city["longitude"],arrival_city["latitude"]]
            ]
        }
        
        api_response = requests.post(
            'https://api.openrouteservice.org/v2/directions/driving-car',
            json=body,
            headers=headers
        )

        api_data = api_response.json()
        distance_meters = api_data['routes'][0]['summary']['distance']
        duration_seconds = api_data['routes'][0]['summary']['duration']
        flight_distance = round(distance_meters/1000,2)
        flight_duration = round(duration_seconds/3600,2)


        cursor.execute("SELECT flight_id FROM flights WHERE flight_id = %s", (data["flight_id"],))
        if cursor.fetchone():
            return jsonify({"message": "Flight ID already exists"}), 409


        cursor.execute("""
             INSERT INTO flights (
                flight_id, trip_type, airline,airline_id,
                origin_country, destination_country,departure_city_code, 
                arrival_city_code,is_directs, transits,
                departure_datetime, return_datetime,price, 
                cabin_class, seats_available,flight_duration, 
                flight_distance, flight_status,gate, 
                terminal, baggage_allowance, flight_description, 
                airline_logo
            )VALUES (%s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, 
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s,
                    %s,%s,%s,
                    %s
            )
                    RETURNING *
                """,
             (
                data["flight_id"],
                data["trip_type"],
                data["airline"],
                airline_id,                         
                departure_city["country"],                   
                arrival_city["country"],                    
                departure_city["city_name"],
                arrival_city["city_name"],
                data.get("is_directs", True),                
                data.get("transits"),                        
                data["departure_datetime"],
                data.get("return_datetime"),
                float(data["price"]),
                data["cabin_class"],
                int(data["seats_available"]),
                flight_duration,
                flight_distance,
                data["flight_status"],
                data.get("gate"),
                data.get("terminal"),
                data.get("baggage_allowance"),
                data.get("flight_description"),
                data.get("airline_logo")
            ))
        new_flight = cursor.fetchone()
        db.commit()
        
        return jsonify({"message": "Flight created successfully",
                        "flight":new_flight}), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()



@app.route('/superadmin/create_admin',methods=['POST'])
def create_1admin():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message":"Invalid or expired token "})
    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401
        
    if decoded.get("role") != "superadmin":
        return jsonify({"message": "Forbidden: Super Admins only"}),403

    data = request.get_json()
    firstname = data.get("firstname")
    lastname = data.get("lastname")
    email = data.get("email")
    password = data.get("password")
    
    
    if not all([firstname, lastname, email, password]):
        return jsonify({"message": "All fields are required"}), 400

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("select email from login_users where email = %s",(email,))
        if cursor.fetchone():
            return jsonify({"message":"Account already exists"}),409
        
        hash_password = bcrypt.hashpw(password.encode('UTF-8'),bcrypt.gensalt()).decode('UTF-8')
        
        cursor.execute("""
            INSERT INTO login_users (first_name, last_name, email, hash_password, role)
            VALUES (%s, %s, %s, %s, %s)
        """, (firstname, lastname, email, hash_password, "admin"))
        db.commit()
        return jsonify({"message": "Admin created successfully"}), 201
                
    except Exception as e :
        db.rollback()
        return jsonify({"error":  str((e))}),500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()

@app.route('/superadmin/deleteadmin', methods=['DELETE'])
def delete_admin():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401

    if decoded.get("role") != "superadmin":
        return jsonify({"message": "Forbidden: Super Admins only"}), 403

    
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"message": "Email is required"}), 400

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

   
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"message": "User not found"}), 404

       
        if user["role"] != "admin":
            return jsonify({"message": "Only admins can be deleted"}), 400

        
        cursor.execute("DELETE FROM login_users WHERE email = %s", (email,))
        db.commit()

        return jsonify({"message": f"Admin with email {email} deleted successfully"}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()

    

@app.route('/bookflight', methods=['POST'])
def book_flight():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401

    user_email = decoded.get('email')
    if not user_email:
        return jsonify({"message": "Invalid token data"}), 401

    data = request.get_json()
    
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    flight_id = data.get('flight_id')

    if not all([first_name, last_name, flight_id]):
            return jsonify({"message": "First name, Last name and Flight ID are required"}), 400

    user_name = f"{first_name} {last_name}"

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        
        cursor.execute("SELECT flight_id, seats_available, departure_city_code, arrival_city_code, price FROM flights WHERE flight_id = %s", (flight_id,))
        flight = cursor.fetchone()
        if not flight:
            return jsonify({"message": "Flight not found"}), 404

        cursor.execute("""
            INSERT INTO bookings (user_name, user_email, flight_id, city_origin, city_destination, price, booking_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
            RETURNING *
        """, (
            user_name,
            user_email,
            flight_id,
            flight["departure_city_code"],
            flight["arrival_city_code"],
            flight["price"],
            "confirmed"
        ))


        booking = cursor.fetchone()
        db.commit()

        return jsonify({"message": "Flight booked successfully", "booking": booking}), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


@app.route('/mybookings', methods=['GET'])
def my_bookings():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401

    user_email = decoded.get('email')
    if not user_email:
        return jsonify({"message":"Login required"})
    
    
    

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT b.booking_id, b.flight_id, f.departure_city_code, f.arrival_city_code,
                   f.departure_datetime, f.airline, b.status, b.booking_date
            FROM bookings b
            JOIN flights f ON b.flight_id = f.flight_id
            WHERE b.user_email = %s
            ORDER BY b.booking_date DESC
        """, (user_email,))
        bookings = cursor.fetchall()

        return jsonify({"bookings": bookings}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/admin/bookings', methods=['GET'])
def all_bookings():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401

    if decoded.get("role") not in ["admin", "superadmin"]:
        return jsonify({"message": "Forbidden: Admins only"}), 403

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT b.booking_id, b.user_email, b.flight_id, f.departure_city_code, f.arrival_city_code,
                   f.departure_datetime, f.airline, b.status, b.booking_date
            FROM bookings b
            JOIN flights f ON b.flight_id = f.flight_id
            ORDER BY b.booking_date DESC
        """)
        bookings = cursor.fetchall()

        return jsonify({"bookings": bookings}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/cancelbooking', methods=['POST'])
def cancel_booking():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401

    user_email = decoded.get('email')
    data = request.get_json()
    booking_id = data.get("booking_id")

    if not booking_id:
        return jsonify({"message": "Booking ID is required"}), 400

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND user_email = %s", 
                       (booking_id, user_email))
        booking = cursor.fetchone()
        if not booking:
            return jsonify({"message": "Booking not found or not yours"}), 404

        cursor.execute("UPDATE bookings SET status = %s WHERE booking_id = %s RETURNING *", 
                       ("cancelled", booking_id))
        updated = cursor.fetchone()
        db.commit()

        return jsonify({"message": "Booking cancelled", "booking": updated}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals(): 
            cursor.close()
        if 'db' in locals(): 
            db.close()


@app.route('/userdetails',methods=['GET'])
def userdetails():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message":"No Token was returned"}),401
        
    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message":"No Token was returned"}),401
        
    useremail = request.args.get('email')
    if not useremail:
        return jsonify({"message":"Email required"}),400
    
   
    
    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""select first_name,last_name,email,
                       role from login_users where email =%s """,
                       (useremail,))
        details = cursor.fetchone()
        
        if not details:
            return jsonify({"message":"Something Happened"}),404
        return jsonify(details),200
    
    except Exception as e:
        return jsonify({"error":str(e)}),500
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


@app.route('/user/history', methods=['GET'])
def user_history():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No token provided"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401

    user_email = decoded.get("email")
    if not user_email:
        return jsonify({"message": "Invalid token payload"}), 401

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT b.booking_id, b.flight_id, b.city_origin, b.city_destination, 
                   b.price, b.booking_date, b.status,b.user_email,
                   f.airline, f.departure_datetime, f.arrival_city, f.departure_city
            FROM bookings b
            JOIN flights f ON b.flight_id = f.flight_id
            WHERE b.user_email = %s
            ORDER BY b.booking_date DESC
        """, (user_email,))
        
        history = cursor.fetchall()

        return jsonify(history), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()



@app.route('/flights/search', methods=['GET'])
def search_flights():
    origin = request.args.get('origin')
    destination = request.args.get('destination')
    date = request.args.get('date')  
    trip_type = request.args.get('trip_type')

    query = """
        SELECT flight_id, trip_type, airline, departure_city, arrival_city,
               departure_datetime, price, cabin_class, seats_available, flight_status
        FROM flights
        WHERE seats_available > 0 AND flight_status = 'active'
    """
    params = []

    if origin:
        query += " AND departure_city ILIKE %s"
        params.append(f"%{origin}%")

    if destination:
        query += " AND arrival_city ILIKE %s"
        params.append(f"%{destination}%")

    if date:
        query += " AND DATE(departure_datetime) = %s"
        params.append(date)

    if trip_type:
        query += " AND trip_type ILIKE %s"
        params.append(trip_type)

    query += " ORDER BY departure_datetime ASC"

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        cursor.execute(query, tuple(params))
        flights = cursor.fetchall()

        if not flights:
            return jsonify({"message":"No flights found for your search"}),404
        
        return jsonify(flights), 200
        

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


# ==================== USER MANAGEMENT ENDPOINTS ====================

@app.route('/users', methods=['GET'])
def get_all_users():
    """Get all users - SuperAdmin only"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
        
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        
        if not decoded:
            return jsonify({"message": "Invalid token"}), 401
        
        # Check if user is superadmin
        email = decoded.get('email')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        
        # Get all users
        cursor.execute("""
            SELECT id, first_name, last_name, email, role, status, permissions, last_login
            FROM login_users
            ORDER BY 
                CASE role 
                    WHEN 'superadmin' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'user' THEN 3
                    ELSE 4
                END,
                id DESC
        """)
        users = cursor.fetchall()
        
        cursor.close()
        db.close()
        
        # Format response
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'name': f"{user['first_name']} {user['last_name']}",
                'email': user['email'],
                'role': user['role'],
                'status': user.get('status', 'active'),
                'permissions': user.get('permissions', []),
                'lastLogin': user.get('last_login')
            })
        
        return jsonify(users_list), 200
        
    except Exception as e:
        return jsonify({"message": f"Error fetching users: {str(e)}"}), 500

@app.route('/users', methods=['POST'])
def create_user():
    """Create new user - SuperAdmin only"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
        
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        
        if not decoded:
            return jsonify({"message": "Invalid token"}), 401
        
        # Check if user is superadmin
        email = decoded.get('email')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        
        # Get request data
        data = request.get_json()
        name = data.get('name', '').strip()
        email_new = data.get('email', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', 'user').strip()
        
        # Validation
        if not all([name, email_new, password]):
            return jsonify({"message": "Name, email, and password are required"}), 400
        
        if role not in ['user', 'admin', 'superadmin']:
            return jsonify({"message": "Invalid role"}), 400
        
        # Check if email already exists
        cursor.execute("SELECT email FROM login_users WHERE email = %s", (email_new,))
        if cursor.fetchone():
            return jsonify({"message": "Email already exists"}), 409
        
        # Split name into first and last name
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Hash password
        hash_password = bcrypt.hashpw(password.encode('UTF-8'), bcrypt.gensalt()).decode('UTF-8')
        
        # Insert new user
        cursor.execute("""
            INSERT INTO login_users (first_name, last_name, email, hash_password, role)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, first_name, last_name, email, role, status, permissions, last_login
        """, (first_name, last_name, email_new, hash_password, role))
        
        new_user = cursor.fetchone()
        db.commit()
        
        cursor.close()
        db.close()
        
        return jsonify({
            'id': new_user['id'],
            'name': f"{new_user['first_name']} {new_user['last_name']}",
            'email': new_user['email'],
            'role': new_user['role'],
            'status': new_user.get('status','active'),
            'permissions': new_user.get('permissions',[]),
            'lastLogin': new_user.get('last_login')
        }), 201
        
    except Exception as e:
        return jsonify({"message": f"Error creating user: {str(e)}"}), 500

@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user - SuperAdmin only"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
        
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        
        if not decoded:
            return jsonify({"message": "Invalid token"}), 401
        
        # Check if user is superadmin
        email = decoded.get('email')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        
        # Get request data
        data = request.get_json()
        name = data.get('name', '').strip()
        email_new = data.get('email', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', '').strip()
        
        # Validation
        if not all([name, email_new]):
            return jsonify({"message": "Name and email are required"}), 400
        
        if role and role not in ['user', 'admin', 'superadmin']:
            return jsonify({"message": "Invalid role"}), 400
        
        # Check if user exists
        cursor.execute("SELECT id FROM login_users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"message": "User not found"}), 404
        
        # Check if email already exists (excluding current user)
        cursor.execute("SELECT id FROM login_users WHERE email = %s AND id != %s", (email_new, user_id))
        if cursor.fetchone():
            return jsonify({"message": "Email already exists"}), 409
        
        # Split name into first and last name
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        # Build update query
        update_fields = ["first_name = %s", "last_name = %s", "email = %s"]
        update_values = [first_name, last_name, email_new]
        
        if password:
            hash_password = bcrypt.hashpw(password.encode('UTF-8'), bcrypt.gensalt()).decode('UTF-8')
            update_fields.append("hash_password = %s")
            update_values.append(hash_password)
        
        if role:
            update_fields.append("role = %s")
            update_values.append(role)
        
        update_values.append(user_id)
        
        # Update user
        cursor.execute(f"""
            UPDATE login_users 
            SET {', '.join(update_fields)}
            WHERE id = %s
            RETURNING id, first_name, last_name, email, role, status, permissions, last_login
        """, update_values)
        
        updated_user = cursor.fetchone()
        db.commit()
        
        cursor.close()
        db.close()
        
        return jsonify({
            'id': updated_user['id'],
            'name': f"{updated_user['first_name']} {updated_user['last_name']}",
            'email': updated_user['email'],
            'role': updated_user['role'],
            'status': updated_user.get('status','active'),
            'permissions': updated_user.get('permissions',[]),
            'lastLogin': updated_user.get('last_login')
        }), 200
        
    except Exception as e:
        return jsonify({"message": f"Error updating user: {str(e)}"}), 500

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user - SuperAdmin only"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
        
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        
        if not decoded:
            return jsonify({"message": "Invalid token"}), 401
        
        # Check if user is superadmin
        email = decoded.get('email')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        
        # Check if user exists
        cursor.execute("SELECT id, email FROM login_users WHERE id = %s", (user_id,))
        user_to_delete = cursor.fetchone()
        if not user_to_delete:
            return jsonify({"message": "User not found"}), 404
        
        # Delete user
        cursor.execute("DELETE FROM login_users WHERE id = %s", (user_id,))
        db.commit()
        
        cursor.close()
        db.close()
        
        return jsonify({"message": f"User {user_to_delete['email']} deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"message": f"Error deleting user: {str(e)}"}), 500

@app.route('/users/<int:user_id>/role', methods=['PATCH'])
def update_user_role(user_id):
    """Update user role - SuperAdmin only"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
        
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        
        if not decoded:
            return jsonify({"message": "Invalid token"}), 401
        
        # Check if user is superadmin
        email = decoded.get('email')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        
        # Get request data
        data = request.get_json()
        new_role = data.get('role', '').strip()
        
        # Validation
        if new_role not in ['user', 'admin', 'superadmin']:
            return jsonify({"message": "Invalid role"}), 400
        
        # Check if user exists
        cursor.execute("SELECT id FROM login_users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"message": "User not found"}), 404
        
        # Update role
        cursor.execute("""
            UPDATE login_users 
            SET role = %s
            WHERE id = %s
            RETURNING id, first_name, last_name, email, role, status, permissions, last_login
        """, (new_role, user_id))
        
        updated_user = cursor.fetchone()
        db.commit()
        
        cursor.close()
        db.close()
        
        return jsonify({
            'id': updated_user['id'],
            'name': f"{updated_user['first_name']} {updated_user['last_name']}",
            'email': updated_user['email'],
            'role': updated_user['role'],
            'status': updated_user.get('status','active'),
            'permissions': updated_user.get('permissions',[]),
            'lastLogin': updated_user.get('last_login')
        }), 200
    except Exception as e:
        return jsonify({"message": f"Error updating user role: {str(e)}"}), 500

# ==================== ADMIN MANAGEMENT ENDPOINTS ====================

@app.route('/admins', methods=['GET'])
def list_admins():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        if not decoded:
            return jsonify({"message": "Invalid token"}), 401
        email = decoded.get('email')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        me = cursor.fetchone()
        if not me or me['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403

        cursor.execute("""
            SELECT id, first_name, last_name, email, role, status, permissions, 
                   to_char(last_login, 'YYYY-MM-DD') as last_login
            FROM login_users 
            WHERE role = 'admin'
            ORDER BY id DESC
        """)
        admins = cursor.fetchall()
        cursor.close(); db.close()
        return jsonify([
            {
                'id': a['id'],
                'name': f"{a['first_name']} {a['last_name']}",
                'email': a['email'],
                'permissions': a.get('permissions', []),
                'lastLogin': a.get('last_login'),
                'status': a.get('status','active')
            } for a in admins
        ])
    except Exception as e:
        return jsonify({"message": f"Error listing admins: {str(e)}"}), 500


@app.route('/admins', methods=['POST'])
def create_admin():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        if not decoded:
            return jsonify({"message": "Invalid token"}), 401
        email = decoded.get('email')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        me = cursor.fetchone()
        if not me or me['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403

        data = request.get_json()
        name = data.get('name','').strip()
        email_new = data.get('email','').strip()
        password = data.get('password','').strip()
        permissions = data.get('permissions', [])
        if not all([name, email_new, password]):
            return jsonify({"message": "Name, email and password are required"}), 400

        cursor.execute("SELECT 1 FROM login_users WHERE email=%s", (email_new,))
        if cursor.fetchone():
            return jsonify({"message": "Email already exists"}), 409

        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        hash_password = bcrypt.hashpw(password.encode('UTF-8'), bcrypt.gensalt()).decode('UTF-8')

        cursor.execute("""
            INSERT INTO login_users (first_name, last_name, email, hash_password, role, permissions, status)
            VALUES (%s, %s, %s, %s, 'admin', %s::jsonb, 'active')
            RETURNING id, first_name, last_name, email, permissions, status, last_login
        """, (first_name, last_name, email_new, hash_password, json.dumps(permissions)))
        new_admin = cursor.fetchone()
        db.commit()
        cursor.close(); db.close()
        return jsonify({
            'id': new_admin['id'],
            'name': f"{new_admin['first_name']} {new_admin['last_name']}",
            'email': new_admin['email'],
            'permissions': new_admin.get('permissions', []),
            'status': new_admin.get('status','active'),
            'lastLogin': new_admin.get('last_login')
        }), 201
    except Exception as e:
        return jsonify({"message": f"Error creating admin: {str(e)}"}), 500


@app.route('/admins/<int:admin_id>/toggle', methods=['PATCH'])
def toggle_admin_status(admin_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        if not decoded:
            return jsonify({"message": "Invalid token"}), 401
        email = decoded.get('email')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        me = cursor.fetchone()
        if not me or me['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403

        cursor.execute("SELECT status FROM login_users WHERE id=%s AND role='admin'", (admin_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"message": "Admin not found"}), 404
        new_status = 'inactive' if row['status'] == 'active' else 'active'
        cursor.execute("""
            UPDATE login_users SET status=%s WHERE id=%s AND role='admin'
            RETURNING id, first_name, last_name, email, permissions, status, last_login
        """, (new_status, admin_id))
        updated = cursor.fetchone(); db.commit(); cursor.close(); db.close()
        return jsonify({
            'id': updated['id'],
            'name': f"{updated['first_name']} {updated['last_name']}",
            'email': updated['email'],
            'permissions': updated.get('permissions', []),
            'status': updated.get('status','active'),
            'lastLogin': updated.get('last_login')
        })
    except Exception as e:
        return jsonify({"message": f"Error toggling admin: {str(e)}"}), 500


@app.route('/admins/<int:admin_id>/permissions', methods=['PUT'])
def update_admin_permissions(admin_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"message": "No token provided"}), 401
        token = auth_header.split(' ')[1]
        decoded = decode_token(token)
        if not decoded:
            return jsonify({"message": "Invalid token"}), 401
        email = decoded.get('email')
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT role FROM login_users WHERE email = %s", (email,))
        me = cursor.fetchone()
        if not me or me['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403

        data = request.get_json()
        permissions = data.get('permissions', [])
        cursor.execute("""
            UPDATE login_users SET permissions=%s::jsonb WHERE id=%s AND role='admin'
            RETURNING id, first_name, last_name, email, permissions, status, last_login
        """, (json.dumps(permissions), admin_id))
        updated = cursor.fetchone(); db.commit(); cursor.close(); db.close()
        if not updated:
            return jsonify({"message": "Admin not found"}), 404
        return jsonify({
            'id': updated['id'],
            'name': f"{updated['first_name']} {updated['last_name']}",
            'email': updated['email'],
            'permissions': updated.get('permissions', []),
            'status': updated.get('status','active'),
            'lastLogin': updated.get('last_login')
        })
    except Exception as e:
        return jsonify({"message": f"Error updating permissions: {str(e)}"}), 500
        
    except Exception as e:
        return jsonify({"message": f"Error updating role: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)
