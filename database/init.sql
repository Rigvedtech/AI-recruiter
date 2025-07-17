-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table to store resume vectors
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name TEXT NOT NULL,
  resume_file_name TEXT,
  resume_content TEXT NOT NULL,
  embedding VECTOR(1536),  -- OpenAI embeddings are 1536 dimensions
  skills TEXT[],  -- Array of skills extracted from resume
  experience_years INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create a table to store job descriptions
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  company_name TEXT,
  job_description TEXT NOT NULL,
  required_skills TEXT[],  -- Array of required skills
  preferred_skills TEXT[],  -- Array of preferred skills
  experience_required INTEGER,
  embedding VECTOR(1536),  -- OpenAI embeddings are 1536 dimensions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create a table to store matching results
CREATE TABLE IF NOT EXISTS resume_job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_descriptions(id) ON DELETE CASCADE,
  similarity_score FLOAT NOT NULL,  -- Cosine similarity score (0-1)
  match_percentage FLOAT NOT NULL,  -- Percentage match (0-100)
  skills_match_count INTEGER,  -- Number of matching skills
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resume_id, job_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_embedding ON resumes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_jobs_embedding ON job_descriptions USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_matches_similarity ON resume_job_matches(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_skills ON resumes USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills ON job_descriptions USING GIN(required_skills);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON job_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
