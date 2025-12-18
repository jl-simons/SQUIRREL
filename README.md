# SQUIRREL

Privacy-first home inventory management system with integrated finance tracking and chore management.

## Overview

SQUIRREL is a web-based application designed for managing household inventory, tracking finances, and organizing chores while prioritizing user privacy. All sensitive inventory data is stored locally in the browser, with optional backend synchronization for multi-device access.

## Features

### Inventory Management
- Track items with name, quantity, location, category, and value
- Low stock alerts with customizable thresholds
- Search and filter by multiple criteria
- CSV import and export capabilities
- Inline editing for quick updates
- Privacy-first: all data stored locally in browser

### Finance Tracking
- Transaction management with income and expense categorization
- Monthly summaries with visual charts
- Balance tracking over time
- Category-based spending analysis
- Financial scenario planning and comparison
- CSV import and export for bank statements
- Configurable time ranges (6, 12, 24, or 36 months)

### Chore Management
- Task creation and assignment
- Status tracking and completion monitoring
- Points and rewards system
- Leaderboard for household competition
- Integration with dashboard for quick overview

### Dashboard
- Summary view of inventory, chores, and finances
- Real-time updates
- Quick access to all features

## Technology Stack

### Frontend
- React 18.2 with React Router 6
- Vite for build tooling and development
- TanStack Query for data caching and state management
- Custom SVG charts for data visualization
- LocalStorage API for client-side persistence

### Backend
- Python with Flask framework
- SQLite database for user data
- RESTful API architecture
- Session-based authentication
- Multiple database strategy for modularity

### Testing
- Jest for unit testing
- React Testing Library for component tests
- Test coverage reporting

## Installation

### Prerequisites
- Node.js 18 or later
- npm or yarn
- Python 3.9 or later
- pip

### Setup Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd SQUIRREL
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Return to root directory:
```bash
cd ..
```

## Running the Application

### Quick Start (Recommended)

From the repository root, start both frontend and backend:

```bash
npm run dev
```

This will start:
- Frontend development server on http://localhost:5173
- Backend API server on http://localhost:5000

The Vite proxy automatically handles backend routing under `/backend` for seamless integration.

### Individual Services

Run frontend only:
```bash
npm run frontend
```

Run backend only:
```bash
npm run backend
```

### Default Login
On first run, a default user is created:
- Username: `admin`
- Password: `admin`

You can create additional accounts via the Register link in the navigation.

## Project Structure

```
SQUIRREL/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page-level components
│   │   ├── utils/         # Utility functions and helpers
│   │   └── tests/         # Test files
│   ├── public/            # Static assets
│   └── package.json
├── backend/               # Flask backend application
│   ├── app/
│   │   ├── routes/        # API route handlers
│   │   ├── models.py      # Database models
│   │   ├── templates/     # Server-side templates
│   │   └── static/        # Static assets
│   ├── instance/          # SQLite databases (created on first run)
│   └── run.py            # Backend entry point
├── scripts/               # Build and utility scripts
└── package.json          # Root package configuration
```

## API Documentation

### Authentication Endpoints
- `POST /backend/login` - User login
- `POST /backend/register` - User registration
- `POST /backend/logout` - User logout
- `GET /backend/api/me` - Get current user information

### Finance Endpoints
- `GET /backend/api/finance` - Get finance summary (supports `?months=N` parameter)
- `GET /backend/api/finance/transactions` - List all transactions
- `POST /backend/api/finance/transactions` - Create new transaction
- `POST /backend/api/finance/import` - Import transactions from CSV
- `GET /backend/api/finance/export` - Export transactions to CSV
- `POST /backend/api/finance/clear` - Clear all finance data
- `GET /backend/api/finance/scenarios` - List financial scenarios
- `POST /backend/api/finance/scenarios` - Create new scenario
- `GET /backend/api/finance/scenarios/:id` - Get scenario details
- `POST /backend/api/finance/scenarios/:id/options` - Add scenario option
- `GET /backend/api/finance/scenarios/:id/compare` - Compare scenario projections

### Chore Endpoints
- `GET /backend/api/chores` - Get chores summary
- Additional endpoints for chore CRUD operations

### Inventory
Inventory data is stored locally in the browser. No backend API is required for basic operations.

## Development

### Testing

Run the test suite:
```bash
cd frontend
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Code Quality

Run linter:
```bash
cd frontend
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint:fix
```

Format code with Prettier:
```bash
npm run format
```

### Building for Production

Build the frontend:
```bash
cd frontend
npm run build
```

Preview production build:
```bash
npm run preview
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Security

- Inventory data stored in browser LocalStorage (privacy-first)
- Session-based authentication for backend features
- CSRF protection on API endpoints
- Input validation and sanitization
- No external API calls or third-party tracking

## Database Structure

The application uses multiple SQLite databases for modularity:
- `chores.db` - User accounts, chores, rewards, and leaderboard
- `finance.db` - Financial transactions and scenario planning
- `accounts.db` - Account management (future feature)
- `rewards.db` - Rewards metadata (future feature)

All databases are created in `backend/app/instance/` on first run.

## Troubleshooting

### Port Conflicts
If ports 5173 or 5000 are already in use:
- Stop the conflicting process, or
- Change ports in `frontend/vite.config.js` or `backend/run.py`

### Authentication Issues
- Ensure you start both frontend and backend servers
- Access the app via the frontend URL (http://localhost:5173)
- Backend routes are proxied under `/backend` automatically

### Database Issues
- Database files are created automatically on first run
- Location: `backend/app/instance/`
- To reset, delete the database files and restart the backend

## Contributing

This is a personal project currently in beta. Contributions are welcome after initial release.

## License

MIT License

## Version

1.0.0-beta

## Support

For issues or questions, please file an issue on the GitHub repository.
