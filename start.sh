#!/bin/bash

# Function to run npm server
run_server() {
    echo "Starting server..."
    npm run server
}

# Function to run npm dev
run_dev() {
    echo "Starting dev server..."
    npm run dev
}

# Start both npm commands in background
run_server &
SERVER_PID=$!

run_dev &
DEV_PID=$!

# Wait a bit for servers to start
sleep 3

# Open Chrome with the URL
open -a "Google Chrome" "http://localhost:5173/"

# Function to cleanup on exit
cleanup() {
    echo "\nShutting down servers..."
    kill $SERVER_PID 2>/dev/null
    kill $DEV_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Wait for both processes
wait $SERVER_PID $DEV_PID