#!/usr/bin/env python3
"""
Script para probar el endpoint completo de la API
"""

import requests
import time

BASE_URL = "http://127.0.0.1:5000/api"

def test_endpoint_completo():
    """Prueba el endpoint completo de la API"""
    print("🧪 PRUEBA DEL ENDPOINT COMPLETO")
    print("=" * 50)

    print("\n🔄 ENVIANDO REQUESTS AL ENDPOINT...")

    # Probar inserciones
    test_cases = [
        ("parpadeo", "cerrado"),
        ("parpadeo", "cerrado"),  # Repetido - no debería insertar
        ("parpadeo", "abierto"),  # Cambio - debería insertar
        ("cejas", "normal"),
        ("cejas", "normal"),     # Repetido - no debería insertar
        ("cejas", "arqueadas"),   # Cambio - debería insertar
        ("boca", "cerrada"),
        ("boca", "cerrada"),     # Repetido - no debería insertar
        ("boca", "abierta"),      # Cambio - debería insertar
    ]

    for i, (tipo, estado) in enumerate(test_cases, 1):
        print(f"  {i}. Enviando {tipo}: {estado}")
        try:
            response = requests.post(
                f"{BASE_URL}/gestos",
                json={"tipo_gesto": tipo, "estado": estado},
                timeout=5
            )

            if response.status_code == 201:
                print(f"     ✅ Status 201: {response.json()}")
            else:
                print(f"     ❌ Status {response.status_code}: {response.text}")

        except Exception as e:
            print(f"     ❌ Error: {e}")

        time.sleep(0.5)  # Pequeña pausa entre requests

    print("\n✅ PRUEBA DEL ENDPOINT COMPLETADA")

if __name__ == "__main__":
    test_endpoint_completo()