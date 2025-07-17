const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'smart_recruiter',
};

const pool = new Pool(dbConfig);

async function checkVectors() {
  try {
    console.log('🔍 Checking vectorized content in database...\n');
    
    const client = await pool.connect();
    
    // Check resumes
    console.log('📄 RESUMES:');
    console.log('='.repeat(50));
    const resumesResult = await client.query(`
      SELECT 
        id, 
        candidate_name, 
        resume_file_name,
        LENGTH(resume_content) as content_length,
        array_length(embedding, 1) as vector_dimensions,
        uploaded_at
      FROM resumes 
      ORDER BY uploaded_at DESC
    `);
    
    if (resumesResult.rows.length === 0) {
      console.log('❌ No resumes found in database');
    } else {
      resumesResult.rows.forEach((resume, index) => {
        console.log(`${index + 1}. ${resume.candidate_name}`);
        console.log(`   File: ${resume.resume_file_name}`);
        console.log(`   Content: ${resume.content_length} characters`);
        console.log(`   Vector: ${resume.vector_dimensions} dimensions`);
        console.log(`   Uploaded: ${resume.uploaded_at}`);
        console.log('');
      });
    }
    
    // Check job descriptions
    console.log('💼 JOB DESCRIPTIONS:');
    console.log('='.repeat(50));
    const jobsResult = await client.query(`
      SELECT 
        id, 
        job_title, 
        company_name,
        LENGTH(job_description) as content_length,
        array_length(embedding, 1) as vector_dimensions,
        created_at
      FROM job_descriptions 
      ORDER BY created_at DESC
    `);
    
    if (jobsResult.rows.length === 0) {
      console.log('❌ No job descriptions found in database');
    } else {
      jobsResult.rows.forEach((job, index) => {
        console.log(`${index + 1}. ${job.job_title}`);
        console.log(`   Company: ${job.company_name || 'N/A'}`);
        console.log(`   Content: ${job.content_length} characters`);
        console.log(`   Vector: ${job.vector_dimensions} dimensions`);
        console.log(`   Created: ${job.created_at}`);
        console.log('');
      });
    }
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Resumes: ${resumesResult.rows.length}`);
    console.log(`Total Job Descriptions: ${jobsResult.rows.length}`);
    console.log(`Total Vectorized Documents: ${resumesResult.rows.length + jobsResult.rows.length}`);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error checking vectors:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkVectors(); 