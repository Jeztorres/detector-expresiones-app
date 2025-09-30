#!/usr/bin/env python3
"""
Servidor Flask configurado para el detector de expresiones.
Usa config_database.py para la configuración.
"""

from flask import Flask
from flask_cors import CORS
import sys
import os

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from config_database import DATABASE_CONFIG, SERVER_CONFIG, PRODUCTION_CONFIG
except ImportError:
    print("❌ Error: No se encontró config_database.py")
    print("📝 Ejecuta primero: python setup_with_config.py")
    sys.exit(1)

# Configurar variables de entorno para la base de datos
os.environ['DB_HOST'] = DATABASE_CONFIG['host']
os.environ['DB_PORT'] = str(DATABASE_CONFIG['port'])
os.environ['DB_USER'] = DATABASE_CONFIG['user']
os.environ['DB_PASSWORD'] = DATABASE_CONFIG['password']
os.environ['DB_NAME'] = DATABASE_CONFIG['database']

# Configurar entorno
if PRODUCTION_CONFIG['environment'] == 'production':
    os.environ['ENVIRONMENT'] = 'production'
    if PRODUCTION_CONFIG['database_url']:
        os.environ['DATABASE_URL'] = PRODUCTION_CONFIG['database_url']

# Importar el controlador después de configurar las variables de entorno
from src.api.controllers.gestos_controller import gestos_controller

# Crear la instancia de la aplicación Flask
app = Flask(__name__)

# Configurar CORS para permitir solicitudes desde cualquier origen
CORS(app)

# Registrar el Blueprint del controlador de gestos
app.register_blueprint(gestos_controller, url_prefix='/api')

@app.route('/')
def index():
    """
    Ruta raíz simple para verificar que el servidor está funcionando.
    """
    return f"""
    <h1>🚀 Backend del Detector de Gestos</h1>
    <p>✅ Servidor funcionando correctamente</p>
    <p>🌐 Entorno: {PRODUCTION_CONFIG['environment']}</p>
    <p>🗄️ Base de datos: {DATABASE_CONFIG['database']}</p>
    <p>🔗 API disponible en: <a href="/api/health">/api/health</a></p>
    <p>📊 Frontend: <a href="https://jeztorres.github.io/detector-expresiones-app/">GitHub Pages</a></p>
    """

@app.route('/api/health')
def health():
    """
    Endpoint de health check.
    """
    return {
        "status": "ok", 
        "message": "API de gestos funcionando correctamente",
        "environment": PRODUCTION_CONFIG['environment'],
        "database": DATABASE_CONFIG['database']
    }

if __name__ == '__main__':
    port = SERVER_CONFIG['port']
    debug_mode = SERVER_CONFIG['debug']
    host = SERVER_CONFIG['host']

    print(f"🚀 Iniciando servidor Flask en http://{host}:{port}")
    print(f"🔧 Modo de depuración: {'Activado' if debug_mode else 'Desactivado'}")
    print(f"🗄️ Base de datos: {DATABASE_CONFIG['database']}")
    print(f"🌐 Entorno: {PRODUCTION_CONFIG['environment']}")
    print(f"📊 Frontend: https://jeztorres.github.io/detector-expresiones-app/")

    # Iniciar la aplicación Flask
    app.run(host=host, port=port, debug=debug_mode)
