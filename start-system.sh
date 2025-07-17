#!/bin/bash

# AI Recruiter System - Complete Startup Script

set -e

echo "🚀 Starting AI Recruiter System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v18 or higher."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. You'll need to set up PostgreSQL manually."
    fi
    
    # Check Ollama
    if ! command -v ollama &> /dev/null; then
        print_warning "Ollama is not installed. Please install Ollama from https://ollama.ai/"
        print_warning "After installation, run: ollama pull nomic-embed-text"
    fi
    
    print_success "Prerequisites check completed"
}

# Start database
start_database() {
    print_status "Starting database..."
    
    if command -v docker &> /dev/null; then
        # Start PostgreSQL with Docker
        docker-compose up -d postgres pgadmin
        print_success "Database started with Docker"
        print_status "PostgreSQL: localhost:5433"
        print_status "pgAdmin: http://localhost:5050 (admin@admin.com / admin)"
    else
        print_warning "Docker not available. Please start PostgreSQL manually."
        print_warning "Make sure PostgreSQL is running on localhost:5433"
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend/node_api
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp config.env .env
        print_status "Environment file created"
    fi
    
    cd ../..
    print_success "Backend setup completed"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    cd ..
    print_success "Frontend setup completed"
}

# Start backend
start_backend() {
    print_status "Starting backend..."
    
    cd backend/node_api
    
    # Start the backend in background
    npm run dev &
    BACKEND_PID=$!
    
    cd ../..
    
    # Wait for backend to start
    print_status "Waiting for backend to start..."
    sleep 5
    
    # Test backend health
    if curl -s http://localhost:4000/health > /dev/null; then
        print_success "Backend started successfully"
    else
        print_warning "Backend may not be ready yet. Check manually at http://localhost:4000/health"
    fi
}

# Start frontend
start_frontend() {
    print_status "Starting frontend..."
    
    cd frontend
    
    # Start the frontend in background
    npm run dev &
    FRONTEND_PID=$!
    
    cd ..
    
    print_success "Frontend started successfully"
}

# Main startup function
main() {
    print_status "Starting AI Recruiter System..."
    
    check_prerequisites
    start_database
    setup_backend
    setup_frontend
    
    print_status "Starting services..."
    start_backend
    start_frontend
    
    print_success "System startup completed!"
    echo ""
    echo "🎉 Services are now running:"
    echo "  📊 Backend API: http://localhost:4000"
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🗄️  PostgreSQL: localhost:5433"
    echo "  📈 pgAdmin: http://localhost:5050"
    echo ""
    echo "📋 Next steps:"
    echo "1. Make sure Ollama is running: ollama serve"
    echo "2. Pull the embedding model: ollama pull nomic-embed-text"
    echo "3. Open http://localhost:3000/upload to test the system"
    echo "4. View uploaded documents at http://localhost:3000/dashboard"
    echo ""
    echo "🛑 To stop the system, press Ctrl+C"
    
    # Wait for user to stop
    wait
}

# Cleanup function
cleanup() {
    print_status "Shutting down services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    print_success "Services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Run main function
main "$@" 