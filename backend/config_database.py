#!/usr/bin/env python3
"""
Configuración de base de datos para el detector de expresiones.
Edita este archivo con los datos de tu base de datos.
"""

# ===== CONFIGURACIÓN DE TU BASE DE DATOS =====
# Reemplaza estos valores con los datos de tu base de datos

DATABASE_CONFIG = {
    'host': 'localhost',           # Dirección de tu servidor MySQL
    'port': 3306,                  # Puerto de MySQL (por defecto 3306)
    'user': 'tu_usuario',          # Tu usuario de MySQL
    'password': 'tu_password',     # Tu contraseña de MySQL
    'database': 'tu_base_de_datos' # Nombre de tu base de datos
}

# ===== CONFIGURACIÓN DEL SERVIDOR =====
SERVER_CONFIG = {
    'port': 5000,                  # Puerto del servidor Flask
    'debug': True,                 # Modo debug (True para desarrollo)
    'host': '0.0.0.0'             # Host del servidor
}

# ===== CONFIGURACIÓN PARA PRODUCCIÓN =====
# Si usas Heroku, Railway, o similar, configura aquí:
PRODUCTION_CONFIG = {
    'database_url': None,          # URL completa de la base de datos
    'environment': 'development'   # 'development' o 'production'
}

# ===== INSTRUCCIONES =====
"""
1. Edita los valores de DATABASE_CONFIG con los datos de tu base de datos
2. Si usas un servicio en la nube, configura PRODUCTION_CONFIG
3. Ejecuta: python setup_database.py
4. Ejecuta: python app.py
"""

if __name__ == "__main__":
    print("🔧 Configuración de Base de Datos")
    print("=" * 40)
    print("📝 Edita este archivo con los datos de tu base de datos")
    print("🗄️  Host:", DATABASE_CONFIG['host'])
    print("👤 Usuario:", DATABASE_CONFIG['user'])
    print("🗃️  Base de datos:", DATABASE_CONFIG['database'])
    print("\n🚀 Después de configurar, ejecuta:")
    print("   python setup_database.py")
    print("   python app.py")
