- In the project root run:
  ```bash
  python
  ```
- To use the database, you must push an application context. For example:
  ```python
  from app import app, db
  from models import User
  from werkzeug.security import generate_password_hash

  with app.app_context():
      # Create tables (if not already created)
      db.create_all()
      # Create a new user
      u = User(username='alice', password=generate_password_hash('password'))
      db.session.add(u)
      db.session.commit()
  ```
- Now you can import the models and the DB session normally:
  ```python
  from app import db
  from app.models import User