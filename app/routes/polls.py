from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models import User, Poll, PollOption, Vote

polls_bp = Blueprint("polls", __name__)

@polls_bp.route('/create', methods=['POST'])
@jwt_required()
def create_poll():
    # Get identity and convert to int for database lookup
    user_id = get_jwt_identity()
    if isinstance(user_id, str):
        user_id = int(user_id)
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"msg": "User not found"}), 404
    
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    options = data.get('options', [])
    
    if not title:
        return jsonify({"msg": "Title is required"}), 400
    
    if not options:
        return jsonify({"msg": "At least one poll option is required"}), 400
        
    # Using user_id directly instead of creator=user
    poll = Poll(title=title, description=description, user_id=user_id)
    db.session.add(poll)
    
    # Create poll options
    for option_text in options:
        option = PollOption(text=option_text, poll=poll)
        db.session.add(option)
    
    db.session.commit()
    
    return jsonify({
        "msg": "Poll created successfully", 
        "poll_id": poll.id,
        "options_count": len(options)
    }), 201

@polls_bp.route('/get/<int:poll_id>', methods=['GET'])
def get_poll(poll_id):
    poll = Poll.query.get(poll_id)
    
    if not poll:
        return jsonify({"msg": "Poll not found"}), 404
    
    # Get poll results with vote counts
    results = poll.get_results()
    
    # Format options for the response
    options = []
    for option_id, option_data in results.items():
        options.append({
            'id': option_id,
            'text': option_data['text'],
            'votes': option_data['votes']
        })
    
    # Create response data
    poll_data = {
        'id': poll.id,
        'title': poll.title,
        'description': poll.description,
        'created_at': poll.created_at.isoformat(),
        'creator_id': poll.user_id,
        'is_active': poll.is_active,
        'options': options
    }
    
    return jsonify(poll_data), 200

@polls_bp.route('/vote', methods=['POST'])
@jwt_required()
def vote_on_poll():
    # Get authenticated user ID
    user_id = get_jwt_identity()
    if isinstance(user_id, str):
        user_id = int(user_id)
    
    data = request.get_json()
    poll_id = data.get('poll_id')
    option_id = data.get('option_id')
    
    # Validate input
    if not poll_id or not option_id:
        return jsonify({"msg": "Poll ID and option ID are required"}), 400
    
    # Check if poll exists and is active
    poll = Poll.query.get(poll_id)
    if not poll:
        return jsonify({"msg": "Poll not found"}), 404
    
    if not poll.is_active:
        return jsonify({"msg": "This poll is no longer active"}), 403
    
    # Check if option belongs to the poll
    option = PollOption.query.get(option_id)
    if not option or option.poll_id != poll.id:
        return jsonify({"msg": "Invalid option for this poll"}), 400
    
    # Check if user has already voted on this poll
    existing_vote = Vote.query.filter_by(user_id=user_id, poll_id=poll_id).first()
    if existing_vote:
        return jsonify({"msg": "You have already voted on this poll"}), 400
    
    # Create new vote
    vote = Vote(user_id=user_id, poll_id=poll_id, option_id=option_id)
    db.session.add(vote)
    
    try:
        db.session.commit()
        return jsonify({"msg": "Vote recorded successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error recording vote", "error": str(e)}), 500