import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from src.api.controllers.gestos_controller import bp as gestos_bp
from src.api.controllers.estadisticas_controller import bp_stats

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend", "public")
FRONT_DIR = os.path.join(FRONTEND_DIR, "front")

def create_app():
    app = Flask(__name__,
                static_folder=FRONTEND_DIR,
                static_url_path="/static",
                template_folder=ROOT_DIR)
    
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                "http://127.0.0.1:5501",
                "http://localhost:5501", 
                "http://127.0.0.1:5000",
                "http://localhost:5000",
                "https://jeztorres.github.io"
            ]
        }
    })

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.route("/")
    def index():
        return send_from_directory(ROOT_DIR, "index.html")
    
    # Rutas para servir archivos estáticos del frontend
    @app.route("/front/<path:filename>")
    def serve_front_files(filename):
        return send_from_directory(FRONT_DIR, filename)
    
    @app.route("/<path:filename>")
    def serve_static_files(filename):
        # Evitar conflictos con las rutas de la API
        if filename.startswith('api/'):
            return "Not Found", 404
        return send_from_directory(FRONTEND_DIR, filename)

    app.register_blueprint(gestos_bp)
    app.register_blueprint(bp_stats)
    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
