"""
Pytest fixtures for Flask app testing
"""
import pytest
import tempfile
import os
from datetime import date
from werkzeug.security import generate_password_hash


@pytest.fixture(scope='function')
def app():
    """Create and configure a test Flask app instance with temporary databases"""
    # Import here to avoid circular imports
    from app import create_app
    from app.models import User, Chore, Reward, Transaction, Scenario, ScenarioOption

    # Create temporary directory for test databases
    temp_dir = tempfile.mkdtemp()

    # Test configuration
    test_config = {
        'TESTING': True,
        'SECRET_KEY': 'test-secret-key',
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{os.path.join(temp_dir, "test_chores.db")}',
        'SQLALCHEMY_BINDS': {
            'finance': f'sqlite:///{os.path.join(temp_dir, "test_finance.db")}',
            'accounts': f'sqlite:///{os.path.join(temp_dir, "test_accounts.db")}',
            'rewards': f'sqlite:///{os.path.join(temp_dir, "test_rewards.db")}'
        },
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'WTF_CSRF_ENABLED': False,  # Disable CSRF for testing
        'SERVER_NAME': 'localhost.localdomain',
    }

    # Create app with test config
    app = create_app(test_config)

    # Create application context
    with app.app_context():
        # Create all tables
        app.db.create_all()

        # Seed test data
        _seed_test_data(app.db)

        yield app

        # Cleanup
        app.db.session.remove()
        app.db.drop_all()

    # Remove temporary directory
    import shutil
    shutil.rmtree(temp_dir)


def _seed_test_data(db):
    """Seed database with test data"""
    from app.models import User, Chore, Reward

    # Create test users
    user1 = User(
        username='testuser',
        display_name='Test User',
        password=generate_password_hash('SecurePass123'),
        points=100
    )
    user2 = User(
        username='admin',
        display_name='Admin User',
        password=generate_password_hash('AdminPass123'),
        points=50
    )
    db.session.add(user1)
    db.session.add(user2)

    # Create test chores
    chore1 = Chore(name='Clean Room', category='Daily', points=10)
    chore2 = Chore(name='Do Dishes', category='Daily', points=5)
    chore3 = Chore(name='Mow Lawn', category='Weekly', points=20)
    db.session.add(chore1)
    db.session.add(chore2)
    db.session.add(chore3)

    # Create test rewards
    reward1 = Reward(name='Movie Night', cost=50)
    reward2 = Reward(name='Ice Cream', cost=25)
    reward3 = Reward(name='Extra Screen Time', cost=10)
    db.session.add(reward1)
    db.session.add(reward2)
    db.session.add(reward3)

    db.session.commit()


@pytest.fixture(scope='function')
def client(app):
    """Create a test client for the app"""
    return app.test_client()


@pytest.fixture(scope='function')
def authenticated_client(app, client):
    """Create an authenticated test client"""
    # Login as testuser
    with client:
        response = client.post('/login', data={
            'username': 'testuser',
            'password': 'SecurePass123'
        }, follow_redirects=True)

        assert response.status_code == 200

        yield client


@pytest.fixture(scope='function')
def admin_client(app, client):
    """Create an authenticated admin test client"""
    # Login as admin
    with client:
        response = client.post('/login', data={
            'username': 'admin',
            'password': 'AdminPass123'
        }, follow_redirects=True)

        assert response.status_code == 200

        yield client


@pytest.fixture(scope='function')
def db_session(app):
    """Provide a database session for tests that need direct DB access"""
    with app.app_context():
        yield app.db.session
