#!/usr/bin/env python3
"""
Script para verificar que los datos de transiciones se estén guardando correctamente
en la base de datos después de usar la aplicación desde GitHub Pages.
"""

import mysql.connector
from mysql.connector import pooling
import sys
from datetime import datetime, timedelta

def verificar_datos_recientes():
    """Verifica los datos guardados en las últimas horas"""
    try:
        # Configuración de conexión
        db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'gestos_db',
            'port': 3306
        }

        # Crear conexión
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor(dictionary=True)

        # Calcular fecha de hace 2 horas
        fecha_limite = datetime.now() - timedelta(hours=2)
        fecha_limite_str = fecha_limite.strftime('%Y-%m-%d %H:%M:%S')

        print(f"🔍 Verificando datos guardados desde: {fecha_limite_str}")
        print("=" * 60)

        # Verificar cada tabla
        tablas = ['parpadeo_hist', 'cejas_hist', 'boca_hist']

        for tabla in tablas:
            print(f"\n📊 Tabla: {tabla}")
            print("-" * 30)

            query = f"""
            SELECT id, estado, fecha_registro
            FROM {tabla}
            WHERE fecha_registro >= %s
            ORDER BY fecha_registro DESC
            LIMIT 10
            """

            cursor.execute(query, (fecha_limite_str,))
            resultados = cursor.fetchall()

            if resultados:
                print(f"✅ Encontrados {len(resultados)} registros recientes:")
                for row in resultados:
                    print(f"  ID: {row['id']}, Estado: {row['estado']}, Fecha: {row['fecha_registro']}")
            else:
                print("❌ No se encontraron registros recientes")

        # Verificar estadísticas totales
        print("\n📈 Estadísticas totales:")
        print("-" * 30)

        for tabla in tablas:
            query = f"SELECT COUNT(*) as total FROM {tabla}"
            cursor.execute(query)
            resultado = cursor.fetchone()
            print(f"  {tabla}: {resultado['total']} registros totales")

        cursor.close()
        connection.close()

        print("\n✅ Verificación completada")
        return True

    except Exception as e:
        print(f"❌ Error al verificar datos: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Verificando datos de transiciones guardados...")
    verificar_datos_recientes()