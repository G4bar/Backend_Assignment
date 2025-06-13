from flask import Blueprint, jsonify

general_bp = Blueprint("general", __name__)

@general_bp.route('/', methods=['GET'])
def health_check():
    """Health check endpoint for container orchestration systems"""
    return jsonify({"status": "healthy", "message": "API is operational"}), 200
