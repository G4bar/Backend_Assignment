import os
from app import create_app, db
from flask_cors import CORS  # Import Flask-CORS extension

# This file is for production WSGI servers like Gunicorn
# It doesn't run a server itself - it just creates the app object
# that Gunicorn will use

os.environ['FLASK_ENV'] = 'production'
app = create_app('production')
CORS(app)  # Initialize CORS for the application

# Initialize database if needed
with app.app_context():
    db.create_all()
