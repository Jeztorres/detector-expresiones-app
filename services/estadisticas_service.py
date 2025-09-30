# services/estadisticas_service.py
from datetime import datetime
from repositories.estadisticas_repository import EstadisticasRepository

class ValidationError(Exception):
    pass

class EstadisticasService:
    def __init__(self, repo: EstadisticasRepository | None = None):
        self.repo = repo or EstadisticasRepository()

    def _val_fecha(self, s: str) -> str:
        """
        Acepta 'YYYY-MM-DD'. Devuelve la misma cadena si el formato es válido.
        """
        if not s or len(s.strip()) != 10:
            raise ValidationError("La fecha debe tener formato YYYY-MM-DD")
        try:
            datetime.strptime(s.strip(), "%Y-%m-%d")
        except ValueError:
            raise ValidationError("Formato de fecha inválido (usa YYYY-MM-DD)")
        return s.strip()

    def por_fecha(self, tipo: str, desde: str, hasta: str):
        t = (tipo or "").strip().lower()
        if t not in ("boca", "cejas", "parpadeo"):
            raise ValidationError("tipo debe ser 'boca' | 'cejas' | 'parpadeo'")
        d = self._val_fecha(desde)
        h = self._val_fecha(hasta)
        rows = self.repo.resumen_por_fecha(t, d, h)
        # total por estado si aplica
        total = {}
        for r in rows:
            for k, v in r.items():
                if k in ("fecha",): 
                    continue
                if isinstance(v, (int, float)):
                    total[k] = total.get(k, 0) + v
        return {"tipo": t, "desde": d, "hasta": h, "series": rows, "totales": total}

    def ultimos_30(self, tipo: str):
        t = (tipo or "").strip().lower()
        if t not in ("boca", "cejas", "parpadeo"):
            raise ValidationError("tipo debe ser 'boca' | 'cejas' | 'parpadeo'")
        rows = self.repo.resumen_ultimos_30(t)
        total = {}
        for r in rows:
            for k, v in r.items():
                if k in ("fecha",): 
                    continue
                if isinstance(v, (int, float)):
                    total[k] = total.get(k, 0) + v
        return {"tipo": t, "rango": "ultimos_30_dias", "series": rows, "totales": total}
