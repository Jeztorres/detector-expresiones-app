#!/usr/bin/env python3
"""
Script para probar el repositorio exactamente como se usa en la API
"""

from src.repositories.gesto_repository import GestoRepository

def test_repositorio():
    """Prueba el repositorio usando el mismo código que la API"""
    print("🧪 PRUEBA DEL REPOSITORIO")
    print("=" * 50)

    repo = GestoRepository()

    print("\n🔄 PROBANDO INSERCIÓN USANDO EL REPOSITORIO...")

    # Probar inserciones
    print("  Insertando parpadeo: cerrado")
    result1 = repo.save('parpadeo', 'cerrado')
    print(f"  Resultado: {result1}")

    print("  Insertando parpadeo: cerrado (repetido)")
    result2 = repo.save('parpadeo', 'cerrado')
    print(f"  Resultado: {result2}")

    print("  Insertando parpadeo: abierto")
    result3 = repo.save('parpadeo', 'abierto')
    print(f"  Resultado: {result3}")

    print("  Insertando cejas: normal")
    result4 = repo.save('cejas', 'normal')
    print(f"  Resultado: {result4}")

    print("  Insertando boca: cerrada")
    result5 = repo.save('boca', 'cerrada')
    print(f"  Resultado: {result5}")

    print("\n✅ PRUEBA DEL REPOSITORIO COMPLETADA")

if __name__ == "__main__":
    test_repositorio()