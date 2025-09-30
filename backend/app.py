from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Cargar variables de entorno
# Se busca el .env en el directorio actual (backend/)
load_dotenv()

# Importar el controlador después de cargar las variables de entorno
from src.api.controllers.gestos_controller import gestos_controller

# Crear la instancia de la aplicación Flask
app = Flask(__name__)

# Configurar CORS para permitir solicitudes desde cualquier origen.
# En un entorno de producción, esto debería restringirse al dominio del frontend.
CORS(app)

# Registrar el Blueprint del controlador de gestos.
# Todas las rutas definidas en el controlador ahora estarán prefijadas con /api.
# Por ejemplo, /gestos se convertirá en /api/gestos.
app.register_blueprint(gestos_controller, url_prefix='/api')

@app.route('/')
def index():
    """
    Ruta raíz simple para verificar que el servidor está funcionando.
    """
    return "<h1>🚀 Backend del Detector de Gestos está funcionando</h1>"

if __name__ == '__main__':
    # Obtener el puerto del archivo .env, con un valor por defecto de 5000.
    port = int(os.getenv('PORT', 5000))

    # Obtener el modo de depuración del archivo .env.
    # El modo de depuración reinicia automáticamente el servidor cuando se detectan cambios.
    debug_mode = os.getenv('DEBUG', 'False').lower() in ['true', '1']

    print(f"🚀 Iniciando servidor Flask en http://127.0.0.1:{port}")
    print(f"🔧 Modo de depuración: {'Activado' if debug_mode else 'Desactivado'}")

    # Iniciar la aplicación Flask.
    # host='0.0.0.0' hace que el servidor sea accesible desde fuera del contenedor/máquina.
    app.run(host='0.0.0.0', port=port, debug=debug_mode)