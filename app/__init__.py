from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
import os

# Initialize extensions outside of create_app
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-please-change')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///polling.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ERROR_MESSAGE_KEY = 'msg'

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.polls import polls_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(polls_bp, url_prefix='/polls')
    
    # Health check route
    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy"}), 200
    
    return app
