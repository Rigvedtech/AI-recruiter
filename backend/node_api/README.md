# Smart Recruiter Backend

A Node.js + Express backend that handles resume and job description uploads, text extraction, Ollama embeddings, and PostgreSQL storage with pgvector.

## 🚀 Features

- **File Upload**: Accepts PDF and DOCX files
- **Text Extraction**: Extracts plain text using pdf-parse and mammoth
- **AI Embeddings**: Generates embeddings using Ollama (nomic-embed-text)
- **Vector Storage**: Stores embeddings in PostgreSQL with pgvector
- **RESTful API**: Complete REST API for all operations
- **Docker Support**: Full Docker containerization
- **Health Checks**: Built-in health monitoring

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL with pgvector extension
- Ollama with nomic-embed-text model
- Docker (optional, for containerized deployment)

## 🛠️ Installation

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp config.env .env
   # Edit .env with your settings
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

2. **Or build the backend separately**:
   ```bash
   docker build -t smart-recruiter-backend .
   docker run -p 4000:4000 smart-recruiter-backend
   ```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=4000
NODE_ENV=production

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

### Database Setup

The backend automatically initializes the database schema on startup:

- Enables pgvector extension
- Creates resumes and job_descriptions tables
- Sets up vector indexes for similarity search

## 📡 API Endpoints

### Health & Status

- `GET /health` - Health check
- `GET /test-ollama` - Test Ollama connection

### File Upload

- `POST /upload/resume` - Upload and process resume
- `POST /upload/job-description` - Upload and process job description

### Embeddings

- `POST /embed` - Generate text embeddings

### Data Retrieval

- `GET /resumes` - Get all resumes
- `GET /job-descriptions` - Get all job descriptions

## 📝 API Documentation

### Upload Resume

```bash
curl -X POST http://localhost:4000/upload/resume \
  -F "file=@resume.pdf" \
  -F "candidate_name=John Doe"
```

**Response**:
```json
{
  "success": true,
  "message": "Resume uploaded and processed successfully",
  "file_id": "uuid-here",
  "file_type": "resume",
  "text_length": 1234,
  "embedding_dimensions": 1536
}
```

### Upload Job Description

```bash
curl -X POST http://localhost:4000/upload/job-description \
  -F "file=@job-description.pdf" \
  -F "job_title=Software Engineer" \
  -F "company_name=Tech Corp"
```

### Generate Embeddings

```bash
curl -X POST http://localhost:4000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "Software engineer with 5 years experience"}'
```

**Response**:
```json
{
  "success": true,
  "embedding": [0.1, 0.2, ...],
  "dimensions": 1536
}
```

## 🗄️ Database Schema

### Resumes Table
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  resume_file_name TEXT,
  resume_content TEXT NOT NULL,
  embedding VECTOR(1536),
  skills TEXT[],
  experience_years INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Job Descriptions Table
```sql
CREATE TABLE job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_description TEXT NOT NULL,
  required_skills TEXT[],
  preferred_skills TEXT[],
  experience_required INTEGER,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔍 File Processing

### Supported Formats
- **PDF**: Uses pdf-parse library
- **DOCX**: Uses mammoth library

### Processing Pipeline
1. File upload validation
2. Text extraction based on file type
3. Ollama embedding generation
4. Database storage with vector indexing

## 🐳 Docker

### Build Image
```bash
docker build -t smart-recruiter-backend .
```

### Run Container
```bash
docker run -p 4000:4000 \
  -e DB_HOST=your-db-host \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  smart-recruiter-backend
```

### Docker Compose
```bash
docker-compose up -d
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:4000/health
```

### Test Ollama Connection
```bash
curl http://localhost:4000/test-ollama
```

### Test File Upload
```bash
# Create a test PDF file
echo "Test resume content" > test.pdf

# Upload it
curl -X POST http://localhost:4000/upload/resume \
  -F "file=@test.pdf" \
  -F "candidate_name=Test User"
```

## 🔧 Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

### Logging
- Uses Morgan for HTTP request logging
- Console logging for errors and info

### Error Handling
- Comprehensive error handling for all endpoints
- Graceful shutdown with database connection cleanup

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify database credentials in .env
   - Ensure pgvector extension is installed

2. **Ollama Connection Failed**
   - Make sure Ollama is running
   - Pull the model: `ollama pull nomic-embed-text`
   - Check OLLAMA_BASE_URL in .env

3. **File Upload Errors**
   - Check file size (max 10MB)
   - Verify file format (PDF/DOCX only)
   - Ensure file contains extractable text

### Logs
```bash
# View container logs
docker logs smart-recruiter-backend

# View real-time logs
docker logs -f smart-recruiter-backend
```

## 📈 Performance

- Connection pooling for database
- File size limits (10MB)
- Timeout handling for Ollama requests
- Vector indexing for fast similarity search

## 🔒 Security

- Input validation and sanitization
- File type restrictions
- Non-root Docker user
- Helmet.js for security headers
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 