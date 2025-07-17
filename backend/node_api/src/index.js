const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Configuration
const PORT = process.env.PORT || 4000;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'smart_recruiter',
};

// Create PostgreSQL connection pool
const pool = new Pool(dbConfig);

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

// Database initialization
async function initializeDatabase() {
  try {
    console.log('Attempting to connect to database...');
    console.log('Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    const client = await pool.connect();
    console.log('Database connection successful!');
    
    // Enable pgvector extension
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('pgvector extension enabled');
    
    // Drop existing tables if they exist (to fix vector dimensions)
    await client.query('DROP TABLE IF EXISTS resumes CASCADE;');
    await client.query('DROP TABLE IF EXISTS job_descriptions CASCADE;');
    console.log('Dropped existing tables to fix vector dimensions');
    
    // Create resumes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        candidate_name TEXT NOT NULL,
        resume_file_name TEXT,
        resume_content TEXT NOT NULL,
        embedding VECTOR(768),
        skills TEXT[],
        experience_years INTEGER,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Resumes table created/verified');
    
    // Create job_descriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS job_descriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_title TEXT NOT NULL,
        company_name TEXT,
        job_description TEXT NOT NULL,
        required_skills TEXT[],
        preferred_skills TEXT[],
        experience_required INTEGER,
        embedding VECTOR(768),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Job descriptions table created/verified');
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_resumes_embedding ON resumes USING ivfflat (embedding vector_cosine_ops);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_jobs_embedding ON job_descriptions USING ivfflat (embedding vector_cosine_ops);');
    console.log('Vector indexes created/verified');
    
    client.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail
    });
    
    // Don't exit the process, just log the error
    console.log('Continuing without database initialization...');
  }
}

// Text extraction functions
async function extractTextFromPDF(buffer) {
  try {
    // First attempt with default options
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.log('First PDF extraction attempt failed:', error.message);
    
    try {
      // Second attempt with more lenient options
      const data = await pdfParse(buffer, {
        max: 0, // No page limit
        version: 'v2.0.550'
      });
      return data.text;
    } catch (secondError) {
      console.log('Second PDF extraction attempt failed:', secondError.message);
      
      try {
        // Third attempt with different options
        const data = await pdfParse(buffer, {
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        return data.text;
      } catch (thirdError) {
        throw new Error(`PDF extraction failed after multiple attempts. The PDF may be corrupted or password-protected. Original error: ${error.message}`);
      }
    }
  }
}

async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
}

// Ollama embedding function
async function getEmbeddingFromOllama(text) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/embeddings`, {
      model: EMBEDDING_MODEL,
      prompt: text
    }, {
      timeout: 30000
    });
    
    const embedding = response.data.embedding;
    if (!embedding || embedding.length === 0) {
      throw new Error('No embedding received from Ollama');
    }
    
    return embedding;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Ollama service is not available. Make sure Ollama is running and the model is pulled.');
    }
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'smart-recruiter-backend',
    timestamp: new Date().toISOString(),
    ollama_url: OLLAMA_BASE_URL,
    embedding_model: EMBEDDING_MODEL
  });
});

// Test Ollama connection
app.get('/test-ollama', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    res.json({
      status: 'ok',
      message: 'Ollama is reachable',
      models: response.data.models || []
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Ollama is not reachable',
      error: error.message
    });
  }
});

// Test PDF extraction endpoint
app.post('/test-pdf-extraction', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (fileExtension !== '.pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are supported for this test'
      });
    }

    const extractedText = await extractTextFromPDF(req.file.buffer);
    
    res.json({
      success: true,
      message: 'PDF extraction successful',
      text_length: extractedText.length,
      text_preview: extractedText.substring(0, 500) + '...',
      file_size: req.file.size
    });

  } catch (error) {
    console.error('PDF test extraction error:', error);
    res.status(500).json({
      success: false,
      message: 'PDF extraction failed',
      error: error.message,
      suggestions: [
        'Try converting the PDF to a different format',
        'Check if the PDF is password-protected',
        'Try opening and re-saving the PDF in a PDF reader',
        'Use a DOCX file instead if possible'
      ]
    });
  }
});

// Upload resume endpoint
app.post('/upload/resume', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { candidate_name } = req.body;
    
    if (!candidate_name) {
      return res.status(400).json({
        success: false,
        message: 'Candidate name is required'
      });
    }

    // Extract text based on file type
    let extractedText;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    if (fileExtension === '.pdf') {
      extractedText = await extractTextFromPDF(req.file.buffer);
    } else if (fileExtension === '.docx') {
      extractedText = await extractTextFromDOCX(req.file.buffer);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type'
      });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No text content found in file'
      });
    }

    // Get embedding from Ollama
    const embedding = await getEmbeddingFromOllama(extractedText);

    // Save to database
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO resumes (candidate_name, resume_file_name, resume_content, embedding)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      // Convert embedding array to PostgreSQL vector format
      const vectorString = `[${embedding.join(',')}]`;
      
      const result = await client.query(query, [
        candidate_name,
        req.file.originalname,
        extractedText,
        vectorString
      ]);

      res.json({
        success: true,
        message: 'Resume uploaded and processed successfully',
        file_id: result.rows[0].id,
        file_type: 'resume',
        text_length: extractedText.length,
        embedding_dimensions: embedding.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed',
      error: error.message
    });
  }
});

// Upload job description endpoint
app.post('/upload/job-description', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { job_title, company_name } = req.body;
    
    if (!job_title) {
      return res.status(400).json({
        success: false,
        message: 'Job title is required'
      });
    }

    // Extract text based on file type
    let extractedText;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    if (fileExtension === '.pdf') {
      extractedText = await extractTextFromPDF(req.file.buffer);
    } else if (fileExtension === '.docx') {
      extractedText = await extractTextFromDOCX(req.file.buffer);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type'
      });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No text content found in file'
      });
    }

    // Get embedding from Ollama
    const embedding = await getEmbeddingFromOllama(extractedText);

    // Save to database
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO job_descriptions (job_title, company_name, job_description, embedding)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      // Convert embedding array to PostgreSQL vector format
      const vectorString = `[${embedding.join(',')}]`;
      
      const result = await client.query(query, [
        job_title,
        company_name || '',
        extractedText,
        vectorString
      ]);

      res.json({
        success: true,
        message: 'Job description uploaded and processed successfully',
        file_id: result.rows[0].id,
        file_type: 'job_description',
        text_length: extractedText.length,
        embedding_dimensions: embedding.length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Job description upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed',
      error: error.message
    });
  }
});

// Get embeddings endpoint
app.post('/embed', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const embedding = await getEmbeddingFromOllama(text);

    res.json({
      success: true,
      embedding: embedding,
      dimensions: embedding.length
    });

  } catch (error) {
    console.error('Embedding error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Embedding failed',
      error: error.message
    });
  }
});

// Get resumes endpoint
app.get('/resumes', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT id, candidate_name, resume_file_name, uploaded_at 
        FROM resumes 
        ORDER BY uploaded_at DESC
      `;
      
      const result = await client.query(query);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes',
      error: error.message
    });
  }
});

// Get detailed resume with content and vector info
app.get('/resumes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    try {
      const query = `
        SELECT id, candidate_name, resume_file_name, resume_content, 
               uploaded_at, array_length(embedding, 1) as vector_dimensions
        FROM resumes 
        WHERE id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }
      
      const resume = result.rows[0];
      res.json({
        success: true,
        data: {
          id: resume.id,
          candidate_name: resume.candidate_name,
          file_name: resume.resume_file_name,
          content_preview: resume.resume_content.substring(0, 500) + '...',
          content_length: resume.resume_content.length,
          vector_dimensions: resume.vector_dimensions,
          uploaded_at: resume.uploaded_at
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get resume details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume details',
      error: error.message
    });
  }
});

// Get job descriptions endpoint
app.get('/job-descriptions', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT id, job_title, company_name, created_at 
        FROM job_descriptions 
        ORDER BY created_at DESC
      `;
      
      const result = await client.query(query);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get job descriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job descriptions',
      error: error.message
    });
  }
});

// Get detailed job description with content and vector info
app.get('/job-descriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    try {
      const query = `
        SELECT id, job_title, company_name, job_description, 
               created_at, array_length(embedding, 1) as vector_dimensions
        FROM job_descriptions 
        WHERE id = $1
      `;
      
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job description not found'
        });
      }
      
      const job = result.rows[0];
      res.json({
        success: true,
        data: {
          id: job.id,
          job_title: job.job_title,
          company_name: job.company_name,
          content_preview: job.job_description.substring(0, 500) + '...',
          content_length: job.job_description.length,
          vector_dimensions: job.vector_dimensions,
          created_at: job.created_at
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get job description details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job description details',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Smart Recruiter Backend listening on port ${PORT}`);
      console.log(`📊 Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
      console.log(`🤖 Ollama: ${OLLAMA_BASE_URL} (model: ${EMBEDDING_MODEL})`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

startServer();

module.exports = app; 