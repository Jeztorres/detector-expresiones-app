# api/controllers/estadisticas_controller.py
from flask import Blueprint, request, jsonify
from src.services.estadisticas_service import EstadisticasService, ValidationError

bp_stats = Blueprint("estadisticas", __name__, url_prefix="/api")
service = EstadisticasService()

@bp_stats.get("/estadisticas/gesto")
def estadisticas_por_fecha():
    """
    GET /api/estadisticas/gesto?tipo=boca|cejas|parpadeo&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
    """
    try:
        tipo = request.args.get("tipo")
        desde = request.args.get("desde")
        hasta = request.args.get("hasta")
        if not (tipo and desde and hasta):
            return jsonify({"error": "Faltan parámetros: tipo, desde, hasta"}), 400
        data = service.por_fecha(tipo, desde, hasta)
        return jsonify(data), 200
    except ValidationError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as ex:
        # opcional: loggear ex
        return jsonify({"error": "Error interno del servidor"}), 500

@bp_stats.get("/estadisticas/gesto/ultimos30")
def estadisticas_ultimos_30():
    """
    GET /api/estadisticas/gesto/ultimos30?tipo=boca|cejas|parpadeo
    """
    try:
        tipo = request.args.get("tipo")
        if not tipo:
            return jsonify({"error": "Falta parámetro: tipo"}), 400
        data = service.ultimos_30(tipo)
        return jsonify(data), 200
    except ValidationError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception:
        return jsonify({"error": "Error interno del servidor"}), 500
