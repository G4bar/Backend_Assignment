from . import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    is_admin = db.Column(db.Boolean, default=False)
    
    # Relationship with polls created by the user
    polls = db.relationship('Poll', backref='creator', lazy=True, cascade='all, delete-orphan')
    votes = db.relationship('Vote', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f"<User {self.username}>"


class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    is_active = db.Column(db.Boolean, default=True)
    
    # Foreign key for the user who created the poll
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationship with poll options
    options = db.relationship('PollOption', backref='poll', lazy=True, cascade='all, delete-orphan')
    votes = db.relationship('Vote', backref='poll', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f"<Poll {self.title}>"
    
    def get_results(self):
        """Returns poll results with vote count"""
        results = {}
        for option in self.options:
            results[option.id] = {
                'text': option.text,
                'votes': len(option.votes)
            }
        return results


class PollOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    
    # Relationship with votes for this option
    votes = db.relationship('Vote', backref='option', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f"<PollOption {self.text}>"


class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey('poll_option.id'), nullable=False)
    
    # Constraint to prevent multiple votes from the same user on the same poll
    __table_args__ = (db.UniqueConstraint('user_id', 'poll_id', name='unique_user_poll_vote'),)
    
    def __repr__(self):
        return f"<Vote user_id={self.user_id} poll_id={self.poll_id}>"
