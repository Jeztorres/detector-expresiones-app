#!/usr/bin/env python3
"""
Script para configurar la base de datos usando config_database.py
"""

import mysql.connector
from mysql.connector import Error
import sys
import os

# Agregar el directorio actual al path para importar config_database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from config_database import DATABASE_CONFIG, SERVER_CONFIG
except ImportError:
    print("❌ Error: No se encontró config_database.py")
    print("📝 Asegúrate de que el archivo existe y está configurado correctamente")
    sys.exit(1)

def create_database():
    """Crear la base de datos y las tablas necesarias."""
    
    # Configuración de conexión (sin especificar base de datos)
    config = {
        'host': DATABASE_CONFIG['host'],
        'port': DATABASE_CONFIG['port'],
        'user': DATABASE_CONFIG['user'],
        'password': DATABASE_CONFIG['password']
    }
    
    try:
        # Conectar sin especificar base de datos
        print("🔌 Conectando a MySQL...")
        print(f"📍 Host: {config['host']}:{config['port']}")
        print(f"👤 Usuario: {config['user']}")
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # Crear base de datos
        db_name = DATABASE_CONFIG['database']
        print(f"📊 Creando base de datos '{db_name}'...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        print(f"✅ Base de datos '{db_name}' creada exitosamente")
        
        # Usar la base de datos
        cursor.execute(f"USE {db_name}")
        
        # Crear tabla de gestos
        print("📋 Creando tabla 'gestos'...")
        create_table_query = """
        CREATE TABLE IF NOT EXISTS gestos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tipo_gesto VARCHAR(50) NOT NULL,
            estado VARCHAR(50) NOT NULL,
            fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha DATE GENERATED ALWAYS AS (DATE(fecha_hora)) STORED,
            INDEX idx_tipo_gesto (tipo_gesto),
            INDEX idx_fecha (fecha),
            INDEX idx_tipo_fecha (tipo_gesto, fecha)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
        
        cursor.execute(create_table_query)
        print("✅ Tabla 'gestos' creada exitosamente")
        
        # Insertar datos de ejemplo
        print("📝 Insertando datos de ejemplo...")
        sample_data = [
            ('parpadeo', 'cerrado'),
            ('parpadeo', 'abierto'),
            ('cejas', 'arqueadas'),
            ('cejas', 'normal'),
            ('boca', 'abierta'),
            ('boca', 'cerrada')
        ]
        
        insert_query = "INSERT INTO gestos (tipo_gesto, estado) VALUES (%s, %s)"
        cursor.executemany(insert_query, sample_data)
        connection.commit()
        print("✅ Datos de ejemplo insertados")
        
        # Verificar la creación
        cursor.execute("SELECT COUNT(*) FROM gestos")
        count = cursor.fetchone()[0]
        print(f"📊 Total de registros en la tabla: {count}")
        
        print("\n🎉 ¡Base de datos configurada exitosamente!")
        print("🚀 Ahora puedes ejecutar: python app.py")
        print(f"🌐 Tu aplicación estará disponible en: http://localhost:{SERVER_CONFIG['port']}")
        
    except Error as e:
        print(f"❌ Error: {e}")
        print("\n🔧 Posibles soluciones:")
        print("1. Verifica que MySQL esté ejecutándose")
        print("2. Revisa los datos en config_database.py")
        print("3. Asegúrate de que el usuario tenga permisos")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("🔌 Conexión cerrada")
    
    return True

if __name__ == "__main__":
    print("🚀 Configurando base de datos para Detector de Gestos")
    print("=" * 50)
    
    # Verificar configuración
    if DATABASE_CONFIG['user'] == 'tu_usuario':
        print("⚠️  ADVERTENCIA: No has configurado tu base de datos")
        print("📝 Edita el archivo config_database.py con tus datos reales")
        print("\n📋 Datos necesarios:")
        print("   - Host de MySQL")
        print("   - Usuario de MySQL") 
        print("   - Contraseña de MySQL")
        print("   - Nombre de la base de datos")
        sys.exit(1)
    
    create_database()
