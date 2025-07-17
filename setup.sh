#!/bin/bash

# AI Recruiter System Setup Script
# This script will set up the entire AI recruiter system

set -e

echo "🚀 Setting up AI Recruiter System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required tools are installed
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
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is not installed. Please install pip3."
        exit 1
    fi
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL is not installed. Please install PostgreSQL and the pgvector extension."
        print_warning "You can use Docker with the provided docker-compose.yml file."
    fi
    
    # Check Ollama
    if ! command -v ollama &> /dev/null; then
        print_warning "Ollama is not installed. Please install Ollama from https://ollama.ai/"
        print_warning "After installation, run: ollama pull nomic-embed-text"
    fi
    
    print_success "Prerequisites check completed"
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if PostgreSQL is running
    if ! pg_isready -q; then
        print_warning "PostgreSQL is not running. Please start PostgreSQL first."
        print_warning "If using Docker, run: docker-compose up -d"
        return 1
    fi
    
    # Create database if it doesn't exist
    if ! psql -lqt | cut -d \| -f 1 | grep -qw ai_recruiter; then
        print_status "Creating database 'ai_recruiter'..."
        createdb ai_recruiter
        print_success "Database created"
    else
        print_status "Database 'ai_recruiter' already exists"
    fi
    
    # Run initialization script
    print_status "Running database initialization script..."
    psql -d ai_recruiter -f database/init.sql
    print_success "Database setup completed"
}

# Setup Python AI service
setup_python_service() {
    print_status "Setting up Python AI service..."
    
    cd backend/python_ai
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip3 install -r requirements.txt
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp config.env .env
        print_status "Environment file created. Please edit .env with your database credentials."
    fi
    
    cd ../..
    print_success "Python AI service setup completed"
}

# Setup Node.js API gateway
setup_node_api() {
    print_status "Setting up Node.js API gateway..."
    
    cd backend/node_api
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Copy environment file
    if [ ! -f .env ]; then
        cp config.env .env
        print_status "Environment file created."
    fi
    
    cd ../..
    print_success "Node.js API gateway setup completed"
}

# Setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install Node.js dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    cd ..
    print_success "Frontend setup completed"
}

# Test services
test_services() {
    print_status "Testing services..."
    
    # Test Python service
    if curl -s http://localhost:8000/health > /dev/null; then
        print_success "Python AI service is running"
    else
        print_warning "Python AI service is not running. Start it with: cd backend/python_ai && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    fi
    
    # Test Node.js gateway
    if curl -s http://localhost:4000/health > /dev/null; then
        print_success "Node.js API gateway is running"
    else
        print_warning "Node.js API gateway is not running. Start it with: cd backend/node_api && npm run dev"
    fi
    
    # Test frontend
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Frontend is running"
    else
        print_warning "Frontend is not running. Start it with: cd frontend && npm run dev"
    fi
}

# Main setup function
main() {
    print_status "Starting AI Recruiter System setup..."
    
    check_prerequisites
    setup_database
    setup_python_service
    setup_node_api
    setup_frontend
    
    print_success "Setup completed!"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Edit backend/python_ai/.env with your database credentials"
    echo "2. Make sure Ollama is running and nomic-embed-text model is pulled"
    echo "3. Start the services:"
    echo "   - Python AI service: cd backend/python_ai && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    echo "   - Node.js gateway: cd backend/node_api && npm run dev"
    echo "   - Frontend: cd frontend && npm run dev"
    echo "4. Open http://localhost:3000/upload to test the system"
    echo ""
    echo "📚 For more information, see the README.md file"
}

# Run main function
main "$@" 