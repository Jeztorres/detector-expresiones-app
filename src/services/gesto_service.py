from datetime import datetime
from src.models.gesto import Gesto, TipoGesto
from src.repositories.gesto_repository import GestoRepository

class ValidationError(Exception):
    pass

def _norm(s: str) -> str:
    return (s or "").strip().lower()

class GestoService:
    """
    Reglas de negocio:
    - parpadeo: 'cerrado' o 'abierto'
    - cejas: 'arqueadas' o 'normal'
    - boca: 'abierta' o 'cerrada'
    Se aceptan sinónimos comunes y se mapean al conjunto anterior.
    """
    def __init__(self, repo: GestoRepository | None = None):
        self.repo = repo or GestoRepository()

    def registrar_gesto(self, tipo: TipoGesto, estado: str) -> Gesto:
        t = _norm(tipo)
        e = _norm(estado)

        if t not in ("parpadeo", "cejas", "boca"):
            raise ValidationError("tipo_gesto inválido")

        # ---- MAPEO DE SINÓNIMOS → ESTÁNDAR ----
        parp_map = {
            # estándar
            "cerrado": "cerrado", "abierto": "abierto",
            # sinónimos
            "close": "cerrado", "closed": "cerrado", "0": "cerrado",
            "open": "abierto", "opened": "abierto", "1": "abierto",
        }
        ceja_map = {
            "arqueadas": "arqueadas", "normal": "normal",
            # sinónimos
            "arriba": "arqueadas", "raised": "arqueadas", "up": "arqueadas",
            "abajo": "normal", "down": "normal", "neutral": "normal",
        }
        boca_map = {
            "abierta": "abierta", "cerrada": "cerrada",
            # sinónimos
            "open": "abierta", "close": "cerrada", "closed": "cerrada",
            "smile": "abierta", "sonrisa": "abierta", "seria": "cerrada",
        }
        maps = {"parpadeo": parp_map, "cejas": ceja_map, "boca": boca_map}

        if e not in maps[t]:
            raise ValidationError(f"estado inválido para {t}")

        est_normalizado = maps[t][e]
        gesto = Gesto(tipo=t, estado=est_normalizado, fecha=datetime.utcnow())

        # Persistir vía SP
        self.repo.insertar_estado(gesto.tipo, gesto.estado)
        return gesto

    def obtener_historial(self):
        """Obtiene el historial de gestos guardados"""
        return self.repo.obtener_todos_gestos()
