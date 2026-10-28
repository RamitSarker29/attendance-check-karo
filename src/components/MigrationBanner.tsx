import React from 'react';
import { useApp } from '../context/AppContext';
import { CloudUpload, Check } from 'lucide-react';

export const MigrationBanner: React.FC = () => {
  const { migrationCandidate, importLocalMigration, dismissMigration, isDemoMode, isAuthenticated } = useApp();

  if (!isAuthenticated || isDemoMode || !migrationCandidate) {
    return null;
  }

  const subjectCount = migrationCandidate.subjects.length;
  const recordCount = migrationCandidate.attendanceRecords.length;
  const sampleNames = migrationCandidate.subjects.slice(0, 3).map(s => s.name).join(', ');

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 text-slate-800 dark:text-zinc-200 shadow-sm animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Import Local Device Data to Cloud?
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Found on this browser
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed">
              We detected <strong className="text-slate-800 dark:text-zinc-200">{subjectCount} subjects</strong> ({sampleNames}{subjectCount > 3 ? '...' : ''}) and <strong className="text-slate-800 dark:text-zinc-200">{recordCount} attendance records</strong> from an offline session. Import them so you can access them across all your devices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={dismissMigration}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            Keep Cloud Empty
          </button>
          <button
            onClick={importLocalMigration}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20 hover:scale-[1.02] active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Import to Cloud</span>
          </button>
        </div>
      </div>
    </div>
  );
};
