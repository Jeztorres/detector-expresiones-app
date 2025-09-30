#!/usr/bin/env python3
"""
Test simple para verificar las transiciones directamente en la base de datos
"""

from src.config.database import Database
import mysql.connector

def test_stored_procedures():
    """Prueba directa de los stored procedures"""
    print("🧪 TESTING STORED PROCEDURES DIRECTAMENTE")
    print("=" * 50)
    
    connection = None
    cursor = None
    
    try:
        connection = Database.get_connection()
        if not connection:
            print("❌ No se pudo conectar a la base de datos")
            return
            
        cursor = connection.cursor(dictionary=True)
        
        # Test 1: Insertar algunos estados para parpadeo
        print("\n📖 Test 1: INSERTANDO ESTADOS DE PARPADEO")
        
        # Primera inserción - debería guardarse
        print("  🔄 Insertando 'cerrado' (debería guardarse)")
        cursor.callproc('sp_insertar_estado_parpadeo', ['cerrado'])
        connection.commit()
        
        # Segunda inserción igual - NO debería guardarse
        print("  🔄 Insertando 'cerrado' otra vez (NO debería guardarse)")
        cursor.callproc('sp_insertar_estado_parpadeo', ['cerrado'])
        connection.commit()
        
        # Cambio de estado - debería guardarse
        print("  🔄 Insertando 'abierto' (debería guardarse)")
        cursor.callproc('sp_insertar_estado_parpadeo', ['abierto'])
        connection.commit()
        
        # Verificar qué se guardó en la tabla histórica
        print("\n📊 VERIFICANDO TABLA HISTÓRICA DE PARPADEO:")
        cursor.execute("SELECT * FROM parpadeos_hist ORDER BY fecha_hora DESC LIMIT 5")
        resultados = cursor.fetchall()
        for i, row in enumerate(resultados, 1):
            print(f"  {i}. {row['estado']} - {row['fecha_hora']}")
            
        # Test 2: Boca
        print("\n📖 Test 2: INSERTANDO ESTADOS DE BOCA")
        
        print("  🔄 Insertando 'cerrada' (debería guardarse)")
        cursor.callproc('sp_insertar_estado_boca', ['cerrada'])
        connection.commit()
        
        print("  🔄 Insertando 'cerrada' otra vez (NO debería guardarse)")
        cursor.callproc('sp_insertar_estado_boca', ['cerrada'])
        connection.commit()
        
        print("  🔄 Insertando 'abierta' (debería guardarse)")
        cursor.callproc('sp_insertar_estado_boca', ['abierta'])
        connection.commit()
        
        print("  🔄 Insertando 'cerrada' (debería guardarse)")
        cursor.callproc('sp_insertar_estado_boca', ['cerrada'])
        connection.commit()
        
        # Verificar qué se guardó
        print("\n📊 VERIFICANDO TABLA HISTÓRICA DE BOCA:")
        cursor.execute("SELECT * FROM boca_hist ORDER BY fecha_hora DESC LIMIT 5")
        resultados = cursor.fetchall()
        for i, row in enumerate(resultados, 1):
            print(f"  {i}. {row['estado']} - {row['fecha_hora']}")
            
        # Test 3: Cejas
        print("\n📖 Test 3: INSERTANDO ESTADOS DE CEJAS")
        
        print("  🔄 Insertando 'normal' (debería guardarse)")
        cursor.callproc('sp_insertar_estado_ceja', ['normal'])
        connection.commit()
        
        print("  🔄 Insertando 'arqueadas' (debería guardarse)")
        cursor.callproc('sp_insertar_estado_ceja', ['arqueadas'])
        connection.commit()
        
        print("  🔄 Insertando 'arqueadas' otra vez (NO debería guardarse)")
        cursor.callproc('sp_insertar_estado_ceja', ['arqueadas'])
        connection.commit()
        
        # Verificar qué se guardó
        print("\n📊 VERIFICANDO TABLA HISTÓRICA DE CEJAS:")
        cursor.execute("SELECT * FROM cejas_hist ORDER BY fecha_hora DESC LIMIT 5")
        resultados = cursor.fetchall()
        for i, row in enumerate(resultados, 1):
            print(f"  {i}. {row['estado']} - {row['fecha_hora']}")
            
        print("\n" + "=" * 50)
        print("✅ PRUEBAS COMPLETADAS")
        print("💡 Solo deberías ver registros cuando hay cambios de estado")
        
    except Exception as e:
        print(f"❌ Error durante las pruebas: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    test_stored_procedures()