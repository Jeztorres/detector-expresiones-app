#!/usr/bin/env python3
"""
Revisar los stored procedures existentes
"""

from src.config.database import Database

def verificar_stored_procedures():
    """Revisar qué stored procedures existen"""
    print("🔍 VERIFICANDO STORED PROCEDURES")
    print("=" * 50)
    
    connection = None
    cursor = None
    
    try:
        connection = Database.get_connection()
        if not connection:
            print("❌ No se pudo conectar a la base de datos")
            return
            
        cursor = connection.cursor(dictionary=True)
        
        # Verificar stored procedures existentes
        print("\n📋 STORED PROCEDURES EXISTENTES:")
        cursor.execute("SHOW PROCEDURE STATUS WHERE Db = 'gestos_db'")
        procedures = cursor.fetchall()
        
        for proc in procedures:
            print(f"  ✅ {proc['Name']}")
            
        # Verificar estructura de una tabla
        print(f"\n📊 ESTRUCTURA DE parpadeos_hist:")
        cursor.execute("DESCRIBE parpadeos_hist")
        columns = cursor.fetchall()
        
        for col in columns:
            print(f"  - {col['Field']}: {col['Type']} {col['Key']}")
            
        # Ver últimos registros con más detalle
        print(f"\n📊 ÚLTIMOS 3 REGISTROS DE parpadeos_hist:")
        cursor.execute("SELECT * FROM parpadeos_hist ORDER BY id DESC LIMIT 3")
        records = cursor.fetchall()
        
        for record in records:
            print(f"  ID: {record['id']}, Estado: {record['estado']}, Fecha: {record['fecha_hora']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    verificar_stored_procedures()