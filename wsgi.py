import os
from app import create_app, db
from flask_cors import CORS

# This file is for production WSGI servers like Gunicorn
# It doesn't run a server itself - it just creates the app object
# that Gunicorn will use

os.environ['FLASK_ENV'] = 'production'
app = create_app('production')

# Apply CORS with a more permissive configuration
CORS(app, supports_credentials=True, origins=["*"])

# Add explicit CORS headers to all responses
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Initialize database if needed (remove duplicate)
with app.app_context():
    db.create_all()
