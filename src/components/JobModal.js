import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { JobStatus } from '@/constants';

/**
 * Modal for adding/editing job applications
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Modal visibility state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {Object} [props.editingJob] - Job being edited (null for new)
 */
function JobModal({ isOpen, onClose, onSave, editingJob }) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    source: '',
    dateApplied: new Date().toISOString().split('T')[0],
    timeApplied: new Date().toISOString().split('T')[1],
    status: JobStatus.APPLIED
  });

  useEffect(() => {
    if (editingJob) {
      setFormData({
        company: editingJob.company,
        role: editingJob.role,
        source: editingJob.source,
        dateApplied: editingJob.dateApplied,
        timeApplied: editingJob.timeApplied,
        status: editingJob.status
      });
    } else {
      setFormData({
        company: '',
        role: '',
        source: '',
        dateApplied: new Date().toISOString().split('T')[0],
        timeApplied: new Date().toISOString().split('T')[1],
        status: JobStatus.APPLIED
      });
    }
  }, [editingJob, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingJob) {
      onSave({ ...formData, id: editingJob.id });
    } else {
      onSave(formData);
    }
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-white">
            {editingJob ? 'Edit Application' : 'New Application'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-400 ml-1">
              Company Name
            </label>
            <input
              required
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white"
              placeholder="e.g. Google, Stripe, etc."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-400 ml-1">
              Job Role / Title
            </label>
            <input
              required
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white"
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-400 ml-1">
                Source
              </label>
              <input
                required
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white"
                placeholder="e.g. LinkedIn"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-400 ml-1">
                Date Applied
              </label>
              <input
                required
                type="date"
                name="dateApplied"
                value={formData.dateApplied}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-400 ml-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all text-white appearance-none"
            >
              <option value={JobStatus.APPLIED} className="bg-gray-900">
                Applied
              </option>
              <option value={JobStatus.INTERVIEWING} className="bg-gray-900">
                Interviewing
              </option>
              <option value={JobStatus.OFFER} className="bg-gray-900">
                Offer
              </option>
              <option value={JobStatus.REJECTED} className="bg-gray-900">
                Rejected
              </option>
              <option value={JobStatus.GHOSTED} className="bg-gray-900">
                Ghosted
              </option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98]"
            >
              {editingJob ? 'Update Application' : 'Save Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobModal;
