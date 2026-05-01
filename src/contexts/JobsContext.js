import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { STORAGE_KEYS } from '@/constants';

const JobsContext = createContext(null);

export function JobsProvider({ children }) {
  const [applications, setApplications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOBS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to parse saved jobs, resetting:', e);
      return [];
    }
  });

  const applicationsRef = useRef(applications);
  applicationsRef.current = applications;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(applications));
  }, [applications]);

  const saveJobApplication = useCallback((jobData) => {
    const currentApps = applicationsRef.current;
    if (jobData.id) {
      const updatedApps = currentApps.map((j) => (j.id === jobData.id ? jobData : j));
      applicationsRef.current = updatedApps;
      setApplications(updatedApps);
      return `Job application for ${jobData.company} updated successfully.`;
    }
    const existingJobIndex = currentApps.findIndex(j =>
      j.company.toLowerCase() === jobData.company.toLowerCase() &&
      j.role.toLowerCase() === jobData.role.toLowerCase()
    );
    if (existingJobIndex >= 0) {
      const existingJob = currentApps[existingJobIndex];
      const updatedJob = { ...existingJob, ...jobData, id: existingJob.id };
      const updatedApps = [...currentApps];
      updatedApps[existingJobIndex] = updatedJob;
      applicationsRef.current = updatedApps;
      setApplications(updatedApps);
      return `Updated existing application for ${jobData.role} at ${jobData.company}.`;
    }
    const newJob = { ...jobData, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    const updatedApps = [newJob, ...currentApps];
    applicationsRef.current = updatedApps;
    setApplications(updatedApps);
    return `Successfully added ${newJob.role} at ${newJob.company} to your tracker.`;
  }, []);

  const deleteJobApplication = useCallback((id) => {
    const jobToDelete = applicationsRef.current.find((j) => j.id === id);
    if (jobToDelete) {
      setApplications((prev) => prev.filter((j) => j.id !== id));
      return `Removed the application for ${jobToDelete.company} from your list.`;
    }
    return "I couldn't find that job application in your tracker.";
  }, []);

  const updateJobApplication = useCallback((updateData) => {
    const { company: companyName } = updateData;
    const job = applicationsRef.current.find((j) => j.company.toLowerCase().includes(companyName.toLowerCase()));
    if (job) {
      setApplications((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...updateData } : j)));
      const changes = Object.keys(updateData).filter(k => k !== 'company' && updateData[k] !== undefined).map(k => `${k} to "${updateData[k]}"`).join(', ');
      return `Updated the application for ${job.company}: ${changes || 'No changes made'}.`;
    }
    return `I couldn't find an application for "${companyName}" in your tracker.`;
  }, []);

  const listJobs = useCallback(() => {
    let jobs = applicationsRef.current;
    if (!jobs || jobs.length === 0) {
      try { const saved = localStorage.getItem(STORAGE_KEYS.JOBS); jobs = saved ? JSON.parse(saved) : []; } catch { jobs = []; }
    }
    if (jobs.length === 0) return "You haven't added any job applications yet.";
    const list = jobs.map((j, i) => `${i + 1}. ${j.company} - ${j.role} (${j.status})`).join('\n');
    return `You have ${jobs.length} applications in your tracker:\n${list}`;
  }, []);

  const findJobByCompany = useCallback((companyName) => {
    let jobs = applicationsRef.current;
    if (!jobs || jobs.length === 0) {
      try { const saved = localStorage.getItem(STORAGE_KEYS.JOBS); jobs = saved ? JSON.parse(saved) : []; } catch { jobs = []; }
    }
    return jobs.find((j) => j.company.toLowerCase().includes(companyName.toLowerCase()));
  }, []);

  const clearAllJobs = useCallback(() => {
    setApplications([]);
    localStorage.removeItem(STORAGE_KEYS.JOBS);
  }, []);

  return (
    <JobsContext.Provider value={{
      applications, applicationsRef, saveJobApplication, deleteJobApplication, updateJobApplication, listJobs, findJobByCompany, clearAllJobs
    }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
}
