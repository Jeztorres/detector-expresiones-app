from flask import Flask, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

# Cargar variables de entorno desde la raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / '.env'
load_dotenv(dotenv_path=ENV_PATH)

# Importar el controlador después de cargar las variables de entorno
from src.api.controllers.gestos_controller import gestos_controller

# Crear la instancia de la aplicación Flask
app = Flask(__name__)

# Configurar CORS para permitir solicitudes desde cualquier origen.
# En un entorno de producción, esto debería restringirse al dominio del frontend.
# CORS(app)  # Comentado porque usamos configuración personalizada abajo

# Registrar el Blueprint del controlador de gestos.
# Todas las rutas definidas en el controlador ahora estarán prefijadas con /api.
# Por ejemplo, /gestos se convertirá en /api/gestos.
app.register_blueprint(gestos_controller, url_prefix='/api')

# Lista de orígenes permitidos (producción + entornos locales comunes)
ALLOWED_ORIGINS = {
    'https://jeztorres.github.io',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:5501',
    'http://127.0.0.1:5502',
    'http://localhost:5502',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    # Puertos adicionales comunes de Live Server
    'http://127.0.0.1:8080',
    'http://localhost:8080',
    'http://127.0.0.1:8081',
    'http://localhost:8081',
    'http://127.0.0.1:3001',
    'http://localhost:3001',
}
ALLOWED_HOSTNAMES = {'localhost', '127.0.0.1'}

@app.before_request
def handle_preflight():
    """Responde rápidamente a preflights OPTIONS para CORS/PNA."""
    if request.method == 'OPTIONS':
        resp = app.make_response(('', 204))
        return resp

@app.after_request
def add_cors_headers(response):
    """Ajusta headers CORS para permitir peticiones desde cualquier origen local."""
    origin = request.headers.get('Origin')
    
    # Permitir cualquier puerto de localhost/127.0.0.1
    try:
        parsed = urlparse(origin) if origin else None
        if parsed and parsed.hostname in ALLOWED_HOSTNAMES:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Vary'] = 'Origin'
        else:
            response.headers['Access-Control-Allow-Origin'] = '*'
    except Exception:
        response.headers['Access-Control-Allow-Origin'] = '*'

    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    # Necesario para solicitudes desde contextos seguros a redes privadas (Chrome PNA)
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response

@app.route('/')
def index():
    """Ruta raíz simple para verificar que el servidor está funcionando."""
    return "<h1>🚀 Backend del Detector de Gestos está funcionando</h1>"


@app.route('/debug/fecha')
def debug_fecha():
    """Devuelve la fecha y hora actual del servidor para depuración."""
    ahora = datetime.now()
    return {
        'fecha_backend': ahora.date().isoformat(),
        'hora_backend': ahora.time().strftime('%H:%M:%S'),
        'timestamp': ahora.isoformat()
    }

if __name__ == '__main__':
    # Obtener el puerto del archivo .env, con un valor por defecto de 5000.
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')

    # Obtener el modo de depuración del archivo .env.
    # El modo de depuración reinicia automáticamente el servidor cuando se detectan cambios.
    debug_mode = os.getenv('DEBUG', 'False').lower() in ['true', '1']

    print(f"Iniciando servidor Flask en http://{host}:{port}")
    print(f"Modo de depuración: {'Activado' if debug_mode else 'Desactivado'}")

    # Iniciar la aplicación Flask.
    # host='0.0.0.0' hace que el servidor sea accesible desde fuera del contenedor/máquina.
    app.run(host=host, port=port, debug=debug_mode)
