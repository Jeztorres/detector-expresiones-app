#!/usr/bin/env python3
"""Script para probar el guardado de gestos en la base de datos"""

from services.gesto_service import GestoService
from repositories.gesto_repository import GestoRepository
import time

def test_guardar_gestos():
    print("🧪 Probando guardado de gestos en la base de datos...")
    
    service = GestoService()
    
    # Datos de prueba
    gestos_prueba = [
        ("parpadeo", "cerrado"),
        ("parpadeo", "abierto"),
        ("cejas", "arqueadas"),
        ("cejas", "normal"),
        ("boca", "abierta"),
        ("boca", "cerrada")
    ]
    
    print(f"📝 Guardando {len(gestos_prueba)} gestos de prueba...")
    
    for tipo, estado in gestos_prueba:
        try:
            gesto = service.registrar_gesto(tipo, estado)
            print(f"✅ {tipo}: {estado} - {gesto.fecha}")
            time.sleep(0.1)  # Pequeña pausa entre gestos
        except Exception as e:
            print(f"❌ Error guardando {tipo}: {estado} - {e}")
    
    print("\n📊 Verificando historial...")
    try:
        historial = service.obtener_historial()
        print(f"📋 Total de gestos en BD: {len(historial)}")
        
        # Mostrar los últimos 10 gestos
        print("\n🕒 Últimos 10 gestos:")
        for i, gesto in enumerate(historial[:10]):
            print(f"  {i+1}. {gesto['tipo']}: {gesto['estado']} - {gesto['fecha']}")
            
    except Exception as e:
        print(f"❌ Error obteniendo historial: {e}")

if __name__ == "__main__":
    test_guardar_gestos()
