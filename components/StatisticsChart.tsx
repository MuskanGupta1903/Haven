import React from 'react';
import { IncidentResponse } from '../types';

interface StatisticsChartProps {
  responses: IncidentResponse[];
}

export const StatisticsChart: React.FC<StatisticsChartProps> = ({ responses }) => {
  // Calculate urgency statistics
  const urgencyStats = {
    CRITICAL: responses.filter(r => r.aiClassification?.urgency === 'CRITICAL').length,
    MODERATE: responses.filter(r => r.aiClassification?.urgency === 'MODERATE').length,
    LOW: responses.filter(r => r.aiClassification?.urgency === 'LOW').length,
    UNKNOWN: responses.filter(r => !r.aiClassification || r.aiClassification.urgency === 'UNKNOWN').length
  };

  // Calculate status statistics
  const statusStats = {
    pending: responses.filter(r => !r.status || r.status === 'pending').length,
    in_progress: responses.filter(r => r.status === 'in_progress').length,
    resolved: responses.filter(r => r.status === 'resolved').length
  };

  // Calculate region statistics
  const regionStats: Record<string, number> = {};
  responses.forEach(r => {
    if (r.region) {
      regionStats[r.region] = (regionStats[r.region] || 0) + 1;
    }
  });

  // Calculate district statistics (top 5)
  const districtStats: Record<string, number> = {};
  responses.forEach(r => {
    if (r.district) {
      const key = `${r.region} - ${r.district}`;
      districtStats[key] = (districtStats[key] || 0) + 1;
    }
  });
  const topDistricts = Object.entries(districtStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate time-based statistics (last 24 hours, by 6-hour blocks)
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const timeBlocks = [
    { label: '0–6h ago', count: 0 },
    { label: '6–12h ago', count: 0 },
    { label: '12–18h ago', count: 0 },
    { label: '18–24h ago', count: 0 }
  ];

  responses.forEach(r => {
    const age = now - r.submittedAt;
    if (age < last24h) return;

    const hoursAgo = age / (60 * 60 * 1000);
    if (hoursAgo < 6) timeBlocks[0].count++;
    else if (hoursAgo < 12) timeBlocks[1].count++;
    else if (hoursAgo < 18) timeBlocks[2].count++;
    else if (hoursAgo < 24) timeBlocks[3].count++;
  });

  const maxTimeCount = Math.max(...timeBlocks.map(b => b.count), 1);

  const total = responses.length;

  const glassCard = 'bg-white/5 dark:bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6';
  const sectionHeading = 'text-sm font-semibold text-ocean-300 uppercase tracking-widest mb-4';
  const barTrack = 'w-full bg-white/10 rounded-full h-2.5';

  if (total === 0) {
    return (
      <div className={`${glassCard} text-center`}>
        <p className="text-slate-400">No data available for statistics yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            value: total,
            label: 'Total Reports',
            border: 'border-ocean-500/50',
            valueClass: 'text-ocean-300',
          },
          {
            value: urgencyStats.CRITICAL,
            label: 'Critical',
            border: 'border-coral-500/50',
            valueClass: 'text-coral-400',
          },
          {
            value: urgencyStats.MODERATE,
            label: 'Moderate',
            border: 'border-amber-500/50',
            valueClass: 'text-amber-400',
          },
          {
            value: statusStats.resolved,
            label: 'Resolved',
            border: 'border-emerald-500/50',
            valueClass: 'text-emerald-400',
          },
        ].map(({ value, label, border, valueClass }) => (
          <div
            key={label}
            className={`bg-white/5 backdrop-blur-xl border-2 ${border} rounded-2xl p-4 text-center`}
          >
            <div className={`text-3xl font-bold ${valueClass}`}>{value}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Urgency Distribution */}
      <div className={glassCard}>
        <h3 className={sectionHeading}>Urgency Distribution</h3>
        <div className="space-y-3.5">
          {[
            { label: 'Critical', count: urgencyStats.CRITICAL, bar: 'bg-coral-500', text: 'text-coral-400' },
            { label: 'Moderate', count: urgencyStats.MODERATE, bar: 'bg-amber-500', text: 'text-amber-400' },
            { label: 'Low', count: urgencyStats.LOW, bar: 'bg-emerald-500', text: 'text-emerald-400' },
            { label: 'Pending AI', count: urgencyStats.UNKNOWN, bar: 'bg-slate-500', text: 'text-slate-400' }
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
                <span className="text-sm text-slate-400">
                  {item.count} ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                </span>
              </div>
              <div className={barTrack}>
                <div
                  className={`${item.bar} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Distribution */}
      <div className={glassCard}>
        <h3 className={sectionHeading}>Response Status</h3>
        <div className="space-y-3.5">
          {[
            { label: 'Pending', count: statusStats.pending, bar: 'bg-slate-500', text: 'text-slate-400' },
            { label: 'In Progress', count: statusStats.in_progress, bar: 'bg-ocean-500', text: 'text-ocean-400' },
            { label: 'Resolved', count: statusStats.resolved, bar: 'bg-emerald-500', text: 'text-emerald-400' }
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className={`text-sm font-medium ${item.text}`}>{item.label}</span>
                <span className="text-sm text-slate-400">
                  {item.count} ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
                </span>
              </div>
              <div className={barTrack}>
                <div
                  className={`${item.bar} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Region Statistics */}
      {Object.keys(regionStats).length > 0 && (
        <div className={glassCard}>
          <h3 className={sectionHeading}>Submissions by Region</h3>
          <div className="space-y-3.5">
            {Object.entries(regionStats)
              .sort((a, b) => b[1] - a[1])
              .map(([region, count]) => (
                <div key={region}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-300">📍 {region}</span>
                    <span className="text-sm text-slate-400">
                      {count} ({total > 0 ? Math.round((count / total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className={barTrack}>
                    <div
                      className="bg-ocean-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Top Districts */}
      {topDistricts.length > 0 && (
        <div className={glassCard}>
          <h3 className={sectionHeading}>Top 5 Affected Districts</h3>
          <div className="space-y-2">
            {topDistricts.map(([district, count], index) => (
              <div key={district} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <span className="text-lg font-bold text-ocean-600 w-6 text-center">{index + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300">{district}</span>
                    <span className="text-sm text-ocean-400 font-semibold">{count} people</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time-based Trends (Last 24h) */}
      <div className={glassCard}>
        <h3 className={sectionHeading}>Submission Timeline (Last 24h)</h3>
        <div className="flex items-end justify-between gap-4 h-40">
          {timeBlocks.map(block => (
            <div key={block.label} className="flex-1 flex flex-col items-center justify-end gap-2">
              <div
                className="w-full bg-gradient-to-t from-ocean-600 to-ocean-400 rounded-t-xl transition-all hover:from-ocean-500 hover:to-ocean-300 relative group cursor-default"
                style={{ height: `${(block.count / maxTimeCount) * 100}%`, minHeight: block.count > 0 ? '20px' : '0' }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-white/10 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                  {block.count} submissions
                </div>
              </div>
              <div className="text-xs text-slate-500 text-center">{block.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
