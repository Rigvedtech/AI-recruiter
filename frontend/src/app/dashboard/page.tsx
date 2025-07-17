"use client";
import { useState, useEffect } from "react";

interface Resume {
  id: string;
  candidate_name: string;
  resume_file_name: string;
  uploaded_at: string;
}

interface JobDescription {
  id: string;
  job_title: string;
  company_name: string;
  created_at: string;
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch resumes
      const resumesResponse = await fetch('http://localhost:4000/resumes');
      if (resumesResponse.ok) {
        const resumesData = await resumesResponse.json();
        setResumes(resumesData);
      }
      
      // Fetch job descriptions
      const jobsResponse = await fetch('http://localhost:4000/job-descriptions');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobDescriptions(jobsData);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sans bg-[var(--background)] p-4">
        <div className="w-full max-w-4xl bg-[var(--card-bg)] rounded-2xl shadow-2xl p-10 border border-[var(--accent)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-[var(--secondary)]">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sans bg-[var(--background)] p-4">
        <div className="w-full max-w-4xl bg-[var(--card-bg)] rounded-2xl shadow-2xl p-10 border border-[var(--accent)]">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Connection Error</h2>
            <p className="text-[var(--secondary)] mb-6">{error}</p>
            <button 
              onClick={fetchData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-sans bg-[var(--background)] p-4">
      <div className="w-full max-w-4xl bg-[var(--card-bg)] rounded-2xl shadow-2xl p-10 border border-[var(--accent)]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Document Dashboard</h1>
          <a 
            href="/upload" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload New Documents
          </a>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Resumes</h3>
            <p className="text-3xl font-bold text-blue-600">{resumes.length}</p>
            <p className="text-blue-600 text-sm">Total uploaded</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Job Descriptions</h3>
            <p className="text-3xl font-bold text-green-600">{jobDescriptions.length}</p>
            <p className="text-green-600 text-sm">Total uploaded</p>
          </div>
        </div>

        {/* Resumes Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Resumes</h2>
          {resumes.length === 0 ? (
            <div className="text-center py-8 text-[var(--secondary)]">
              <div className="text-4xl mb-4">📄</div>
              <p>No resumes uploaded yet.</p>
              <a href="/upload" className="text-blue-600 hover:text-blue-800 underline">
                Upload your first resume
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumes.map((resume) => (
                <div key={resume.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[var(--foreground)] truncate">
                      {resume.candidate_name}
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Resume
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary)] mb-2 truncate">
                    {resume.resume_file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uploaded: {formatDate(resume.uploaded_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Descriptions Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Job Descriptions</h2>
          {jobDescriptions.length === 0 ? (
            <div className="text-center py-8 text-[var(--secondary)]">
              <div className="text-4xl mb-4">💼</div>
              <p>No job descriptions uploaded yet.</p>
              <a href="/upload" className="text-blue-600 hover:text-blue-800 underline">
                Upload your first job description
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobDescriptions.map((job) => (
                <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[var(--foreground)] truncate">
                      {job.job_title}
                    </h3>
                    <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">
                      Job
                    </span>
                  </div>
                  {job.company_name && (
                    <p className="text-sm text-[var(--secondary)] mb-2">
                      {job.company_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Created: {formatDate(job.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processing Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Processing Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">Text Extraction</h4>
              <ul className="text-[var(--secondary)] space-y-1">
                <li>• PDF files processed with pdf-parse</li>
                <li>• DOCX files processed with mammoth</li>
                <li>• Plain text extracted and stored</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-2">AI Embeddings</h4>
              <ul className="text-[var(--secondary)] space-y-1">
                <li>• Generated using Ollama (nomic-embed-text)</li>
                <li>• 1536-dimensional vectors</li>
                <li>• Stored in PostgreSQL with pgvector</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 