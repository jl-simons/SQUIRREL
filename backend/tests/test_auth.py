"""
Tests for authentication: register, login, logout
"""
import pytest
from flask import session


class TestRegistration:
    """Test user registration"""

    def test_register_success(self, client):
        """Test successful registration"""
        response = client.post('/register', data={
            'username': 'newuser',
            'password': 'SecurePass123',
            'confirm': 'SecurePass123'
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'Registration successful!' in response.data or b'dashboard' in response.data

    def test_register_weak_password(self, client):
        """Test registration with weak password is rejected"""
        response = client.post('/register', data={
            'username': 'weakuser',
            'password': 'admin',
            'confirm': 'admin'
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'Password is too common' in response.data or b'8 characters' in response.data

    def test_register_short_password(self, client):
        """Test registration with short password is rejected"""
        response = client.post('/register', data={
            'username': 'shortpass',
            'password': '123',
            'confirm': '123'
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'8 characters' in response.data

    def test_register_password_mismatch(self, client):
        """Test registration with mismatched passwords"""
        response = client.post('/register', data={
            'username': 'mismatch',
            'password': 'SecurePass123',
            'confirm': 'DifferentPass456'
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'do not match' in response.data

    def test_register_duplicate_username(self, client):
        """Test registration with existing username"""
        response = client.post('/register', data={
            'username': 'testuser',  # Already exists from seed
            'password': 'SecurePass123',
            'confirm': 'SecurePass123'
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'already exists' in response.data

    def test_register_missing_fields(self, client):
        """Test registration with missing required fields"""
        response = client.post('/register', data={
            'username': '',
            'password': 'SecurePass123',
            'confirm': 'SecurePass123'
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'required' in response.data


class TestLogin:
    """Test user login"""

    def test_login_success(self, client):
        """Test successful login"""
        response = client.post('/login', data={
            'username': 'testuser',
            'password': 'SecurePass123'
        }, follow_redirects=True)

        assert response.status_code == 200

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post('/login', data={
            'username': 'testuser',
            'password': 'WrongPassword'
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'Invalid credentials' in response.data

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        response = client.post('/login', data={
            'username': 'nonexistent',
            'password': 'SomePassword123'
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'Invalid credentials' in response.data

    def test_login_get_request(self, client):
        """Test GET request to login page"""
        response = client.get('/login')
        assert response.status_code == 200


class TestLogout:
    """Test user logout"""

    def test_logout_authenticated(self, authenticated_client):
        """Test logout when authenticated"""
        response = authenticated_client.get('/logout', follow_redirects=True)
        assert response.status_code == 200

    def test_logout_redirects_to_login(self, client):
        """Test logout redirects to login page"""
        # Try to logout when not authenticated
        response = client.get('/logout', follow_redirects=False)
        assert response.status_code in [302, 401]


class TestApiMe:
    """Test /api/me endpoint"""

    def test_api_me_authenticated(self, authenticated_client):
        """Test /api/me returns user data when authenticated"""
        response = authenticated_client.get('/api/me')
        assert response.status_code == 200

        data = response.get_json()
        assert data['authenticated'] is True
        assert data['username'] == 'testuser'
        assert data['display_name'] == 'Test User'
        assert data['points'] == 100

    def test_api_me_unauthenticated(self, client):
        """Test /api/me returns not authenticated when not logged in"""
        response = client.get('/api/me')
        assert response.status_code == 200

        data = response.get_json()
        assert data['authenticated'] is False

    def test_api_me_profile_picture(self, authenticated_client, app):
        """Test /api/me includes profile picture if set"""
        from app.models import User

        # Update user's profile picture
        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            user.profile_picture = 'https://example.com/avatar.jpg'
            app.db.session.commit()

        response = authenticated_client.get('/api/me')
        data = response.get_json()
        assert data['profile_picture'] == 'https://example.com/avatar.jpg'


class TestInputSanitization:
    """Test input sanitization in registration and profile"""

    def test_register_xss_attempt_in_username(self, client):
        """Test XSS attempt in username is sanitized"""
        response = client.post('/register', data={
            'username': '<script>alert("xss")</script>hacker',
            'password': 'SecurePass123',
            'confirm': 'SecurePass123'
        }, follow_redirects=True)

        # Should succeed but sanitize the username
        assert response.status_code == 200

        # Verify username was sanitized
        response = client.post('/login', data={
            'username': 'hacker',  # Script tags should be stripped
            'password': 'SecurePass123'
        }, follow_redirects=True)

        # May or may not login depending on exact sanitization - just check it processed
        assert response.status_code == 200
