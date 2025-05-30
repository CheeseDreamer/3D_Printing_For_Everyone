from flask import Flask, jsonify, request, make_response 
import mysql.connector
import os
from werkzeug.security import generate_password_hash, check_password_hash 

app = Flask(__name__)
CORS(app)

DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_USER = os.getenv('DB_USER', '3DPrintApp')
DB_PASSWORD = os.getenv('DB_PASSWORD', '!1Qwertyuiop') 
DB_NAME = os.getenv('DB_NAME', '3DPrinting4Everyone')

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        if err.errno == mysql.connector.errorcode.ER_BAD_DB_ERROR:
            try:
                conn_no_db = mysql.connector.connect(
                    host=DB_HOST, user=DB_USER, password=DB_PASSWORD
                )
                cursor_no_db = conn_no_db.cursor()
                cursor_no_db.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
                conn_no_db.commit()
                cursor_no_db.close()
                conn_no_db.close()
                print(f"Database {DB_NAME} might have been created. Please try connecting again.")
            except mysql.connector.Error as inner_err:
                print(f"Could not create database: {inner_err}")
        return None

@app.route('/')
def home():
    return "Python Backend is running!"

@app.route('/api/register', methods=['POST', 'OPTIONS']) 
def register_user():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200

    
    data = request.get_json()
    if not data or not all(k in data for k in ('username', 'email', 'password', 'firstName', 'lastName')):
        return jsonify({"error": "Missing required fields"}), 400

    username = data['username']
    email = data['email']
    raw_password = data['password']
    first_name = data['firstName']
    last_name = data['lastName']
    user_role = data.get('role', 'CLIENT') 
    client_phone = data.get('clientPhone', None) 

    if len(raw_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400

    hashed_password = generate_password_hash(raw_password)

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        conn.start_transaction() 

        
        cursor.execute("SELECT user_id FROM USERS WHERE user_name = %s OR user_email = %s", (username, email))
        existing_user = cursor.fetchone()
        if existing_user:
            conn.rollback() 
            return jsonify({"error": "Username or email already exists"}), 409 

        
        sql_insert_user = """
        INSERT INTO USERS (user_name, user_password, user_email, user_first_name, user_last_name, user_role)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        user_data_tuple = (username, hashed_password, email, first_name, last_name, user_role)
        cursor.execute(sql_insert_user, user_data_tuple)
        new_user_id = cursor.lastrowid

        if not new_user_id: 
            conn.rollback()
            return jsonify({"error": "Failed to create user entry."}), 500

        
        if user_role == 'CLIENT':
            sql_insert_client = "INSERT INTO CLIENTS (user_id, client_phone) VALUES (%s, %s)"
            client_data_tuple = (new_user_id, client_phone)
            cursor.execute(sql_insert_client, client_data_tuple)

        conn.commit() 
        return jsonify({"message": "User registered successfully", "userId": new_user_id}), 201

    except mysql.connector.Error as err:
        if conn.is_connected(): 
            conn.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected(): 
            cursor.close()
            conn.close()

@app.route('/api/login', methods=['POST', 'OPTIONS']) 
def login_user():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200

    
    data = request.get_json()
    if not data or not ('email' in data or 'username' in data) or not 'password' in data:
        return jsonify({"error": "Missing email/username or password"}), 400

    identifier = data.get('email') or data.get('username')
    raw_password = data['password']

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT user_id, user_name, user_password, user_role, user_first_name, user_last_name, user_email FROM USERS WHERE user_email = %s OR user_name = %s"
        cursor.execute(query, (identifier, identifier))
        user = cursor.fetchone()

        if user and check_password_hash(user['user_password'], raw_password):
            user_info = {
                "userId": user['user_id'],
                "username": user['user_name'],
                "email": user['user_email'], 
                "firstName": user['user_first_name'],
                "lastName": user['user_last_name'],
                "role": user['user_role']
            }
            
            return jsonify({"message": "Login successful", "user": user_info}), 200
        else:
            return jsonify({"error": "Invalid credentials"}), 401

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/data', methods=['GET', 'OPTIONS']) 
def get_data():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200

    
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
       
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            )
        """)
        
        cursor.execute("SELECT COUNT(*) as count FROM items")
        if cursor.fetchone()['count'] == 0:
            cursor.execute("INSERT INTO items (name) VALUES (%s), (%s)", ("Demo Item 1", "Demo Item 2"))
            conn.commit() 
        cursor.execute("SELECT * FROM items")
        items = cursor.fetchall()
        return jsonify(items)
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/user/profile', methods=['GET', 'OPTIONS'])
def get_user_profile():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200
    
    user_id = request.args.get('userId') 
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT u.user_id, u.user_name, u.user_email, u.user_first_name, u.user_last_name, u.user_role,
                   c.client_address, c.client_bank_info, c.client_balance, c.client_contract_info, c.client_phone
            FROM USERS u
            LEFT JOIN CLIENTS c ON u.user_id = c.user_id
            WHERE u.user_id = %s
        """
        cursor.execute(query, (user_id,))
        user_profile = cursor.fetchone()

        if not user_profile:
            return jsonify({"error": "User not found"}), 404
        
        profile_data = {
            "userId": user_profile["user_id"],
            "username": user_profile["user_name"],
            "email": user_profile["user_email"],
            "firstName": user_profile["user_first_name"],
            "lastName": user_profile["user_last_name"],
            "role": user_profile["user_role"],
            "phone": user_profile.get("client_phone"), 
            "balance": user_profile.get("client_balance", 0.00) 
           
        }
        return jsonify(profile_data), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/user/profile', methods=['PUT', 'OPTIONS'])
def update_user_profile():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200
    
    user_id = request.args.get('userId') 
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
        
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    email = data.get('email')
    phone = data.get('phone') 
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        conn.start_transaction()
        
        user_update_fields = []
        user_update_values = []
        if first_name is not None:
            user_update_fields.append("user_first_name = %s")
            user_update_values.append(first_name)
        if last_name is not None:
            user_update_fields.append("user_last_name = %s")
            user_update_values.append(last_name)
        if email is not None:
            
            cursor.execute("SELECT user_id FROM USERS WHERE user_email = %s AND user_id != %s", (email, user_id))
            if cursor.fetchone():
                conn.rollback()
                return jsonify({"error": "Email already in use by another account."}), 409
            user_update_fields.append("user_email = %s")
            user_update_values.append(email)
        
        if user_update_fields:
            sql_update_user = f"UPDATE USERS SET {', '.join(user_update_fields)} WHERE user_id = %s"
            cursor.execute(sql_update_user, (*user_update_values, user_id))

        
        cursor.execute("SELECT user_role FROM USERS WHERE user_id = %s", (user_id,))
        user_role_result = cursor.fetchone()
        if user_role_result and user_role_result[0] == 'CLIENT':
            client_update_fields = []
            client_update_values = []
            if phone is not None:
                
                cursor.execute("SELECT user_id FROM CLIENTS WHERE client_phone = %s AND user_id != %s", (phone, user_id))
                if cursor.fetchone():
                    conn.rollback()
                    return jsonify({"error": "Phone number already in use by another account."}), 409
                client_update_fields.append("client_phone = %s")
                client_update_values.append(phone)
            
            
            if client_update_fields:
                sql_update_client = f"UPDATE CLIENTS SET {', '.join(client_update_fields)} WHERE user_id = %s"
                cursor.execute(sql_update_client, (*client_update_values, user_id))
            elif phone is not None: 
                                    
                pass


        conn.commit()
        return jsonify({"message": "Profile updated successfully"}), 200
    except mysql.connector.Error as err:
        if conn.is_connected(): conn.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/user/change-password', methods=['POST', 'OPTIONS'])
def change_user_password():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200

    user_id = request.args.get('userId') 
    if not user_id: return jsonify({"error": "User ID is required"}), 400

    data = request.get_json()
    if not data or not all(k in data for k in ('currentPassword', 'newPassword')):
        return jsonify({"error": "Current and new password are required"}), 400

    current_password_raw = data['currentPassword']
    new_password_raw = data['newPassword']

    if len(new_password_raw) < 6: 
        return jsonify({"error": "New password must be at least 6 characters long"}), 400

    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT user_password FROM USERS WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if not check_password_hash(user['user_password'], current_password_raw):
            return jsonify({"error": "Incorrect current password"}), 401
        
        new_hashed_password = generate_password_hash(new_password_raw)
        cursor.execute("UPDATE USERS SET user_password = %s WHERE user_id = %s", (new_hashed_password, user_id))
        conn.commit()
        return jsonify({"message": "Password changed successfully"}), 200
    except mysql.connector.Error as err:
        if conn.is_connected(): conn.rollback() 
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.route('/api/materials', methods=['GET', 'OPTIONS'])
def get_materials():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200

    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        
        
        query = "SELECT material_id, material_name, material_color, material_type, material_properties, material_quantity, material_unit FROM MATERIAL WHERE material_quantity > 0" # Εμφάνισε μόνο όσα είναι σε απόθεμα
        
        cursor.execute(query)
        materials = cursor.fetchall()
        return jsonify(materials), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.route('/api/printers', methods=['GET', 'OPTIONS'])
def get_printers():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200
    
    
    printer_types_from_db = [] 
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT DISTINCT printer_type FROM PRINTER WHERE printer_availability = TRUE") # Μόνο διαθέσιμοι
            results = cursor.fetchall()
            printer_types_from_db = [row['printer_type'] for row in results if row['printer_type']]
        except mysql.connector.Error as err:
            print(f"Error fetching printer types: {err}")
        finally:
            if conn.is_connected():
                cursor.close()
                conn.close()
    
    
    default_printer_types = ["SLA", "SLS", "FDM", "DLP", "MJF", "EBM"]
    
    available_types = sorted(list(set(printer_types_from_db + default_printer_types)))

    return jsonify(available_types), 200



@app.route('/api/orders', methods=['POST', 'OPTIONS'])
def create_order():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200

    user_id = request.args.get('userId') 
    if not user_id: return jsonify({"error": "User ID is required"}), 400
        
    data = request.get_json()
    if not data: return jsonify({"error": "No order data provided"}), 400

    
    
    
    selected_file_name = data.get('fileName') 
    printer_type = data.get('printerType')
    print_quality = data.get('printQuality')
    material_name = data.get('materialName') 
    material_color = data.get('materialColor') 
    
    
    order_cost = 10.00 

    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor()
    try:
        
        found_material_id = None
        if material_name:
            mat_query = "SELECT material_id FROM MATERIAL WHERE material_name = %s"
            mat_params = [material_name]
            if material_color:
                mat_query += " AND material_color = %s"
                mat_params.append(material_color)
            mat_query += " LIMIT 1"
            cursor.execute(mat_query, tuple(mat_params))
            mat_result = cursor.fetchone()
            if mat_result:
                found_material_id = mat_result[0]
            else:
                return jsonify({"error": f"Material '{material_name}' (Color: {material_color}) not found."}), 404
        else: 
             return jsonify({"error": "Material information is required."}), 400


        
        cursor.execute("SELECT client_balance FROM CLIENTS WHERE user_id = %s", (user_id,))
        client = cursor.fetchone()
        if not client or client[0] < order_cost:
            return jsonify({"error": "Insufficient balance to place order."}), 402 

        conn.start_transaction()
        
        
        sql_insert_order = """
        INSERT INTO `ORDER` (client_user_id, material_id, assigned_printer_id, order_status, 
                             order_cost, order_settings, order_submit_date) 
        VALUES (%s, %s, %s, %s, %s, %s, NOW()) 
        """
        
        order_settings_text = f"File: {selected_file_name}, Type: {printer_type}, Quality: {print_quality}" 

        
        order_data_tuple = (user_id, found_material_id, None, 'PENDING', order_cost, order_settings_text)
        cursor.execute(sql_insert_order, order_data_tuple)
        new_order_id = cursor.lastrowid

        
        new_balance = client[0] - order_cost
        cursor.execute("UPDATE CLIENTS SET client_balance = %s WHERE user_id = %s", (new_balance, user_id))

       

        conn.commit()
        
        
        return jsonify({"message": "Order placed successfully", "orderId": new_order_id, "newBalance": new_balance}), 201

    except mysql.connector.Error as err:
        if conn.is_connected(): conn.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/orders', methods=['GET', 'OPTIONS'])
def get_user_orders():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200
    
    user_id = request.args.get('userId')
    if not user_id: return jsonify({"error": "User ID is required"}), 400

    status_filter = request.args.get('status') 

    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT o.order_id, o.order_status, o.order_time_estimate_minutes, o.order_cost, 
                   o.order_settings, o.order_submit_date, o.order_completion_date,
                   m.material_name, m.material_color, m.material_type,
                   p.printer_name
            FROM `ORDER` o
            JOIN MATERIAL m ON o.material_id = m.material_id
            LEFT JOIN PRINTER p ON o.assigned_printer_id = p.printer_id
            WHERE o.client_user_id = %s
        """
        params = [user_id]
        if status_filter:
            if status_filter == 'pending': 
                query += " AND o.order_status IN ('PENDING', 'PROCESSING', 'PRINTING', 'AWAITING_PAYMENT')"
            elif status_filter == 'history': 
                query += " AND o.order_status IN ('COMPLETED', 'CANCELLED', 'SHIPPED')"
            else: 
                query += " AND o.order_status = %s"
                params.append(status_filter)
        
        query += " ORDER BY o.order_submit_date DESC"
        cursor.execute(query, tuple(params))
        orders = cursor.fetchall()

        
        processed_orders = []
        for order in orders:
            
            settings_parts = {}
            if order.get('order_settings'):
                try:
                    parts = order['order_settings'].split(', ')
                    for part in parts:
                        if ':' in part:
                            key, value = part.split(':', 1)
                            settings_parts[key.strip().lower().replace(' ', '')] = value.strip()
                except Exception:
                    pass


            processed_order = {
                "id": order["order_id"],
                "status": order["order_status"],
                "submittedAt": order["order_submit_date"].isoformat() if order.get("order_submit_date") else None,
                "completedAt": order["order_completion_date"].isoformat() if order.get("order_completion_date") else None,
                "cancelledAt": None, 
                "cost": order["order_cost"],
                "fileName": settings_parts.get("file", "N/A"),
                "printerType": settings_parts.get("type", "N/A"),
                "printQuality": settings_parts.get("quality", "N/A"),
                "filaments": [f"{order.get('material_name', '')} ({order.get('material_color', '')}, {order.get('material_type', '')})"], 
                "needsSupport": "support" in settings_parts, 
                "assignedPrinter": order.get("printer_name")
            }
            if order["order_status"] == 'CANCELLED': 
                 processed_order["cancelledAt"] = order["order_completion_date"].isoformat() if order.get("order_completion_date") else order["order_submit_date"].isoformat()


            processed_orders.append(processed_order)
        
        return jsonify(processed_orders), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()


@app.route('/api/orders/<int:order_id>/cancel', methods=['POST', 'OPTIONS'])
def cancel_order(order_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200

    user_id = request.args.get('userId') 
    if not user_id: return jsonify({"error": "User ID is required"}), 400

    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        
        cursor.execute("SELECT order_status, order_cost FROM `ORDER` WHERE order_id = %s AND client_user_id = %s", (order_id, user_id))
        order = cursor.fetchone()

        if not order:
            return jsonify({"error": "Order not found or you do not have permission to cancel it."}), 404
        
       
        cancellable_statuses = ['PENDING', 'AWAITING_PAYMENT'] 
        if order['order_status'] not in cancellable_statuses:
            return jsonify({"error": f"Order cannot be cancelled. Status: {order['order_status']}"}), 400

        conn.start_transaction()
        
        
        cursor.execute("UPDATE `ORDER` SET order_status = 'CANCELLED' WHERE order_id = %s", (order_id,))
        
        
        order_cost = order['order_cost']
        cursor.execute("UPDATE CLIENTS SET client_balance = client_balance + %s WHERE user_id = %s", (order_cost, user_id))
        
        
        
        conn.commit()
        return jsonify({"message": "Order cancelled successfully. Amount refunded to balance."}), 200
    except mysql.connector.Error as err:
        if conn.is_connected(): conn.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()



@app.route('/api/transactions', methods=['GET', 'OPTIONS'])
def get_transaction_history():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight request successful'}), 200

    user_id = request.args.get('userId')
    if not user_id: return jsonify({"error": "User ID is required"}), 400

    
    conn = get_db_connection()
    if not conn: return jsonify({"error": "Database connection failed"}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT 
                order_id as id, 
                order_id,
                order_submit_date as transactionDate, 
                order_cost as transactionAmount,
                'debit' as transactionType,
                order_status as status,
                order_settings -- Περιέχει το fileName, type, quality
            FROM `ORDER` 
            WHERE client_user_id = %s AND order_status NOT IN ('PENDING', 'AWAITING_PAYMENT') 
            UNION ALL
            SELECT 
                CONCAT('refund-', order_id) as id, 
                order_id,
                order_completion_date as transactionDate, -- Ή μια νέα στήλη 'refund_date'
                order_cost as transactionAmount,
                'refund' as transactionType,
                'Refund for cancelled order' as status,
                order_settings
            FROM `ORDER`
            WHERE client_user_id = %s AND order_status = 'CANCELLED'
            ORDER BY transactionDate DESC
        """
        cursor.execute(query, (user_id, user_id))
        raw_transactions = cursor.fetchall()
        
        transactions = []
        for tx in raw_transactions:
            settings_parts = {}
            if tx.get('order_settings'):
                try:
                    parts = tx['order_settings'].split(', ')
                    for part in parts:
                        if ':' in part:
                            key, value = part.split(':', 1)
                            settings_parts[key.strip().lower().replace(' ', '')] = value.strip()
                except Exception:
                    pass
            
            transactions.append({
                "id": tx["id"],
                "orderId": tx["order_id"],
                "transactionDate": tx["transactionDate"].isoformat() if tx.get("transactionDate") else None,
                "transactionAmount": tx["transactionAmount"],
                "transactionType": tx["transactionType"],
                "status": tx["status"], 
                "fileName": settings_parts.get("file", "N/A"),
                "printerType": settings_parts.get("type", "N/A"),
                "printQuality": settings_parts.get("quality", "N/A"),
                 
            })

        return jsonify(transactions), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5001)