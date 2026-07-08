#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting backend..."
(
  cd "$SCRIPT_DIR/backend"
  ./venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
) &
BACKEND_PID=$!

sleep 2

echo "Starting frontend..."
(
  cd "$SCRIPT_DIR/frontend"
  npm start
) &
FRONTEND_PID=$!

cleanup() {
  echo "Stopping services..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT

wait "$BACKEND_PID" "$FRONTEND_PID"
