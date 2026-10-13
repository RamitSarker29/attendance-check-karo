import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  History,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Ban,
  Calendar,
  Filter,
} from 'lucide-react';

export const HistoryLog: React.FC = () => {
  const { attendanceRecords, subjects, undoAttendanceRecord } = useApp();
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  const filteredRecords = attendanceRecords.filter(r => {
    if (selectedSubjectFilter !== 'all' && r.subjectId !== selectedSubjectFilter) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return {
          label: 'Attended (Present)',
          icon: CheckCircle2,
          className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'absent':
        return {
          label: 'Missed (Absent)',
          icon: XCircle,
          className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'cancelled':
      default:
        return {
          label: 'Cancelled (Neutral)',
          icon: Ban,
          className: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700',
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Attendance Logs & History
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              {attendanceRecords.length} Entries
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Audit marked lectures. Tap Undo to revert any accidental mark immediately.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
          <select
            value={selectedSubjectFilter}
            onChange={e => setSelectedSubjectFilter(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Items */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-10 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400 dark:text-zinc-400">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-200">No attendance records yet</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              Whenever you mark a class as Attended, Missed, or Cancelled from the Dashboard, it will be catalogued here with instant undo capability.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRecords.map(record => {
            const subject = subjects.find(s => s.id === record.subjectId);
            const statusConfig = getStatusBadge(record.status);
            const StatusIcon = statusConfig.icon;
            const timeFormatted = new Date(record.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={record.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${statusConfig.className}`}
                  >
                    <StatusIcon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm">
                        {subject ? subject.name : 'Archived Subject'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                        +{record.units} {record.units === 1 ? 'class unit' : 'class units'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                        {record.date}
                      </span>
                      <span>•</span>
                      <span>{timeFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Undo Button */}
                <button
                  onClick={() => undoAttendanceRecord(record.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-zinc-700/60 shrink-0"
                  title="Undo and revert attendance counts"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                  <span className="hidden sm:inline">Undo</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
