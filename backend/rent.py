from flask import Flask,render_template,redirect,request,session,url_for,flash
import json
import mysql.connector
import bcrypt

app = Flask(__name__)
app.secret_key = 'MY_SECRET_KEY'


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
        email = request.form.get('email')
        password = request.form.get('password')    
        
        try:
            db = database_connection()
            cursor = db.cursor()
            
            login_query = "select hash_password from login_users where email = %s"
            cursor.execute(login_query,(email,))
            result = cursor.fetchone()
            if result:
                hash_password = result[0]
                if isinstance (hash_password,str):
                    hash_password = hash_password.encode('UTF-8')
                
                if bcrypt.checkpw(password.encode('UTF-8'),hash_password):
                    flash("Login Succesfull")
                    return redirect(url_for('signup'))
                else:
                    flash("Password Incorrect")
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
        
        firstname = request.form.get('firstname')
        lastname = request.form.get('lastname')
        email = request.form.get('email')
        password = request.form.get('password') 
        userword = request.form.get('userword')
        if password == userword:
            hashword = bcrypt.hashpw(password.encode('UTF-8'),bcrypt.gensalt())
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
            print("cant be saved",  e)
        finally:
            cursor.close()
            db.close()
        return redirect(url_for('login'))  
        
    return render_template('signup.html')

if __name__ == '__main__':
    app.run(debug=True)
