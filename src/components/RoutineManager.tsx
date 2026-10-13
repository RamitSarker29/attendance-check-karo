import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { DayOfWeek, RoutineSlot } from '../types';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const RoutineManager: React.FC = () => {
  const {
    routine,
    subjects,
    addRoutineSlot,
    updateRoutineSlot,
    deleteRoutineSlot,
    loadSampleData,
    setActiveTab,
  } = useApp();

  const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<RoutineSlot | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    day: 'Monday' as DayOfWeek,
    subjectId: '',
    startTime: '09:50',
    endTime: '10:40',
    classUnits: 1,
    room: '',
  });

  const [formError, setFormError] = useState('');

  const openAddModal = (day: DayOfWeek = activeDay) => {
    setEditingSlot(null);
    setFormData({
      day,
      subjectId: subjects[0]?.id || '',
      startTime: '09:50',
      endTime: '10:40',
      classUnits: 1,
      room: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (slot: RoutineSlot) => {
    setEditingSlot(slot);
    setFormData({
      day: slot.day,
      subjectId: slot.subjectId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      classUnits: slot.classUnits,
      room: slot.room || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId) {
      setFormError('Please select a subject or create one first.');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      setFormError('Please enter valid start and end times.');
      return;
    }

    if (editingSlot) {
      updateRoutineSlot({
        ...editingSlot,
        ...formData,
      });
    } else {
      addRoutineSlot(formData);
    }

    setIsModalOpen(false);
  };

  const slotsForActiveDay = routine
    .filter(slot => slot.day === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalClassesThisWeek = routine.reduce((sum, r) => sum + r.classUnits, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Weekly Routine & Timetable
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              {totalClassesThisWeek} Weekly Classes
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Configure your timetable slots and class durations. 1 class (50 min) = 1 attendance, 2 classes = 2 attendances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {routine.length === 0 && (
            <button
              onClick={loadSampleData}
              className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Load Sample Routine</span>
            </button>
          )}

          <button
            onClick={() => openAddModal(activeDay)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Class Slot</span>
          </button>
        </div>
      </div>

      {/* Days Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-zinc-800/80">
        {days.map(day => {
          const count = routine.filter(r => r.day === day).length;
          const isActive = activeDay === day;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-zinc-700 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span>{day}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Timetable List */}
      {slotsForActiveDay.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-10 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400 dark:text-zinc-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-800 dark:text-zinc-200">No classes listed for {activeDay}</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
              Add your lecture slots to track attendance automatically every {activeDay}.
            </p>
          </div>
          <button
            onClick={() => openAddModal(activeDay)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class to {activeDay}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {slotsForActiveDay.map((slot, index) => {
            const subject = subjects.find(s => s.id === slot.subjectId);
            return (
              <div
                key={slot.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all gap-4 group shadow-sm"
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Slot Order Number */}
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                    #{index + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                        {subject ? subject.name : 'Unknown Subject'}
                      </span>
                      {subject?.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                          {subject.code}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                          subject?.type === 'lab'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {subject?.type || 'theory'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400 flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {slot.classUnits} {slot.classUnits === 1 ? 'Class Unit (50m)' : 'Class Units (100m)'}
                      </span>
                      {slot.room && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                            <MapPin className="w-3.5 h-3.5" />
                            {slot.room}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => openEditModal(slot)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 transition-colors"
                    title="Edit slot"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteRoutineSlot(slot.id)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-500/20 dark:bg-zinc-800/80 dark:hover:bg-rose-500/20 text-slate-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Delete slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Routine Slot Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSlot ? 'Edit Routine Slot' : 'Add Class to Routine'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs px-2 py-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Day selection */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Day of the Week</label>
                <select
                  value={formData.day}
                  onChange={e => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  {days.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">Subject</label>
                  {subjects.length === 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setActiveTab('subjects');
                      }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      + Create Subject First
                    </button>
                  )}
                </div>
                {subjects.length > 0 ? (
                  <select
                    value={formData.subjectId}
                    onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ''} - {s.type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400">
                    No subjects exist yet. Please create a subject first in the Subjects tab.
                  </div>
                )}
              </div>

              {/* Timing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Class Units */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Class Units (Attendance Value)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(units => (
                    <button
                      type="button"
                      key={units}
                      onClick={() => setFormData({ ...formData, classUnits: units })}
                      className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                        formData.classUnits === units
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 font-bold'
                          : 'bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {units} {units === 1 ? 'Class (50m)' : `${units} Classes`}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-1">
                  Single lecture = 1 attendance unit, Double lecture (10:40-12:20) = 2 attendance units.
                </p>
              </div>

              {/* Room / Location */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Classroom / Lab Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 304, Hall B, Systems Lab"
                  value={formData.room}
                  onChange={e => setFormData({ ...formData, room: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subjects.length === 0}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {editingSlot ? 'Save Changes' : 'Add to Routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
