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
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Derived filters
  const companies = ['All', ...new Set(applications.map(job => job.company).filter(Boolean))].sort();
  const roles = ['All', ...new Set(applications.map(job => job.role).filter(Boolean))].sort();
  const statuses = ['All', ...new Set(applications.map(job => job.status).filter(Boolean))].sort();

  const filteredApplications = applications.filter(job => {
    const matchesSearch =
      (job.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (job.role?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === 'All' || job.company === selectedCompany;
    const matchesRole = selectedRole === 'All' || job.role === selectedRole;
    const matchesStatus = selectedStatus === 'All' || job.status === selectedStatus;

    return matchesSearch && matchesCompany && matchesRole && matchesStatus;
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
            <div className="flex-1 relative">
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

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {/* Company Filter */}
              <div className="relative min-w-[150px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Briefcase size={16} />
                </div>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-white focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
                >
                  {companies.map(company => (
                    <option key={company} value={company} className="bg-gray-900 text-white">
                      {company === 'All' ? 'All Companies' : company}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Filter size={14} />
                </div>
              </div>

              {/* Role Filter */}
              <div className="relative min-w-[150px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Filter size={16} />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-white focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
                >
                  {roles.map(role => (
                    <option key={role} value={role} className="bg-gray-900 text-white">
                      {role === 'All' ? 'All Roles' : role}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Filter size={14} />
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative min-w-[150px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Loader2 size={16} className={selectedStatus !== 'All' ? 'text-violet-400' : ''} />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-white focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
                >
                  {statuses.map(status => (
                    <option key={status} value={status} className="bg-gray-900 text-white">
                      {status === 'All' ? 'All Statuses' : status}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <Filter size={14} />
                </div>
              </div>

              {/* Remove Rejected Button */}
              {applications.some(job => job.status === 'Rejected') && (
                <button
                  onClick={handleRemoveRejected}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium border border-red-500/20 transition-all whitespace-nowrap ml-auto"
                  title="Remove all rejected applications"
                >
                  <Trash2 size={18} />
                  <span className="hidden md:inline">Clear Rejected</span>
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
