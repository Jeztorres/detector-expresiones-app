from datetime import datetime
from src.repositories.db import connection_factory
from src.models.gesto import Gesto, TipoGesto

class GestoRepository:
    """Repositorio para manejo de gestos en la base de datos"""
    
    SP_MAP = {
        "boca": "sp_insertar_estado_boca",
        "cejas": "sp_insertar_estado_ceja", 
        "parpadeo": "sp_insertar_estado_parpadeo",
    }
    
    def guardar_gesto(self, tipo: TipoGesto, estado: str) -> Gesto:
        """Guarda un gesto en la base de datos"""
        conn = connection_factory()
        cur = conn.cursor()
        try:
            # Obtener el procedimiento almacenado correspondiente
            sp_name = self.SP_MAP.get(tipo)
            if not sp_name:
                raise ValueError(f"Tipo de gesto no válido: {tipo}")
                
            # Ejecutar el procedimiento almacenado
            cur.callproc(sp_name, (estado,))
            conn.commit()
            
            # Crear y retornar el objeto Gesto
            return Gesto(tipo=tipo, estado=estado, fecha=datetime.now())
            
        except Exception as ex:
            conn.rollback()
            raise ex
        finally:
            try:
                cur.close()
            except:
                pass
            try:
                conn.close()
            except:
                pass

    def insertar_estado(self, tipo: TipoGesto, estado: str):
        """Método alias para mantener compatibilidad con el servicio"""
        return self.guardar_gesto(tipo, estado)
    
    def obtener_todos_gestos(self):
        """Obtiene todos los gestos guardados de todas las tablas"""
        conn = connection_factory()
        cur = conn.cursor(dictionary=True)
        gestos = []
        
        try:
            # Obtener gestos de boca (histórico completo)
            cur.execute("SELECT 'boca' as tipo, estado, fecha_hora as fecha FROM boca_hist ORDER BY fecha_hora DESC")
            for row in cur.fetchall():
                gestos.append({
                    "tipo": row["tipo"],
                    "estado": row["estado"],
                    "fecha": row["fecha"].isoformat() + "Z" if row["fecha"] else None
                })
            
            # Obtener gestos de cejas (histórico completo)
            cur.execute("SELECT 'cejas' as tipo, estado, fecha_hora as fecha FROM cejas_hist ORDER BY fecha_hora DESC")
            for row in cur.fetchall():
                gestos.append({
                    "tipo": row["tipo"],
                    "estado": row["estado"],
                    "fecha": row["fecha"].isoformat() + "Z" if row["fecha"] else None
                })
            
            # Obtener gestos de parpadeo (histórico completo)
            cur.execute("SELECT 'parpadeo' as tipo, estado, fecha_hora as fecha FROM parpadeos_hist ORDER BY fecha_hora DESC")
            for row in cur.fetchall():
                gestos.append({
                    "tipo": row["tipo"],
                    "estado": row["estado"],
                    "fecha": row["fecha"].isoformat() + "Z" if row["fecha"] else None
                })
            
            # Ordenar por fecha (más recientes primero)
            gestos.sort(key=lambda x: x["fecha"] if x["fecha"] else "", reverse=True)
            
            return gestos
            
        finally:
            try:
                cur.close()
            except:
                pass
            try:
                conn.close()
            except:
                pass
