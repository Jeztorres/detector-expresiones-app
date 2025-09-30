from flask import Blueprint, request, jsonify
from src.services.gesto_service import GestoService

# Crear un Blueprint, que es un conjunto de rutas que se pueden registrar en la aplicación principal.
# Esto ayuda a mantener el código organizado.
gestos_controller = Blueprint('gestos_controller', __name__)

# Crear una única instancia del servicio para ser utilizada por todas las solicitudes.
gesto_service = GestoService()

@gestos_controller.route('/gestos', methods=['POST'])
def save_gesto():
    """
    Endpoint para guardar un nuevo gesto.
    Espera un JSON con 'tipo_gesto' y 'estado'.
    """
    data = request.get_json()
    if not data or 'tipo_gesto' not in data or 'estado' not in data:
        return jsonify({"error": "Datos incompletos. Se requiere 'tipo_gesto' y 'estado'."}), 400

    tipo_gesto = data['tipo_gesto']
    estado = data['estado']

    # Llama al servicio para guardar el gesto.
    result = gesto_service.save_gesto(tipo_gesto, estado)

    if "error" in result:
        return jsonify(result), 500

    return jsonify(result), 201 # 201 Created

@gestos_controller.route('/estadisticas/<string:tipo_gesto>', methods=['GET'])
def get_stats(tipo_gesto):
    """
    Endpoint para obtener estadísticas por fecha.
    Espera los parámetros 'fecha_inicio' y 'fecha_fin' en la URL.
    """
    # Obtener los parámetros de la URL (query parameters).
    start_date_str = request.args.get('fecha_inicio')
    end_date_str = request.args.get('fecha_fin')

    if not start_date_str or not end_date_str:
        return jsonify({"error": "Se requieren los parámetros 'fecha_inicio' y 'fecha_fin'."}), 400

    # Llama al servicio para obtener las estadísticas.
    stats = gesto_service.get_statistics(tipo_gesto, start_date_str, end_date_str)
    return jsonify(stats), 200

@gestos_controller.route('/estadisticas/<string:tipo_gesto>/ultimos30', methods=['GET'])
def get_stats_last_30(tipo_gesto):
    """
    Endpoint para obtener estadísticas de los últimos 30 días.
    """
    # Llama al servicio para obtener las estadísticas de los últimos 30 días.
    stats = gesto_service.get_stats_last_30_days(tipo_gesto)
    return jsonify(stats), 200

# Endpoint de prueba para verificar que el backend está funcionando.
@gestos_controller.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint de "health check" para verificar que la API está en línea.
    """
    return jsonify({"status": "ok", "message": "API de gestos funcionando."}), 200
