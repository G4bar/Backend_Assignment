from flask import Blueprint, request, jsonify
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models import User, Poll, PollOption, Vote

polls_bp = Blueprint("polls", __name__)

class PollCreateView(MethodView):
    decorators = [jwt_required()]
    
    def post(self):
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

class PollDetailView(MethodView):
    def get(self, poll_id):
        poll = Poll.query.get(poll_id)
        
        if not poll:
            return jsonify({"msg": "Poll not found"}), 404
        
        # Get poll results with vote counts
        results = poll.get_results()
        
        # Get creator's name
        creator = User.query.get(poll.user_id)
        creator_name = creator.username if creator else "Unknown User"
        
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
            'creator_name': creator_name,
            'is_active': poll.is_active,
            'options': options
        }
        
        return jsonify(poll_data), 200
    
    @jwt_required()
    def delete(self, poll_id):
        # Get authenticated user ID
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        # Get the user to check if admin
        user = User.query.get(user_id)
        if not user:
            return jsonify({"msg": "User not found"}), 404
        
        # Check if poll exists
        poll = Poll.query.get(poll_id)
        if not poll:
            return jsonify({"msg": "Poll not found"}), 404
        
        # Check if authenticated user is the poll owner or an admin
        if poll.user_id != user_id and not user.is_admin:
            return jsonify({"msg": "You don't have permission to delete this poll"}), 403
        
        # Delete poll (cascade will handle related options and votes)
        db.session.delete(poll)
        
        try:
            db.session.commit()
            return jsonify({"msg": "Poll deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"msg": "Error deleting poll", "error": str(e)}), 500

class PollVoteView(MethodView):
    decorators = [jwt_required()]
    
    def post(self):
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

class PollListView(MethodView):
    def get(self):
        polls = Poll.query.all()
        
        polls_list = []
        for poll in polls:
            # Get creator's name
            creator = User.query.get(poll.user_id)
            creator_name = creator.username if creator else "Unknown User"
            
            polls_list.append({
                'id': poll.id,
                'title': poll.title,
                'description': poll.description,
                'user_id': poll.user_id,
                'creator_name': creator_name
            })
        
        return jsonify({
            'polls': polls_list,
            'count': len(polls_list)
        }), 200

class MyPollsView(MethodView):
    decorators = [jwt_required()]
    
    def get(self):
        # Get authenticated user ID
        user_id = get_jwt_identity()
        if isinstance(user_id, str):
            user_id = int(user_id)
        
        # Get the user to get the username
        user = User.query.get(user_id)
        creator_name = user.username if user else "Unknown User"
        
        # Query polls created by the authenticated user
        polls = Poll.query.filter_by(user_id=user_id).all()
        
        polls_list = []
        for poll in polls:
            polls_list.append({
                'id': poll.id,
                'title': poll.title,
                'description': poll.description,
                'user_id': poll.user_id,
                'creator_name': creator_name
            })
        
        return jsonify({
            'user_id': user_id,
            'polls': polls_list,
            'count': len(polls_list)
        }), 200

# Register class-based views with blueprints
polls_bp.add_url_rule('/create', view_func=PollCreateView.as_view('create_poll'))
polls_bp.add_url_rule('/get/<int:poll_id>', view_func=PollDetailView.as_view('get_poll'))
polls_bp.add_url_rule('/delete/<int:poll_id>', view_func=PollDetailView.as_view('delete_poll'))
polls_bp.add_url_rule('/vote', view_func=PollVoteView.as_view('vote_on_poll'))
polls_bp.add_url_rule('/', view_func=PollListView.as_view('get_all_polls'))
polls_bp.add_url_rule('/my-polls', view_func=MyPollsView.as_view('get_my_polls'))