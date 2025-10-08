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

def ensure_audit_logs_table():
    """Create audit_logs table if it doesn't exist"""
    try:
        db = database_connection()
        cursor = db.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                timestamp TIMESTAMP DEFAULT NOW(),
                user_email VARCHAR(255),
                action VARCHAR(100),
                details TEXT,
                ip_address VARCHAR(45),
                status VARCHAR(20),
                resource_type VARCHAR(50),
                resource_id VARCHAR(100)
            );
        """)
        db.commit()
    except Exception as e:
        print(f"Error creating audit_logs table: {e}")
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

def log_audit(user_email, action, details, status="SUCCESS", resource_type=None, resource_id=None):
    """Helper function to log audit events"""
    try:
        ip_address = request.remote_addr if request else "SYSTEM"
        db = database_connection()
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (user_email, action, details, ip_address, status, resource_type, resource_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_email, action, details, ip_address, status, resource_type, resource_id))
        db.commit()
        cursor.close()
        db.close()
    except Exception as e:
        print(f"Error logging audit: {e}")


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

ensure_admin_columns()
ensure_audit_logs_table()



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

        # Log audit
        log_audit(email, "SIGNUP", f"New user registered: {firstname} {lastname}", "SUCCESS", "USER", email)

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
        cursor.execute("SELECT hash_password,role,email,first_name,last_name FROM login_users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            log_audit(email, "LOGIN", "Login attempt - user not found", "FAILED", "AUTH", email)
            return jsonify({"message": "User not found"}), 404

        hash_password = user['hash_password'].encode('utf-8') if isinstance(user['hash_password'], str) else user['hash_password']
        
        if not bcrypt.checkpw(password.encode('utf-8'), hash_password):
            log_audit(email, "LOGIN", "Login attempt - incorrect password", "FAILED", "AUTH", email)
            return jsonify({"message": "Incorrect password"}), 404

        role = user.get('role','user')

      
        try:
            cursor.execute("""
                UPDATE login_users SET last_login = NOW()
                WHERE email = %s AND role IN ('admin','superadmin')
            """, (email,))
            db.commit()
        except Exception:
            db.rollback()
        
        # Log successful login
        log_audit(email, "LOGIN", f"User logged in successfully - Role: {role}", "SUCCESS", "AUTH", email)

        access_token = generate_access_token(email,role)
        refresh_token = generate_refresh_token(email,role)
        secure_cookie, samesite_cookie = get_cookie_settings()

        response = jsonify({"message": "Login successful",
                            "access_token": access_token,
                           "user":{
                               "email":user["email"],
                               "role":role,
                               "firstname":user.get("first_name"),
                               "lastname":user.get("last_name")
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
        # Format response to match login endpoint
        user_data = {
            "email": user["email"],
            "role": user["role"],
            "firstname": user.get("first_name"),
            "lastname": user.get("last_name")
        }
        return jsonify({"user": user_data}), 200
    return jsonify({"user": None}), 404





@app.route("/admin/flights", methods=["POST"])
def create_flight():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message":"No Token"}),401
    
    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401
    
    # Debug logging
    print(f"DEBUG: Decoded token: {decoded}")
    print(f"DEBUG: User role: {decoded.get('role')}")
     
    if decoded.get("role") != "admin":
        return jsonify({"message": f"Forbidden: Admins only. Your role is: {decoded.get('role')}"}), 403
    
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

        
        # Calculate flight distance and duration
        if API_KEY and API_KEY != "YOUR_OPENROUTESERVICE_API_KEY_HERE":
            # Use OpenRouteService API if key is configured
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
            
            try:
                api_response = requests.post(
                    'https://api.openrouteservice.org/v2/directions/driving-car',
                    json=body,
                    headers=headers,
                    timeout=10
                )

                api_data = api_response.json()
                
                # Check if API call was successful
                if 'routes' not in api_data or not api_data['routes']:
                    # Handle different error response formats
                    if isinstance(api_data.get('error'), dict):
                        error_msg = api_data['error'].get('message', 'Failed to calculate route')
                    elif isinstance(api_data.get('error'), str):
                        error_msg = api_data['error']
                    else:
                        error_msg = str(api_data)
                    print(f"OpenRouteService API Error: {api_data}")
                    # Fall back to estimated values
                    flight_distance = 1000.0
                    flight_duration = 2.0
                else:
                    distance_meters = api_data['routes'][0]['summary']['distance']
                    duration_seconds = api_data['routes'][0]['summary']['duration']
                    flight_distance = round(distance_meters/1000,2)
                    flight_duration = round(duration_seconds/3600,2)
            except Exception as e:
                print(f"Error calling OpenRouteService API: {e}")
                # Use estimated values as fallback
                flight_distance = 1000.0
                flight_duration = 2.0
        else:
            # Use estimated values when API key is not configured
            print("API_KEY not configured, using estimated distance/duration")
            flight_distance = 1000.0
            flight_duration = 2.0


        cursor.execute("SELECT flight_id FROM flights WHERE flight_id = %s", (data["flight_id"],))
        if cursor.fetchone():
            return jsonify({"message": "Flight ID already exists"}), 409

        # Sanitize optional fields - convert empty strings to None
        return_datetime = data.get("return_datetime") or None
        gate = data.get("gate") or None
        terminal = data.get("terminal") or None
        baggage_allowance = data.get("baggage_allowance") or None
        flight_description = data.get("flight_description") or None
        airline_logo = data.get("airline_logo") or None
        transits = data.get("transits") or None

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
                transits,                        
                data["departure_datetime"],
                return_datetime,
                float(data["price"]),
                data["cabin_class"],
                int(data["seats_available"]),
                flight_duration,
                flight_distance,
                data["flight_status"],
                gate,
                terminal,
                baggage_allowance,
                flight_description,
                airline_logo
            ))
        new_flight = cursor.fetchone()
        db.commit()
        
        # Log audit
        log_audit(
            decoded.get('email'), 
            "CREATE_FLIGHT", 
            f"Created flight {data['flight_id']} from {departure_city['city_name']} to {arrival_city['city_name']}", 
            "SUCCESS", 
            "FLIGHT", 
            data['flight_id']
        )
        
        return jsonify({"message": "Flight created successfully",
                        "flight":new_flight}), 201

    except Exception as e:
        db.rollback()
        log_audit(decoded.get('email') if decoded else "UNKNOWN", "CREATE_FLIGHT", f"Failed to create flight: {str(e)}", "FAILED", "FLIGHT", data.get('flight_id'))
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
        
        # Log audit
        log_audit(decoded.get('email'), "CREATE_ADMIN", f"Created admin account for {email}", "SUCCESS", "USER", email)
        
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

        # Log audit
        log_audit(decoded.get('email'), "DELETE_ADMIN", f"Deleted admin account {email}", "SUCCESS", "USER", email)

        return jsonify({"message": f"Admin with email {email} deleted successfully"}), 200

    except Exception as e:
        db.rollback()
        log_audit(decoded.get('email'), "DELETE_ADMIN", f"Failed to delete admin: {str(e)}", "FAILED", "USER", email)
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
    email = data.get('email')
    phone = data.get('phone')
    num_seats = data.get('num_seats', 1)
    cabin_class = data.get('cabin_class')
    extra_baggage = data.get('extra_baggage', 0)
    meal_preference = data.get('meal_preference', 'Standard')
    payment_method = data.get('payment_method')
    payment_amount = data.get('payment_amount')

    if not all([first_name, last_name, flight_id, payment_method, payment_amount]):
            return jsonify({"message": "Required fields missing"}), 400

    user_name = f"{first_name} {last_name}"

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        
        cursor.execute("SELECT flight_id, seats_available, departure_city_code, arrival_city_code, price FROM flights WHERE flight_id = %s", (flight_id,))
        flight = cursor.fetchone()
        if not flight:
            return jsonify({"message": "Flight not found"}), 404

        # Create booking
        cursor.execute("""
            INSERT INTO bookings (user_name, user_email, flight_id, city_origin, city_destination, price, booking_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), %s)
            RETURNING booking_id, *
        """, (
            user_name,
            user_email or email,
            flight_id,
            flight["departure_city_code"],
            flight["arrival_city_code"],
            payment_amount,
            "confirmed"
        ))

        booking = cursor.fetchone()
        booking_id = booking['booking_id']

        # Create payment record
        cursor.execute("""
            INSERT INTO payments (passenger_id, booking_id, amount, payment_method, payment_status, created_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING payment_id, *
        """, (
            user_email or email,  # Using email as passenger_id
            booking_id,
            payment_amount,
            payment_method,
            'completed'  # Mark as completed for now
        ))

        payment = cursor.fetchone()
        db.commit()

        # Log audit
        log_audit(
            user_email, 
            "CREATE_BOOKING", 
            f"Booked flight {flight_id} for {user_name} with payment {payment_method}", 
            "SUCCESS", 
            "BOOKING", 
            str(booking_id)
        )

        return jsonify({
            "message": "Flight booked successfully", 
            "booking": booking,
            "payment": payment
        }), 201

    except Exception as e:
        db.rollback()
        log_audit(user_email, "CREATE_BOOKING", f"Failed to book flight: {str(e)}", "FAILED", "BOOKING", flight_id)
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

        # Log audit
        log_audit(
            user_email, 
            "CANCEL_BOOKING", 
            f"Cancelled booking {booking_id}", 
            "SUCCESS", 
            "BOOKING", 
            str(booking_id)
        )

        return jsonify({"message": "Booking cancelled", "booking": updated}), 200

    except Exception as e:
        db.rollback()
        log_audit(user_email, "CANCEL_BOOKING", f"Failed to cancel booking: {str(e)}", "FAILED", "BOOKING", str(booking_id))
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



@app.route('/flights', methods=['GET'])
def get_all_flights_public():
    """Get all active flights - Public endpoint"""
    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT flight_id, trip_type, airline, departure_city_code, arrival_city_code,
                   departure_datetime, return_datetime as arrival_datetime, price, cabin_class, seats_available,
                   flight_status, flight_duration, flight_distance, origin_country, destination_country
            FROM flights
            WHERE flight_status IN ('active', 'scheduled') AND seats_available > 0
            ORDER BY departure_datetime ASC
            LIMIT 50
        """)
        flights = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(flights), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/flights/search', methods=['GET'])
def search_flights():
    origin = request.args.get('origin')
    destination = request.args.get('destination')
    date = request.args.get('date')  
    trip_type = request.args.get('trip_type')
    cabin = request.args.get('cabin')
    passengers = request.args.get('passengers', '1')

    query = """
        SELECT flight_id, trip_type, airline, departure_city_code, arrival_city_code,
               departure_datetime, return_datetime as arrival_datetime, price, cabin_class, seats_available, 
               flight_status, flight_duration, flight_distance, gate, terminal,
               origin_country, destination_country
        FROM flights
        WHERE seats_available > 0 AND flight_status IN ('active', 'scheduled')
    """
    params = []

    if origin:
        # Search by both city code and city name
        query += " AND (departure_city_code ILIKE %s OR departure_city_code IN (SELECT city_code FROM cities WHERE city_name ILIKE %s))"
        params.append(f"%{origin}%")
        params.append(f"%{origin}%")

    if destination:
        # Search by both city code and city name
        query += " AND (arrival_city_code ILIKE %s OR arrival_city_code IN (SELECT city_code FROM cities WHERE city_name ILIKE %s))"
        params.append(f"%{destination}%")
        params.append(f"%{destination}%")

    if date:
        query += " AND DATE(departure_datetime) = %s"
        params.append(date)

    if trip_type:
        query += " AND trip_type ILIKE %s"
        params.append(trip_type)

    if cabin:
        query += " AND cabin_class ILIKE %s"
        params.append(cabin)

    if passengers:
        query += " AND seats_available >= %s"
        params.append(int(passengers))

    query += " ORDER BY departure_datetime ASC"

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        cursor.execute(query, tuple(params))
        flights = cursor.fetchall()

        # Return empty array instead of 404 for better frontend handling
        if not flights:
            return jsonify([]), 200
        
        return jsonify(flights), 200
        

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


@app.route('/cities/search', methods=['GET'])
def search_cities():
    """Search cities by name for autocomplete"""
    search_query = request.args.get('q', '').strip()
    
    if not search_query:
        return jsonify([]), 200
    
    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT DISTINCT city_name, country
            FROM cities
            WHERE city_name ILIKE %s
            ORDER BY city_name
            LIMIT 10
        """, (f"%{search_query}%",))
        
        cities = cursor.fetchall()
        
        # Format the response
        city_list = [{"city": city["city_name"], "country": city["country"]} for city in cities]
        
        return jsonify(city_list), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()




@app.route('/users', methods=['GET'])
def get_all_users():
    """Get all users - SuperAdmin only"""
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
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        
        #
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
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        
        
        data = request.get_json()
        name = data.get('name', '').strip()
        email_new = data.get('email', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', 'user').strip()
        
        
        if not all([name, email_new, password]):
            return jsonify({"message": "Name, email, and password are required"}), 400
        
        if role not in ['user', 'admin', 'superadmin']:
            return jsonify({"message": "Invalid role"}), 400
        
        
        cursor.execute("SELECT email FROM login_users WHERE email = %s", (email_new,))
        if cursor.fetchone():
            return jsonify({"message": "Email already exists"}), 409
        
        
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        
        hash_password = bcrypt.hashpw(password.encode('UTF-8'), bcrypt.gensalt()).decode('UTF-8')
        
        
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
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        

        data = request.get_json()
        name = data.get('name', '').strip()
        email_new = data.get('email', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', '').strip()
        
        
        if not all([name, email_new]):
            return jsonify({"message": "Name and email are required"}), 400
        
        if role and role not in ['user', 'admin', 'superadmin']:
            return jsonify({"message": "Invalid role"}), 400
        
        
        cursor.execute("SELECT id FROM login_users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"message": "User not found"}), 404
        
        
        cursor.execute("SELECT id FROM login_users WHERE email = %s AND id != %s", (email_new, user_id))
        if cursor.fetchone():
            return jsonify({"message": "Email already exists"}), 409
        
        
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        
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
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        
        
        cursor.execute("SELECT id, email FROM login_users WHERE id = %s", (user_id,))
        user_to_delete = cursor.fetchone()
        if not user_to_delete:
            return jsonify({"message": "User not found"}), 404
        
        
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
        user = cursor.fetchone()
        
        if not user or user['role'] != 'superadmin':
            return jsonify({"message": "Unauthorized - SuperAdmin access required"}), 403
        
        
        data = request.get_json()
        new_role = data.get('role', '').strip()
        
        
        if new_role not in ['user', 'admin', 'superadmin']:
            return jsonify({"message": "Invalid role"}), 400
        
        
        cursor.execute("SELECT id FROM login_users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"message": "User not found"}), 404
        
        
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


@app.route('/admin/dashboard/stats', methods=['GET'])
def admin_dashboard_stats():
    """Get dashboard statistics for admin"""
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

        # Total flights
        cursor.execute("SELECT COUNT(*) as count FROM flights")
        total_flights = cursor.fetchone()['count']

        # Total bookings
        cursor.execute("SELECT COUNT(*) as count FROM bookings")
        total_bookings = cursor.fetchone()['count']

        # Total revenue
        cursor.execute("SELECT SUM(price) as revenue FROM bookings WHERE status = 'confirmed'")
        revenue_result = cursor.fetchone()
        total_revenue = float(revenue_result['revenue']) if revenue_result['revenue'] else 0

        # Cancelled bookings
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'")
        cancelled_bookings = cursor.fetchone()['count']

        # Upcoming flights
        cursor.execute("SELECT COUNT(*) as count FROM flights WHERE departure_datetime > NOW() AND flight_status = 'active'")
        upcoming_flights = cursor.fetchone()['count']

        # Bookings per route
        cursor.execute("""
            SELECT city_origin, city_destination, COUNT(*) as count
            FROM bookings
            GROUP BY city_origin, city_destination
            ORDER BY count DESC
            LIMIT 10
        """)
        bookings_per_route = cursor.fetchall()

        # Revenue per month
        cursor.execute("""
            SELECT 
                TO_CHAR(booking_date, 'Mon YYYY') as month,
                SUM(price) as revenue
            FROM bookings
            WHERE status = 'confirmed'
            GROUP BY TO_CHAR(booking_date, 'Mon YYYY'), DATE_TRUNC('month', booking_date)
            ORDER BY DATE_TRUNC('month', booking_date)
            LIMIT 12
        """)
        revenue_per_month = cursor.fetchall()

        # Flight status distribution
        cursor.execute("""
            SELECT flight_status, COUNT(*) as count
            FROM flights
            GROUP BY flight_status
        """)
        flight_status_dist = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify({
            "totalFlights": total_flights,
            "totalBookings": total_bookings,
            "totalRevenue": total_revenue,
            "cancelledBookings": cancelled_bookings,
            "upcomingFlights": upcoming_flights,
            "bookingsPerRoute": bookings_per_route,
            "revenuePerMonth": revenue_per_month,
            "flightStatusDistribution": flight_status_dist
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/admin/flights', methods=['GET'])
def get_all_flights():
    """Get all flights for admin management"""
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
            SELECT flight_id, trip_type, airline, departure_city_code, arrival_city_code,
                   departure_datetime, return_datetime as arrival_datetime, price, cabin_class, seats_available,
                   flight_status, flight_duration, origin_country, destination_country
            FROM flights
            ORDER BY departure_datetime DESC
        """)
        flights = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(flights), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/admin/flights/<flight_id>/status', methods=['PUT'])
def update_flight_status(flight_id):
    """Update flight status - Admin only"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401

    if decoded.get("role") not in ["admin", "superadmin"]:
        return jsonify({"message": "Forbidden: Admins only"}), 403

    data = request.get_json()
    new_status = data.get('status')

    if not new_status or new_status not in ['scheduled', 'active', 'cancelled', 'completed']:
        return jsonify({"message": "Invalid status"}), 400

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        # Update flight status
        cursor.execute("""
            UPDATE flights
            SET flight_status = %s
            WHERE flight_id = %s
            RETURNING flight_id, flight_status
        """, (new_status, flight_id))

        updated_flight = cursor.fetchone()
        
        if not updated_flight:
            return jsonify({"message": "Flight not found"}), 404

        db.commit()
        cursor.close()
        db.close()

        # Log audit
        log_audit(
            decoded.get('email'),
            "UPDATE_FLIGHT_STATUS",
            f"Changed flight {flight_id} status to {new_status}",
            "SUCCESS",
            "FLIGHT",
            flight_id
        )

        return jsonify({
            "message": "Flight status updated successfully",
            "flight": updated_flight
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/hotels', methods=['GET'])
def get_hotels():
    """Get hotels with dummy data - Public endpoint"""
    # Dummy hotel data
    hotels = [
        {
            "id": 1,
            "name": "Kempinski Hotel Gold Coast City",
            "location": "Accra, Ghana",
            "city": "Accra",
            "country": "Ghana",
            "rating": 5,
            "price_per_night": 450.00,
            "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500",
            "amenities": ["Pool", "Spa", "Restaurant", "Gym", "WiFi", "Bar"],
            "description": "Luxury 5-star hotel in the heart of Accra with stunning ocean views",
            "available_rooms": 15
        },
        {
            "id": 2,
            "name": "Movenpick Ambassador Hotel",
            "location": "Accra, Ghana",
            "city": "Accra",
            "country": "Ghana",
            "rating": 5,
            "price_per_night": 380.00,
            "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500",
            "amenities": ["Pool", "Restaurant", "Gym", "WiFi", "Conference Room"],
            "description": "Premium hotel with excellent business facilities",
            "available_rooms": 22
        },
        {
            "id": 3,
            "name": "Royal Senchi Resort",
            "location": "Akosombo, Ghana",
            "city": "Akosombo",
            "country": "Ghana",
            "rating": 4,
            "price_per_night": 280.00,
            "image_url": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500",
            "amenities": ["Pool", "Restaurant", "Beach Access", "WiFi", "Spa"],
            "description": "Beautiful resort on the Volta Lake with serene environment",
            "available_rooms": 30
        },
        {
            "id": 4,
            "name": "Labadi Beach Hotel",
            "location": "Accra, Ghana",
            "city": "Accra",
            "country": "Ghana",
            "rating": 4,
            "price_per_night": 320.00,
            "image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500",
            "amenities": ["Beach Access", "Pool", "Restaurant", "Bar", "WiFi"],
            "description": "Beachfront hotel with direct access to Labadi Beach",
            "available_rooms": 18
        },
        {
            "id": 5,
            "name": "Golden Tulip Kumasi City",
            "location": "Kumasi, Ghana",
            "city": "Kumasi",
            "country": "Ghana",
            "rating": 4,
            "price_per_night": 250.00,
            "image_url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500",
            "amenities": ["Pool", "Restaurant", "Gym", "WiFi", "Parking"],
            "description": "Modern hotel in the cultural capital of Ghana",
            "available_rooms": 25
        },
        {
            "id": 6,
            "name": "Alisa Hotel North Ridge",
            "location": "Accra, Ghana",
            "city": "Accra",
            "country": "Ghana",
            "rating": 4,
            "price_per_night": 290.00,
            "image_url": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=500",
            "amenities": ["Pool", "Restaurant", "Gym", "WiFi", "Bar"],
            "description": "Boutique hotel with personalized service",
            "available_rooms": 12
        },
        {
            "id": 7,
            "name": "Coconut Grove Beach Resort",
            "location": "Cape Coast, Ghana",
            "city": "Cape Coast",
            "country": "Ghana",
            "rating": 3,
            "price_per_night": 180.00,
            "image_url": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500",
            "amenities": ["Beach Access", "Restaurant", "WiFi", "Bar"],
            "description": "Cozy beachfront resort perfect for relaxation",
            "available_rooms": 20
        },
        {
            "id": 8,
            "name": "Lancaster Kumasi",
            "location": "Kumasi, Ghana",
            "city": "Kumasi",
            "country": "Ghana",
            "rating": 3,
            "price_per_night": 150.00,
            "image_url": "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=500",
            "amenities": ["Restaurant", "WiFi", "Parking", "Conference Room"],
            "description": "Comfortable hotel with great value for money",
            "available_rooms": 35
        }
    ]
    
    # Optional filters
    city = request.args.get('city', '')
    max_price = request.args.get('max_price', '')
    min_rating = request.args.get('min_rating', '')
    
    filtered_hotels = hotels
    
    if city:
        filtered_hotels = [h for h in filtered_hotels if city.lower() in h['city'].lower()]
    
    if max_price:
        filtered_hotels = [h for h in filtered_hotels if h['price_per_night'] <= float(max_price)]
    
    if min_rating:
        filtered_hotels = [h for h in filtered_hotels if h['rating'] >= int(min_rating)]
    
    return jsonify(filtered_hotels), 200


@app.route('/admin/audit-logs', methods=['GET'])
def get_audit_logs():
    """Get audit logs with optional filters - SuperAdmin only"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401

    if decoded.get("role") != "superadmin":
        return jsonify({"message": "Forbidden: SuperAdmin only"}), 403

    try:
        # Get filter parameters
        action = request.args.get('action', '')
        user = request.args.get('user', '')
        date_from = request.args.get('dateFrom', '')
        date_to = request.args.get('dateTo', '')
        limit = request.args.get('limit', '100')

        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        # Build query with filters
        query = "SELECT * FROM audit_logs WHERE 1=1"
        params = []

        if action:
            query += " AND action ILIKE %s"
            params.append(f"%{action}%")

        if user:
            query += " AND user_email ILIKE %s"
            params.append(f"%{user}%")

        if date_from:
            query += " AND timestamp >= %s"
            params.append(date_from)

        if date_to:
            query += " AND timestamp <= %s"
            params.append(date_to)

        query += " ORDER BY timestamp DESC LIMIT %s"
        params.append(int(limit))

        cursor.execute(query, tuple(params))
        logs = cursor.fetchall()

        cursor.close()
        db.close()

        return jsonify(logs), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
