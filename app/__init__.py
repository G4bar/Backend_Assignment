from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config

# Initialize extensions outside of create_app
db = SQLAlchemy()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app(env=None):
    app = Flask(__name__)
    
    # Use Config class for configuration
    app.config.from_object(Config)
    
    # Ensure debug is disabled in production
    if env == 'production':
        app.config['DEBUG'] = False
    
    # Configure CORS to allow frontend requests
    # NOTE FOR RAILWAY DEPLOYMENT: Update these origins to match your frontend URL
    CORS(app, resources={
        r"/*": {
            "origins": [
                "https://polling-app-production-1019.up.railway.app",  # Production frontend
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize extensions with app
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.polls import polls_bp
    from .routes.general import general_bp  # Import the new general blueprint
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(polls_bp, url_prefix='/polls')
    app.register_blueprint(general_bp)  # Register it at the root level (no prefix)
    
    return app
    
    return app
