"use client";
import { useState, DragEvent } from "react";

interface FileData {
  file: File | null;
  candidate_name?: string;
  job_title?: string;
  company_name?: string;
}

interface ProcessingStatus {
  step: string;
  message: string;
  progress: number;
}

function FileDrop({ 
  label, 
  fileData, 
  setFileData, 
  type 
}: { 
  label: string;
  fileData: FileData;
  setFileData: (data: FileData) => void;
  type: 'resume' | 'job-description';
}) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileData({ ...fileData, file: e.dataTransfer.files[0] });
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileData({ ...fileData, file: e.target.files[0] });
    }
  };

  const handleInputChange = (field: keyof FileData, value: string) => {
    setFileData({ ...fileData, [field]: value });
  };

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <label className="block text-lg font-semibold mb-2" style={{color: 'var(--foreground)'}}>{label}</label>
      
      {/* File input fields */}
      {type === 'resume' && (
        <input
          type="text"
          placeholder="Candidate Name"
          value={fileData.candidate_name || ''}
          onChange={(e) => handleInputChange('candidate_name', e.target.value)}
          className="w-full mb-4 p-3 rounded-lg border border-[var(--accent)] bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--secondary)]"
        />
      )}
      
      {type === 'job-description' && (
        <>
          <input
            type="text"
            placeholder="Job Title"
            value={fileData.job_title || ''}
            onChange={(e) => handleInputChange('job_title', e.target.value)}
            className="w-full mb-4 p-3 rounded-lg border border-[var(--accent)] bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--secondary)]"
          />
          <input
            type="text"
            placeholder="Company Name (optional)"
            value={fileData.company_name || ''}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            className="w-full mb-4 p-3 rounded-lg border border-[var(--accent)] bg-[var(--card-bg)] text-[var(--foreground)] placeholder-[var(--secondary)]"
          />
        </>
      )}
      
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors duration-200 ${dragActive ? 'border-[var(--primary)] bg-[var(--accent)]/30' : 'border-[var(--accent)] bg-[var(--card-bg)]'} cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{minHeight: 160}}
      >
        <input
          type="file"
          className="hidden"
          id={`file-input-${label}`}
          onChange={handleFileChange}
          accept=".pdf,.docx"
          disabled={isUploading}
        />
        <label htmlFor={`file-input-${label}`} className="cursor-pointer font-medium text-[var(--secondary)] hover:text-[var(--primary)] transition-colors duration-200">
          {fileData.file ? fileData.file.name : `Click or drag & drop to upload ${label}`}
        </label>
        {isUploading && (
          <div className="mt-4 text-[var(--primary)]">
            Processing...
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessingStatus({ status }: { status: ProcessingStatus }) {
  return (
    <div className="w-full mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-blue-800 font-medium">{status.step}</span>
        <span className="text-blue-600 text-sm">{status.progress}%</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${status.progress}%` }}
        ></div>
      </div>
      <p className="text-blue-700 text-sm mt-2">{status.message}</p>
    </div>
  );
}

export default function UploadPage() {
  const [resumeData, setResumeData] = useState<FileData>({ file: null });
  const [jobData, setJobData] = useState<FileData>({ file: null });
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);

  const validateForm = () => {
    if (!resumeData.file) {
      setMessage({ type: 'error', text: 'Please upload a resume file' });
      return false;
    }
    if (!resumeData.candidate_name?.trim()) {
      setMessage({ type: 'error', text: 'Please enter candidate name' });
      return false;
    }
    if (!jobData.file) {
      setMessage({ type: 'error', text: 'Please upload a job description file' });
      return false;
    }
    if (!jobData.job_title?.trim()) {
      setMessage({ type: 'error', text: 'Please enter job title' });
      return false;
    }
    return true;
  };

  const uploadFile = async (endpoint: string, formData: FormData) => {
    const response = await fetch(`http://localhost:4000${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }
    
    return response.json();
  };

  const updateProcessingStatus = (step: string, message: string, progress: number) => {
    setProcessingStatus({ step, message, progress });
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setIsUploading(true);
    setMessage(null);
    setProcessingStatus(null);

    try {
      // Upload resume
      updateProcessingStatus('Uploading Resume', 'Uploading resume file...', 10);
      const resumeFormData = new FormData();
      resumeFormData.append('file', resumeData.file!);
      resumeFormData.append('candidate_name', resumeData.candidate_name!);
      
      updateProcessingStatus('Processing Resume', 'Extracting text from resume...', 30);
      const resumeResult = await uploadFile('/upload/resume', resumeFormData);
      console.log('Resume upload result:', resumeResult);
      
      updateProcessingStatus('Resume Complete', `Resume processed successfully! Text length: ${resumeResult.text_length}, Embedding dimensions: ${resumeResult.embedding_dimensions}`, 50);

      // Upload job description
      updateProcessingStatus('Uploading Job Description', 'Uploading job description file...', 60);
      const jobFormData = new FormData();
      jobFormData.append('file', jobData.file!);
      jobFormData.append('job_title', jobData.job_title!);
      if (jobData.company_name) {
        jobFormData.append('company_name', jobData.company_name);
      }
      
      updateProcessingStatus('Processing Job Description', 'Extracting text and generating embeddings...', 80);
      const jobResult = await uploadFile('/upload/job-description', jobFormData);
      console.log('Job description upload result:', jobResult);
      
      updateProcessingStatus('Complete', `Job description processed successfully! Text length: ${jobResult.text_length}, Embedding dimensions: ${jobResult.embedding_dimensions}`, 100);

      setMessage({ 
        type: 'success', 
        text: 'Files uploaded successfully! Both resume and job description have been processed, text extracted, embeddings generated, and stored in the database.' 
      });
      
      // Reset form after a delay
      setTimeout(() => {
        setResumeData({ file: null });
        setJobData({ file: null });
        setProcessingStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Upload failed. Please try again.' 
      });
      setProcessingStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setResumeData({ file: null });
    setJobData({ file: null });
    setMessage(null);
    setProcessingStatus(null);
  };

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:4000/health');
      if (response.ok) {
        const data = await response.json();
        console.log('Backend health check:', data);
        return true;
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
    }
    return false;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-sans bg-[var(--background)] p-4">
      <div className="w-full max-w-2xl bg-[var(--card-bg)] rounded-2xl shadow-2xl p-10 border border-[var(--accent)] flex flex-col items-center" style={{boxShadow: '0 8px 32px 0 rgba(73,88,103,0.10)'}}>
        <h1 className="text-3xl font-bold mb-2 text-[var(--foreground)] text-center">Upload Documents</h1>
        <p className="mb-8 text-[var(--secondary)] text-center">Upload your Job Description and Resume files below. Supported formats: PDF, DOCX.</p>
        
        {/* Backend Status */}
        <div className="w-full mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Backend Status:</span>
            <button 
              onClick={checkBackendHealth}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Check Health
            </button>
          </div>
        </div>
        
        {/* Message display */}
        {message && (
          <div className={`w-full mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
        
        {/* Processing Status */}
        {processingStatus && (
          <ProcessingStatus status={processingStatus} />
        )}
        
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <FileDrop 
            label="Resume" 
            fileData={resumeData}
            setFileData={setResumeData}
            type="resume"
          />
          <FileDrop 
            label="Job Description" 
            fileData={jobData}
            setFileData={setJobData}
            type="job-description"
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md mx-auto">
          <button
            className="flex-1 py-3 px-6 rounded-lg font-bold shadow-md border-none transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{background: 'var(--accent)', color: 'var(--foreground)'}}
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Processing...' : 'Upload & Process'}
          </button>
          <button
            className="flex-1 py-3 px-6 rounded-lg font-bold shadow-md border-none transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{background: 'var(--primary)', color: '#fff'}}
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </button>
        </div>
        
        {/* Dashboard Link */}
        <div className="mt-8 text-center">
          <a 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Uploaded Documents →
          </a>
        </div>
      </div>
    </div>
  );
} 