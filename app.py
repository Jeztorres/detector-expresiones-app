import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from api.controllers.gestos_controller import bp as gestos_bp
from api.controllers.estadisticas_controller import bp_stats

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
FRONT_DIR = os.path.join(BASE_DIR, "front")

def create_app():
    app = Flask(__name__,
                static_folder=FRONT_DIR,
                static_url_path="/static")
    
    # Configurar CORS para permitir conexiones desde Live Server y GitHub Pages
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://127.0.0.1:5501",  # Live Server
                "http://localhost:5501",   # Live Server alternativo
                "http://127.0.0.1:5000",  # Flask directo
                "http://localhost:5000",   # Flask alternativo
                "https://jeztorres.github.io",  # GitHub Pages
                "https://jeztorres.github.io/detector-expresiones-app/"  # App específica
            ]
        }
    })

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.route("/")
    def index():
        return send_from_directory(FRONT_DIR, "index.html")
    
    # Rutas para servir archivos estáticos del frontend
    @app.route("/<path:filename>")
    def serve_static_files(filename):
        return send_from_directory(FRONT_DIR, filename)

    app.register_blueprint(gestos_bp)
    app.register_blueprint(bp_stats)
    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
