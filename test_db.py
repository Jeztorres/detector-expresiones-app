#!/usr/bin/env python3
"""Script para probar la conexión a la base de datos"""

import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

def test_connection():
    print("🔍 Probando conexión a la base de datos...")
    print(f"DB_HOST: {os.getenv('DB_HOST')}")
    print(f"DB_PORT: {os.getenv('DB_PORT')}")
    print(f"DB_USER: {os.getenv('DB_USER')}")
    print(f"DB_NAME: {os.getenv('DB_NAME')}")
    print("DB_PASSWORD: [OCULTA]")
    
    try:
        conn = mysql.connector.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            autocommit=True,
        )
        print("✅ Conexión exitosa!")
        
        # Probar una consulta simple
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        print(f"📋 Tablas encontradas: {tables}")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Error de conexión: {err}")
        print(f"   Código de error: {err.errno}")
        print(f"   Mensaje SQL: {err.msg}")
    except Exception as e:
        print(f"❌ Error general: {e}")

if __name__ == "__main__":
    test_connection()