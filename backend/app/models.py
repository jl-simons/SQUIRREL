from . import db
from flask_login import UserMixin

# Accounts scaffold (separate DB)
class Account(db.Model):
    __bind_key__ = 'accounts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    institution = db.Column(db.String(120), nullable=True)
    last4 = db.Column(db.String(4), nullable=True)
    note = db.Column(db.String(255), nullable=True)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    points = db.Column(db.Integer, default=0)
    display_name = db.Column(db.String(120), nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)

class Chore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(20), nullable=False)  # Added category field
    points = db.Column(db.Integer, nullable=False)

class CompletedChore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    chore_id = db.Column(db.Integer, db.ForeignKey('chore.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)

class Reward(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    cost = db.Column(db.Integer, nullable=False)

class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('reward.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)

class QueueItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('reward.id'), nullable=False)
    date_added = db.Column(db.Date, nullable=False)
    reward = db.relationship('Reward')

# Finance models (stored in dedicated 'finance' bind)
class Transaction(db.Model):
    __bind_key__ = 'finance'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)  # keep int to avoid cross-DB FK
    date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=True)
    type = db.Column(db.String(10), nullable=False)  # 'income' or 'expense'
    notes = db.Column(db.String(255), nullable=True)

class Scenario(db.Model):
    __bind_key__ = 'finance'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255), nullable=True)

class ScenarioOption(db.Model):
    __bind_key__ = 'finance'
    id = db.Column(db.Integer, primary_key=True)
    scenario_id = db.Column(db.Integer, nullable=False)  # same DB, FK optional
    name = db.Column(db.String(120), nullable=False)
    monthly_delta = db.Column(db.Float, nullable=False, default=0.0)
    one_time_delta = db.Column(db.Float, nullable=False, default=0.0)
    start_month = db.Column(db.String(7), nullable=False)
    months = db.Column(db.Integer, nullable=True)

# Minimal rewards-bound table to materialize rewards.db (does not affect current Reward/Purchase models)
class RewardsMeta(db.Model):
    __bind_key__ = 'rewards'
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.Date, nullable=True)