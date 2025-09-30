#!/usr/bin/env python3
"""
Recrear los stored procedures con la lógica correcta
"""

from src.config.database import Database

def recrear_stored_procedures():
    """Recrear los stored procedures corrigiendo la lógica"""
    print("🔧 RECREANDO STORED PROCEDURES")
    print("=" * 50)
    
    connection = None
    cursor = None
    
    try:
        connection = Database.get_connection()
        if not connection:
            print("❌ No se pudo conectar a la base de datos")
            return
            
        cursor = connection.cursor()
        
        # Eliminar procedimientos existentes y recrearlos
        stored_procedures = [
            # PARPADEO
            """
            DROP PROCEDURE IF EXISTS sp_insertar_estado_parpadeo;
            """,
            """
            CREATE PROCEDURE sp_insertar_estado_parpadeo(IN p_estado VARCHAR(50))
            BEGIN
              DECLARE v_last VARCHAR(50) DEFAULT NULL;
            
              SELECT estado INTO v_last
              FROM parpadeos_hist
              ORDER BY fecha_hora DESC, id DESC
              LIMIT 1;
            
              IF v_last IS NULL OR v_last != p_estado THEN
                INSERT INTO parpadeos_hist (estado) VALUES (p_estado);
                INSERT INTO parpadeos (estado) VALUES (p_estado);
                
                DELETE FROM parpadeos
                WHERE id NOT IN (
                  SELECT * FROM (
                    SELECT id FROM parpadeos
                    ORDER BY fecha_hora DESC, id DESC
                    LIMIT 10
                  ) AS t
                );
              END IF;
            END;
            """,
            
            # CEJAS
            """
            DROP PROCEDURE IF EXISTS sp_insertar_estado_ceja;
            """,
            """
            CREATE PROCEDURE sp_insertar_estado_ceja(IN p_estado VARCHAR(50))
            BEGIN
              DECLARE v_last VARCHAR(50) DEFAULT NULL;
            
              SELECT estado INTO v_last
              FROM cejas_hist
              ORDER BY fecha_hora DESC, id DESC
              LIMIT 1;
            
              IF v_last IS NULL OR v_last != p_estado THEN
                INSERT INTO cejas_hist (estado) VALUES (p_estado);
                INSERT INTO cejas (estado) VALUES (p_estado);
                
                DELETE FROM cejas
                WHERE id NOT IN (
                  SELECT * FROM (
                    SELECT id FROM cejas
                    ORDER BY fecha_hora DESC, id DESC
                    LIMIT 10
                  ) AS t
                );
              END IF;
            END;
            """,
            
            # BOCA
            """
            DROP PROCEDURE IF EXISTS sp_insertar_estado_boca;
            """,
            """
            CREATE PROCEDURE sp_insertar_estado_boca(IN p_estado VARCHAR(50))
            BEGIN
              DECLARE v_last VARCHAR(50) DEFAULT NULL;
            
              SELECT estado INTO v_last
              FROM boca_hist
              ORDER BY fecha_hora DESC, id DESC
              LIMIT 1;
            
              IF v_last IS NULL OR v_last != p_estado THEN
                INSERT INTO boca_hist (estado) VALUES (p_estado);
                INSERT INTO boca (estado) VALUES (p_estado);
                
                DELETE FROM boca
                WHERE id NOT IN (
                  SELECT * FROM (
                    SELECT id FROM boca
                    ORDER BY fecha_hora DESC, id DESC
                    LIMIT 10
                  ) AS t
                );
              END IF;
            END;
            """
        ]
        
        # Ejecutar cada procedimiento
        for i, sp_sql in enumerate(stored_procedures):
            print(f"  🔄 Ejecutando procedimiento {i+1}/{len(stored_procedures)}")
            try:
                cursor.execute(sp_sql)
                connection.commit()
                print(f"  ✅ Procedimiento {i+1} ejecutado correctamente")
            except Exception as e:
                print(f"  ❌ Error en procedimiento {i+1}: {e}")
                
        print("\n✅ STORED PROCEDURES RECREADOS")
        print("🧪 Ejecutando prueba rápida...")
        
        # Prueba rápida
        cursor.callproc('sp_insertar_estado_parpadeo', ['cerrado'])
        cursor.callproc('sp_insertar_estado_parpadeo', ['cerrado'])  # Duplicado - no debería insertar
        cursor.callproc('sp_insertar_estado_parpadeo', ['abierto'])  # Cambio - debería insertar
        connection.commit()
        
        # Verificar resultados
        cursor.execute("SELECT * FROM parpadeos_hist ORDER BY id DESC LIMIT 3")
        results = cursor.fetchall()
        
        print(f"\n📊 ÚLTIMOS 3 REGISTROS DESPUÉS DE LA PRUEBA:")
        for record in results:
            print(f"  ID: {record[0]}, Estado: {record[1]}, Fecha: {record[2]}")
            
    except Exception as e:
        print(f"❌ Error general: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    recrear_stored_procedures()