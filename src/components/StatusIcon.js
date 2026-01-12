import {
  Clock,
  Calendar,
  Trophy,
  XCircle,
  Ghost,
  CheckCircle2
} from 'lucide-react';
import { JobStatus } from '@/constants';

/**
 * Renders status icon based on job application status
 * @param {Object} props - Component props
 * @param {string} props.status - Job status value
 */
function StatusIcon({ status }) {
  switch (status) {
    case JobStatus.APPLIED:
      return <Clock size={16} className="text-blue-400" />;
    case JobStatus.INTERVIEWING:
      return <Calendar size={16} className="text-yellow-400" />;
    case JobStatus.OFFER:
      return <Trophy size={16} className="text-green-400" />;
    case JobStatus.REJECTED:
      return <XCircle size={16} className="text-red-400" />;
    case JobStatus.GHOSTED:
      return <Ghost size={16} className="text-gray-400" />;
    default:
      return <CheckCircle2 size={16} className="text-gray-400" />;
  }
}

export default StatusIcon;
