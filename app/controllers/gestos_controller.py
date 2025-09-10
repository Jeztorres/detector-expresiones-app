from flask import Blueprint, request, jsonify
from mysql.connector import Error

from ..config import DB_CONFIG
from ..models.database import Database
from ..models.gesto_model import GestoModel


gestos_bp = Blueprint('gestos', __name__)

database = Database(DB_CONFIG)
modelo = GestoModel(database)


@gestos_bp.route('/gestos', methods=['POST'])
def registrar_gesto():
    if not request.json or 'tipo_gesto' not in request.json or 'estado' not in request.json:
        return jsonify({"error": "Datos inválidos. Se esperan 'tipo_gesto' y 'estado'."}), 400

    tipo_gesto = request.json['tipo_gesto']
    estado = request.json['estado']

    try:
        modelo.insertar_gesto(tipo_gesto, estado)
        return jsonify({"mensaje": f"Gesto '{tipo_gesto}' con estado '{estado}' registrado."}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Error:
        return jsonify({"error": "Error interno del servidor"}), 500
