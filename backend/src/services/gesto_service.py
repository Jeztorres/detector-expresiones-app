from src.repositories.gesto_repository import GestoRepository
from datetime import date
from decimal import Decimal

class GestoService:
    """
    Capa de servicio para la lógica de negocio de los gestos.
    Actúa como intermediario entre los controladores de la API y el repositorio de datos.
    """
    def __init__(self):
        # Al crear una instancia del servicio, también se crea una instancia del repositorio.
        self.gesto_repository = GestoRepository()

    def save_gesto(self, tipo_gesto: str, estado: str):
        """
        Procesa y guarda un gesto.

        Args:
            tipo_gesto (str): El tipo de gesto a guardar.
            estado (str): El estado del gesto.
        """
        # Por ahora, la lógica es simple y solo llama al repositorio.
        # En una aplicación más compleja, aquí se podrían añadir validaciones,
        # notificaciones u otra lógica de negocio.
        try:
            self.gesto_repository.save(tipo_gesto, estado)
            return {"message": f"Gesto '{tipo_gesto}' guardado exitosamente."}
        except Exception as e:
            # Captura cualquier excepción y devuelve un mensaje de error.
            return {"error": str(e)}

    def get_statistics(self, tipo_gesto: str, start_date_str: str, end_date_str: str):
        """
        Obtiene y formatea las estadísticas de gestos para un rango de fechas.

        Args:
            tipo_gesto (str): El tipo de gesto a consultar.
            start_date_str (str): La fecha de inicio en formato 'YYYY-MM-DD'.
            end_date_str (str): La fecha de fin en formato 'YYYY-MM-DD'.

        Returns:
            list: Una lista de diccionarios con las estadísticas.
        """
        try:
            # Convierte las fechas de string a objetos date.
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)

            stats = self.gesto_repository.get_stats_by_date(tipo_gesto, start_date, end_date)

            # Asegura que la fecha se devuelva en formato string 'YYYY-MM-DD'.
            for item in stats:
                fecha = item.get('fecha')
                if isinstance(fecha, date):
                    item['fecha'] = fecha.isoformat()
                cantidad = item.get('cantidad')
                if isinstance(cantidad, Decimal):
                    item['cantidad'] = int(cantidad)

            return stats
        except Exception as e:
            print(f"❌ Error en el servicio al obtener estadísticas: {e}")
            return []

    def get_stats_last_30_days(self, tipo_gesto: str):
        """
        Obtiene estadísticas para los últimos 30 días usando stored procedures.
        """
        try:
            stats = self.gesto_repository.get_stats_last_30_days(tipo_gesto)

            # Asegurar que las fechas se devuelvan en formato string 'YYYY-MM-DD'.
            for item in stats:
                fecha = item.get('fecha')
                if isinstance(fecha, date):
                    item['fecha'] = fecha.isoformat()
                cantidad = item.get('cantidad')
                if isinstance(cantidad, Decimal):
                    item['cantidad'] = int(cantidad)

            return stats
        except Exception as e:
            print(f"❌ Error en el servicio al obtener estadísticas de últimos 30 días: {e}")
            return []
