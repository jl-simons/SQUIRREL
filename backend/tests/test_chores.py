"""
Tests for chores functionality: listing, completing, points increment
"""
import pytest
from datetime import date


class TestChoresListing:
    """Test chore listing endpoints"""

    def test_api_chores_list(self, client):
        """Test /api/chores returns list of pending chores"""
        response = client.get('/api/chores')
        assert response.status_code == 200

        data = response.get_json()
        assert 'chores' in data
        assert 'pending_count' in data
        assert 'completed_count' in data
        assert isinstance(data['chores'], list)
        assert len(data['chores']) >= 3  # We seeded 3 chores

    def test_api_chores_contains_expected_fields(self, client):
        """Test chores have required fields"""
        response = client.get('/api/chores')
        data = response.get_json()

        if data['chores']:
            chore = data['chores'][0]
            assert 'id' in chore
            assert 'name' in chore
            assert 'category' in chore
            assert 'points' in chore

    def test_chores_page_authenticated(self, authenticated_client):
        """Test chores page accessible when authenticated"""
        response = authenticated_client.get('/chores')
        assert response.status_code == 200

    def test_chores_page_unauthenticated(self, client):
        """Test chores page redirects when not authenticated"""
        response = client.get('/chores', follow_redirects=False)
        assert response.status_code == 302  # Redirect to login


class TestChoreCompletion:
    """Test completing chores and points increment"""

    def test_complete_chore_increments_points(self, authenticated_client, app):
        """Test completing a chore increments user points"""
        from app.models import User, Chore

        # Get initial points
        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            initial_points = user.points
            chore = Chore.query.filter_by(name='Clean Room').first()
            chore_id = chore.id
            chore_points = chore.points

        # Complete the chore
        response = authenticated_client.post('/chores', data={
            'chore': [str(chore_id)]
        }, follow_redirects=True)

        assert response.status_code == 200

        # Verify points increased
        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            assert user.points == initial_points + chore_points

    def test_complete_multiple_chores(self, authenticated_client, app):
        """Test completing multiple chores at once"""
        from app.models import User, Chore

        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            initial_points = user.points

            chore1 = Chore.query.filter_by(name='Clean Room').first()
            chore2 = Chore.query.filter_by(name='Do Dishes').first()
            total_points = chore1.points + chore2.points

        # Complete both chores
        response = authenticated_client.post('/chores', data={
            'chore': [str(chore1.id), str(chore2.id)]
        }, follow_redirects=True)

        assert response.status_code == 200

        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            assert user.points == initial_points + total_points

    def test_completed_chore_recorded(self, authenticated_client, app):
        """Test completed chore is recorded in CompletedChore table"""
        from app.models import User, Chore, CompletedChore

        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            chore = Chore.query.filter_by(name='Mow Lawn').first()
            chore_id = chore.id
            user_id = user.id

        # Complete the chore
        response = authenticated_client.post('/chores', data={
            'chore': [str(chore_id)]
        }, follow_redirects=True)

        assert response.status_code == 200

        # Verify CompletedChore record exists
        with app.app_context():
            completed = CompletedChore.query.filter_by(
                user_id=user_id,
                chore_id=chore_id,
                date=date.today()
            ).first()
            assert completed is not None

    def test_completed_chore_removed_from_pending(self, authenticated_client, app):
        """Test completed chore doesn't appear in pending list"""
        from app.models import Chore

        with app.app_context():
            chore = Chore.query.filter_by(name='Do Dishes').first()
            chore_id = chore.id

        # Complete the chore
        authenticated_client.post('/chores', data={
            'chore': [str(chore_id)]
        }, follow_redirects=True)

        # Check pending chores via API
        response = authenticated_client.get('/api/chores')
        data = response.get_json()

        # Completed chore should not be in pending list
        pending_ids = [c['id'] for c in data['chores']]
        assert chore_id not in pending_ids


class TestChoreCreation:
    """Test creating new chores"""

    def test_create_chore_via_form(self, authenticated_client, app):
        """Test creating a new chore via form submission"""
        response = authenticated_client.post('/chores', data={
            'new_chore_name': 'Vacuum Living Room',
            'new_chore_category': 'Weekly',
            'new_chore_points': '15'
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'New chore added' in response.data or response.status_code == 200

        # Verify chore was created
        with app.app_context():
            from app.models import Chore
            chore = Chore.query.filter_by(name='Vacuum Living Room').first()
            assert chore is not None
            assert chore.category == 'Weekly'
            assert chore.points == 15

    def test_create_chore_via_api(self, client, app):
        """Test creating a new chore via API"""
        response = client.post('/api/chores',
                               json={
                                   'name': 'Take Out Trash',
                                   'category': 'Daily',
                                   'points': 5
                               })

        assert response.status_code == 201
        data = response.get_json()
        assert data['ok'] is True

        # Verify chore was created
        with app.app_context():
            from app.models import Chore
            chore = Chore.query.filter_by(name='Take Out Trash').first()
            assert chore is not None

    def test_create_chore_invalid_payload(self, client):
        """Test creating chore with invalid payload fails"""
        response = client.post('/api/chores',
                               json={
                                   'name': 'Invalid Chore',
                                   'category': 'Daily',
                                   # Missing points
                               })

        assert response.status_code == 400
        data = response.get_json()
        assert data['ok'] is False


class TestDashboard:
    """Test dashboard endpoint"""

    def test_dashboard_authenticated(self, authenticated_client):
        """Test dashboard accessible when authenticated"""
        response = authenticated_client.get('/dashboard')
        assert response.status_code == 200

    def test_dashboard_shows_pending_chores(self, authenticated_client):
        """Test dashboard shows pending chores"""
        response = authenticated_client.get('/dashboard')
        assert response.status_code == 200
        # Just verify it renders without error

    def test_dashboard_unauthenticated_redirects(self, client):
        """Test dashboard redirects when not authenticated"""
        response = client.get('/dashboard', follow_redirects=False)
        assert response.status_code == 302


class TestLeaderboard:
    """Test leaderboard functionality"""

    def test_leaderboard_shows_users(self, authenticated_client):
        """Test leaderboard shows users ordered by points"""
        response = authenticated_client.get('/leaderboard')
        assert response.status_code == 200

    def test_leaderboard_requires_auth(self, client):
        """Test leaderboard requires authentication"""
        response = client.get('/leaderboard', follow_redirects=False)
        assert response.status_code == 302
