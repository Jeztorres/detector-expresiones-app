#!/usr/bin/env python3
"""
Script simple para probar la inserción directa usando stored procedures
"""

from src.config.database import Database

def test_insercion_directa():
    """Prueba la inserción directa usando stored procedures"""
    print("🧪 PRUEBA DE INSERCIÓN DIRECTA")
    print("=" * 50)

    connection = None
    cursor = None

    try:
        connection = Database.get_connection()
        if not connection:
            print("❌ No se pudo conectar a la base de datos")
            return

        cursor = connection.cursor()

        # Verificar registros actuales antes de insertar
        print("\n📊 REGISTROS ANTES DE INSERTAR:")
        cursor.execute("SELECT COUNT(*) as total FROM parpadeos_hist")
        result = cursor.fetchone()
        print(f"  Parpadeos_hist: {result[0]} registros")

        cursor.execute("SELECT COUNT(*) as total FROM cejas_hist")
        result = cursor.fetchone()
        print(f"  Cejas_hist: {result[0]} registros")

        cursor.execute("SELECT COUNT(*) as total FROM boca_hist")
        result = cursor.fetchone()
        print(f"  Boca_hist: {result[0]} registros")

        # Probar inserción usando stored procedure
        print("\n🔄 INSERTANDO ESTADOS...")

        # Parpadeo - cerrado
        print("  Insertando parpadeo: cerrado")
        cursor.callproc('sp_insertar_estado_parpadeo', ['cerrado'])
        connection.commit()

        # Parpadeo - cerrado otra vez (no debería insertar)
        print("  Insertando parpadeo: cerrado (repetido)")
        cursor.callproc('sp_insertar_estado_parpadeo', ['cerrado'])
        connection.commit()

        # Parpadeo - abierto (debería insertar)
        print("  Insertando parpadeo: abierto")
        cursor.callproc('sp_insertar_estado_parpadeo', ['abierto'])
        connection.commit()

        # Cejas - normal
        print("  Insertando cejas: normal")
        cursor.callproc('sp_insertar_estado_ceja', ['normal'])
        connection.commit()

        # Boca - cerrada
        print("  Insertando boca: cerrada")
        cursor.callproc('sp_insertar_estado_boca', ['cerrada'])
        connection.commit()

        # Verificar registros después de insertar
        print("\n📊 REGISTROS DESPUÉS DE INSERTAR:")
        cursor.execute("SELECT COUNT(*) as total FROM parpadeos_hist")
        result = cursor.fetchone()
        print(f"  Parpadeos_hist: {result[0]} registros")

        cursor.execute("SELECT COUNT(*) as total FROM cejas_hist")
        result = cursor.fetchone()
        print(f"  Cejas_hist: {result[0]} registros")

        cursor.execute("SELECT COUNT(*) as total FROM boca_hist")
        result = cursor.fetchone()
        print(f"  Boca_hist: {result[0]} registros")

        # Mostrar los últimos registros
        print("\n📋 ÚLTIMOS REGISTROS INSERTADOS:")
        cursor.execute("SELECT 'parpadeos_hist' as tabla, estado, fecha_hora FROM parpadeos_hist ORDER BY id DESC LIMIT 2")
        results = cursor.fetchall()
        for row in results:
            print(f"  {row[0]}: {row[1]} - {row[2]}")

        cursor.execute("SELECT 'cejas_hist' as tabla, estado, fecha_hora FROM cejas_hist ORDER BY id DESC LIMIT 2")
        results = cursor.fetchall()
        for row in results:
            print(f"  {row[0]}: {row[1]} - {row[2]}")

        cursor.execute("SELECT 'boca_hist' as tabla, estado, fecha_hora FROM boca_hist ORDER BY id DESC LIMIT 2")
        results = cursor.fetchall()
        for row in results:
            print(f"  {row[0]}: {row[1]} - {row[2]}")

        print("\n✅ PRUEBA COMPLETADA")

    except Exception as e:
        print(f"❌ Error: {e}")
        if connection:
            connection.rollback()

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

if __name__ == "__main__":
    test_insercion_directa()