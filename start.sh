#!/bin/bash
# start.sh - 启动开发环境

echo "Starting backend..."
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:3000"
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
