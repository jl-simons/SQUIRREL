from app.routes import *  # registers routes
from werkzeug.security import generate_password_hash
import os
import sys
from sqlalchemy import text

if __name__ == '__main__':
    with app.app_context():
        # Create any new tables (e.g., finance) without altering existing columns
        db.create_all()
        try:
            db.create_all(bind='finance')
        except Exception:
            pass
        try:
            db.create_all(bind='accounts')
        except Exception:
            pass
        try:
            db.create_all(bind='rewards')
        except Exception:
            pass

        # Ensure new columns exist in SQLite for backward compatibility (legacy tables)
        try:
            conn = db.session.connection()
            # User table columns
            user_cols_res = conn.execute(text("PRAGMA table_info('user')")).fetchall()
            user_col_names = {row[1] for row in user_cols_res}
            if 'display_name' not in user_col_names:
                conn.execute(text("ALTER TABLE user ADD COLUMN display_name VARCHAR(120)"))
            if 'profile_picture' not in user_col_names:
                conn.execute(text("ALTER TABLE user ADD COLUMN profile_picture VARCHAR(255)"))

            # Chore table columns (ensure category exists for older DBs)
            chore_cols_res = conn.execute(text("PRAGMA table_info('chore')")).fetchall()
            chore_col_names = {row[1] for row in chore_cols_res}
            if 'category' not in chore_col_names:
                conn.execute(text("ALTER TABLE chore ADD COLUMN category VARCHAR(20)"))
                conn.execute(text("UPDATE chore SET category='As Needed' WHERE category IS NULL"))

            db.session.commit()
        except Exception:
            db.session.rollback()

        # One-time data migration: copy finance tables from main DB to finance DB if finance is empty
        try:
            finance_engine = db.get_engine(app, bind='finance')
            main_engine = db.engine
            with finance_engine.begin() as fconn, main_engine.begin() as mconn:
                tx_count = fconn.execute(text("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='transaction'"));
                # Ensure tables exist in finance
                fconn.execute(text("CREATE TABLE IF NOT EXISTS transaction (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, date DATE NOT NULL, amount FLOAT NOT NULL, category VARCHAR(50), type VARCHAR(10) NOT NULL, notes VARCHAR(255))"))
                fconn.execute(text("CREATE TABLE IF NOT EXISTS scenario (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, name VARCHAR(120) NOT NULL, description VARCHAR(255))"))
                fconn.execute(text("CREATE TABLE IF NOT EXISTS scenario_option (id INTEGER PRIMARY KEY, scenario_id INTEGER NOT NULL, name VARCHAR(120) NOT NULL, monthly_delta FLOAT NOT NULL DEFAULT 0.0, one_time_delta FLOAT NOT NULL DEFAULT 0.0, start_month VARCHAR(7) NOT NULL, months INTEGER)"))
                # If finance DB is empty (no rows), copy from main if present
                existing = fconn.execute(text("SELECT COUNT(*) FROM transaction")).scalar()
                if existing == 0:
                    try:
                        rows = mconn.execute(text("SELECT id,user_id,date,amount,category,type,notes FROM transaction")).fetchall()
                        for r in rows:
                            fconn.execute(text("INSERT INTO transaction (id,user_id,date,amount,category,type,notes) VALUES (:id,:user_id,:date,:amount,:category,:type,:notes)"), {
                                'id': r[0], 'user_id': r[1], 'date': r[2], 'amount': r[3], 'category': r[4], 'type': r[5], 'notes': r[6]
                            })
                    except Exception:
                        pass
                    try:
                        rows = mconn.execute(text("SELECT id,user_id,name,description FROM scenario")).fetchall()
                        for r in rows:
                            fconn.execute(text("INSERT INTO scenario (id,user_id,name,description) VALUES (:id,:user_id,:name,:description)"), {
                                'id': r[0], 'user_id': r[1], 'name': r[2], 'description': r[3]
                            })
                    except Exception:
                        pass
                    try:
                        rows = mconn.execute(text("SELECT id,scenario_id,name,monthly_delta,one_time_delta,start_month,months FROM scenario_option")).fetchall()
                        for r in rows:
                            fconn.execute(text("INSERT INTO scenario_option (id,scenario_id,name,monthly_delta,one_time_delta,start_month,months) VALUES (:id,:scenario_id,:name,:monthly_delta,:one_time_delta,:start_month,:months)"), {
                                'id': r[0], 'scenario_id': r[1], 'name': r[2], 'monthly_delta': r[3], 'one_time_delta': r[4], 'start_month': r[5], 'months': r[6]
                            })
                    except Exception:
                        pass
        except Exception:
            # If anything goes wrong, skip migration silently
            pass
        
        # Seed a default user if none exists yet (for initial login)
        if not User.query.first():
            db.session.add(User(username='admin', display_name='admin', password=generate_password_hash('admin'), points=0))
        else:
            # Backfill display_name for existing users if missing
            for u in User.query.all():
                if getattr(u, 'display_name', None) in (None, ''):
                    u.display_name = u.username
            
        # Only seed once for chores
        if not Chore.query.first():
            for name, category, pts in [
                ('Make Bed', 'Daily', 2), ('Wash Dishes', 'Daily', 5), ('Feed Pets', 'Daily', 3),
                ('Water Plants', 'Daily', 2), ('Tidy Workspace', 'Daily', 4), ('Take Out Trash', 'Daily', 3),
                ('Wipe Counters', 'Daily', 2), ('Sort Mail', 'Daily', 1), ('Plan Meals', 'Daily', 2),
                ('Check Calendar', 'Daily', 1),
                ('Laundry', 'Weekly', 10), ('Vacuum Floors', 'Weekly', 8), ('Clean Bathroom', 'Weekly', 12),
                ('Mop Floors', 'Weekly', 8), ('Change Bedding', 'Weekly', 5), ('Grocery Shopping', 'Weekly', 7),
                ('Dust Surfaces', 'Weekly', 6), ('Take Recycling', 'Weekly', 4), ('Clean Fridge', 'Weekly', 9),
                ('Yard Work', 'Weekly', 10),
                ('Pay Bills', 'Monthly', 15), ('Deep Clean Oven', 'Monthly', 12), ('Check Smoke Alarms', 'Monthly', 8),
                ('Clean Gutters', 'Monthly', 10), ('Inspect Plumbing', 'Monthly', 9), ('Backup Computer', 'Monthly', 7),
                ('Replace Air Filters', 'Monthly', 8), ('Review Budget', 'Monthly', 6),
                ('Clean Windows', 'Monthly', 10), ('Declutter Closet', 'Monthly', 12),
                ('Organize Papers', 'As Needed', 5), ('Fix Leaks', 'As Needed', 8), ('Repaint Walls', 'As Needed', 15),
                ('Sharpen Tools', 'As Needed', 6), ('Replace Lightbulbs', 'As Needed', 3),
                ('Service HVAC', 'As Needed', 12), ('Update Software', 'As Needed', 4), ('Donate Items', 'As Needed', 7),
                ('Repair Furniture', 'As Needed', 10), ('Clean Gutters', 'As Needed', 9),
            ]:
                db.session.add(Chore(name=name, category=category, points=pts))

        if not Reward.query.first():
            for name, cost in [('Movie Night',50),('Dinner Out',100)]:
                db.session.add(Reward(name=name, cost=cost))

        db.session.commit()

    debug = os.getenv('FLASK_DEBUG', '1') == '1'
    try:
        app.run(debug=debug, use_reloader=False)
    except KeyboardInterrupt:
        print("Flask server received SIGINT, shutting down gracefully...", flush=True)
        sys.exit(0)
