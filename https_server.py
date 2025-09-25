#!/usr/bin/env python3
"""
Servidor HTTPS local para GitHub Pages
Permite acceso a la cámara con certificados SSL
"""

import os
import ssl
from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser

class CORSHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def create_self_signed_cert():
    """Crear certificado SSL autofirmado"""
    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import rsa
        from cryptography.hazmat.primitives import serialization
        import datetime
        
        # Generar clave privada
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        
        # Crear certificado
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Local"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Local"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Local Development"),
            x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.datetime.utcnow()
        ).not_valid_after(
            datetime.datetime.utcnow() + datetime.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([
                x509.DNSName("localhost"),
                x509.IPAddress("127.0.0.1"),
            ]),
            critical=False,
        ).sign(private_key, hashes.SHA256())
        
        # Guardar certificado y clave
        with open("cert.pem", "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        with open("key.pem", "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        return True
    except ImportError:
        print("❌ Instala cryptography: pip install cryptography")
        return False

def run_https_server():
    """Ejecutar servidor HTTPS"""
    port = 8443
    
    # Crear certificado si no existe
    if not (os.path.exists("cert.pem") and os.path.exists("key.pem")):
        print("🔐 Creando certificado SSL...")
        if not create_self_signed_cert():
            return
    
    # Configurar SSL
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain("cert.pem", "key.pem")
    
    # Crear servidor
    server = HTTPServer(("localhost", port), CORSHTTPRequestHandler)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    
    print(f"🚀 Servidor HTTPS ejecutándose en:")
    print(f"   https://localhost:{port}")
    print(f"   https://127.0.0.1:{port}")
    print("\n📱 Abre tu navegador y acepta el certificado")
    print("🔒 La cámara funcionará con HTTPS")
    
    # Abrir navegador
    webbrowser.open(f"https://localhost:{port}")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido")
        server.shutdown()

if __name__ == "__main__":
    run_https_server()
