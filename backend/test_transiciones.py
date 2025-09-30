#!/usr/bin/env python3
"""
Test script para verificar que el sistema de transiciones funciona correctamente
Simula diferentes transiciones de estado para verificar que solo se guardan los cambios.
"""

import requests
import time
import json

BASE_URL = "http://127.0.0.1:5000/api"

def test_transicion(tipo_gesto, estado, descripcion):
    """Envía un estado y muestra la respuesta"""
    print(f"\n🔄 {descripcion}")
    print(f"   Enviando: {tipo_gesto} → {estado}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/gestos",
            json={"tipo_gesto": tipo_gesto, "estado": estado},
            timeout=5
        )
        
        if response.status_code == 201:
            print(f"   ✅ Respuesta: {response.json()}")
        else:
            print(f"   ❌ Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    time.sleep(0.5)  # Pequeña pausa entre requests

def main():
    print("🧪 TESTING SISTEMA DE TRANSICIONES")
    print("=" * 50)
    
    # Test 1: Parpadeo - Secuencia de transiciones
    print("\n📖 Test 1: PARPADEO (Cerrado → Abierto → Cerrado)")
    test_transicion("parpadeo", "cerrado", "Primera transición a cerrado")
    test_transicion("parpadeo", "cerrado", "Intento repetido (NO debería guardarse)")
    test_transicion("parpadeo", "abierto", "Transición a abierto")
    test_transicion("parpadeo", "abierto", "Intento repetido (NO debería guardarse)")
    test_transicion("parpadeo", "cerrado", "Vuelta a cerrado")
    
    # Test 2: Cejas - Secuencia de transiciones
    print("\n📖 Test 2: CEJAS (Normal → Arqueadas → Normal)")
    test_transicion("cejas", "normal", "Estado inicial normal")
    test_transicion("cejas", "normal", "Intento repetido (NO debería guardarse)")
    test_transicion("cejas", "arqueadas", "Transición a arqueadas")
    test_transicion("cejas", "arqueadas", "Intento repetido (NO debería guardarse)")
    test_transicion("cejas", "normal", "Vuelta a normal")
    
    # Test 3: Boca - Secuencia de transiciones
    print("\n📖 Test 3: BOCA (Cerrada → Abierta → Cerrada)")
    test_transicion("boca", "cerrada", "Estado inicial cerrada")
    test_transicion("boca", "cerrada", "Intento repetido (NO debería guardarse)")
    test_transicion("boca", "abierta", "Transición a abierta")
    test_transicion("boca", "abierta", "Intento repetido (NO debería guardarse)")
    test_transicion("boca", "cerrada", "Vuelta a cerrada")
    
    # Test 4: Verificar estadísticas
    print("\n📊 Test 4: VERIFICANDO ESTADÍSTICAS")
    try:
        # Obtener estadísticas de últimos 30 días para cada gesto
        gestos = ["parpadeo", "cejas", "boca"]
        for gesto in gestos:
            response = requests.get(f"{BASE_URL}/estadisticas/{gesto}/ultimos30", timeout=5)
            if response.status_code == 200:
                datos = response.json()
                print(f"   📈 Estadísticas {gesto}: {len(datos)} días con datos")
                if datos:
                    # Mostrar el día más reciente
                    ultimo_dia = datos[0] if datos else {}
                    print(f"      Último día: {ultimo_dia}")
            else:
                print(f"   ❌ Error obteniendo stats de {gesto}: {response.status_code}")
                
    except Exception as e:
        print(f"   ❌ Error obteniendo estadísticas: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 PRUEBA COMPLETADA")
    print("💡 NOTAS:")
    print("   - Solo las transiciones reales deberían guardarse en BD")
    print("   - Los intentos repetidos NO deberían crear nuevos registros")
    print("   - Revisa los logs del servidor para ver qué se guardó realmente")

if __name__ == "__main__":
    main()