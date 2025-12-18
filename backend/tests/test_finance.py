"""
Tests for finance features: transactions, scenarios, comparisons
"""
import pytest
from datetime import date, datetime
import json


class TestTransactions:
    """Test transaction management"""

    def test_add_transaction_income(self, authenticated_client, app):
        """Test adding an income transaction"""
        response = authenticated_client.post('/api/finance/transactions',
                                             json={
                                                 'date': '2024-01-15',
                                                 'amount': 1000.50,
                                                 'type': 'income',
                                                 'category': 'Salary',
                                                 'notes': 'Monthly paycheck'
                                             })

        assert response.status_code == 201
        data = response.get_json()
        assert data['ok'] is True
        assert 'id' in data

        # Verify transaction created
        with app.app_context():
            from app.models import Transaction, User
            user = User.query.filter_by(username='testuser').first()
            tx = Transaction.query.filter_by(user_id=user.id).first()
            assert tx is not None
            assert tx.amount == 1000.50
            assert tx.type == 'income'
            assert tx.category == 'Salary'

    def test_add_transaction_expense(self, authenticated_client, app):
        """Test adding an expense transaction"""
        response = authenticated_client.post('/api/finance/transactions',
                                             json={
                                                 'date': '2024-01-16',
                                                 'amount': 50.75,
                                                 'type': 'expense',
                                                 'category': 'Groceries',
                                                 'notes': 'Weekly shopping'
                                             })

        assert response.status_code == 201
        data = response.get_json()
        assert data['ok'] is True

    def test_add_transaction_invalid_date(self, authenticated_client):
        """Test adding transaction with invalid date format"""
        response = authenticated_client.post('/api/finance/transactions',
                                             json={
                                                 'date': 'invalid-date',
                                                 'amount': 100,
                                                 'type': 'income'
                                             })

        assert response.status_code == 400
        data = response.get_json()
        assert data['ok'] is False
        assert 'date' in data['error'].lower()

    def test_add_transaction_invalid_type(self, authenticated_client):
        """Test adding transaction with invalid type"""
        response = authenticated_client.post('/api/finance/transactions',
                                             json={
                                                 'date': '2024-01-15',
                                                 'amount': 100,
                                                 'type': 'invalid'
                                             })

        assert response.status_code == 400
        data = response.get_json()
        assert data['ok'] is False

    def test_list_transactions(self, authenticated_client, app):
        """Test listing transactions"""
        # Add some transactions first
        with app.app_context():
            from app.models import Transaction, User
            user = User.query.filter_by(username='testuser').first()

            tx1 = Transaction(user_id=user.id, date=date(2024, 1, 15),
                             amount=1000, type='income', category='Salary')
            tx2 = Transaction(user_id=user.id, date=date(2024, 1, 16),
                             amount=50, type='expense', category='Food')
            app.db.session.add(tx1)
            app.db.session.add(tx2)
            app.db.session.commit()

        response = authenticated_client.get('/api/finance/transactions')
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 2

        # Check structure
        if data:
            tx = data[0]
            assert 'id' in tx
            assert 'date' in tx
            assert 'amount' in tx
            assert 'type' in tx

    def test_filter_transactions_by_date(self, authenticated_client, app):
        """Test filtering transactions by date range"""
        # Add transactions
        with app.app_context():
            from app.models import Transaction, User
            user = User.query.filter_by(username='testuser').first()

            tx1 = Transaction(user_id=user.id, date=date(2024, 1, 1),
                             amount=100, type='income')
            tx2 = Transaction(user_id=user.id, date=date(2024, 2, 1),
                             amount=200, type='income')
            tx3 = Transaction(user_id=user.id, date=date(2024, 3, 1),
                             amount=300, type='income')
            app.db.session.add_all([tx1, tx2, tx3])
            app.db.session.commit()

        # Filter for February only
        response = authenticated_client.get('/api/finance/transactions?start=2024-02-01&end=2024-02-28')
        assert response.status_code == 200

        data = response.get_json()
        # Should only get February transaction
        feb_txs = [tx for tx in data if tx['date'] >= '2024-02-01' and tx['date'] <= '2024-02-28']
        assert len(feb_txs) >= 1

    def test_filter_transactions_by_type(self, authenticated_client, app):
        """Test filtering transactions by type"""
        with app.app_context():
            from app.models import Transaction, User
            user = User.query.filter_by(username='testuser').first()

            tx1 = Transaction(user_id=user.id, date=date.today(),
                             amount=100, type='income', category='Salary')
            tx2 = Transaction(user_id=user.id, date=date.today(),
                             amount=50, type='expense', category='Food')
            app.db.session.add_all([tx1, tx2])
            app.db.session.commit()

        # Filter for income only
        response = authenticated_client.get('/api/finance/transactions?type=income')
        data = response.get_json()

        # All returned transactions should be income
        for tx in data:
            assert tx['type'] == 'income'


class TestFinanceSummary:
    """Test finance summary endpoint"""

    def test_finance_summary(self, authenticated_client, app):
        """Test /api/finance returns summary with all required fields"""
        # Add some transactions
        with app.app_context():
            from app.models import Transaction, User
            user = User.query.filter_by(username='testuser').first()

            tx1 = Transaction(user_id=user.id, date=date(2024, 1, 15),
                             amount=1500, type='income', category='Salary')
            tx2 = Transaction(user_id=user.id, date=date(2024, 1, 20),
                             amount=300, type='expense', category='Groceries')
            app.db.session.add_all([tx1, tx2])
            app.db.session.commit()

        response = authenticated_client.get('/api/finance')
        assert response.status_code == 200

        data = response.get_json()
        assert 'balance' in data
        assert 'monthly' in data
        assert 'category_breakdown' in data
        assert 'recent' in data
        assert 'timeseries' in data

        # Balance should be income - expense = 1500 - 300 = 1200
        assert data['balance'] == 1200.0

    def test_finance_summary_category_breakdown(self, authenticated_client, app):
        """Test category breakdown in finance summary"""
        with app.app_context():
            from app.models import Transaction, User
            user = User.query.filter_by(username='testuser').first()

            tx1 = Transaction(user_id=user.id, date=date.today(),
                             amount=100, type='expense', category='Food')
            tx2 = Transaction(user_id=user.id, date=date.today(),
                             amount=50, type='expense', category='Food')
            tx3 = Transaction(user_id=user.id, date=date.today(),
                             amount=200, type='expense', category='Entertainment')
            app.db.session.add_all([tx1, tx2, tx3])
            app.db.session.commit()

        response = authenticated_client.get('/api/finance')
        data = response.get_json()

        # Check category breakdown
        breakdown = data['category_breakdown']
        assert isinstance(breakdown, list)

        # Find Food category
        food_cat = next((c for c in breakdown if c['category'] == 'Food'), None)
        assert food_cat is not None
        assert food_cat['amount'] == 150.0

    def test_finance_summary_monthly_param(self, authenticated_client):
        """Test finance summary with custom months parameter"""
        response = authenticated_client.get('/api/finance?months=6')
        assert response.status_code == 200

        data = response.get_json()
        assert 'monthly' in data
        # Should have 6 months of data
        assert len(data['monthly']) == 6


class TestScenarios:
    """Test financial scenarios"""

    def test_create_scenario(self, authenticated_client, app):
        """Test creating a financial scenario"""
        response = authenticated_client.post('/api/finance/scenarios',
                                             json={
                                                 'name': 'Job Change',
                                                 'description': 'What if I switch jobs?'
                                             })

        assert response.status_code == 201
        data = response.get_json()
        assert data['ok'] is True
        assert 'id' in data

        # Verify scenario created
        with app.app_context():
            from app.models import Scenario, User
            user = User.query.filter_by(username='testuser').first()
            scenario = Scenario.query.filter_by(user_id=user.id, name='Job Change').first()
            assert scenario is not None

    def test_list_scenarios(self, authenticated_client, app):
        """Test listing scenarios"""
        # Create a scenario
        with app.app_context():
            from app.models import Scenario, User
            user = User.query.filter_by(username='testuser').first()
            scenario = Scenario(user_id=user.id, name='Test Scenario', description='Test')
            app.db.session.add(scenario)
            app.db.session.commit()

        response = authenticated_client.get('/api/finance/scenarios')
        assert response.status_code == 200

        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1

        # Check structure
        if data:
            s = data[0]
            assert 'id' in s
            assert 'name' in s
            assert 'options_count' in s

    def test_get_scenario_detail(self, authenticated_client, app):
        """Test getting scenario details"""
        # Create scenario
        with app.app_context():
            from app.models import Scenario, User
            user = User.query.filter_by(username='testuser').first()
            scenario = Scenario(user_id=user.id, name='Detail Test', description='Test')
            app.db.session.add(scenario)
            app.db.session.commit()
            scenario_id = scenario.id

        response = authenticated_client.get(f'/api/finance/scenarios/{scenario_id}')
        assert response.status_code == 200

        data = response.get_json()
        assert data['id'] == scenario_id
        assert data['name'] == 'Detail Test'
        assert 'options' in data

    def test_add_scenario_option(self, authenticated_client, app):
        """Test adding an option to a scenario"""
        # Create scenario first
        with app.app_context():
            from app.models import Scenario, User
            user = User.query.filter_by(username='testuser').first()
            scenario = Scenario(user_id=user.id, name='Options Test')
            app.db.session.add(scenario)
            app.db.session.commit()
            scenario_id = scenario.id

        # Add option
        response = authenticated_client.post(
            f'/api/finance/scenarios/{scenario_id}/options',
            json={
                'name': 'Higher Salary',
                'monthly_delta': 500.0,
                'one_time_delta': 0,
                'start_month': '2024-02',
                'months': 12
            }
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data['ok'] is True

        # Verify option created
        with app.app_context():
            from app.models import ScenarioOption
            option = ScenarioOption.query.filter_by(scenario_id=scenario_id).first()
            assert option is not None
            assert option.name == 'Higher Salary'
            assert option.monthly_delta == 500.0


class TestScenarioComparison:
    """Test scenario comparison/projection endpoint"""

    def test_scenario_compare_basic(self, authenticated_client, app):
        """Test scenario comparison returns expected JSON shape"""
        # Create scenario with options
        with app.app_context():
            from app.models import Scenario, ScenarioOption, User, Transaction
            user = User.query.filter_by(username='testuser').first()

            # Add base transactions for balance
            tx = Transaction(user_id=user.id, date=date(2024, 1, 1),
                           amount=1000, type='income')
            app.db.session.add(tx)

            # Create scenario
            scenario = Scenario(user_id=user.id, name='Compare Test')
            app.db.session.add(scenario)
            app.db.session.flush()

            # Add option
            option = ScenarioOption(
                scenario_id=scenario.id,
                name='Raise',
                monthly_delta=200.0,
                one_time_delta=0,
                start_month='2024-02',
                months=6
            )
            app.db.session.add(option)
            app.db.session.commit()
            scenario_id = scenario.id

        # Get comparison
        response = authenticated_client.get(f'/api/finance/scenarios/{scenario_id}/compare?n=12')
        assert response.status_code == 200

        data = response.get_json()

        # Verify structure
        assert 'months' in data
        assert 'series' in data
        assert isinstance(data['months'], list)
        assert isinstance(data['series'], list)

        # Should have at least baseline + 1 option
        assert len(data['series']) >= 2

        # Check baseline series
        baseline = next((s for s in data['series'] if s['name'] == 'Baseline'), None)
        assert baseline is not None
        assert 'data' in baseline
        assert isinstance(baseline['data'], list)

        # Each data point should have x (month) and y (balance)
        if baseline['data']:
            point = baseline['data'][0]
            assert 'x' in point
            assert 'y' in point

    def test_scenario_compare_multiple_options(self, authenticated_client, app):
        """Test scenario comparison with multiple options"""
        with app.app_context():
            from app.models import Scenario, ScenarioOption, User
            user = User.query.filter_by(username='testuser').first()

            scenario = Scenario(user_id=user.id, name='Multi Options')
            app.db.session.add(scenario)
            app.db.session.flush()

            option1 = ScenarioOption(
                scenario_id=scenario.id,
                name='Option A',
                monthly_delta=100,
                one_time_delta=0,
                start_month='2024-01',
                months=12
            )
            option2 = ScenarioOption(
                scenario_id=scenario.id,
                name='Option B',
                monthly_delta=200,
                one_time_delta=500,
                start_month='2024-01',
                months=6
            )
            app.db.session.add_all([option1, option2])
            app.db.session.commit()
            scenario_id = scenario.id

        response = authenticated_client.get(f'/api/finance/scenarios/{scenario_id}/compare')
        data = response.get_json()

        # Should have baseline + 2 options = 3 series
        assert len(data['series']) == 3

        # Verify all series have data
        for series in data['series']:
            assert 'name' in series
            assert 'data' in series
            assert len(series['data']) > 0


class TestFinanceImportExport:
    """Test CSV import/export"""

    def test_export_transactions_csv(self, authenticated_client, app):
        """Test exporting transactions as CSV"""
        # Add some transactions
        with app.app_context():
            from app.models import Transaction, User
            user = User.query.filter_by(username='testuser').first()

            tx = Transaction(user_id=user.id, date=date(2024, 1, 15),
                           amount=100, type='income', category='Test',
                           notes='Export test')
            app.db.session.add(tx)
            app.db.session.commit()

        response = authenticated_client.get('/api/finance/export')
        assert response.status_code == 200
        assert response.content_type == 'text/csv; charset=utf-8'
        assert b'date' in response.data  # CSV header
        assert b'2024-01-15' in response.data

    def test_import_transactions_csv(self, authenticated_client, app):
        """Test importing transactions from CSV"""
        csv_data = """date,type,category,amount,notes
2024-01-10,income,Salary,1500.00,January salary
2024-01-15,expense,Groceries,200.00,Weekly shopping"""

        response = authenticated_client.post('/api/finance/import',
                                            json={'csv': csv_data})
        assert response.status_code == 200

        data = response.get_json()
        assert data['ok'] is True
        assert data['imported'] >= 2

        # Verify transactions imported
        with app.app_context():
            from app.models import Transaction, User
            user = User.query.filter_by(username='testuser').first()
            txs = Transaction.query.filter_by(user_id=user.id).all()
            assert len(txs) >= 2


class TestFinanceClear:
    """Test clearing finance data"""

    def test_clear_finance_data(self, authenticated_client, app):
        """Test clearing all finance data for user"""
        # Add data
        with app.app_context():
            from app.models import Transaction, Scenario, User
            user = User.query.filter_by(username='testuser').first()

            tx = Transaction(user_id=user.id, date=date.today(),
                           amount=100, type='income')
            scenario = Scenario(user_id=user.id, name='Test')
            app.db.session.add_all([tx, scenario])
            app.db.session.commit()
            user_id = user.id

        # Clear data
        response = authenticated_client.post('/api/finance/clear')
        assert response.status_code == 200

        data = response.get_json()
        assert data['ok'] is True

        # Verify data cleared
        with app.app_context():
            from app.models import Transaction, Scenario
            txs = Transaction.query.filter_by(user_id=user_id).all()
            scenarios = Scenario.query.filter_by(user_id=user_id).all()
            assert len(txs) == 0
            assert len(scenarios) == 0
