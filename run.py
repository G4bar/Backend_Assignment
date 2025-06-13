# Keep this file for local development purposes
import os
from app import create_app, db

# This file is for local development only
# It's not used in production where Gunicorn uses wsgi.py instead
env = 'development'  # Always use development for local runs
app = create_app(env)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
