# AI Recruiter System

A smart recruitment system that uses AI to match job descriptions with resumes using vector embeddings and semantic similarity.

## 🏗️ Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Node.js + Express with file processing and AI integration
- **Database**: PostgreSQL with pgvector extension for vector storage
- **AI**: Ollama for generating text embeddings (nomic-embed-text)
- **File Processing**: PDF and DOCX text extraction

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v12 or higher) with pgvector extension
3. **Ollama** installed and running locally
4. **Docker** (optional, for containerized deployment)

## 🚀 Quick Setup

### 1. Install Ollama and Required Model

```bash
# Install Ollama (if not already installed)
# Visit: https://ollama.ai/

# Pull the embedding model
ollama pull nomic-embed-text
```

### 2. Start the Database (Docker)

```bash
# Start PostgreSQL with pgvector
docker-compose up -d postgres pgadmin
```

### 3. Backend Setup

```bash
cd backend/node_api

# Install dependencies
npm install

# Copy environment configuration
cp config.env .env
# Edit .env with your database credentials if needed

# Start the Node.js backend
npm run dev
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=4000

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_USER=admin
DB_PASSWORD=password
DB_NAME=smart_recruiter

# Ollama Configuration
OLLAMA_BASE_URL=http://host.docker.internal:11434
EMBEDDING_MODEL=nomic-embed-text
```

## 📁 Project Structure

```
AI-recruiter/
├── frontend/                 # Next.js frontend
│   ├── src/app/upload/      # Upload page
│   ├── src/app/dashboard/   # Dashboard page
│   └── ...
├── backend/
│   └── node_api/            # Node.js backend
│       ├── src/index.js     # Express server
│       ├── Dockerfile       # Docker configuration
│       └── package.json     # Node.js dependencies
├── database/
│   └── init.sql             # Database schema
└── docker-compose.yml       # Docker setup
```

## 🔌 API Endpoints

### Backend (Port 4000)

- `GET /health` - Health check
- `GET /test-ollama` - Test Ollama connection
- `POST /upload/resume` - Upload and process resume file
- `POST /upload/job-description` - Upload and process job description file
- `POST /embed` - Generate text embeddings
- `GET /resumes` - Get all resumes
- `GET /job-descriptions` - Get all job descriptions

## 🎯 Usage

1. **Start all services** (see setup instructions above)
2. **Open the frontend** at `http://localhost:3000`
3. **Navigate to the upload page** at `http://localhost:3000/upload`
4. **Upload files**:
   - Resume: PDF or DOCX file + candidate name
   - Job Description: PDF or DOCX file + job title + company name (optional)
5. **Files are automatically processed**:
   - Text extraction from PDF/DOCX
   - Embedding generation using Ollama
   - Storage in PostgreSQL with pgvector
6. **View uploaded documents** at `http://localhost:3000/dashboard`

## 🔍 Features

- **File Upload**: Drag & drop or click to upload PDF/DOCX files
- **Text Extraction**: Automatic text extraction from PDF and DOCX files
- **Vector Embeddings**: Generate embeddings using Ollama's nomic-embed-text model
- **Database Storage**: Store documents and embeddings in PostgreSQL with pgvector
- **Real-time Processing**: Progress indicators and status updates
- **Dashboard**: View all uploaded documents and processing information
- **Error Handling**: Comprehensive error handling and user feedback

## 🐳 Docker Deployment

### Full Stack (Recommended)
```bash
# Start all services
docker-compose up -d

# Services available:
# - Backend: http://localhost:4000
# - Frontend: http://localhost:3000 (run separately)
# - PostgreSQL: localhost:5433
# - pgAdmin: http://localhost:5050
```

### Backend Only
```bash
cd backend/node_api
docker build -t smart-recruiter-backend .
docker run -p 4000:4000 smart-recruiter-backend
```

## 🧪 Testing

### Health Checks
```bash
# Test backend
curl http://localhost:4000/health

# Test Ollama connection
curl http://localhost:4000/test-ollama
```

### File Upload Test
```bash
# Create a test PDF
echo "Test resume content" > test.pdf

# Upload resume
curl -X POST http://localhost:4000/upload/resume \
  -F "file=@test.pdf" \
  -F "candidate_name=Test User"
```

## 🔧 Development

### Adding New Features

1. **Frontend**: Add new pages in `frontend/src/app/`
2. **Backend**: Add endpoints in `backend/node_api/src/index.js`
3. **Database**: Update schema in `database/init.sql`

### Scripts

```bash
# Backend
cd backend/node_api
npm run dev    # Development with nodemon
npm start      # Production

# Frontend
cd frontend
npm run dev    # Development server
npm run build  # Production build
```

## 🐛 Troubleshooting

### Common Issues

1. **Ollama not running**: Make sure Ollama is installed and running
2. **Database connection**: Check PostgreSQL is running and credentials are correct
3. **CORS errors**: Ensure frontend is running on the correct port
4. **File upload errors**: Check file size limits and supported formats

### Logs

- **Backend**: Check console output for detailed error messages
- **Frontend**: Check browser console for client-side errors
- **Docker**: `docker logs smart-recruiter-backend`

## 📈 Next Steps

- [ ] Add resume-job matching functionality
- [ ] Implement similarity scoring
- [ ] Add user authentication
- [ ] Create advanced filtering and search
- [ ] Add batch processing capabilities
- [ ] Implement real-time notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 