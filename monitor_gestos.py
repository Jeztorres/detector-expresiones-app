#!/usr/bin/env python3
"""Script para monitorear gestos en tiempo real desde la base de datos"""

from repositories.gesto_repository import GestoRepository
import time
import os

def monitor_gestos():
    print("👁️ Monitoreando gestos en tiempo real...")
    print("Presiona Ctrl+C para salir")
    print("-" * 50)
    
    repo = GestoRepository()
    ultimo_count = 0
    
    try:
        while True:
            # Obtener el historial actual
            historial = repo.obtener_todos_gestos()
            count_actual = len(historial)
            
            # Si hay nuevos gestos, mostrarlos
            if count_actual > ultimo_count:
                nuevos_gestos = historial[:count_actual - ultimo_count]
                print(f"\n🆕 {len(nuevos_gestos)} nuevo(s) gesto(s) detectado(s):")
                
                for gesto in reversed(nuevos_gestos):  # Mostrar del más reciente al más antiguo
                    print(f"  📊 {gesto['tipo']}: {gesto['estado']} - {gesto['fecha']}")
                
                ultimo_count = count_actual
                print(f"📈 Total de gestos: {count_actual}")
            
            time.sleep(1)  # Verificar cada segundo
            
    except KeyboardInterrupt:
        print("\n👋 Monitoreo detenido")
    except Exception as e:
        print(f"❌ Error en monitoreo: {e}")

if __name__ == "__main__":
    monitor_gestos()
