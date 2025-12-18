import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { createNotification, NOTIFICATION_TYPES } from './utils/notificationUtils';

/**
 * App Component (Layout)
 *
 * Provides the global navigation and layout. Route rendering occurs via <Outlet />
 * which is populated by the Data Router configured in main.jsx.
 */
const App = () => {
  const [globalNotifications, setGlobalNotifications] = useState([]);
  const [me, setMe] = useState({ authenticated: false });
  const navigate = useNavigate();

  const addNotification = (message, type = NOTIFICATION_TYPES.INFO) => {
    const notification = createNotification(message, type);
    setGlobalNotifications(prev => [...prev, notification]);

    // Auto-remove notification after its duration
    setTimeout(() => {
      setGlobalNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, notification.duration);
  };

  const loadMe = async () => {
    try {
      const res = await fetch('/backend/api/me', { credentials: 'include' });
      const data = await res.json();
      setMe(data || { authenticated: false });
    } catch {
      setMe({ authenticated: false });
    }
  };

  useEffect(() => {
    loadMe();
    const onAuth = () => loadMe();
    window.addEventListener('squirrel-auth-success', onAuth);
    return () => window.removeEventListener('squirrel-auth-success', onAuth);
  }, []);

  const logout = async () => {
    try {
      await fetch('/backend/logout', { credentials: 'include' });
    } catch {}
    await loadMe();
    navigate('/');
  };

  const displayName = me?.display_name || me?.username;

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="app-logo">
          <img src="/src/assets/logo.png" alt="SQUIRREL Logo" width="40" />
          <h1>SQUIRREL</h1>
        </div>
        <ul className="nav-links">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/inventory">Inventory</Link></li>
          <li><Link to="/chores">Chores</Link></li>
          <li><Link to="/finance">Finance</Link></li>
          <li><Link to="/rewards">Rewards</Link></li>
          <li><Link to="/leaderboard">Leaderboard</Link></li>
          <li><Link to="/import-export">Import/Export</Link></li>
          {me?.authenticated ? (
            <li className="user-menu">
              <details>
                <summary>{displayName}</summary>
                <ul className="dropdown">
                  <li><Link to="/profile">Profile</Link></li>
                  <li><button type="button" onClick={logout}>Logout</button></li>
                </ul>
              </details>
            </li>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>

      <main className="app-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} SQUIRREL - Privacy-First Home Inventory</p>
      </footer>
    </div>
  );
};

export default App;
