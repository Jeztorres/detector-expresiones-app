from src.repositories.db import connection_factory
from typing import List, Dict, Any

class EstadisticasRepository:
    """Repositorio para manejo de estadísticas de gestos"""
    
    SP_RANGO = {
        "boca": "sp_resumen_boca_por_fecha",
        "cejas": "sp_resumen_cejas_por_fecha",
        "parpadeo": "sp_resumen_parpadeo_por_fecha",
    }
    
    SP_30 = {
        "boca": "sp_resumen_boca_ultimos_30",
        "cejas": "sp_resumen_cejas_ultimos_30",
        "parpadeo": "sp_resumen_parpadeo_ultimos_30",
    }
    
    def obtener_estadisticas_por_fecha(self, tipo: str, desde: str, hasta: str) -> Dict[str, Any]:
        """Obtiene estadísticas de gestos por rango de fechas"""
        if tipo not in self.SP_RANGO:
            raise ValueError(f"Tipo de gesto no válido: {tipo}")
            
        conn = connection_factory()
        cur = conn.cursor(dictionary=True)
        try:
            cur.callproc(self.SP_RANGO[tipo], (desde, hasta))
            rows = []
            for result in cur.stored_results():
                rows = result.fetchall()
                break
                
            # Calcular totales
            totales = {}
            for r in rows:
                for k, v in r.items():
                    if k == "fecha":
                        continue
                    if isinstance(v, (int, float)):
                        totales[k] = totales.get(k, 0) + v
                        
            return {
                "tipo": tipo,
                "desde": desde,
                "hasta": hasta,
                "series": rows,
                "totales": totales
            }
        finally:
            try:
                cur.close()
            except:
                pass
            try:
                conn.close()
            except:
                pass
    
    def obtener_estadisticas_ultimos_30(self, tipo: str) -> Dict[str, Any]:
        """Obtiene estadísticas de los últimos 30 días"""
        if tipo not in self.SP_30:
            raise ValueError(f"Tipo de gesto no válido: {tipo}")
            
        conn = connection_factory()
        cur = conn.cursor(dictionary=True)
        try:
            cur.callproc(self.SP_30[tipo])
            rows = []
            for result in cur.stored_results():
                rows = result.fetchall()
                break
                
            # Calcular totales
            totales = {}
            for r in rows:
                for k, v in r.items():
                    if k == "fecha":
                        continue
                    if isinstance(v, (int, float)):
                        totales[k] = totales.get(k, 0) + v
                        
            return {
                "tipo": tipo,
                "rango": "ultimos_30_dias",
                "series": rows,
                "totales": totales
            }
        finally:
            try:
                cur.close()
            except:
                pass
            try:
                conn.close()
            except:
                pass

# Flask Blueprint para las rutas
from flask import Blueprint, request, jsonify

bp_stats = Blueprint("estadisticas", __name__, url_prefix="/api")

# Instancia del repositorio para usar en las rutas
_repo = EstadisticasRepository()

@bp_stats.get("/estadisticas/gesto")
def por_fecha():
    tipo = (request.args.get("tipo") or "").strip().lower()
    desde = (request.args.get("desde") or "").strip()
    hasta = (request.args.get("hasta") or "").strip()

    if tipo not in _repo.SP_RANGO:
        return jsonify({"error": "tipo debe ser boca|cejas|parpadeo"}), 400
    if not (desde and hasta):
        return jsonify({"error": "faltan parámetros: desde, hasta (YYYY-MM-DD)"}), 400

    try:
        resultado = _repo.obtener_estadisticas_por_fecha(tipo, desde, hasta)
        return jsonify(resultado), 200
    except Exception:
        return jsonify({"error": "Error interno"}), 500

@bp_stats.get("/estadisticas/gesto/ultimos30")
def ultimos_30():
    tipo = (request.args.get("tipo") or "").strip().lower()
    if tipo not in _repo.SP_30:
        return jsonify({"error": "tipo debe ser boca|cejas|parpadeo"}), 400

    try:
        resultado = _repo.obtener_estadisticas_ultimos_30(tipo)
        return jsonify(resultado), 200
    except Exception:
        return jsonify({"error": "Error interno"}), 500
