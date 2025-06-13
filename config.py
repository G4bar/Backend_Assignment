import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "supersecretkey")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", 'sqlite:///polling.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwtsecret")
    ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "default_admin_secret")
