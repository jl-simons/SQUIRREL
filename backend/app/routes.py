from app import app, db, login_manager, limiter
from flask import render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_user, login_required, logout_user, current_user
from datetime import date, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import text
import os
import re
import bleach
from app.models import User, Chore, CompletedChore, Reward, Purchase, QueueItem, Transaction, Scenario, ScenarioOption
from flask_cors import CORS

# Restricted CORS: only allow configured origins (default: localhost:5175 for dev)
allowed_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:5175').split(',')
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]
CORS(app, supports_credentials=True, origins=allowed_origins)

# Input validation helpers
def sanitize_input(value, max_length=255):
    """Sanitize text input to prevent XSS and injection attacks"""
    if not value:
        return value
    # Remove HTML tags and limit length
    cleaned = bleach.clean(str(value), tags=[], strip=True)
    return cleaned[:max_length]

def validate_password(password):
    """Enforce password policy: min 8 chars, not common defaults"""
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters"
    # Block common weak passwords
    weak_passwords = ['password', 'admin123', '12345678', 'qwerty123', 'admin', 'password123']
    if password.lower() in weak_passwords:
        return False, "Password is too common. Choose a stronger password"
    return True, None

def is_admin_user(user):
    """Check if user is an admin (for debug endpoint access)"""
    admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
    return user and user.username == admin_username

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    return redirect(url_for('dashboard'))

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def login():
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()
        if user and check_password_hash(user.password, request.form['password']):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid credentials')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
@limiter.limit("5 per hour")
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        confirm = request.form.get('confirm', '')
        if not username or not password:
            flash('Username and password are required')
            return render_template('register.html')

        # Validate password strength
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            flash(error_msg)
            return render_template('register.html')

        if password != confirm:
            flash('Passwords do not match')
            return render_template('register.html')
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return render_template('register.html')

        # Sanitize username for display
        safe_username = sanitize_input(username, max_length=80)
        user = User(username=safe_username, display_name=safe_username, password=generate_password_hash(password), points=0)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        flash('Registration successful!')
        return redirect(url_for('dashboard'))
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    today = date.today()
    chores = Chore.query.all()
    completed = [c.chore_id for c in CompletedChore.query.filter_by(user_id=current_user.id, date=today)]
    pending = [c for c in chores if c.id not in completed]
    users = User.query.order_by(User.points.desc()).all()
    position = next((i+1 for i,u in enumerate(users) if u.id==current_user.id), None)
    next_item = QueueItem.query.filter_by(user_id=current_user.id).order_by(QueueItem.date_added).first()
    return render_template('dashboard.html', pending=pending, position=position, next_item=next_item)

@app.route('/chores', methods=['GET', 'POST'])
@login_required
def chores():
    today = date.today()
    all_chores = Chore.query.all()

    # Helper to decide if a chore is completed for the current recurrence period
    def is_completed_for_period(chore_id):
        last = CompletedChore.query.filter_by(user_id=current_user.id, chore_id=chore_id).order_by(CompletedChore.date.desc()).first()
        if not last:
            return False
        last_date = last.date
        cat = Chore.query.get(chore_id).category
        if cat == 'Daily':
            return last_date == today
        if cat == 'Weekly':
            return last_date.isocalendar()[:2] == today.isocalendar()[:2]
        if cat == 'Monthly':
            return last_date.year == today.year and last_date.month == today.month
        # As Needed: only hide for the same day
        return last_date == today

    if request.method == 'POST':
        # Add new chore flow
        new_name = request.form.get('new_chore_name', '').strip()
        new_cat = request.form.get('new_chore_category', '').strip()
        new_pts = request.form.get('new_chore_points', '').strip()
        if new_name and new_cat and new_pts.isdigit():
            db.session.add(Chore(name=new_name, category=new_cat, points=int(new_pts)))
            db.session.commit()
            flash('New chore added')
            return redirect(url_for('chores'))

        # Complete selected chores
        for cid in request.form.getlist('chore'):
            chore = Chore.query.get(int(cid))
            if chore:
                db.session.add(CompletedChore(user_id=current_user.id, chore_id=chore.id, date=today))
                current_user.points += chore.points
        db.session.commit()
        return redirect(url_for('chores'))

    # Filter pending chores according to recurrence
    pending = [c for c in all_chores if not is_completed_for_period(c.id)]
    return render_template('chores.html', chores=pending)

@app.route('/leaderboard')
@login_required
def leaderboard():
    users = User.query.order_by(User.points.desc()).all()
    return render_template('leaderboard.html', users=users)

@app.route('/rewards', methods=['GET', 'POST'])
@login_required
def rewards():
    rewards = Reward.query.all()
    if request.method == 'POST':
        rid = int(request.form['reward_id'])
        db.session.add(QueueItem(user_id=current_user.id, reward_id=rid, date_added=date.today()))
        db.session.commit()
        flash('Added to queue')
        return redirect(url_for('rewards'))
    return render_template('rewards.html', rewards=rewards)

@app.route('/queue')
@login_required
def view_queue():
    items = QueueItem.query.filter_by(user_id=current_user.id).all()
    return render_template('queue.html', items=items)

@app.route('/queue/redeem/<int:item_id>')
@login_required
def redeem_queue(item_id):
    item = QueueItem.query.get(item_id)
    if current_user.points >= item.reward.cost:
        current_user.points -= item.reward.cost
        db.session.add(Purchase(user_id=current_user.id, reward_id=item.reward_id, date=date.today()))
        db.session.delete(item)
        db.session.commit()
        flash('Redeemed!')
    else:
        flash('Not enough points')
    return redirect(url_for('dashboard'))

@app.route('/queue/remove/<int:item_id>')
@login_required
def remove_queue(item_id):
    item = QueueItem.query.get(item_id)
    db.session.delete(item)
    db.session.commit()
    flash('Removed from queue')
    return redirect(url_for('dashboard'))

@app.route('/finances')
@login_required
def finances():
    # Placeholder for future financial data
    return render_template('finances.html')

# Profile routes
@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        display_name = request.form.get('display_name', '').strip()
        profile_picture = request.form.get('profile_picture', '').strip()

        # Sanitize inputs to prevent XSS
        if display_name:
            current_user.display_name = sanitize_input(display_name, max_length=120)

        # Validate profile_picture is a reasonable URL or empty
        if profile_picture:
            # Basic URL validation - must start with http:// or https://
            if profile_picture.startswith(('http://', 'https://')):
                current_user.profile_picture = sanitize_input(profile_picture, max_length=255)
            else:
                flash('Profile picture must be a valid URL')
                return redirect(url_for('profile'))
        else:
            current_user.profile_picture = None

        db.session.commit()
        flash('Profile updated')
        # Redirect back with saved=1; embed param will be preserved by after_request
        return redirect(url_for('profile', saved=1))

    # Recent activity: pull last 10 completed chores and purchases
    recent_completed = (
        db.session.query(CompletedChore, Chore)
        .join(Chore, CompletedChore.chore_id == Chore.id)
        .filter(CompletedChore.user_id == current_user.id)
        .order_by(CompletedChore.date.desc())
        .limit(10)
        .all()
    )
    recent_completed = [
        {'date': cc.date, 'chore_name': ch.name, 'points': ch.points}
        for cc, ch in recent_completed
    ]
    recent_purchases = (
        db.session.query(Purchase, Reward)
        .join(Reward, Purchase.reward_id == Reward.id)
        .filter(Purchase.user_id == current_user.id)
        .order_by(Purchase.date.desc())
        .limit(10)
        .all()
    )
    recent_purchases = [
        {'date': p.date, 'reward': r.name, 'cost': r.cost}
        for p, r in recent_purchases
    ]
    return render_template('profile.html', recent_completed=recent_completed, recent_purchases=recent_purchases)

# API Endpoints

@app.route('/api/me')
def api_me():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'username': current_user.username,
            'display_name': getattr(current_user, 'display_name', None) or current_user.username,
            'profile_picture': getattr(current_user, 'profile_picture', None),
            'points': current_user.points,
        })
    return jsonify({'authenticated': False}), 200

@app.route('/api/profile', methods=['POST'])
@login_required
def api_profile():
    data = request.get_json(silent=True) or {}
    dn = (data.get('display_name') or '').strip()
    pp = (data.get('profile_picture') or '').strip()

    # Sanitize inputs
    if dn:
        current_user.display_name = sanitize_input(dn, max_length=120)

    # Validate profile picture URL
    if pp:
        if pp.startswith(('http://', 'https://')):
            current_user.profile_picture = sanitize_input(pp, max_length=255)
        else:
            return jsonify({'ok': False, 'error': 'Profile picture must be a valid URL'}), 400
    else:
        current_user.profile_picture = None

    db.session.commit()
    return jsonify({'ok': True})

@app.route('/api/chores', methods=['GET', 'POST'])
def api_chores():
    if request.method == 'POST':
        # Create new chore
        data = request.get_json(silent=True) or {}
        name = (data.get('name') or '').strip()
        cat = (data.get('category') or '').strip()
        pts = data.get('points')
        if not (name and cat and isinstance(pts, int)):
            return jsonify({'ok': False, 'error': 'Invalid payload'}), 400
        db.session.add(Chore(name=name, category=cat, points=pts))
        db.session.commit()
        return jsonify({'ok': True}), 201

    today = date.today()
    all_chores = Chore.query.all()

    def is_completed_for_period(chore_id):
        last = CompletedChore.query.filter_by(user_id=current_user.id, chore_id=chore_id).order_by(CompletedChore.date.desc()).first() if current_user.is_authenticated else None
        if not last:
            return False
        last_date = last.date
        cat = Chore.query.get(chore_id).category
        if cat == 'Daily':
            return last_date == today
        if cat == 'Weekly':
            return last_date.isocalendar()[:2] == today.isocalendar()[:2]
        if cat == 'Monthly':
            return last_date.year == today.year and last_date.month == today.month
        return last_date == today

    completed_count = sum(1 for c in all_chores if is_completed_for_period(c.id)) if current_user.is_authenticated else 0
    pending = [c for c in all_chores if not is_completed_for_period(c.id)]
    data = {
        'pending_count': len(pending),
        'completed_count': completed_count,
        'chores': [{
            'id': c.id,
            'name': c.name,
            'category': getattr(c, 'category', None),
            'points': c.points,
        } for c in pending]
    }
    return jsonify(data)

@app.route('/api/finance')
@login_required
def api_finance():
    # Summary for current user, support optional months param for slicing (default 12)
    from datetime import datetime
    try:
        months_param = int(request.args.get('months', '12'))
        if months_param < 1 or months_param > 60:
            months_param = 12
    except Exception:
        months_param = 12
    uid = current_user.id

    # Fetch transactions
    all_txs = Transaction.query.filter_by(user_id=uid).all()

    def signed_amount(tx):
        return tx.amount if tx.type == 'income' else -abs(tx.amount)

    # Balance
    balance = sum(signed_amount(tx) for tx in all_txs)

    # Monthly aggregates for last N months
    from collections import defaultdict
    monthly_income = defaultdict(float)
    monthly_expense = defaultdict(float)
    for tx in all_txs:
        ym = tx.date.strftime('%Y-%m')
        if tx.type == 'income':
            monthly_income[ym] += tx.amount
        else:
            monthly_expense[ym] += tx.amount

    # Build ordered list for last months_param months
    today = date.today()
    months = []
    y, m = today.year, today.month
    for _ in range(months_param):
        months.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    months = list(reversed(months))

    monthly = [{
        'month': mm,
        'income': round(monthly_income.get(mm, 0.0), 2),
        'expense': round(monthly_expense.get(mm, 0.0), 2),
        'net': round(monthly_income.get(mm, 0.0) - monthly_expense.get(mm, 0.0), 2)
    } for mm in months]

    # Category breakdown (expenses only)
    by_category = defaultdict(float)
    for tx in all_txs:
        if tx.type == 'expense':
            key = tx.category or 'Uncategorized'
            by_category[key] += tx.amount
    category_breakdown = [{'category': k, 'amount': round(v, 2)} for k, v in sorted(by_category.items(), key=lambda x: -x[1])]

    # Balance timeseries by month (cumulative), sliced to recent months_param months
    month_net = defaultdict(float)
    for tx in all_txs:
        ym = tx.date.strftime('%Y-%m')
        month_net[ym] += signed_amount(tx)
    # order keys and slice last months_param
    keys = sorted(month_net.keys())[-months_param:]
    cumulative = []
    # compute baseline as sum of nets prior to sliced window so the curve starts at correct balance
    prior_keys = sorted(month_net.keys())[:-months_param] if len(keys) == months_param else []
    running = sum(month_net[k] for k in prior_keys)
    for k in keys:
        running += month_net[k]
        cumulative.append({'month': k, 'balance': round(running, 2)})

    # Recent transactions capped to 20
    tx_q = Transaction.query.filter_by(user_id=uid).order_by(Transaction.date.desc())
    recent = tx_q.limit(20).all()
    recent_list = [{
        'id': tx.id,
        'date': tx.date.isoformat(),
        'amount': tx.amount,
        'type': tx.type,
        'category': tx.category,
        'notes': tx.notes,
    } for tx in recent]

    return jsonify({
        'balance': round(balance, 2),
        'monthly': monthly,
        'category_breakdown': category_breakdown,
        'recent': recent_list,
        'timeseries': cumulative,
    })

@app.route('/api/inventory')
def api_inventory():
    # Placeholder for inventory data
    # In a real implementation, this would fetch data from a database
    inventory_data = []
    return jsonify(inventory_data)


# Finance: Transactions endpoints
@app.route('/api/finance/transactions', methods=['GET', 'POST'])
@login_required
def api_finance_transactions():
    uid = current_user.id
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        try:
            from datetime import datetime
            date_str = (data.get('date') or '').strip()
            dt = datetime.strptime(date_str, '%Y-%m-%d').date()
        except Exception:
            return jsonify({'ok': False, 'error': 'Invalid or missing date (YYYY-MM-DD)'}), 400
        try:
            amount = float(data.get('amount'))
        except Exception:
            return jsonify({'ok': False, 'error': 'Invalid amount'}), 400
        tx_type = (data.get('type') or '').strip().lower()
        if tx_type not in ('income', 'expense'):
            return jsonify({'ok': False, 'error': "type must be 'income' or 'expense'"}), 400
        category = (data.get('category') or '').strip() or None
        notes = (data.get('notes') or '').strip() or None
        tx = Transaction(user_id=uid, date=dt, amount=abs(amount), type=tx_type, category=category, notes=notes)
        db.session.add(tx)
        db.session.commit()
        return jsonify({'ok': True, 'id': tx.id}), 201

    # GET with filters: start, end, type, category
    from datetime import datetime
    q = Transaction.query.filter_by(user_id=uid)
    start = request.args.get('start')
    end = request.args.get('end')
    ttype = request.args.get('type')
    cat = request.args.get('category')
    try:
        if start:
            q = q.filter(Transaction.date >= datetime.strptime(start, '%Y-%m-%d').date())
        if end:
            q = q.filter(Transaction.date <= datetime.strptime(end, '%Y-%m-%d').date())
    except Exception:
        return jsonify({'ok': False, 'error': 'Invalid date filter (YYYY-MM-DD)'}), 400
    if ttype in ('income', 'expense'):
        q = q.filter(Transaction.type == ttype)
    if cat:
        q = q.filter(Transaction.category == cat)
    q = q.order_by(Transaction.date.desc(), Transaction.id.desc())
    txs = q.all()
    return jsonify([{
        'id': tx.id,
        'date': tx.date.isoformat(),
        'amount': tx.amount,
        'type': tx.type,
        'category': tx.category,
        'notes': tx.notes,
    } for tx in txs])


# Finance: Scenarios
@app.route('/api/finance/scenarios', methods=['GET', 'POST'])
@login_required
def api_finance_scenarios():
    uid = current_user.id
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        name = (data.get('name') or '').strip()
        if not name:
            return jsonify({'ok': False, 'error': 'name is required'}), 400
        desc = (data.get('description') or '').strip() or None
        s = Scenario(user_id=uid, name=name, description=desc)
        db.session.add(s)
        db.session.commit()
        return jsonify({'ok': True, 'id': s.id}), 201
    # GET list
    scenarios = Scenario.query.filter_by(user_id=uid).all()
    # count options per scenario
    counts = {
        s.id: db.session.query(ScenarioOption).filter(ScenarioOption.scenario_id == s.id).count() for s in scenarios
    }
    return jsonify([{
        'id': s.id,
        'name': s.name,
        'description': s.description,
        'options_count': counts.get(s.id, 0)
    } for s in scenarios])


@app.route('/api/finance/scenarios/<int:sid>')
@login_required
def api_finance_scenario_detail(sid):
    s = Scenario.query.get_or_404(sid)
    if s.user_id != current_user.id:
        return jsonify({'error': 'Not found'}), 404
    opts = ScenarioOption.query.filter_by(scenario_id=s.id).all()
    return jsonify({
        'id': s.id,
        'name': s.name,
        'description': s.description,
        'options': [{
            'id': o.id,
            'name': o.name,
            'monthly_delta': o.monthly_delta,
            'one_time_delta': o.one_time_delta,
            'start_month': o.start_month,
            'months': o.months,
        } for o in opts]
    })


@app.route('/api/finance/scenarios/<int:sid>/options', methods=['POST'])
@login_required
def api_finance_scenario_add_option(sid):
    s = Scenario.query.get_or_404(sid)
    if s.user_id != current_user.id:
        return jsonify({'error': 'Not found'}), 404
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'ok': False, 'error': 'name is required'}), 400
    try:
        monthly_delta = float(data.get('monthly_delta') or 0)
        one_time_delta = float(data.get('one_time_delta') or 0)
    except Exception:
        return jsonify({'ok': False, 'error': 'invalid deltas'}), 400
    start_month = (data.get('start_month') or '').strip()
    if not start_month or len(start_month) != 7:
        return jsonify({'ok': False, 'error': "start_month must be 'YYYY-MM'"}), 400
    months = data.get('months')
    months = int(months) if months is not None else None
    o = ScenarioOption(
        scenario_id=s.id,
        name=name,
        monthly_delta=monthly_delta,
        one_time_delta=one_time_delta,
        start_month=start_month,
        months=months
    )
    db.session.add(o)
    db.session.commit()
    return jsonify({'ok': True, 'id': o.id}), 201


@app.route('/api/finance/scenarios/<int:sid>/compare')
@login_required
def api_finance_scenario_compare(sid):
    # Return projection timeseries for baseline and each option
    s = Scenario.query.get_or_404(sid)
    if s.user_id != current_user.id:
        return jsonify({'error': 'Not found'}), 404
    try:
        n = int(request.args.get('n') or 12)
        if n < 1 or n > 60:
            n = 12
    except Exception:
        n = 12

    # Compute current balance baseline from user transactions
    uid = current_user.id
    txs = Transaction.query.filter_by(user_id=uid).all()
    def signed_amount(tx):
        return tx.amount if tx.type == 'income' else -abs(tx.amount)
    balance = sum(signed_amount(tx) for tx in txs)

    # Build months array starting from current month
    today = date.today()
    y, m = today.year, today.month
    months = []
    for _ in range(n):
        months.append(f"{y:04d}-{m:02d}")
        m += 1
        if m == 13:
            m = 1
            y += 1

    # Baseline series: flat balance (no change)
    series = [
        {'name': 'Baseline', 'data': [{'x': mm, 'y': round(balance, 2)} for mm in months]}
    ]

    # Each option applied separately
    opts = ScenarioOption.query.filter_by(scenario_id=s.id).all()
    for o in opts:
        cur = balance
        data = []
        # Determine when to apply one-time delta
        for mm in months:
            # Apply monthly delta while within duration
            apply_monthly = True
            if o.months is not None:
                # Only apply for months >= start and < start+months
                # Compare year-month strings lexicographically since format is fixed
                if mm < o.start_month or mm >= _add_months(o.start_month, o.months):
                    apply_monthly = False
            if mm >= o.start_month and apply_monthly:
                cur += o.monthly_delta
            # Apply one-time at start month
            if mm == o.start_month and o.one_time_delta:
                cur += o.one_time_delta
            data.append({'x': mm, 'y': round(cur, 2)})
        series.append({'name': o.name, 'data': data})

    return jsonify({'months': months, 'series': series})


def _add_months(ym: str, months: int) -> str:
    # ym in 'YYYY-MM'
    y = int(ym[:4])
    m = int(ym[5:7])
    total = y * 12 + (m - 1) + months
    ny = total // 12
    nm = total % 12 + 1
    return f"{ny:04d}-{nm:02d}"


# Finance clearing endpoint
@app.route('/api/finance/clear', methods=['POST'])
@login_required
def api_finance_clear():
    uid = current_user.id
    # Delete scenario options, scenarios, and transactions for this user
    try:
        # Delete options via scenarios for this user
        sids = [s.id for s in Scenario.query.filter_by(user_id=uid).all()]
        if sids:
            db.session.query(ScenarioOption).filter(ScenarioOption.scenario_id.in_(sids)).delete(synchronize_session=False)
        db.session.query(Scenario).filter_by(user_id=uid).delete(synchronize_session=False)
        db.session.query(Transaction).filter_by(user_id=uid).delete(synchronize_session=False)
        db.session.commit()
        return jsonify({'ok': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'ok': False, 'error': str(e)}), 500

# Finance import/export
@app.route('/api/finance/import', methods=['POST'])
@login_required
def api_finance_import():
    data = request.get_json(silent=True) or {}
    csv_text = data.get('csv')
    if not csv_text or not isinstance(csv_text, str):
        return jsonify({'ok': False, 'error': 'csv text required'}), 400
    import csv, io
    uid = current_user.id
    f = io.StringIO(csv_text)
    # Try to sniff dialect
    try:
        dialect = csv.Sniffer().sniff(csv_text[:1024])
    except Exception:
        class Simple: delimiter = ','
        dialect = Simple()
    reader = csv.reader(f, delimiter=dialect.delimiter)
    rows = list(reader)
    if not rows:
        return jsonify({'ok': False, 'imported': 0})
    headers = [h.strip().lower() for h in rows[0]]
    data_rows = rows[1:] if any(headers) else rows
    # Map headers
    def find_col(keys):
        for k in keys:
            if k in headers:
                return headers.index(k)
        return -1
    idx_date = find_col(['date','posted date','transaction date'])
    idx_amount = find_col(['amount','amt'])
    idx_debit = find_col(['debit','withdrawal','outflow'])
    idx_credit = find_col(['credit','deposit','inflow'])
    idx_type = find_col(['type'])
    idx_cat = find_col(['category','cat'])
    idx_desc = find_col(['description','memo','name','details'])

    from datetime import datetime
    def parse_date(s):
        for fmt in ('%Y-%m-%d','%m/%d/%Y','%d/%m/%Y'):
            try:
                return datetime.strptime(s.strip(), fmt).date()
            except Exception:
                pass
        raise ValueError('bad date')

    imported = 0
    for r in data_rows:
        try:
            dstr = r[idx_date] if idx_date != -1 and idx_date < len(r) else None
            dt = parse_date(dstr) if dstr else None
            if not dt:
                continue
            amt = None
            if idx_amount != -1 and idx_amount < len(r) and r[idx_amount]:
                amt = float(str(r[idx_amount]).replace(',',''))
            else:
                debit = float(str(r[idx_debit]).replace(',','')) if idx_debit != -1 and r[idx_debit] else 0.0
                credit = float(str(r[idx_credit]).replace(',','')) if idx_credit != -1 and r[idx_credit] else 0.0
                amt = credit - debit
            ttype = 'income' if (idx_type != -1 and 'income' in str(r[idx_type]).lower()) or amt > 0 else 'expense'
            category = (r[idx_cat] if idx_cat != -1 and idx_cat < len(r) else '').strip() or None
            notes = (r[idx_desc] if idx_desc != -1 and idx_desc < len(r) else '').strip() or None
            tx = Transaction(user_id=uid, date=dt, amount=abs(amt), type=ttype, category=category, notes=notes)
            db.session.add(tx)
            imported += 1
        except Exception:
            # Skip bad rows
            continue
    db.session.commit()
    return jsonify({'ok': True, 'imported': imported})


@app.route('/api/finance/export')
@login_required
def api_finance_export():
    import csv, io
    uid = current_user.id
    txs = Transaction.query.filter_by(user_id=uid).order_by(Transaction.date.asc(), Transaction.id.asc()).all()
    f = io.StringIO()
    w = csv.writer(f)
    w.writerow(['date','type','category','amount','notes'])
    for tx in txs:
        w.writerow([tx.date.isoformat(), tx.type, tx.category or '', f"{tx.amount:.2f}", tx.notes or ''])
    out = f.getvalue()
    from flask import Response
    resp = Response(out, mimetype='text/csv')
    resp.headers['Content-Disposition'] = 'attachment; filename=transactions.csv'
    return resp


# Ensure redirects stay within the proxied prefix when coming via Vite (/backend)
@app.after_request
def _apply_forwarded_prefix_to_redirects(response):
    try:
        fwd_prefix = request.headers.get('X-Forwarded-Prefix')
        loc = response.headers.get('Location')
        if loc:
            # Prefix absolute redirect targets to keep the iframe inside /backend
            if fwd_prefix and loc.startswith('/') and not loc.startswith(fwd_prefix + '/') and loc != fwd_prefix:
                loc = fwd_prefix + loc
            # Preserve embed=1 across redirects when coming from embedded context
            if request.args.get('embed'):
                if '?' in loc:
                    if 'embed=' not in loc:
                        loc = loc + '&embed=1'
                else:
                    loc = loc + '?embed=1'
            response.headers['Location'] = loc
    except Exception:
        # Be non-fatal if anything goes wrong
        pass
    return response


# Debug endpoint to inspect DB path and tables - ADMIN ONLY
@app.route('/api/debug/db')
@login_required
def api_debug_db():
    # Restrict to admin users only
    if not is_admin_user(current_user):
        return jsonify({'error': 'Forbidden: Admin access required'}), 403

    info = {
        'cwd': os.getcwd(),
        'db_uri': app.config.get('SQLALCHEMY_DATABASE_URI'),
        'binds': app.config.get('SQLALCHEMY_BINDS', {})
    }
    # Main DB info
    try:
        rows = db.session.execute(text("PRAGMA database_list")).fetchall()
        info['main_database_list'] = [{'seq': r[0], 'name': r[1], 'file': r[2]} for r in rows]
    except Exception as e:
        info['main_database_list_error'] = str(e)
    # Main tables and counts
    try:
        main_tables = []
        trows = db.session.execute(text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")).fetchall()
        for (tname,) in trows:
            try:
                cnt = db.session.execute(text(f"SELECT COUNT(*) FROM '{tname}'")).scalar()
            except Exception:
                cnt = None
            main_tables.append({'name': tname, 'count': cnt})
        info['main_tables'] = main_tables
    except Exception as e:
        info['main_tables_error'] = str(e)
    # Finance DB info
    try:
        fengine = db.get_engine(app, bind='finance')
        with fengine.connect() as conn:
            rows = conn.execute(text("PRAGMA database_list")).fetchall()
            info['finance_database_list'] = [{'seq': r[0], 'name': r[1], 'file': r[2]} for r in rows]
            f_tables = []
            trows = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")).fetchall()
            for (tname,) in trows:
                try:
                    cnt = conn.execute(text(f"SELECT COUNT(*) FROM '{tname}'")).scalar()
                except Exception:
                    cnt = None
                f_tables.append({'name': tname, 'count': cnt})
            info['finance_tables'] = f_tables
    except Exception as e:
        info['finance_error'] = str(e)

    # Accounts DB info
    try:
        aengine = db.get_engine(app, bind='accounts')
        with aengine.connect() as conn:
            rows = conn.execute(text("PRAGMA database_list")).fetchall()
            info['accounts_database_list'] = [{'seq': r[0], 'name': r[1], 'file': r[2]} for r in rows]
            a_tables = []
            trows = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")).fetchall()
            for (tname,) in trows:
                try:
                    cnt = conn.execute(text(f"SELECT COUNT(*) FROM '{tname}'")).scalar()
                except Exception:
                    cnt = None
                a_tables.append({'name': tname, 'count': cnt})
            info['accounts_tables'] = a_tables
    except Exception as e:
        info['accounts_error'] = str(e)

    # Rewards DB info
    try:
        rengine = db.get_engine(app, bind='rewards')
        with rengine.connect() as conn:
            rows = conn.execute(text("PRAGMA database_list")).fetchall()
            info['rewards_database_list'] = [{'seq': r[0], 'name': r[1], 'file': r[2]} for r in rows]
            r_tables = []
            trows = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")).fetchall()
            for (tname,) in trows:
                try:
                    cnt = conn.execute(text(f"SELECT COUNT(*) FROM '{tname}'")).scalar()
                except Exception:
                    cnt = None
                r_tables.append({'name': tname, 'count': cnt})
            info['rewards_tables'] = r_tables
    except Exception as e:
        info['rewards_error'] = str(e)

    return jsonify(info)
