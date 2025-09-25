from flask import Blueprint, request, jsonify
from src.services.gesto_service import GestoService, ValidationError
import traceback

bp = Blueprint("gestos", __name__, url_prefix="/api")
service = GestoService()

@bp.post("/gestos")
def registrar_gesto():
    try:
        print("📨 Petición recibida en /api/gestos")
        data = request.get_json(silent=True) or {}
        print(f"📄 Datos recibidos: {data}")
        
        tipo = data.get("tipo_gesto")
        estado = data.get("estado")
        print(f"🎯 Procesando: tipo={tipo}, estado={estado}")
        
        gesto = service.registrar_gesto(tipo, estado)
        print("✅ Gesto registrado exitosamente")
        
        return jsonify({"mensaje": "Gesto registrado", "tipo": gesto.tipo, "estado": gesto.estado, "fecha": gesto.fecha.isoformat()+"Z"}), 201
    except ValidationError as ve:
        print(f"❌ Error de validación: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"💥 Error interno: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return jsonify({"error": f"Error interno del servidor: {str(e)}"}), 500

@bp.get("/gestos")
def obtener_gestos():
    """Obtiene todos los gestos guardados"""
    try:
        print("📋 Obteniendo historial de gestos")
        gestos = service.obtener_historial()
        print(f"✅ Se encontraron {len(gestos)} gestos")
        return jsonify(gestos), 200
    except Exception as e:
        print(f"💥 Error obteniendo gestos: {e}")
        return jsonify({"error": f"Error obteniendo gestos: {str(e)}"}), 500
