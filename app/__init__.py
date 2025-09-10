from flask import Flask
from flask_cors import CORS
from .controllers.gestos_controller import gestos_bp


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(gestos_bp, url_prefix='/api')
    return app
