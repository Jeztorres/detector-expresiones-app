from src.config.database import Database
from src.models.gesto import Gesto
from datetime import date

class GestoRepository:
    """
    Capa de acceso a datos para los gestos.
    Se encarga de todas las operaciones de base de datos (CRUD) para los gestos.
    """

    def _get_table_name(self, tipo_gesto):
        """
        Devuelve el nombre de la tabla de historial basado en el tipo de gesto.
        Esto permite que la lógica funcione para parpadeos, cejas y boca.
        """
        if tipo_gesto == 'parpadeo':
            return 'parpadeos_hist'
        elif tipo_gesto == 'cejas':
            return 'cejas_hist'
        elif tipo_gesto == 'boca':
            return 'boca_hist'
        else:
            # Si el tipo de gesto no es válido, se lanza un error.
            raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

    def save(self, tipo_gesto: str, estado: str):
        """
        Guarda un nuevo registro de gesto en la tabla correspondiente.

        Args:
            tipo_gesto (str): El tipo de gesto (e.g., 'parpadeo').
            estado (str): El estado del gesto (e.g., 'cerrado').
        """
        connection = None
        cursor = None
        try:
            table_name = self._get_table_name(tipo_gesto)
            # La sentencia SQL se formatea de forma segura para evitar inyección SQL.
            sql = f"INSERT INTO {table_name} (tipo_gesto, estado) VALUES (%s, %s)"

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor()
                cursor.execute(sql, (tipo_gesto, estado))
                connection.commit()
                print(f"✅ Gesto '{tipo_gesto}: {estado}' guardado en la tabla '{table_name}'.")
        except Exception as e:
            print(f"❌ Error al guardar el gesto: {e}")
            # Si hay un error, se revierte cualquier cambio en la transacción.
            if connection:
                connection.rollback()
        finally:
            # Se asegura de que el cursor y la conexión se cierren correctamente.
            if cursor:
                cursor.close()
            if connection:
                connection.close()

    def get_stats_by_date(self, tipo_gesto: str, start_date: date, end_date: date):
        """
        Obtiene estadísticas de gestos (conteo por día) para un tipo de gesto
        y un rango de fechas.

        Args:
            tipo_gesto (str): El tipo de gesto a consultar.
            start_date (date): La fecha de inicio del rango.
            end_date (date): La fecha de fin del rango.

        Returns:
            list: Una lista de diccionarios, donde cada uno contiene 'fecha' y 'cantidad'.
        """
        connection = None
        cursor = None
        try:
            table_name = self._get_table_name(tipo_gesto)
            # Consulta SQL para contar gestos y agruparlos por día.
            sql = f"""
                SELECT DATE(timestamp) as fecha, COUNT(*) as cantidad
                FROM {table_name}
                WHERE DATE(timestamp) BETWEEN %s AND %s
                GROUP BY DATE(timestamp)
                ORDER BY fecha DESC
            """

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor(dictionary=True) # Devuelve resultados como diccionarios
                cursor.execute(sql, (start_date, end_date))
                results = cursor.fetchall()
                print(f"📊 Estadísticas obtenidas para '{tipo_gesto}' entre {start_date} y {end_date}.")
                return results
        except Exception as e:
            print(f"❌ Error al obtener estadísticas: {e}")
            return []
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()

        return []