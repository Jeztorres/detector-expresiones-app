from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app) 

DB_CONFIG = {
    'host': 'localhost',
    'database': 'gestos_db',
    'user': 'root', # ¡Cambia 'root' por tu usuario!
    'password': 'tu_contraseña_mysql' # ¡Cambia por tu contraseña!
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None

@app.route('/api/gestos', methods=['POST'])
def registrar_gesto():
    if not request.json or 'tipo_gesto' not in request.json or 'estado' not in request.json:
        return jsonify({"error": "Datos inválidos. Se esperan 'tipo_gesto' y 'estado'."}), 400

    tipo_gesto = request.json['tipo_gesto']
    estado = request.json['estado']

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

    try:
        cursor = conn.cursor()

        if tipo_gesto == 'parpadeo':
            cursor.callproc('sp_insertar_estado_parpadeo', (estado,))
        elif tipo_gesto == 'cejas':
            cursor.callproc('sp_insertar_estado_ceja', (estado,))
        elif tipo_gesto == 'boca':
            cursor.callproc('sp_insertar_estado_boca', (estado,))
        else:
            return jsonify({"error": "Tipo de gesto no válido"}), 400

        conn.commit()
        return jsonify({"mensaje": f"Gesto '{tipo_gesto}' con estado '{estado}' registrado."}), 201

    except Error as e:
        conn.rollback()
        print(f"Error en la consulta SQL: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(port=5000, debug=True)