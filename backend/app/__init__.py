from flask import Flask, request
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
import os
import secrets
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def create_app(config=None):
    """Application factory for Flask app"""
    app = Flask(__name__)

    # Apply test config if provided
    if config:
        app.config.update(config)
        # Skip loading rest of config if TESTING is True
        if app.config.get('TESTING'):
            # Minimal setup for tests
            db = SQLAlchemy(app)
            login_manager = LoginManager(app)
            login_manager.login_view = 'login'
            limiter = Limiter(
                app=app,
                key_func=get_remote_address,
                default_limits=["200 per day", "50 per hour"],
                storage_uri="memory://",
                enabled=False  # Disable rate limiting in tests
            )
            app.db = db
            app.login_manager = login_manager
            app.limiter = limiter
            return app

    # Standard initialization continues below
    return _initialize_app(app)

def _initialize_app(app):
    """Initialize app with standard config (non-test)"""
    # Ensure instance folder exists for SQLite files
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except Exception:
        pass

    # Database and security basics
    # Keep core data (users/chores/rewards) in main DB (existing chores.db to preserve data)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chores.db'
    # Add dedicated finance DB via bind
    app.config['SQLALCHEMY_BINDS'] = {
        'finance': f"sqlite:///{os.path.join(app.instance_path, 'finance.db')}",
        'accounts': f"sqlite:///{os.path.join(app.instance_path, 'accounts.db')}",
        'rewards': f"sqlite:///{os.path.join(app.instance_path, 'rewards.db')}"
    }

    # Secure SECRET_KEY handling: must be set via environment variable
    secret_key = os.environ.get('SECRET_KEY')
    if not secret_key:
        # In production, this should fail hard. For dev, generate a temporary key with warning.
        if os.environ.get('FLASK_ENV') == 'production':
            raise ValueError("SECRET_KEY environment variable must be set in production!")
        secret_key = secrets.token_hex(32)
        print("WARNING: Using auto-generated SECRET_KEY for development. Set SECRET_KEY env var for production!")
    app.config['SECRET_KEY'] = secret_key

    # Session/cookie settings suitable for local dev behind Vite proxy
    app.config.setdefault('SESSION_COOKIE_SAMESITE', 'Lax')
    app.config.setdefault('REMEMBER_COOKIE_SAMESITE', 'Lax')
    app.config.setdefault('SESSION_COOKIE_SECURE', False)
    app.config.setdefault('REMEMBER_COOKIE_SECURE', False)
    app.config.setdefault('SESSION_COOKIE_HTTPONLY', True)

    # Respect X-Forwarded-* headers from the dev proxy (host, proto, port)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    # Extensions
    db = SQLAlchemy(app)
    login_manager = LoginManager(app)
    login_manager.login_view = 'login'

    # Rate limiting to prevent brute force and abuse
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://"
    )

    # Attach to app for access in routes
    app.db = db
    app.login_manager = login_manager
    app.limiter = limiter

    return app

# Create default app instance for normal usage
app = create_app()
db = app.db
login_manager = app.login_manager
limiter = app.limiter

# Ensure we allow being framed by the same origin (Vite proxy keeps same origin)
@app.after_request
def _frame_headers(resp):
    try:
        # SAMEORIGIN allows embedding when origin is the same as the top-level (which it is via proxy)
        resp.headers.setdefault('X-Frame-Options', 'SAMEORIGIN')
    except Exception:
        pass
    return resp

# Make a `prefix` variable available in all templates so forms/links stay under /backend when proxied
@app.context_processor
def inject_proxy_prefix():
    try:
        forwarded_prefix = request.headers.get('X-Forwarded-Prefix')
        prefix = forwarded_prefix if forwarded_prefix else ('/backend' if request.path.startswith('/backend') else '')
        return {'prefix': prefix}
    except Exception:
        return {'prefix': ''}
