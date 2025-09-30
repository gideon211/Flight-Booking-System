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
    methods=["GET", "POST", "OPTIONS"]
)

JWT_SECRET = os.getenv("JWT_KEY", "MY_SECRET_KEY")  
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



def get_cookie_settings():
    secure_cookie = False if "localhost" in request.host else True
    samesite_cookie = "Lax" if "localhost" in request.host else "None"
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
            return jsonify({"message": "Incorrect password"}), 401

        role = user.get('role','user')
        
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
                            secure=secure_cookie, 
                            samesite=samesite_cookie,
                            max_age=7*24*60*60
                            )
        
        response.set_cookie('access_token', access_token,
                            httponly=True, 
                            secure=secure_cookie, 
                            samesite=samesite_cookie, 
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
                        secure=secure_cookie, 
                        samesite=samesite_cookie,
                        max_age=15*60
                        )
    return response


@app.route('/logout', methods=['POST'])
def logout():
    secure_cookie, samesite_cookie = get_cookie_settings()
    response = jsonify({"message": "Logout successful", "status": "success"})

  
    response.set_cookie('access_token', '', expires=0)
    response.set_cookie('refresh_token', '', expires=0)
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
def create_admin():
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

@app.route('/superadmin/deleteadmin', methods=['POST'])
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
    flight_id = data.get('flight_id')

    if not flight_id:
        return jsonify({"message": "Flight ID is required"}), 400

    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)

        
        cursor.execute("SELECT flight_id, seats_available FROM flights WHERE flight_id = %s", (flight_id,))
        flight = cursor.fetchone()
        if not flight:
            return jsonify({"message": "Flight not found"}), 404

        
        cursor.execute("SELECT * FROM bookings WHERE flight_id = %s AND user_email = %s", (flight_id, user_email))
        existing = cursor.fetchone()
        if existing:
            return jsonify({"message": "You already booked this flight"}), 409

        
        cursor.execute("""
            INSERT INTO bookings (user_email, first_name,last_name,flight_id, booking_date, status)
            VALUES (%s, %s, NOW(), %s)
            RETURNING *
        """, (user_email, flight_id, "confirmed"))

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


@app.route('/userdetails',methods=['POST'])
def userdetails():
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"message":"No Token was returned"}),401
        
    decoded = decode_token(access_token)
    if not decoded:
        return jsonify({"message":"No Token was returned"}),401
        
    useremail = request.get_json('email')
    data = request.get_json()
    
    try:
        db = database_connection()
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("""select first_name,last_name,email,
                       role,from login_users where email =%s """)
        details = cursor.fetchall
        if not details:
            return jsonify({"message":"Something Happened"}),403
    except Exception as e:
        return jsonify({"error":str(e)}),500
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'db' in locals():
            db.close()

if __name__ == '__main__':
    app.run(debug=True)
