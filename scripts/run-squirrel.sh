#!/usr/bin/env bash
set -euo pipefail

# Simple launcher to start SQUIRREL Suite (frontend + backend)
# - Ensures Python is available
# - Creates a backend virtual environment and installs Python deps
# - Uses npx concurrently to run both processes in one terminal

# Pick python executable
if command -v python >/dev/null 2>&1; then
  PY=python
elif command -v python3 >/dev/null 2>&1; then
  PY=python3
else
  echo "Error: python (or python3) not found in PATH" >&2
  exit 1
fi

# Move to repo root (directory of this script is scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Ensure node is present
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed. Please install Node.js to run the frontend." >&2
  exit 1
fi

# Install root dev dependencies if needed (concurrently)
if [ ! -d "node_modules" ]; then
  echo "Installing root dev dependencies (concurrently)..."
  npm install --no-audit --no-fund --no-progress
fi

# Ensure backend virtual environment and dependencies
VENV_DIR="backend/.venv"
VENV_PY="$VENV_DIR/bin/python"
if [ ! -x "$VENV_PY" ]; then
  echo "Creating backend virtual environment..."
  $PY -m venv "$VENV_DIR"
fi

# Upgrade pip and install requirements (fast no-op if satisfied)
"$VENV_PY" -m pip install --upgrade pip >/dev/null 2>&1 || true
"$VENV_PY" -m pip install -r backend/requirements.txt

# Run both frontend and backend
npx concurrently \
  "npm --prefix frontend run dev" \
  "$VENV_PY backend/run.py"
