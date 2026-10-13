import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateSubjectMetrics } from '../utils/calculations';
import type { Subject, SubjectType } from '../types';
import {
  Plus,
  BookOpen,
  FlaskConical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const SubjectList: React.FC = () => {
  const {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    markAttendance,
    loadSampleData,
    triggerCelebration,
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [adjustingSubject, setAdjustingSubject] = useState<Subject | null>(null);

  // Form state for creating / editing
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'theory' as SubjectType,
    targetPercentage: 75,
    attended: 0,
    total: 0,
  });

  // Form state for direct adjuster
  const [adjustData, setAdjustData] = useState({
    attended: 0,
    total: 0,
  });

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      type: 'theory',
      targetPercentage: 75,
      attended: 0,
      total: 0,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code || '',
      type: subject.type,
      targetPercentage: subject.targetPercentage,
      attended: subject.attended,
      total: subject.total,
    });
    setIsAddModalOpen(true);
  };

  const openAdjustModal = (subject: Subject) => {
    setAdjustingSubject(subject);
    setAdjustData({
      attended: subject.attended,
      total: subject.total,
    });
  };

  const handleTypeChange = (newType: SubjectType) => {
    const defaultTarget = newType === 'lab' ? 90 : 75;
    setFormData({
      ...formData,
      type: newType,
      targetPercentage: defaultTarget,
    });
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingSubject) {
      updateSubject({
        ...editingSubject,
        ...formData,
      });
    } else {
      addSubject({
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        type: formData.type,
        targetPercentage: formData.targetPercentage,
        attended: Number(formData.attended),
        total: Number(formData.total),
      });
    }

    setIsAddModalOpen(false);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingSubject) return;
    updateSubject({
      ...adjustingSubject,
      attended: Math.max(0, Number(adjustData.attended)),
      total: Math.max(Number(adjustData.attended), Number(adjustData.total)),
    });
    setAdjustingSubject(null);
  };

  const handleQuickAddAttendance = (subject: Subject, type: 'present' | 'absent') => {
    markAttendance(subject.id, type, 1);
    if (type === 'present') {
      triggerCelebration();
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Subject-Wise Attendance
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              {subjects.length} Subjects
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Track eligibility per course. Labs require 90% and Theory requires 75% target attendance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {subjects.length === 0 && (
            <button
              onClick={loadSampleData}
              className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Load Sample Subjects</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Subject</span>
          </button>
        </div>
      </div>

      {/* Subject Cards Grid */}
      {subjects.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-10 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400 dark:text-zinc-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-200">No subjects added yet</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              Add your theory courses and lab sessions to start tracking your individual attendance and bunk targets.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Subject</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(subject => {
            const metrics = calculateSubjectMetrics(subject);
            const isLab = subject.type === 'lab';

            return (
              <div
                key={subject.id}
                className="rounded-2xl bg-white dark:bg-zinc-900/70 p-5 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-4 group shadow-sm"
              >
                {/* Top Section */}
                <div className="space-y-3">
                  {/* Title & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-zinc-100 text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {subject.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {subject.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700/60">
                            {subject.code}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.2 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                            isLab
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {isLab ? <FlaskConical className="w-2.5 h-2.5" /> : <BookOpen className="w-2.5 h-2.5" />}
                          {subject.type}
                        </span>
                      </div>
                    </div>

                    {/* Percentage Display */}
                    <div className="text-right">
                      <div
                        className={`font-mono text-2xl font-extrabold tracking-tight ${
                          metrics.isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {metrics.percentage}%
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        Target: {subject.targetPercentage}%
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-zinc-800/80 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          metrics.isEligible ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, metrics.percentage)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                      <span>Attended: {subject.attended} / {subject.total}</span>
                      <span>Target: {subject.targetPercentage}%</span>
                    </div>
                  </div>

                  {/* Target Calculation Box (PRD feature 5 & 8) */}
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      metrics.isEligible
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-500/5 border-rose-500/20 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      {metrics.isEligible ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                          <span>Safe to Bunk</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                          <span>Attendance Shortage</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                      {metrics.isEligible ? (
                        <>
                          You can safely bunk <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{metrics.bunkableClasses}</strong>{' '}
                          {metrics.bunkableClasses === 1 ? 'class' : 'classes'} and remain above {subject.targetPercentage}%.
                        </>
                      ) : (
                        <>
                          You must attend the next <strong className="text-rose-600 dark:text-rose-400 font-mono">{metrics.classesNeeded}</strong>{' '}
                          consecutive {metrics.classesNeeded === 1 ? 'class' : 'classes'} to reach {subject.targetPercentage}%.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Bottom Controls: Quick +/- & Settings */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  {/* Quick Attendance Bump */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuickAddAttendance(subject, 'present')}
                      title="Quick mark +1 Present"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>+1 Attended</span>
                    </button>
                    <button
                      onClick={() => handleQuickAddAttendance(subject, 'absent')}
                      title="Quick mark +1 Missed"
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>+1 Missed</span>
                    </button>
                  </div>

                  {/* Actions: Adjust, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openAdjustModal(subject)}
                      title="Adjust initial numbers"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(subject)}
                      title="Edit subject details"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSubject(subject.id)}
                      title="Delete subject"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-500/20 dark:bg-zinc-800/80 dark:hover:bg-rose-500/20 text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs px-2 py-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Industrial Instrumentation"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Course Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. EE-501"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Subject Type selection */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Type of Course</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('theory')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      formData.type === 'theory'
                        ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40 font-bold'
                        : 'bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Theory (75% Goal)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('lab')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      formData.type === 'lab'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-bold'
                        : 'bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Lab (90% Goal)</span>
                  </button>
                </div>
              </div>

              {/* Custom Target percentage */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Target Attendance (%)</label>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formData.targetPercentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={formData.targetPercentage}
                  onChange={e => setFormData({ ...formData, targetPercentage: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Initial Numbers if new subject */}
              {!editingSubject && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Attended so far
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.attended}
                      onChange={e => setFormData({ ...formData, attended: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                      Total conducted
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.total}
                      onChange={e => setFormData({ ...formData, total: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors shadow-sm"
                >
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Counters Modal */}
      {adjustingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Adjust Attendance Numbers</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                For {adjustingSubject.name} (Directly calibrate portal records)
              </p>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Classes Attended</label>
                <input
                  type="number"
                  min="0"
                  value={adjustData.attended}
                  onChange={e => setAdjustData({ ...adjustData, attended: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Total Classes Conducted</label>
                <input
                  type="number"
                  min="0"
                  value={adjustData.total}
                  onChange={e => setAdjustData({ ...adjustData, total: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300">
                New percentage will be:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {adjustData.total > 0
                    ? `${Math.round(((adjustData.attended / adjustData.total) * 100) * 10) / 10}%`
                    : '100%'}
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAdjustingSubject(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
