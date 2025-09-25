#!/usr/bin/env python3
"""
Configuración de ngrok para acceso HTTPS
Permite usar la cámara desde GitHub Pages
"""

import subprocess
import webbrowser
import time
import requests

def install_ngrok():
    """Instalar ngrok si no está instalado"""
    try:
        subprocess.run(["ngrok", "version"], check=True, capture_output=True)
        print("✅ ngrok ya está instalado")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("📥 Instalando ngrok...")
        print("1. Ve a: https://ngrok.com/download")
        print("2. Descarga ngrok para Windows")
        print("3. Extrae ngrok.exe en esta carpeta")
        print("4. Ejecuta este script de nuevo")
        return False

def start_ngrok_tunnel():
    """Iniciar túnel ngrok"""
    try:
        # Iniciar túnel en puerto 5000 (backend Flask)
        process = subprocess.Popen([
            "ngrok", "http", "5000", 
            "--log=stdout"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        print("🚀 Iniciando túnel ngrok...")
        time.sleep(3)
        
        # Obtener URL del túnel
        try:
            response = requests.get("http://localhost:4040/api/tunnels")
            tunnels = response.json()["tunnels"]
            
            for tunnel in tunnels:
                if tunnel["proto"] == "https":
                    https_url = tunnel["public_url"]
                    print(f"✅ Túnel HTTPS creado:")
                    print(f"   {https_url}")
                    print(f"\n🌐 Ahora puedes usar esta URL en GitHub Pages")
                    print(f"📱 La cámara funcionará con HTTPS")
                    
                    # Actualizar app.js con la nueva URL
                    update_app_js(https_url)
                    return https_url
        except:
            print("❌ No se pudo obtener la URL del túnel")
            return None
            
    except FileNotFoundError:
        print("❌ ngrok no encontrado. Instálalo primero.")
        return None

def update_app_js(https_url):
    """Actualizar app.js con la URL HTTPS"""
    app_js_path = "frontend/public/front/app.js"
    
    try:
        with open(app_js_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Reemplazar la URL del endpoint
        new_content = content.replace(
            'const ENDPOINT_GESTOS = "http://127.0.0.1:5000/api/gestos";',
            f'const ENDPOINT_GESTOS = "{https_url}/api/gestos";'
        )
        
        with open(app_js_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        
        print(f"✅ app.js actualizado con URL: {https_url}")
        
    except Exception as e:
        print(f"❌ Error actualizando app.js: {e}")

def main():
    print("🔧 Configuración de ngrok para GitHub Pages")
    print("=" * 50)
    
    if not install_ngrok():
        return
    
    print("\n🚀 Iniciando túnel ngrok...")
    https_url = start_ngrok_tunnel()
    
    if https_url:
        print(f"\n✅ Configuración completada!")
        print(f"🌐 Usa esta URL en GitHub Pages: {https_url}")
        print(f"📱 La cámara funcionará correctamente")
    else:
        print("❌ No se pudo configurar ngrok")

if __name__ == "__main__":
    main()
