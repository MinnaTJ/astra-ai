import { useState } from 'react';
import { Briefcase, Plus, RefreshCcw, Loader2, Search, Filter, Trash2, X } from 'lucide-react';
import JobCard from './JobCard';
import JobModal from './JobModal';

/**
 * Job applications dashboard component
 * @param {Object} props - Component props
 * @param {Array} props.applications - Job applications array
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onSave - Save handler
 * @param {boolean} props.isGmailConnected - Gmail connection status
 * @param {Function} props.onSyncGmail - Gmail sync handler
 * @param {boolean} props.isSyncing - Syncing state
 */
function JobDashboard({
  applications,
  onDelete,
  onSave,
  isGmailConnected,
  onSyncGmail,
  isSyncing,
  timezone
}) {
  /* ... existing imports */

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');

  const filteredApplications = applications.filter(job => {
    // Search logic: check company and role
    const matchesSearch =
      (job.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (job.role?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    // Filter logic
    let matchesFilter = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jobDate = job.dateApplied ? new Date(job.dateApplied) : null;
    if (jobDate) jobDate.setHours(0, 0, 0, 0);

    switch (filterOption) {
      case 'today':
        matchesFilter = jobDate && jobDate.getTime() === today.getTime();
        break;
      case 'week':
        if (!jobDate) {
          matchesFilter = false;
        } else {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          matchesFilter = jobDate >= weekAgo;
        }
        break;
      case 'month':
        if (!jobDate) {
          matchesFilter = false;
        } else {
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          matchesFilter = jobDate >= monthAgo;
        }
        break;
      case 'Interviewing':
      case 'Assessment':
      case 'Offer':
      case 'Rejected':
      case 'Ghosted':
      case 'Applied':
        matchesFilter = job.status === filterOption;
        break;
      case 'all':
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesFilter;
  });

  const handleOpenAddModal = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleRemoveRejected = () => {
    if (window.confirm('Are you sure you want to remove all rejected applications?')) {
      const rejectedJobs = applications.filter(job => job.status === 'Rejected');
      rejectedJobs.forEach(job => onDelete(job.id));
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto pb-20">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Job Applications
            </h2>
            <p className="text-gray-400">
              Manage and track your career opportunities in one place.
            </p>
          </div>
          <div className="flex gap-3">
            {isGmailConnected && (
              <button
                onClick={onSyncGmail}
                disabled={isSyncing}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCcw size={18} />
                )}
                {isSyncing ? 'Syncing...' : 'Sync Gmail'}
              </button>
            )}
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-600/20 active:scale-95"
            >
              <Plus size={20} />
              Add Application
            </button>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-[2] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by company or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Filter size={18} />
                </div>
                <select
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
                >
                  <option value="all" className="bg-gray-900 text-white">All Applications</option>

                  <optgroup label="Date Filters" className="bg-gray-900 text-gray-400 font-normal">
                    <option value="today" className="bg-gray-900 text-white">Applied Today</option>
                    <option value="week" className="bg-gray-900 text-white">Applied This Week</option>
                    <option value="month" className="bg-gray-900 text-white">Applied This Month</option>
                  </optgroup>

                  <optgroup label="Status Filters" className="bg-gray-900 text-gray-400 font-normal">
                    <option value="Applied" className="bg-gray-900 text-white">Status: Applied</option>
                    <option value="Assessment" className="bg-gray-900 text-white">Status: Assessment</option>
                    <option value="Interviewing" className="bg-gray-900 text-white">Status: Interviewing</option>
                    <option value="Offer" className="bg-gray-900 text-white">Status: Offer</option>
                    <option value="Rejected" className="bg-gray-900 text-white">Status: Rejected</option>
                    <option value="Ghosted" className="bg-gray-900 text-white">Status: Ghosted</option>
                  </optgroup>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Remove Rejected Button */}
              {applications.some(job => job.status === 'Rejected') && (
                <button
                  onClick={handleRemoveRejected}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium border border-red-500/20 transition-all whitespace-nowrap"
                  title="Remove all rejected applications"
                >
                  <Trash2 size={18} />
                  <span className="hidden lg:inline">Clear Rejected</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border-dashed border-2 border-white/10">
            <Briefcase size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-300">
              No applications tracked yet
            </h3>
            <p className="text-gray-500 mt-2">
              {isGmailConnected
                ? 'Try syncing with Gmail to automatically find your applications.'
                : 'Ask Astra to add a job for you, or click "Add Application" above.'}
            </p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center border-dashed border-2 border-white/10">
            <Search size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-gray-300">
              No matching applications found
            </h3>
            <p className="text-gray-500 mt-2">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={handleOpenEditModal}
                onDelete={onDelete}
                timezone={timezone}
              />
            ))}
          </div>
        )}
      </div>

      <JobModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={onSave}
        editingJob={editingJob}
      />
    </div >
  );
}

export default JobDashboard;
