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

JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_MINUTES = 60


def ensure_admin_columns():
    """Ensure admin-related columns exist in login_users table"""
    try:
        db = database_connection()
        cursor = db.cursor()
        
        # Add role column if it doesn't exist
        cursor.execute("""
            ALTER TABLE login_users 
            ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
        """)
        
        # Add permissions column if it doesn't exist
        cursor.execute("""
            ALTER TABLE login_users 
            ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb
        """)
        
        # Add last_login column if it doesn't exist
        cursor.execute("""
            ALTER TABLE login_users 
            ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL
        """)
        
        # Add status column if it doesn't exist
        cursor.execute("""
            ALTER TABLE login_users 
            ADD COLUMN IF NOT EXISTS status VARCHAR(16) DEFAULT 'active'
        """)
        
        # Add created_at column if it doesn't exist
        cursor.execute("""
            ALTER TABLE login_users 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()
        """)
        
        db.commit()
        cursor.close()
        db.close()
    except Exception as e:
        print(f"Error ensuring admin columns: {e}")
        try:
            db.rollback()
        except Exception:
            pass
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
        print(f"Database connection failed: {e}")
        print(f"Attempting to connect to: host={os.getenv('DB_HOST')}, user={os.getenv('DB_USER')}, db={os.getenv('DB_NAME')}")
        raise


try:
    ensure_admin_columns()
    ensure_audit_logs_table()
    print("Database tables initialized successfully")
except Exception as e:
    print(f"Warning: Could not initialize database tables: {e}")
    print("The API will still run, but database-dependent features may not work")

@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "Flight Booking System API", "status": "running"}), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify database connectivity"""
    try:
        db = database_connection()
        cursor = db.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        db.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "unhealthy", "database": "disconnected", "error": str(e)}), 500



def get_cookie_settings():
    is_local = ("localhost" in request.host) or ("127.0.0.1" in request.host)
    secure_cookie = False if is_local else True
    samesite_cookie = "Lax" if is_local else "None"  
    domain_cookie = None  
    return secure_cookie, samesite_cookie, domain_cookie


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
        secure_cookie, samesite_cookie, domain_cookie = get_cookie_settings()

        user = {"first_name": firstname, "last_name": lastname, "email": email}
        response = jsonify({"message": "Signup successful", "status": "success", "user": user})

        response.set_cookie(
            'refresh_token',
            refresh_token,
            httponly=True,
            secure=secure_cookie,
            samesite=samesite_cookie,
            domain=domain_cookie,
            max_age=7 * 24 * 60 * 60
        )
        response.set_cookie(
            'access_token',
            access_token,
            httponly=True,
            secure=secure_cookie,
            samesite=samesite_cookie,
            domain=domain_cookie,
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
        secure_cookie, samesite_cookie, domain_cookie = get_cookie_settings()

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
                            secure=secure_cookie,
                            samesite=samesite_cookie,
                            domain=domain_cookie,
                            max_age=7*24*60*60,
                            path='/'
                            )

        response.set_cookie('access_token', access_token,
                            httponly=True,
                            secure=secure_cookie,
                            samesite=samesite_cookie,
                            domain=domain_cookie,
                            max_age=15*60,
                            path='/'
                            )
        return response

    except Exception as e:
        return jsonify({"message": "Database error", "error": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()


@app.route('/api/login', methods=['POST'])
def api_login():
    """API version of login endpoint"""
    return login()


@app.route('/api/signup', methods=['POST'])
def api_signup():
    """API version of signup endpoint"""
    return signup()


@app.route('/api/logout', methods=['POST'])
def api_logout():
    """API version of logout endpoint"""
    return logout()


@app.route('/api/me', methods=['GET'])
def api_me():
    """API version of me endpoint"""
    return me()


@app.route('/api/refresh', methods=['POST'])
def api_refresh():
    """API version of refresh endpoint"""
    return refresh()


@app.route('/api/hotels', methods=['GET'])
def api_get_hotels():
    """API version of hotels endpoint"""
    return get_hotels()


@app.route('/api/flights', methods=['GET'])
def api_get_all_flights_public():
    """API version of public flights endpoint"""
    return get_all_flights_public()


@app.route('/api/flights/search', methods=['GET'])
def api_search_flights():
    """API version of flights search endpoint"""
    return search_flights()


@app.route('/api/bookflight', methods=['POST'])
def api_book_flight():
    """API version of book flight endpoint"""
    return book_flight()


@app.route('/api/mybookings', methods=['GET'])
def api_my_bookings():
    """API version of my bookings endpoint"""
    return my_bookings()


@app.route('/api/cancelbooking', methods=['POST'])
def api_cancel_booking():
    """API version of cancel booking endpoint"""
    return cancel_booking()


@app.route('/api/packages', methods=['GET'])
def api_get_packages():
    """API endpoint for travel packages"""
    try:
        # Dummy package data for now
        packages = [
            {
                "id": 1,
                "name": "Accra to London Adventure",
                "description": "7-day package including flights, hotel, and tours",
                "price": 2500,
                "currency": "USD",
                "duration": "7 days",
                "includes": ["Round-trip flights", "4-star hotel", "City tours", "Breakfast"],
                "image": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=500",
                "destinations": ["London", "Accra"],
                "rating": 4.5
            },
            {
                "id": 2,
                "name": "Dubai Luxury Getaway",
                "description": "5-day luxury package with premium accommodations",
                "price": 3200,
                "currency": "USD", 
                "duration": "5 days",
                "includes": ["Round-trip flights", "5-star hotel", "Desert safari", "All meals"],
                "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500",
                "destinations": ["Dubai", "Accra"],
                "rating": 4.8
            },
            {
                "id": 3,
                "name": "New York City Explorer",
                "description": "6-day package exploring the Big Apple",
                "price": 2800,
                "currency": "USD",
                "duration": "6 days", 
                "includes": ["Round-trip flights", "3-star hotel", "Broadway show", "City pass"],
                "image": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=500",
                "destinations": ["New York", "Accra"],
                "rating": 4.3
            }
        ]
        
        return jsonify(packages), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/car-rentals', methods=['GET'])
def api_get_car_rentals():
    """API endpoint for car rentals"""
    try:
        # Dummy car rental data 
        car_rentals = [
            {
                "id": 1,
                "brand": "Toyota",
                "model": "Camry",
                "year": 2023,
                "type": "Sedan",
                "price_per_day": 45,
                "currency": "USD",
                "features": ["Air Conditioning", "GPS", "Bluetooth", "Automatic"],
                "image": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500",
                "location": "Accra",
                "available": True,
                "rating": 4.2
            },
            {
                "id": 2,
                "brand": "Honda",
                "model": "CR-V",
                "year": 2023,
                "type": "SUV",
                "price_per_day": 65,
                "currency": "USD",
                "features": ["Air Conditioning", "GPS", "4WD", "Bluetooth", "Automatic"],
                "image": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=500",
                "location": "Accra",
                "available": True,
                "rating": 4.5
            },
            {
                "id": 3,
                "brand": "Nissan",
                "model": "Altima",
                "year": 2022,
                "type": "Sedan",
                "price_per_day": 40,
                "currency": "USD",
                "features": ["Air Conditioning", "GPS", "Bluetooth", "Automatic"],
                "image": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500",
                "location": "Kumasi",
                "available": True,
                "rating": 4.0
            },
            {
                "id": 4,
                "brand": "Ford",
                "model": "Explorer",
                "year": 2023,
                "type": "SUV",
                "price_per_day": 70,
                "currency": "USD",
                "features": ["Air Conditioning", "GPS", "4WD", "Bluetooth", "7-seater"],
                "image": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
                "location": "Accra",
                "available": True,
                "rating": 4.6
            }
        ]
        
        # Filter by location 
        location = request.args.get('location')
        if location:
            car_rentals = [car for car in car_rentals if car['location'].lower() == location.lower()]
            
        # Filter by type 
        car_type = request.args.get('type')
        if car_type:
            car_rentals = [car for car in car_rentals if car['type'].lower() == car_type.lower()]
        
        return jsonify(car_rentals), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/refresh', methods=['POST'])
def refresh():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({"message": "Refresh token missing", "code": "NO_REFRESH_TOKEN"}), 401

    decoded = decode_token(refresh_token, is_refresh=True)
    if not decoded:
        return jsonify({"message": "Invalid or expired refresh token", "code": "INVALID_REFRESH_TOKEN"}), 401

    try:
        new_access_token = generate_access_token(decoded['email'], decoded['role'])
        secure_cookie, samesite_cookie, domain_cookie = get_cookie_settings()
        response = jsonify({"message": "Token refreshed successfully"})
        response.set_cookie('access_token', new_access_token,
                            httponly=True,
                            secure=secure_cookie,
                            samesite=samesite_cookie,
                            domain=domain_cookie,
                            max_age=15*60,
                            path='/'
                            )
        return response
    except Exception as e:
        return jsonify({"message": "Failed to generate new token", "error": str(e)}), 500


@app.route('/logout', methods=['POST'])
def logout():
    secure_cookie, samesite_cookie, domain_cookie = get_cookie_settings()
    response = jsonify({"message": "Logout successful", "status": "success"})

    # Delete cookies by setting empty value with immediate expiration
    response.delete_cookie('access_token', path='/', secure=secure_cookie, samesite=samesite_cookie, domain=domain_cookie)
    response.delete_cookie('refresh_token', path='/', secure=secure_cookie, samesite=samesite_cookie, domain=domain_cookie)

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





@app.route("/api/admin/flights", methods=["GET", "POST"])
def admin_flights_api():
    if request.method == "GET":
    
        return get_all_flights()
    elif request.method == "POST":
        
        return create_flight()


@app.route('/api/admin/flights/<flight_id>/status', methods=['PUT'])
def api_update_flight_status(flight_id):
    """API version of update flight status endpoint"""
    return update_flight_status(flight_id)


def create_flight():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message":"No Token"}),401
    
    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid or expired token"}), 401
    
     
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

        
        if API_KEY and API_KEY != "YOUR_OPENROUTESERVICE_API_KEY_HERE":
            
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
                
                
                if 'routes' not in api_data or not api_data['routes']:
            
                    if isinstance(api_data.get('error'), dict):
                        error_msg = api_data['error'].get('message', 'Failed to calculate route')
                    elif isinstance(api_data.get('error'), str):
                        error_msg = api_data['error']
                    else:
                        error_msg = str(api_data)
                    print(f"OpenRouteService API Error: {api_data}")
                    
                    flight_distance = 1000.0
                    flight_duration = 2.0
                else:
                    distance_meters = api_data['routes'][0]['summary']['distance']
                    duration_seconds = api_data['routes'][0]['summary']['duration']
                    flight_distance = round(distance_meters/1000,2)
                    flight_duration = round(duration_seconds/3600,2)
            except Exception as e:
                print(f"Error calling OpenRouteService API: {e}")
                
                flight_distance = 1000.0
                flight_duration = 2.0
        else:
            
            print("API_KEY not configured, using estimated distance/duration")
            flight_distance = 1000.0
            flight_duration = 2.0


        cursor.execute("SELECT flight_id FROM flights WHERE flight_id = %s", (data["flight_id"],))
        if cursor.fetchone():
            return jsonify({"message": "Flight ID already exists"}), 409

        
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

    

@app.route('/test-booking', methods=['POST'])
def test_booking():
    """Test booking endpoint without authentication for debugging"""
    data = request.get_json()
    print(f"TEST BOOKING - Received data: {data}")
    
    # Simple validation
    required_fields = ['flight_id', 'first_name', 'last_name', 'payment_method', 'payment_amount']
    missing = [field for field in required_fields if not data.get(field)]
    
    if missing:
        return jsonify({"message": f"Missing fields: {missing}"}), 400
    
    return jsonify({"message": "Test booking successful", "data": data}), 200

@app.route('/api-health', methods=['GET'])
def api_health():
    return jsonify({"status": "healthy", "message": "Backend is running"}), 200

@app.route('/bookflight', methods=['POST'])
def book_flight():
    print(f"BOOKING REQUEST - Started booking request")
    print(f"BOOKING REQUEST - Headers: {dict(request.headers)}")
    print(f"BOOKING REQUEST - Cookies: {request.cookies}")
    print(f"BOOKING REQUEST - Method: {request.method}")
    print(f"BOOKING REQUEST - URL: {request.url}")
    print(f"BOOKING REQUEST - Data: {request.get_data()}")
    
    access_token = request.cookies.get('access_token')
    if not access_token:
        print(f"BOOKING ERROR - No access token found")
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

    # Log booking attempt for audit
    print(f"BOOKING ATTEMPT - User: {user_email}, Flight: {flight_id}, Amount: {payment_amount}")
    
    missing_fields = []
    if not first_name: missing_fields.append("first_name")
    if not last_name: missing_fields.append("last_name") 
    if not flight_id: missing_fields.append("flight_id")
    if not payment_method: missing_fields.append("payment_method")
    if not payment_amount: missing_fields.append("payment_amount")
    
    if missing_fields:
        return jsonify({"message": f"Required fields missing: {', '.join(missing_fields)}"}), 400

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

        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS flight_payments (
                payment_id SERIAL PRIMARY KEY,
                booking_id INTEGER,
                user_email VARCHAR(255),
                amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                payment_status VARCHAR(20) DEFAULT 'pending',
                payment_date TIMESTAMP DEFAULT NOW()
            )
        """)
        

        cursor.execute("""
            INSERT INTO flight_payments (booking_id, user_email, amount, payment_method, payment_status, payment_date)
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING payment_id, *
        """, (
            booking_id,
            user_email,
            payment_amount,
            payment_method,
            'completed'  
        ))

        payment = cursor.fetchone()
        
        
        cursor.execute("""
            UPDATE flights 
            SET seats_available = seats_available - %s 
            WHERE flight_id = %s AND seats_available >= %s
        """, (num_seats, flight_id, num_seats))
        
        if cursor.rowcount == 0:
            db.rollback()
            return jsonify({"message": "Not enough seats available"}), 400
            
        db.commit()


        
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
        print(f"BOOKING ERROR - {str(e)}")
        print(f"BOOKING ERROR - Error type: {type(e).__name__}")
        import traceback
        print(f"BOOKING ERROR - Traceback: {traceback.format_exc()}")
        db.rollback()
        log_audit(user_email, "CREATE_BOOKING", f"Failed to book flight: {str(e)}", "FAILED", "BOOKING", flight_id)
        return jsonify({"message": "Booking failed", "error": str(e), "details": str(type(e).__name__)}), 500

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
        return jsonify({"message": "Invalid Token"}), 401

    user_role = decoded.get('role')
    if user_role not in ['admin', 'superadmin']:
        return jsonify({"message": "Access denied"}), 403

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        cursor.execute("""
            SELECT b.booking_id, b.user_email, b.user_name, b.flight_id, 
                   f.departure_city_code, f.arrival_city_code, f.departure_datetime, 
                   f.airline, b.status, b.booking_date, b.price,
                   fp.amount as payment_amount, fp.payment_method, fp.payment_status
            FROM bookings b
            JOIN flights f ON b.flight_id = f.flight_id
            LEFT JOIN flight_payments fp ON b.booking_id = fp.booking_id
            ORDER BY b.booking_date DESC
        """)
        bookings = cursor.fetchall()
        
        print(f"ADMIN BOOKINGS - Total bookings found: {len(bookings)}")
        for booking in bookings:
            print(f"ADMIN BOOKINGS - Booking {booking['booking_id']}: status={booking['status']}, user={booking['user_email']}")
        
        cancelled_bookings = [b for b in bookings if b['status'] == 'cancelled']
        print(f"ADMIN BOOKINGS - Cancelled bookings: {len(cancelled_bookings)}")

        return jsonify({"bookings": bookings}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/api/admin/bookings', methods=['GET'])
def api_all_bookings():
    """API version of admin bookings endpoint"""
    return all_bookings()


@app.route('/api/debug/bookings', methods=['GET'])
def debug_bookings():
    """Debug endpoint to check bookings in database"""
    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        # Get all bookings with their status
        cursor.execute("SELECT booking_id, user_email, status, booking_date FROM bookings ORDER BY booking_date DESC")
        bookings = cursor.fetchall()
        
        # Count by status
        status_counts = {}
        for booking in bookings:
            status = booking['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return jsonify({
            "total_bookings": len(bookings),
            "status_counts": status_counts,
            "bookings": [dict(b) for b in bookings]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/cancelbooking', methods=['POST'])
def cancel_booking():
    print(f"CANCEL BOOKING - Request received")
    access_token = request.cookies.get('access_token')
    if not access_token:
        print(f"CANCEL BOOKING - No access token")
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        print(f"CANCEL BOOKING - Invalid token")
        return jsonify({"message": "Invalid or expired token"}), 401

    user_email = decoded.get('email')
    user_role = decoded.get('role')
    data = request.get_json()
    booking_id = data.get("booking_id")
    
    print(f"CANCEL BOOKING - User: {user_email}, Role: {user_role}, Booking ID: {booking_id}")

    if not booking_id:
        return jsonify({"message": "Booking ID is required"}), 400

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        # Check if user is admin/superadmin or if it's their own booking
        if user_role in ['admin', 'superadmin']:
            # Admins can cancel any booking
            cursor.execute("SELECT * FROM bookings WHERE booking_id = %s", (booking_id,))
        else:
            # Regular users can only cancel their own bookings
            cursor.execute("SELECT * FROM bookings WHERE booking_id = %s AND user_email = %s", 
                           (booking_id, user_email))
        
        booking = cursor.fetchone()
        if not booking:
            return jsonify({"message": "Booking not found"}), 404

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


@app.route('/flights/test-search', methods=['GET'])
def test_search():
    """Test search with Accra to London"""
    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT DISTINCT f.flight_id, f.departure_city_code, f.arrival_city_code, 
                   f.departure_datetime, f.price, f.flight_status,
                   dc.country as departure_country, ac.country as arrival_country
            FROM flights f
            LEFT JOIN cities dc ON f.departure_city_code = dc.city_name
            LEFT JOIN cities ac ON f.arrival_city_code = ac.city_name
            WHERE f.seats_available > 0 
            AND f.flight_status IN ('active', 'Scheduled')
            AND (f.departure_city_code ILIKE %s OR dc.city_name ILIKE %s)
            AND (f.arrival_city_code ILIKE %s OR ac.city_name ILIKE %s)
            ORDER BY f.departure_datetime ASC
        """, ('%Accra%', '%Accra%', '%London%', '%London%'))
        flights = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify({
            "search_params": {"origin": "Accra", "destination": "London"},
            "found_flights": len(flights),
            "flights": flights
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/flights/debug', methods=['GET'])
def debug_flights():
    """Get all flights for debugging"""
    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""
            SELECT flight_id, departure_city_code, arrival_city_code, 
                   departure_datetime, price, seats_available, flight_status
            FROM flights 
            ORDER BY flight_id ASC
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
        SELECT DISTINCT f.flight_id, f.trip_type, f.airline, f.departure_city_code, f.arrival_city_code,
               f.departure_datetime, f.return_datetime as arrival_datetime, f.price, f.cabin_class, f.seats_available, 
               f.flight_status, f.flight_duration, f.flight_distance, f.gate, f.terminal,
               f.origin_country, f.destination_country,
               dc.country as departure_country, ac.country as arrival_country
        FROM flights f
        LEFT JOIN cities dc ON f.departure_city_code = dc.city_name
        LEFT JOIN cities ac ON f.arrival_city_code = ac.city_name
        WHERE f.seats_available > 0 AND f.flight_status IN ('active', 'Scheduled')
    """
    params = []

    if origin:
        # Search by departure city name using cities table relationship
        query += " AND (f.departure_city_code ILIKE %s OR dc.city_name ILIKE %s)"
        params.append(f"%{origin}%")
        params.append(f"%{origin}%")

    if destination:
        # Search by arrival city name using cities table relationship
        query += " AND (f.arrival_city_code ILIKE %s OR ac.city_name ILIKE %s)"
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

        # Debug: print the query and parameters
        print(f"DEBUG SEARCH - Query: {query}")
        print(f"DEBUG SEARCH - Params: {params}")
        
        cursor.execute(query, tuple(params))
        flights = cursor.fetchall()

        print(f"DEBUG SEARCH - Found {len(flights)} flights")

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
    print(f"DASHBOARD STATS - Request received")
    access_token = request.cookies.get('access_token')
    if not access_token:
        print(f"DASHBOARD STATS - No access token")
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        print(f"DASHBOARD STATS - Invalid token")
        return jsonify({"message": "Invalid or expired token"}), 401

    if decoded.get("role") not in ["admin", "superadmin"]:
        print(f"DASHBOARD STATS - Forbidden role: {decoded.get('role')}")
        return jsonify({"message": "Forbidden: Admins only"}), 403

    print(f"DASHBOARD STATS - Starting database queries")
    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        # Total flights
        try:
            cursor.execute("SELECT COUNT(*) as count FROM flights")
            total_flights = cursor.fetchone()['count']
        except Exception as e:
            print(f"Error fetching total flights: {e}")
            total_flights = 0

        # Total bookings
        try:
            cursor.execute("SELECT COUNT(*) as count FROM bookings")
            total_bookings = cursor.fetchone()['count']
        except Exception as e:
            print(f"Error fetching total bookings: {e}")
            total_bookings = 0

        # Total revenue
        try:
            cursor.execute("SELECT SUM(price) as revenue FROM bookings WHERE status = 'confirmed'")
            revenue_result = cursor.fetchone()
            total_revenue = float(revenue_result['revenue']) if revenue_result and revenue_result['revenue'] else 0
        except Exception as e:
            print(f"Error fetching total revenue: {e}")
            total_revenue = 0

        # Cancelled bookings
        try:
            cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'")
            cancelled_bookings = cursor.fetchone()['count']
        except Exception as e:
            print(f"Error fetching cancelled bookings: {e}")
            cancelled_bookings = 0

        # Upcoming flights
        try:
            cursor.execute("SELECT COUNT(*) as count FROM flights WHERE departure_datetime > NOW() AND flight_status = 'active'")
            upcoming_flights = cursor.fetchone()['count']
        except Exception as e:
            print(f"Error fetching upcoming flights: {e}")
            upcoming_flights = 0

        # Bookings per route
        try:
            cursor.execute("""
                SELECT city_origin, city_destination, COUNT(*) as count
                FROM bookings
                GROUP BY city_origin, city_destination
                ORDER BY count DESC
                LIMIT 10
            """)
            bookings_per_route = cursor.fetchall()
        except Exception as e:
            print(f"Error fetching bookings per route: {e}")
            bookings_per_route = []

        # Revenue per month
        try:
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
        except Exception as e:
            print(f"Error fetching revenue per month: {e}")
            revenue_per_month = []

        # Flight status distribution
        try:
            cursor.execute("""
                SELECT flight_status, COUNT(*) as count
                FROM flights
                GROUP BY flight_status
            """)
            flight_status_dist = cursor.fetchall()
        except Exception as e:
            print(f"Error fetching flight status distribution: {e}")
            flight_status_dist = []

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
        print(f"Dashboard stats error: {str(e)}")
        return jsonify({"error": str(e), "message": "Failed to load dashboard statistics"}), 500


@app.route('/api/admin/dashboard/stats', methods=['GET'])
def api_admin_dashboard_stats():
    """API version of admin dashboard stats endpoint"""
    return admin_dashboard_stats()


# API versions of user management endpoints with cookie authentication
@app.route('/api/users', methods=['GET'])
def api_get_all_users():
    """Get all users - SuperAdmin only (API version with cookie auth)"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid Token"}), 401

    user_role = decoded.get('role')
    if user_role != 'superadmin':
        return jsonify({"message": "Access denied - SuperAdmin only"}), 403

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT id, first_name, last_name, email, role, status, created_at
            FROM login_users 
            ORDER BY created_at DESC
        """)
        users = cursor.fetchall()
        
        # Format the response
        formatted_users = []
        for user in users:
            # Manually create the name field
            name = f"{user['first_name']} {user['last_name']}" if user['first_name'] and user['last_name'] else (user['first_name'] or user['last_name'] or 'Unknown')
            
            formatted_users.append({
                'id': user['id'],
                'name': name,
                'email': user['email'],
                'role': user['role'],
                'status': user['status'],
                'createdAt': user['created_at'].strftime('%Y-%m-%d') if user['created_at'] else 'N/A'
            })
        
        return jsonify(formatted_users), 200

    except Exception as e:
        return jsonify({"message": f"Error fetching users: {str(e)}"}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/api/users', methods=['POST'])
def api_create_user():
    """Create new user - SuperAdmin only (API version with cookie auth)"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid Token"}), 401

    user_role = decoded.get('role')
    if user_role != 'superadmin':
        return jsonify({"message": "Access denied - SuperAdmin only"}), 403

    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', 'user')

        if not all([name, email, password]):
            return jsonify({"message": "Name, email, and password are required"}), 400

        # Split name into first and last name
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        # Check if user already exists
        cursor.execute("SELECT id FROM login_users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "User with this email already exists"}), 400

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Insert new user
        cursor.execute("""
            INSERT INTO login_users (first_name, last_name, email, hash_password, role, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, first_name, last_name, email, role, status, created_at
        """, (first_name, last_name, email, hashed_password, role, 'active'))
        
        new_user = cursor.fetchone()
        db.commit()
        
        # Format response
        response_user = {
            'id': new_user['id'],
            'name': f"{new_user['first_name']} {new_user['last_name']}",
            'email': new_user['email'],
            'role': new_user['role'],
            'status': new_user['status'],
            'createdAt': new_user['created_at'].strftime('%Y-%m-%d') if new_user['created_at'] else 'N/A'
        }
        
        return jsonify(response_user), 201

    except Exception as e:
        if 'db' in locals():
            db.rollback()
        return jsonify({"message": f"Error creating user: {str(e)}"}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/api/users/<int:user_id>', methods=['PUT'])
def api_update_user(user_id):
    """Update user - SuperAdmin only (API version with cookie auth)"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid Token"}), 401

    user_role = decoded.get('role')
    if user_role != 'superadmin':
        return jsonify({"message": "Access denied - SuperAdmin only"}), 403

    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        role = data.get('role', 'user')

        if not all([name, email]):
            return jsonify({"message": "Name and email are required"}), 400

        # Split name into first and last name
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        # Check if user exists
        cursor.execute("SELECT id FROM login_users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"message": "User not found"}), 404

        # Update user
        if password:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            cursor.execute("""
                UPDATE login_users 
                SET first_name = %s, last_name = %s, email = %s, hash_password = %s, role = %s
                WHERE id = %s
                RETURNING id, first_name, last_name, email, role, status, created_at
            """, (first_name, last_name, email, hashed_password, role, user_id))
        else:
            cursor.execute("""
                UPDATE login_users 
                SET first_name = %s, last_name = %s, email = %s, role = %s
                WHERE id = %s
                RETURNING id, first_name, last_name, email, role, status, created_at
            """, (first_name, last_name, email, role, user_id))
        
        updated_user = cursor.fetchone()
        db.commit()
        
        # Format response
        response_user = {
            'id': updated_user['id'],
            'name': f"{updated_user['first_name']} {updated_user['last_name']}",
            'email': updated_user['email'],
            'role': updated_user['role'],
            'status': updated_user['status'],
            'createdAt': updated_user['created_at'].strftime('%Y-%m-%d') if updated_user['created_at'] else 'N/A'
        }
        
        return jsonify(response_user), 200

    except Exception as e:
        if 'db' in locals():
            db.rollback()
        return jsonify({"message": f"Error updating user: {str(e)}"}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def api_delete_user(user_id):
    """Delete user - SuperAdmin only (API version with cookie auth)"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid Token"}), 401

    user_role = decoded.get('role')
    if user_role != 'superadmin':
        return jsonify({"message": "Access denied - SuperAdmin only"}), 403

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        # Check if user exists
        cursor.execute("SELECT id FROM login_users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({"message": "User not found"}), 404

        # Delete user
        cursor.execute("DELETE FROM login_users WHERE id = %s", (user_id,))
        db.commit()
        
        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        if 'db' in locals():
            db.rollback()
        return jsonify({"message": f"Error deleting user: {str(e)}"}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/api/users/<int:user_id>/role', methods=['PATCH'])
def api_update_user_role(user_id):
    """Update user role - SuperAdmin only (API version with cookie auth)"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid Token"}), 401

    user_role = decoded.get('role')
    if user_role != 'superadmin':
        return jsonify({"message": "Access denied - SuperAdmin only"}), 403

    try:
        data = request.get_json()
        new_role = data.get('role')

        if new_role not in ['user', 'admin', 'superadmin']:
            return jsonify({"message": "Invalid role"}), 400

        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        # Update user role
        cursor.execute("""
            UPDATE login_users 
            SET role = %s
            WHERE id = %s
            RETURNING id, first_name, last_name, email, role, status, created_at
        """, (new_role, user_id))
        
        updated_user = cursor.fetchone()
        if not updated_user:
            return jsonify({"message": "User not found"}), 404
            
        db.commit()
        
        # Format response
        response_user = {
            'id': updated_user['id'],
            'name': f"{updated_user['first_name']} {updated_user['last_name']}",
            'email': updated_user['email'],
            'role': updated_user['role'],
            'status': updated_user['status'],
            'createdAt': updated_user['created_at'].strftime('%Y-%m-%d') if updated_user['created_at'] else 'N/A'
        }
        
        return jsonify(response_user), 200

    except Exception as e:
        if 'db' in locals():
            db.rollback()
        return jsonify({"message": f"Error updating user role: {str(e)}"}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


# API versions of admin management endpoints with cookie authentication
@app.route('/api/admins', methods=['GET'])
def api_list_admins():
    """Get all admins - SuperAdmin only (API version with cookie auth)"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid Token"}), 401

    user_role = decoded.get('role')
    if user_role != 'superadmin':
        return jsonify({"message": "Access denied - SuperAdmin only"}), 403

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT id, first_name, last_name, email, role, status, permissions, 
                   last_login, created_at
            FROM login_users 
            WHERE role IN ('admin', 'superadmin')
            ORDER BY created_at DESC
        """)
        admins = cursor.fetchall()
        
        # Format the response
        formatted_admins = []
        for admin in admins:
            # Parse permissions JSON safely
            permissions = admin['permissions'] if admin['permissions'] else []
            if isinstance(permissions, str):
                try:
                    import json
                    permissions = json.loads(permissions)
                except Exception as e:
                    print(f"Error parsing permissions for admin {admin['id']}: {e}")
                    permissions = []
            elif permissions is None:
                permissions = []
            
            # Manually create the name field
            name = f"{admin['first_name']} {admin['last_name']}" if admin['first_name'] and admin['last_name'] else (admin['first_name'] or admin['last_name'] or 'Unknown')
            
            formatted_admins.append({
                'id': admin['id'],
                'name': name,
                'email': admin['email'],
                'role': admin['role'],
                'status': admin['status'],
                'permissions': permissions,
                'lastLogin': admin['last_login'].strftime('%Y-%m-%d %H:%M') if admin['last_login'] else 'Never',
                'createdAt': admin['created_at'].strftime('%Y-%m-%d') if admin['created_at'] else 'N/A'
            })
        
        return jsonify(formatted_admins), 200

    except Exception as e:
        return jsonify({"message": f"Error fetching admins: {str(e)}"}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/api/admins', methods=['POST'])
def api_create_admin():
    """Create new admin - SuperAdmin only (API version with cookie auth)"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid Token"}), 401

    user_role = decoded.get('role')
    if user_role != 'superadmin':
        return jsonify({"message": "Access denied - SuperAdmin only"}), 403

    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        permissions = data.get('permissions', [])

        if not all([name, email, password]):
            return jsonify({"message": "Name, email, and password are required"}), 400

        # Split name into first and last name
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        # Check if user already exists
        cursor.execute("SELECT id FROM login_users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "User with this email already exists"}), 400

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Convert permissions to JSON
        import json
        permissions_json = json.dumps(permissions)
        
        # Insert new admin
        cursor.execute("""
            INSERT INTO login_users (first_name, last_name, email, hash_password, role, status, permissions)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, first_name, last_name, email, role, status, permissions, created_at
        """, (first_name, last_name, email, hashed_password, 'admin', 'active', permissions_json))
        
        new_admin = cursor.fetchone()
        db.commit()
        
        # Format response
        response_admin = {
            'id': new_admin['id'],
            'name': f"{new_admin['first_name']} {new_admin['last_name']}",
            'email': new_admin['email'],
            'role': new_admin['role'],
            'status': new_admin['status'],
            'permissions': permissions,
            'lastLogin': 'Never',
            'createdAt': new_admin['created_at'].strftime('%Y-%m-%d') if new_admin['created_at'] else 'N/A'
        }
        
        return jsonify(response_admin), 201

    except Exception as e:
        if 'db' in locals():
            db.rollback()
        return jsonify({"message": f"Error creating admin: {str(e)}"}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


@app.route('/api/admins/<int:admin_id>/toggle', methods=['PATCH'])
def api_toggle_admin_status(admin_id):
    """Toggle admin status - SuperAdmin only (API version with cookie auth)"""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message": "No Token"}), 401

    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message": "Invalid Token"}), 401

    user_role = decoded.get('role')
    if user_role != 'superadmin':
        return jsonify({"message": "Access denied - SuperAdmin only"}), 403

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        
        # Get current status
        cursor.execute("SELECT status FROM login_users WHERE id = %s AND role IN ('admin', 'superadmin')", (admin_id,))
        admin = cursor.fetchone()
        if not admin:
            return jsonify({"message": "Admin not found"}), 404

        # Toggle status
        new_status = 'inactive' if admin['status'] == 'active' else 'active'
        
        # Update admin status
        cursor.execute("""
            UPDATE login_users 
            SET status = %s
            WHERE id = %s
            RETURNING id, first_name, last_name, email, role, status, permissions, last_login, created_at
        """, (new_status, admin_id))
        
        updated_admin = cursor.fetchone()
        db.commit()
        
        # Parse permissions
        permissions = updated_admin['permissions'] if updated_admin['permissions'] else []
        if isinstance(permissions, str):
            import json
            try:
                permissions = json.loads(permissions)
            except:
                permissions = []
        
        # Format response
        response_admin = {
            'id': updated_admin['id'],
            'name': f"{updated_admin['first_name']} {updated_admin['last_name']}",
            'email': updated_admin['email'],
            'role': updated_admin['role'],
            'status': updated_admin['status'],
            'permissions': permissions,
            'lastLogin': updated_admin['last_login'].strftime('%Y-%m-%d %H:%M') if updated_admin['last_login'] else 'Never',
            'createdAt': updated_admin['created_at'].strftime('%Y-%m-%d') if updated_admin['created_at'] else 'N/A'
        }
        
        return jsonify(response_admin), 200

    except Exception as e:
        if 'db' in locals():
            db.rollback()
        return jsonify({"message": f"Error toggling admin status: {str(e)}"}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'db' in locals(): db.close()


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
        return jsonify({"error": str(e), "message": "Failed to load flights"}), 500


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


@app.route('/api/admin/audit-logs', methods=['GET'])
def api_get_audit_logs():
    """API version of audit logs endpoint"""
    return get_audit_logs()


@app.before_request
def log_request():
    print(f"REQUEST - {request.method} {request.path} from {request.remote_addr}")

if __name__ == '__main__':
    app.run(debug=True)
