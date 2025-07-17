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

console.log('Testing database connection...');
console.log('Config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

const pool = new Pool(dbConfig);

async function testConnection() {
  try {
    console.log('Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('✅ Database version:', result.rows[0].version);
    
    // Test pgvector extension
    const vectorResult = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector'");
    if (vectorResult.rows.length > 0) {
      console.log('✅ pgvector extension is installed');
    } else {
      console.log('❌ pgvector extension not found');
    }
    
    // List tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✅ Tables found:', tablesResult.rows.map(r => r.table_name));
    
    client.release();
    await pool.end();
    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error detail:', error.detail);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: Make sure PostgreSQL is running');
      console.log('Try: docker-compose up -d postgres');
    } else if (error.code === '28P01') {
      console.log('\n💡 Solution: Check username/password');
      console.log('Current config:', dbConfig);
    } else if (error.code === '3D000') {
      console.log('\n💡 Solution: Database does not exist');
      console.log('Try: docker-compose down && docker-compose up -d postgres');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection(); 