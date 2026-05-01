import { useState, useMemo } from 'react';
import { Briefcase, Plus, RefreshCcw, Loader2, Search, Filter, Trash2, X, TrendingUp, Users, BarChart3, Zap } from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');

  const filteredApplications = useMemo(() => applications.filter(job => {
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
  }), [applications, searchTerm, filterOption]);

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

  // Dashboard stats
  const stats = useMemo(() => {
    const total = applications.length;
    const interviewing = applications.filter(j => j.status === 'Interviewing').length;
    const assessments = applications.filter(j => j.status === 'Assessment').length;
    const offers = applications.filter(j => j.status === 'Offer').length;
    const rejected = applications.filter(j => j.status === 'Rejected').length;
    const active = total - rejected;
    // Response rate = anything that moved past 'Applied' or 'Ghosted'
    const responded = applications.filter(j => !['Applied', 'Ghosted'].includes(j.status)).length;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
    const interviewRate = total > 0 ? Math.round(((interviewing + assessments + offers) / total) * 100) : 0;
    return { total, active, responseRate, interviewRate, offers };
  }, [applications]);

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto pb-24 md:pb-20">
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">
              Job Applications
            </h2>
            <p className="text-sm md:text-base text-gray-400">
              Manage and track your career opportunities.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {isGmailConnected && (
              <button
                onClick={onSyncGmail}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold border border-white/10 transition-all active:scale-95 disabled:opacity-50 text-sm md:text-base"
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
              className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-600/20 active:scale-95 text-sm md:text-base"
            >
              <Plus size={20} />
              Add Application
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        {applications.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="glass rounded-2xl p-4 border border-white/5 hover:border-violet-500/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-violet-500/10 rounded-xl">
                  <Briefcase size={18} className="text-violet-400" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 hover:border-blue-500/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Zap size={18} className="text-blue-400" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Active</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 hover:border-amber-500/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <TrendingUp size={18} className="text-amber-400" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Response</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.responseRate}<span className="text-sm text-gray-500 font-normal">%</span></p>
            </div>
            <div className="glass rounded-2xl p-4 border border-white/5 hover:border-green-500/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-xl">
                  <BarChart3 size={18} className="text-green-400" />
                </div>
                <span className="text-xs text-gray-500 font-medium">Interview</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.interviewRate}<span className="text-sm text-gray-500 font-normal">%</span></p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="flex-[2] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 md:py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Filter size={16} />
                </div>
                <select
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-2 md:py-2.5 pl-9 pr-10 text-white focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer text-sm"
                >
                  <option value="all" className="bg-gray-900 text-white">All Jobs</option>
                  <optgroup label="Date" className="bg-gray-900 text-gray-400 font-normal">
                    <option value="today" className="bg-gray-900 text-white">Today</option>
                    <option value="week" className="bg-gray-900 text-white">This Week</option>
                  </optgroup>
                  <optgroup label="Status" className="bg-gray-900 text-gray-400 font-normal">
                    <option value="Applied" className="bg-gray-900 text-white">Applied</option>
                    <option value="Interviewing" className="bg-gray-900 text-white">Interviewing</option>
                    <option value="Offer" className="bg-gray-900 text-white">Offer</option>
                    <option value="Rejected" className="bg-gray-900 text-white">Rejected</option>
                  </optgroup>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Remove Rejected Button */}
              {applications.some(job => job.status === 'Rejected') && (
                <button
                  onClick={handleRemoveRejected}
                  className="flex items-center gap-2 px-3 py-2 md:py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium border border-red-500/20 transition-all whitespace-nowrap text-xs md:text-sm"
                  title="Remove rejected"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Clear Rejected</span>
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
