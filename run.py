import os
from app import create_app, db

# Use environment variable for environment setting
env = os.environ.get('FLASK_ENV', 'production')
app = create_app(env)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
