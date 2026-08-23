import React from 'react';
import { ResponseStatus } from '../types';
import { Clock, PlayCircle, CheckCircle, Copy } from 'lucide-react';

interface StatusBadgeProps {
  status: ResponseStatus;
  compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'pending', compact = false }) => {
  const getStatusConfig = (s: ResponseStatus) => {
    switch (s) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          classes:
            'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-600',
        };
      case 'in_progress':
        return {
          icon: PlayCircle,
          label: 'In Progress',
          classes:
            'bg-ocean-100 text-ocean-700 border-ocean-300 dark:bg-ocean-900/40 dark:text-ocean-300 dark:border-ocean-700',
        };
      case 'resolved':
        return {
          icon: CheckCircle,
          label: 'Resolved',
          classes:
            'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
        };
      case 'duplicate':
        return {
          icon: Copy,
          label: 'Duplicate',
          classes:
            'bg-coral-100 text-coral-700 border-coral-300 dark:bg-coral-900/30 dark:text-coral-300 dark:border-coral-600',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.classes}`}
    >
      <Icon className="w-3 h-3" />
      {!compact && config.label}
    </span>
  );
};
