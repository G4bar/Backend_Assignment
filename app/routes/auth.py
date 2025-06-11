from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from .. import db, bcrypt
from ..models import User

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
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token)

    return jsonify({"msg": "Invalid credentials"}), 401
