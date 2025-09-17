from flask import Flask,render_template,redirect,request,session,url_for,flash,jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt

app = Flask(__name__)
app.secret_key = 'MY_SECRET_KEY'
CORS(app,supports_credentials=True)

def database_connection():
    return mysql.connector.connect(
            host = 'localhost',
            user = 'root',
            password = 'Spickles@004.com',
            database = 'flightapp'
        )
        




@app.route('/',methods=['GET','POST'])
def login():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
        else:
            email = request.form.get('email')
            password = request.form.get('password')
        
        if not email or not password:
            message = "Email and password are required"
            if request.is_json:
                return jsonify({"message": message, "status": "error"}), 400
            else:
                flash(message)
                return redirect(url_for('login'))
            
        try:
            db = database_connection()
            cursor = db.cursor()
            
            login_query = "select hash_password from login_users where email = %s"
            cursor.execute(login_query,(email,))
            result = cursor.fetchone()
            
            if not result:
                if request.is_json:
                    return jsonify({"message": "User not found", "status": "error"}), 404
                flash("Login unsuccessful: user not found.")
                return redirect(url_for('login'))
                        
            hash_password = result[0]
            
            if hash_password is None:
                if request.is_json:
                    return jsonify({"message": "Account has no password set", "status": "error"}), 500
                flash("Stored password is invalid.")
                return redirect(url_for('login'))

            
            if result:
                hash_password = result[0]
                if isinstance (hash_password,str):
                    hash_password = hash_password.encode('UTF-8')
                
                if bcrypt.checkpw(password.encode('UTF-8'),hash_password):
                    session['email'] = email
                    if request.is_json:
                        
                        return jsonify({"message":"Login Successfull"})
                        
                    else:
                        flash('Login Successfull')
                        return redirect(url_for('login'))
                else:
                    message = 'Incorrect Password'
                    if request.is_json:
                        return jsonify({"message": message, "status": "error"}), 401
            else:
                flash("Login Unsuccessful")
                return redirect(url_for('login'))
        except mysql.connector.Error as e:
            flash("Something happened")
            
        finally:
            cursor.close()
            db.close()
        return redirect(url_for('login'))
        
        
    return render_template('login.html')


@app.route('/signup',methods=['GET','POST'])
def signup():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            firstname = data.get('firstname')
            lastname = data.get('lastname')
            email = data.get('email')
            password = data.get('password')
            userword = data.get('userword')
        else:
            firstname = request.form.get('firstname')
            lastname = request.form.get('lastname')
            email = request.form.get('email')
            password = request.form.get('password') 
            userword = request.form.get('userword')
        if password == userword:
            hashword = bcrypt.hashpw(password.encode('utf-8'),bcrypt.gensalt()).decode('UTF-8')
        else:
            flash("Incorrect password")
            return redirect(url_for('signup'))
        try:   
            db = database_connection()
            cursor = db.cursor()
        
            email_query = "select email from login_users where email = %s"
            cursor.execute(email_query,(email,))
            email_exist = cursor.fetchone()
            if email_exist:
                    flash("Email already exist")
                    return redirect(url_for('signup'))
                
            insert_query = "insert into login_users (first_name,last_name,email,hash_password)values(%s,%s,%s,%s)"
            values = (firstname,lastname,email,hashword)
            cursor.execute(insert_query,values)
            db.commit()
        except mysql.connector.Error as e:
            if request.is_json:
                    return jsonify({"message": "Database error", "error": str(e)}), 500
            else:
                flash("Something went wrong")
                return redirect(url_for('signup'))
        finally:
            cursor.close()
            db.close()
            return redirect(url_for('login'))  

    return render_template('signup.html')


@app.route('/logout',methods=['POST','GET'])
def logout():
    session.clear()
    if request.is_json:
        return jsonify({"message":"Logout Successfull","status":"Success"})
    else:
        flash("Logged out")
        return redirect(url_for('login'))
    

if __name__ == '__main__':
    app.run(debug=True)