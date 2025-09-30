from src.config.database import Database
from src.models.gesto import Gesto
from datetime import date

class GestoRepository:
    """
    Capa de acceso a datos para los gestos.
    Se encarga de todas las operaciones de base de datos (CRUD) para los gestos.
    Utiliza stored procedures para guardar solo cambios de estado (transiciones).
    """

    def _get_stored_procedure_name(self, tipo_gesto):
        """
        Devuelve el nombre del stored procedure basado en el tipo de gesto.
        Estos procedimientos solo insertan cuando hay cambio de estado.
        """
        if tipo_gesto == 'parpadeo':
            return 'sp_insertar_estado_parpadeo'
        elif tipo_gesto == 'cejas':
            return 'sp_insertar_estado_ceja'
        elif tipo_gesto == 'boca':
            return 'sp_insertar_estado_boca'
        else:
            # Si el tipo de gesto no es válido, se lanza un error.
            raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

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
        Guarda un nuevo registro de gesto usando stored procedures que solo
        insertan cuando hay cambio de estado (transiciones).

        Args:
            tipo_gesto (str): El tipo de gesto (e.g., 'parpadeo').
            estado (str): El estado del gesto (e.g., 'cerrado').
        """
        connection = None
        cursor = None
        try:
            sp_name = self._get_stored_procedure_name(tipo_gesto)
            # Llamar al stored procedure que verifica transiciones
            sql = f"CALL {sp_name}(%s)"

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor()
                cursor.execute(sql, (estado,))
                connection.commit()

                # El SP solo inserta si hay cambio de estado
                print(f"✅ Estado '{tipo_gesto}: {estado}' procesado (solo se guarda si hay transición).")
        except Exception as e:
            print(f"❌ Error al procesar el estado del gesto: {e}")
            # Si hay un error, se revierte cualquier cambio en la transacción.
            if connection:
                try:
                    connection.rollback()
                except:
                    pass
        finally:
            # Se asegura de que el cursor y la conexión se cierren correctamente.
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass

    def get_stats_by_date(self, tipo_gesto: str, start_date: date, end_date: date):
        """
        Obtiene estadísticas detalladas de gestos por estado usando stored procedures.
        Ahora retorna conteos separados por cada estado (ej: abierta/cerrada para boca).

        Args:
            tipo_gesto (str): El tipo de gesto a consultar.
            start_date (date): La fecha de inicio del rango.
            end_date (date): La fecha de fin del rango.

        Returns:
            list: Una lista de diccionarios con estadísticas por fecha y estado.
        """
        connection = None
        cursor = None
        try:
            # Determinar qué stored procedure usar
            if tipo_gesto == 'parpadeo':
                sp_name = 'sp_resumen_parpadeo_por_fecha'
            elif tipo_gesto == 'cejas':
                sp_name = 'sp_resumen_cejas_por_fecha'
            elif tipo_gesto == 'boca':
                sp_name = 'sp_resumen_boca_por_fecha'
            else:
                raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

            # Llamar al stored procedure correspondiente
            sql = f"CALL {sp_name}(%s, %s)"

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor(dictionary=True)
                cursor.execute(sql, (start_date, end_date))
                results = cursor.fetchall()
                
                # Consumir todos los resultados y cerrar cursor adecuadamente
                cursor.fetchall()  # Asegurar que no queden resultados pendientes
                
                print(f"📊 Estadísticas detalladas obtenidas para '{tipo_gesto}' entre {start_date} y {end_date}.")
                return results
        except Exception as e:
            print(f"❌ Error al obtener estadísticas: {e}")
            return []
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass

        return []

    def get_stats_last_30_days(self, tipo_gesto: str):
        """
        Obtiene estadísticas de los últimos 30 días usando stored procedures.

        Args:
            tipo_gesto (str): El tipo de gesto a consultar.

        Returns:
            list: Una lista de diccionarios con estadísticas por fecha y estado.
        """
        connection = None
        cursor = None
        try:
            # Determinar qué stored procedure usar para últimos 30 días
            if tipo_gesto == 'parpadeo':
                sp_name = 'sp_resumen_parpadeo_ultimos_30'
            elif tipo_gesto == 'cejas':
                sp_name = 'sp_resumen_cejas_ultimos_30'
            elif tipo_gesto == 'boca':
                sp_name = 'sp_resumen_boca_ultimos_30'
            else:
                raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

            # Llamar al stored procedure (sin parámetros para últimos 30 días)
            sql = f"CALL {sp_name}()"

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor(dictionary=True)
                cursor.execute(sql)
                results = cursor.fetchall()
                
                # Consumir todos los resultados y cerrar cursor adecuadamente
                try:
                    cursor.fetchall()  # Asegurar que no queden resultados pendientes
                except:
                    pass
                
                print(f"📊 Estadísticas últimos 30 días obtenidas para '{tipo_gesto}'.")
                return results
        except Exception as e:
            print(f"❌ Error al obtener estadísticas de últimos 30 días: {e}")
            return []
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass
            if connection:
                try:
                    connection.close()
                except:
                    pass

        return []