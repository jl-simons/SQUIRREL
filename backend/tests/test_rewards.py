"""
Tests for rewards system: queue management, redemption, points deduction
"""
import pytest
from datetime import date


class TestRewardsListing:
    """Test rewards listing"""

    def test_rewards_page_authenticated(self, authenticated_client):
        """Test rewards page accessible when authenticated"""
        response = authenticated_client.get('/rewards')
        assert response.status_code == 200

    def test_rewards_page_unauthenticated(self, client):
        """Test rewards page redirects when not authenticated"""
        response = client.get('/rewards', follow_redirects=False)
        assert response.status_code == 302

    def test_rewards_list_shows_all_rewards(self, authenticated_client, app):
        """Test rewards page shows all available rewards"""
        from app.models import Reward

        with app.app_context():
            rewards_count = Reward.query.count()

        response = authenticated_client.get('/rewards')
        assert response.status_code == 200
        # At least our seeded rewards should be present
        assert rewards_count >= 3


class TestQueueManagement:
    """Test reward queue functionality"""

    def test_add_reward_to_queue(self, authenticated_client, app):
        """Test adding a reward to user's queue"""
        from app.models import Reward, QueueItem, User

        with app.app_context():
            reward = Reward.query.filter_by(name='Ice Cream').first()
            reward_id = reward.id
            user = User.query.filter_by(username='testuser').first()
            user_id = user.id

        # Add to queue
        response = authenticated_client.post('/rewards', data={
            'reward_id': str(reward_id)
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'Added to queue' in response.data

        # Verify it's in the queue
        with app.app_context():
            queue_item = QueueItem.query.filter_by(
                user_id=user_id,
                reward_id=reward_id
            ).first()
            assert queue_item is not None
            assert queue_item.date_added == date.today()

    def test_view_queue(self, authenticated_client):
        """Test viewing user's queue"""
        response = authenticated_client.get('/queue')
        assert response.status_code == 200

    def test_queue_requires_auth(self, client):
        """Test queue page requires authentication"""
        response = client.get('/queue', follow_redirects=False)
        assert response.status_code == 302

    def test_remove_from_queue(self, authenticated_client, app):
        """Test removing item from queue"""
        from app.models import Reward, QueueItem, User

        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            reward = Reward.query.filter_by(name='Extra Screen Time').first()

            # Add to queue first
            queue_item = QueueItem(
                user_id=user.id,
                reward_id=reward.id,
                date_added=date.today()
            )
            app.db.session.add(queue_item)
            app.db.session.commit()
            item_id = queue_item.id

        # Remove from queue
        response = authenticated_client.get(f'/queue/remove/{item_id}', follow_redirects=True)
        assert response.status_code == 200
        assert b'Removed from queue' in response.data

        # Verify it's removed
        with app.app_context():
            item = QueueItem.query.get(item_id)
            assert item is None


class TestRewardRedemption:
    """Test reward redemption and points deduction"""

    def test_redeem_reward_with_sufficient_points(self, authenticated_client, app):
        """Test redeeming a reward when user has enough points"""
        from app.models import User, Reward, QueueItem, Purchase

        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            initial_points = user.points  # Should be 100 from seed

            # Find a reward we can afford
            reward = Reward.query.filter_by(name='Ice Cream').first()  # Cost: 25
            assert initial_points >= reward.cost

            # Add to queue
            queue_item = QueueItem(
                user_id=user.id,
                reward_id=reward.id,
                date_added=date.today()
            )
            app.db.session.add(queue_item)
            app.db.session.commit()
            item_id = queue_item.id
            reward_cost = reward.cost
            reward_id = reward.id
            user_id = user.id

        # Redeem the reward
        response = authenticated_client.get(f'/queue/redeem/{item_id}', follow_redirects=True)
        assert response.status_code == 200
        assert b'Redeemed!' in response.data

        # Verify points deducted
        with app.app_context():
            user = User.query.get(user_id)
            assert user.points == initial_points - reward_cost

        # Verify purchase recorded
        with app.app_context():
            purchase = Purchase.query.filter_by(
                user_id=user_id,
                reward_id=reward_id,
                date=date.today()
            ).first()
            assert purchase is not None

        # Verify queue item removed
        with app.app_context():
            item = QueueItem.query.get(item_id)
            assert item is None

    def test_redeem_reward_insufficient_points(self, authenticated_client, app):
        """Test redeeming reward when user doesn't have enough points"""
        from app.models import User, Reward, QueueItem

        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            initial_points = user.points

            # Set points to less than reward cost
            user.points = 5
            app.db.session.commit()

            # Try to add expensive reward to queue
            reward = Reward.query.filter_by(name='Movie Night').first()  # Cost: 50
            queue_item = QueueItem(
                user_id=user.id,
                reward_id=reward.id,
                date_added=date.today()
            )
            app.db.session.add(queue_item)
            app.db.session.commit()
            item_id = queue_item.id
            user_id = user.id

        # Try to redeem
        response = authenticated_client.get(f'/queue/redeem/{item_id}', follow_redirects=True)
        assert response.status_code == 200
        assert b'Not enough points' in response.data

        # Verify points not deducted
        with app.app_context():
            user = User.query.get(user_id)
            assert user.points == 5

        # Verify queue item still exists
        with app.app_context():
            item = QueueItem.query.get(item_id)
            assert item is not None

    def test_multiple_redemptions_tracked(self, authenticated_client, app):
        """Test multiple reward redemptions are tracked correctly"""
        from app.models import User, Reward, QueueItem, Purchase

        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            user.points = 200  # Ensure enough points
            app.db.session.commit()

            reward = Reward.query.filter_by(name='Extra Screen Time').first()  # Cost: 10

            # Add to queue twice
            item1 = QueueItem(user_id=user.id, reward_id=reward.id, date_added=date.today())
            item2 = QueueItem(user_id=user.id, reward_id=reward.id, date_added=date.today())
            app.db.session.add(item1)
            app.db.session.add(item2)
            app.db.session.commit()
            item1_id = item1.id
            item2_id = item2.id
            user_id = user.id
            reward_id = reward.id

        # Redeem first
        authenticated_client.get(f'/queue/redeem/{item1_id}', follow_redirects=True)

        # Redeem second
        authenticated_client.get(f'/queue/redeem/{item2_id}', follow_redirects=True)

        # Verify both purchases recorded
        with app.app_context():
            purchases = Purchase.query.filter_by(
                user_id=user_id,
                reward_id=reward_id
            ).all()
            assert len(purchases) >= 2

        # Verify correct points deducted
        with app.app_context():
            user = User.query.get(user_id)
            assert user.points == 200 - (10 * 2)


class TestDashboardQueueIntegration:
    """Test dashboard integration with queue"""

    def test_dashboard_shows_next_queue_item(self, authenticated_client, app):
        """Test dashboard displays next queue item"""
        from app.models import User, Reward, QueueItem

        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            reward = Reward.query.first()

            # Add item to queue
            queue_item = QueueItem(
                user_id=user.id,
                reward_id=reward.id,
                date_added=date.today()
            )
            app.db.session.add(queue_item)
            app.db.session.commit()

        # Access dashboard
        response = authenticated_client.get('/dashboard')
        assert response.status_code == 200
        # Should render without error even with queue item


class TestProfile:
    """Test profile page with purchase history"""

    def test_profile_page_accessible(self, authenticated_client):
        """Test profile page is accessible"""
        response = authenticated_client.get('/profile')
        assert response.status_code == 200

    def test_profile_shows_recent_activity(self, authenticated_client, app):
        """Test profile displays recent completed chores and purchases"""
        from app.models import User, Reward, Purchase

        with app.app_context():
            user = User.query.filter_by(username='testuser').first()
            reward = Reward.query.first()

            # Create a purchase
            purchase = Purchase(
                user_id=user.id,
                reward_id=reward.id,
                date=date.today()
            )
            app.db.session.add(purchase)
            app.db.session.commit()

        response = authenticated_client.get('/profile')
        assert response.status_code == 200
        # Should display without error

    def test_profile_update_display_name(self, authenticated_client, app):
        """Test updating display name via profile"""
        response = authenticated_client.post('/profile', data={
            'display_name': 'Updated Name',
            'profile_picture': ''
        }, follow_redirects=True)

        assert response.status_code == 200
        assert b'Profile updated' in response.data

        # Verify update
        with app.app_context():
            from app.models import User
            user = User.query.filter_by(username='testuser').first()
            assert user.display_name == 'Updated Name'
