from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from .. import db, bcrypt
from ..models import User
from config import Config

auth_bp = Blueprint("auth", __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(username=username, password_hash=hashed_pw)
    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "User created"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password_hash, password):
        # Include admin status in the token as an additional claim
        additional_claims = {"is_admin": user.is_admin}
        access_token = create_access_token(
            identity=str(user.id), 
            additional_claims=additional_claims
        )
        return jsonify(access_token=access_token)

    return jsonify({"msg": "Invalid credentials"}), 401

@auth_bp.route('/create-admin', methods=['POST'])
def create_admin():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    admin_secret = data.get('admin_secret')
    
    # Check admin secret using the config value
    if admin_secret != Config.ADMIN_SECRET:
        return jsonify({"msg": "Invalid admin secret"}), 403

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(username=username, password_hash=hashed_pw, is_admin=True)
    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "Admin user created"}), 201
