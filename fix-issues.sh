#!/bin/bash

# Fix Database and Ollama Issues Script

set -e

echo "🔧 Fixing Database and Ollama Issues..."

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

# Fix 1: Database Issues
fix_database() {
    print_status "Fixing database issues..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down
    
    # Remove any existing volumes to start fresh
    print_status "Removing existing volumes..."
    docker volume rm ai-recruiter_pg_data 2>/dev/null || true
    
    # Start database fresh
    print_status "Starting database fresh..."
    docker-compose up -d postgres
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Test database connection
    print_status "Testing database connection..."
    if docker exec -it pgvector-db psql -U admin -d smart_recruiter -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database is working!"
    else
        print_error "Database connection failed"
        return 1
    fi
}

# Fix 2: Ollama Issues
fix_ollama() {
    print_status "Fixing Ollama issues..."
    
    # Check if Ollama is installed
    if ! command -v ollama &> /dev/null; then
        print_error "Ollama is not installed!"
        print_status "Please install Ollama from: https://ollama.ai/"
        print_status "After installation, run this script again"
        return 1
    fi
    
    # Check if Ollama is running
    print_status "Checking if Ollama is running..."
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_success "Ollama is running!"
    else
        print_status "Starting Ollama..."
        ollama serve &
        sleep 5
    fi
    
    # Check if model is pulled
    print_status "Checking if nomic-embed-text model is available..."
    if ollama list | grep -q "nomic-embed-text"; then
        print_success "Model is already pulled!"
    else
        print_status "Pulling nomic-embed-text model..."
        ollama pull nomic-embed-text
    fi
    
    # Test Ollama
    print_status "Testing Ollama..."
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_success "Ollama is working!"
    else
        print_error "Ollama is not responding"
        return 1
    fi
}

# Test backend connection
test_backend() {
    print_status "Testing backend connection..."
    
    # Wait a bit for backend to start
    sleep 3
    
    # Test health endpoint
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        print_success "Backend is responding!"
    else
        print_warning "Backend may not be ready yet"
    fi
    
    # Test Ollama endpoint
    if curl -s http://localhost:4000/test-ollama > /dev/null 2>&1; then
        print_success "Ollama connection is working!"
    else
        print_warning "Ollama connection may not be ready"
    fi
}

# Main function
main() {
    print_status "Starting fixes..."
    
    # Fix database
    if fix_database; then
        print_success "Database issues fixed!"
    else
        print_error "Failed to fix database issues"
        exit 1
    fi
    
    # Fix Ollama
    if fix_ollama; then
        print_success "Ollama issues fixed!"
    else
        print_error "Failed to fix Ollama issues"
        exit 1
    fi
    
    print_success "All issues fixed!"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Start the backend: cd backend/node_api && npm run dev"
    echo "2. Test the system: curl http://localhost:4000/health"
    echo "3. Try uploading a file through the frontend"
}

# Run main function
main "$@" 