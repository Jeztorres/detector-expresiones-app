from src.config.database import Database
from datetime import date, datetime, timedelta
from decimal import Decimal

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

    def _consume_remaining_results(self, cursor):
        """Consume cualquier result set pendiente después de ejecutar un stored procedure."""
        if not cursor:
            return
        try:
            while cursor.nextset():
                cursor.fetchall()
        except Exception:
            pass

    def _normalize_rows(self, rows):
        """Convierte fechas y números a tipos compatibles con JSON."""
        normalizados = []
        for row in rows or []:
            normalizado = {}
            for key, value in row.items():
                if isinstance(value, (date, datetime)):
                    normalizado[key] = value.isoformat()
                elif isinstance(value, timedelta):
                    # Convertir timedelta a string en formato HH:MM:SS
                    total_seconds = int(value.total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    seconds = total_seconds % 60
                    normalizado[key] = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
                elif isinstance(value, Decimal):
                    normalizado[key] = int(value)
                else:
                    normalizado[key] = value
            normalizados.append(normalizado)
        return normalizados

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
            # Determinar qué stored procedure usar (usando los del base.sql)
            if tipo_gesto == 'parpadeo':
                sp_name = 'sp_resumen_parpadeo_rango'
            elif tipo_gesto == 'cejas':
                sp_name = 'sp_resumen_cejas_rango'
            elif tipo_gesto == 'boca':
                sp_name = 'sp_resumen_boca_rango'
            else:
                raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor(dictionary=True)
                # Usar callproc para stored procedures
                cursor.callproc(sp_name, ['custom', start_date, end_date])
                
                # Obtener los resultados
                results = []
                for result in cursor.stored_results():
                    results.extend(result.fetchall())

                print(f"📊 Estadísticas detalladas obtenidas para '{tipo_gesto}' entre {start_date} y {end_date}.")
                return self._normalize_rows(results)
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

    def get_day_details(self, tipo_gesto: str, target_date: date):
        """
        Obtiene todos los registros detallados de un día específico.
        
        Args:
            tipo_gesto (str): El tipo de gesto a consultar.
            target_date (date): La fecha objetivo.
            
        Returns:
            list: Lista de registros con hora, estado y otros detalles.
        """
        connection = None
        cursor = None
        
        try:
            # Obtener la tabla correspondiente al tipo de gesto
            if tipo_gesto == 'parpadeo':
                tabla = 'parpadeos_hist'
            elif tipo_gesto == 'cejas':
                tabla = 'cejas_hist'
            elif tipo_gesto == 'boca':
                tabla = 'boca_hist'
            else:
                raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")
            
            connection = Database.get_connection()
            cursor = connection.cursor(dictionary=True)
            
            # Query para obtener todos los registros del día específico
            query = f"""
                SELECT 
                    id,
                    estado,
                    fecha_hora,
                    TIME(fecha_hora) as hora,
                    DATE(fecha_hora) as fecha
                FROM {tabla}
                WHERE DATE(fecha_hora) = %s
                ORDER BY fecha_hora ASC
            """
            
            cursor.execute(query, (target_date,))
            rows = cursor.fetchall()
            
            # Normalizar los resultados
            return self._normalize_rows(rows)
            
        except Exception as e:
            print(f"❌ Error en el repositorio al obtener detalles del día: {e}")
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

    def get_stats_today(self, tipo_gesto: str):
        """
        Obtiene estadísticas para el día de hoy usando stored procedures.
        """
        connection = None
        cursor = None
        try:
            # Determinar qué stored procedure usar (usando los del base.sql)
            if tipo_gesto == 'parpadeo':
                sp_name = 'sp_resumen_parpadeo_rango'
            elif tipo_gesto == 'cejas':
                sp_name = 'sp_resumen_cejas_rango'
            elif tipo_gesto == 'boca':
                sp_name = 'sp_resumen_boca_rango'
            else:
                raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

            # Llamar al stored procedure con parámetro 'hoy'
            sql = f"CALL {sp_name}('hoy', NULL, NULL)"
            print(f"🔍 DEBUG: Ejecutando SQL: {sql}")

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor(dictionary=True)
                # Usar callproc en lugar de execute para stored procedures
                cursor.callproc(sp_name, ['hoy', None, None])
                
                # Obtener los resultados
                results = []
                for result in cursor.stored_results():
                    rows = result.fetchall()
                    print(f"🔍 DEBUG: Filas obtenidas del stored procedure: {rows}")
                    results.extend(rows)

                print(f"🔍 DEBUG: Resultados totales: {results}")
                normalized = self._normalize_rows(results)
                print(f"🔍 DEBUG: Resultados normalizados: {normalized}")
                print(f"📊 Estadísticas de hoy obtenidas para '{tipo_gesto}'.")
                return normalized
        except Exception as e:
            print(f"❌ Error al obtener estadísticas de hoy: {e}")
            import traceback
            traceback.print_exc()
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

    def get_stats_last_7_days(self, tipo_gesto: str):
        """
        Obtiene estadísticas de los últimos 7 días usando stored procedures.
        """
        connection = None
        cursor = None
        try:
            # Determinar qué stored procedure usar (usando los del base.sql)
            if tipo_gesto == 'parpadeo':
                sp_name = 'sp_resumen_parpadeo_rango'
            elif tipo_gesto == 'cejas':
                sp_name = 'sp_resumen_cejas_rango'
            elif tipo_gesto == 'boca':
                sp_name = 'sp_resumen_boca_rango'
            else:
                raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor(dictionary=True)
                # Usar callproc para stored procedures
                cursor.callproc(sp_name, ['7', None, None])
                
                # Obtener los resultados
                results = []
                for result in cursor.stored_results():
                    results.extend(result.fetchall())

                print(f"📊 Estadísticas de últimos 7 días obtenidas para '{tipo_gesto}'.")
                return self._normalize_rows(results)
        except Exception as e:
            print(f"❌ Error al obtener estadísticas de últimos 7 días: {e}")
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
        """
        connection = None
        cursor = None
        try:
            # Determinar qué stored procedure usar (usando los del base.sql)
            if tipo_gesto == 'parpadeo':
                sp_name = 'sp_resumen_parpadeo_rango'
            elif tipo_gesto == 'cejas':
                sp_name = 'sp_resumen_cejas_rango'
            elif tipo_gesto == 'boca':
                sp_name = 'sp_resumen_boca_rango'
            else:
                raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor(dictionary=True)
                # Usar callproc para stored procedures
                cursor.callproc(sp_name, ['30', None, None])
                
                # Obtener los resultados
                results = []
                for result in cursor.stored_results():
                    results.extend(result.fetchall())

                print(f"📊 Estadísticas últimos 30 días obtenidas para '{tipo_gesto}'.")
                return self._normalize_rows(results)
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

    def get_stats_by_date_range(self, tipo_gesto: str, start_date: str, end_date: str):
        """
        Obtiene estadísticas por rango de fechas usando stored procedures.
        """
        connection = None
        cursor = None
        try:
            # Determinar qué stored procedure usar (usando los del base.sql)
            if tipo_gesto == 'parpadeo':
                sp_name = 'sp_resumen_parpadeo_rango'
            elif tipo_gesto == 'cejas':
                sp_name = 'sp_resumen_cejas_rango'
            elif tipo_gesto == 'boca':
                sp_name = 'sp_resumen_boca_rango'
            else:
                raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor(dictionary=True)
                # Usar callproc para stored procedures
                cursor.callproc(sp_name, ['custom', start_date, end_date])
                
                # Obtener los resultados
                results = []
                for result in cursor.stored_results():
                    results.extend(result.fetchall())

                print(f"📊 Estadísticas detalladas obtenidas para '{tipo_gesto}' entre {start_date} y {end_date}.")
                return self._normalize_rows(results)
        except Exception as e:
            print(f"❌ Error al obtener estadísticas por rango de fechas: {e}")
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

    def get_daily_history(self, tipo_gesto: str, page: int = 1, limit: int = 30):
        """
        Obtiene el historial diario de gestos usando stored procedures.
        """
        connection = None
        cursor = None
        try:
            # Determinar qué stored procedure usar (usando los del base.sql)
            if tipo_gesto == 'parpadeo':
                sp_name = 'sp_resumen_parpadeo_rango'
            elif tipo_gesto == 'cejas':
                sp_name = 'sp_resumen_cejas_rango'
            elif tipo_gesto == 'boca':
                sp_name = 'sp_resumen_boca_rango'
            else:
                raise ValueError(f"Tipo de gesto no válido: {tipo_gesto}")

            # Calcular fechas para el historial (últimos 30 días por defecto)
            from datetime import timedelta
            end_date = date.today()
            start_date = end_date - timedelta(days=30)

            connection = Database.get_connection()
            if connection:
                cursor = connection.cursor(dictionary=True)
                # Usar callproc para stored procedures
                cursor.callproc(sp_name, ['custom', start_date, end_date])
                
                # Obtener los resultados
                results = []
                for result in cursor.stored_results():
                    results.extend(result.fetchall())

                # Ordenar por fecha descendente (más reciente primero)
                results = sorted(results, key=lambda x: x.get('fecha', ''), reverse=True)

                # Aplicar paginación
                start_index = (page - 1) * limit
                end_index = start_index + limit
                paginated_results = results[start_index:end_index]

                print(f"📊 Historial diario obtenido para '{tipo_gesto}' (página {page}).")
                return self._normalize_rows(paginated_results)
        except Exception as e:
            print(f"❌ Error al obtener historial diario: {e}")
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
