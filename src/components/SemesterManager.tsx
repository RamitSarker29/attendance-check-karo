import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Archive,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';

export const SemesterManager: React.FC = () => {
  const {
    semesterArchives,
    archiveCurrentSemester,
    resetCurrentRoutineAndAttendance,
    deleteArchive,
    exportDataJson,
    importDataJson,
    loadSampleData,
  } = useApp();

  const [semesterName, setSemesterName] = useState('Semester 5 (Fall 2026)');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterName.trim()) return;
    archiveCurrentSemester(semesterName.trim());
    setIsArchiveModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJson(content);
        if (success) {
          setImportStatus('Backup restored successfully!');
        } else {
          setImportStatus('Invalid JSON backup file.');
        }
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Semester Management & Data Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Archive finished semesters, start fresh with new routines, or export local offline backups.
        </p>
      </div>

      {importStatus && (
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Semester Transition Section (PRD Feature 10) */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Semester Transition & Reset</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xl">
              When a semester ends, you can archive your current attendance records and clear the timetable to add your new semester's routine.
            </p>
          </div>

          <button
            onClick={() => setIsArchiveModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm shadow-emerald-500/20"
          >
            <Archive className="w-4 h-4 stroke-[2.5]" />
            <span>Archive & Start New Semester</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium border border-slate-200 dark:border-zinc-700/60 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Routine & Timetable Only</span>
          </button>

          <button
            onClick={loadSampleData}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-medium border border-slate-200 dark:border-zinc-700/60 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Reload Sample College Routine</span>
          </button>
        </div>
      </div>

      {/* Offline Storage, Backup & Export */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Offline Data Storage & Backup</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xl">
          Attendance Check karo is completely local-first. All your routines, attendance logs, and subject preferences are safely stored on your device and work 100% offline without internet.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={exportDataJson}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2 border border-slate-200 dark:border-zinc-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>Export Backup (JSON)</span>
          </button>

          <label className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-2 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer shadow-sm">
            <Upload className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>Restore Backup (JSON)</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Archived Semesters List */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Past Archived Semesters ({semesterArchives.length})</span>
        </h3>

        {semesterArchives.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-500 dark:text-zinc-400 shadow-sm">
            No past semesters archived yet. When you archive your current semester at exam time, your final attendance records will be permanently saved here.
          </div>
        ) : (
          <div className="space-y-3">
            {semesterArchives.map(archive => (
              <div
                key={archive.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{archive.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                      Archived: {archive.archivedAt}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                    Final Attendance: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{archive.overallPercentage}%</strong>{' '}
                    ({archive.totalAttended} of {archive.totalConducted} classes) across {archive.subjects.length} courses.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      archive.overallPercentage >= 75
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {archive.overallPercentage >= 75 ? 'Qualified (Safe)' : 'Shortage'}
                  </span>
                  <button
                    onClick={() => deleteArchive(archive.id)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-500/20 dark:bg-zinc-800 dark:hover:bg-rose-500/20 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors"
                    title="Delete archived record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archive Modal */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Archive Current Semester</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Save your final attendance scores to history and reset timetable for your upcoming semester.
              </p>
            </div>

            <form onSubmit={handleArchive} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Semester Title</label>
                <input
                  type="text"
                  placeholder="e.g. Semester 4 - Spring 2026"
                  value={semesterName}
                  onChange={e => setSemesterName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                This will save your current attendance statistics to the Past Archives list and clear your routine so you can register your new timetable.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm"
                >
                  Archive & Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Timetable?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              This will remove all current routine slots and reset class attendance counters to 0. Are you sure you want to proceed?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetCurrentRoutineAndAttendance();
                  setIsResetConfirmOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-sm"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
