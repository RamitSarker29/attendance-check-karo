import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateOverallMetrics,
  calculateSubjectMetrics,
  getDayName,
  getTodayDateString,
} from '../utils/calculations';
import type { DayOfWeek, AttendanceStatus } from '../types';
import {
  CheckCircle2,
  XCircle,
  Ban,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  ArrowRight,
  BookOpen,
  FlaskConical,
  Clock,
  MapPin,
  Check,
  PlusCircle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    subjects,
    routine,
    markAttendance,
    setActiveTab,
    loadSampleData,
    triggerCelebration,
  } = useApp();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => getDayName(0));
  const [markedFeedback, setMarkedFeedback] = useState<string | null>(null);

  const overallMetrics = calculateOverallMetrics(subjects, 75);
  const todayActualDay = getDayName(0);

  // Group routine slots for selected day, sorted by start time
  const daySlots = routine
    .filter(slot => slot.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Compute theory vs lab stats
  const theorySubjects = subjects.filter(s => s.type === 'theory');
  const labSubjects = subjects.filter(s => s.type === 'lab');

  const theoryAttended = theorySubjects.reduce((sum, s) => sum + s.attended, 0);
  const theoryTotal = theorySubjects.reduce((sum, s) => sum + s.total, 0);
  const theoryPct = theoryTotal > 0 ? Math.round(((theoryAttended / theoryTotal) * 100) * 10) / 10 : 100;

  const labAttended = labSubjects.reduce((sum, s) => sum + s.attended, 0);
  const labTotal = labSubjects.reduce((sum, s) => sum + s.total, 0);
  const labPct = labTotal > 0 ? Math.round(((labAttended / labTotal) * 100) * 10) / 10 : 100;

  const handleQuickMark = (
    subjectId: string,
    status: AttendanceStatus,
    units: number,
    slotId: string,
    subjectName: string
  ) => {
    markAttendance(subjectId, status, units, slotId, getTodayDateString());
    if (status === 'present') {
      triggerCelebration();
      setMarkedFeedback(`Marked +${units} Attended for ${subjectName}!`);
    } else if (status === 'absent') {
      setMarkedFeedback(`Marked ${units} Missed for ${subjectName}.`);
    } else {
      setMarkedFeedback(`Class marked Cancelled (no attendance change).`);
    }
    setTimeout(() => setMarkedFeedback(null), 3000);
  };

  const daysList: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Status colors & icons
  const getStatusDisplay = (metrics: typeof overallMetrics) => {
    if (metrics.status === 'safe') {
      return {
        color: 'emerald',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        ringClass: 'stroke-emerald-500 dark:stroke-emerald-400',
        title: 'Safe to Bunk',
        icon: ShieldCheck,
      };
    } else if (metrics.status === 'warning') {
      return {
        color: 'amber',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        ringClass: 'stroke-amber-500 dark:stroke-amber-400',
        title: 'On the Edge',
        icon: AlertTriangle,
      };
    } else {
      return {
        color: 'rose',
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        ringClass: 'stroke-rose-500 dark:stroke-rose-400',
        title: 'Attendance Shortage',
        icon: AlertTriangle,
      };
    }
  };

  const statusConfig = getStatusDisplay(overallMetrics);
  const StatusIcon = statusConfig.icon;

  // SVG circular calculations
  const strokeDashoffset = 283 - (283 * Math.min(100, overallMetrics.percentage)) / 100;

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {markedFeedback && (
        <div className="fixed top-20 right-4 z-50 bg-white dark:bg-zinc-900 border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>{markedFeedback}</span>
        </div>
      )}

      {/* Main Hero Card: Overall Attendance & Target Intelligence */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gradient-to-b dark:from-zinc-900/90 dark:to-zinc-950 p-6 sm:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-xl transition-colors">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          {/* Circular Gauge */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-slate-200 dark:stroke-zinc-800/80"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className={`${statusConfig.ringClass} transition-all duration-1000 ease-out`}
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {overallMetrics.percentage}%
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Overall
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusConfig.title}
                </span>
                <span className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700/50">
                  Target: 75%
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {overallMetrics.status === 'safe'
                  ? 'Your attendance is secure!'
                  : overallMetrics.status === 'warning'
                  ? 'Attendance right at the threshold!'
                  : 'Action required: attendance low!'}
              </h2>

              <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md">
                Attended <strong className="text-slate-900 dark:text-zinc-200">{overallMetrics.attended}</strong> out of{' '}
                <strong className="text-slate-900 dark:text-zinc-200">{overallMetrics.total}</strong> total class units conducted this semester.
              </p>
            </div>
          </div>

          {/* Right Banner: Real-Time Target Calculation Card (PRD item 5) */}
          <div className="w-full lg:w-auto min-w-[280px] bg-slate-50 dark:bg-zinc-900/80 p-5 rounded-xl border border-slate-200 dark:border-zinc-800/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Real-time Target Intelligence
              </span>
            </div>

            {overallMetrics.isEligible ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Safe Bunk Cushion</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {overallMetrics.bunkableClasses} {overallMetrics.bunkableClasses === 1 ? 'Class' : 'Classes'}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
                  You can safely miss up to {overallMetrics.bunkableClasses} classes and still maintain &ge; 75%.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <div className="text-xs text-rose-700 dark:text-rose-300 font-medium">Consecutive Classes Required</div>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                  {overallMetrics.classesNeeded} {overallMetrics.classesNeeded === 1 ? 'Class' : 'Classes'}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
                  Attend the next {overallMetrics.classesNeeded} consecutive classes without missing to reach 75%.
                </p>
              </div>
            )}

            <button
              onClick={() => setActiveTab('simulator')}
              className="w-full py-2 px-3 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700/80 text-slate-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-zinc-700 shadow-sm"
            >
              <span>Simulate Tomorrow's Leave</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Theory vs Lab Category Badges */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">Theory Subjects (Goal: 75%)</div>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-200 font-mono">
                  {theoryPct}% <span className="text-xs font-normal text-slate-500 dark:text-zinc-500">({theoryAttended}/{theoryTotal})</span>
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theoryPct >= 75 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              {theoryPct >= 75 ? 'Eligible' : 'Shortage'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">Lab Classes (Goal: 90%)</div>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-200 font-mono">
                  {labPct}% <span className="text-xs font-normal text-slate-500 dark:text-zinc-500">({labAttended}/{labTotal})</span>
                </div>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${labPct >= 90 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
              {labPct >= 90 ? 'Eligible' : 'Shortage'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">Total Subjects Tracked</div>
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-200 font-mono">
                  {subjects.length} Courses
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('subjects')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <span>View details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Today's Schedule & 1-Tap Attendance Marker (Core PRD Features 2, 3, 6) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Today's Class Schedule</h3>
              {selectedDay === todayActualDay && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Live Today
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Tap Present, Missed, or Cancelled to instantly update your attendance.
            </p>
          </div>

          {/* Day selection pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {daysList.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  selectedDay === day
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800'
                }`}
              >
                {day.substring(0, 3)}
                {day === todayActualDay && <span className="ml-1 text-[9px] opacity-80">•</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule Slots List */}
        {daySlots.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto text-slate-400 dark:text-zinc-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No classes scheduled on {selectedDay}</div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
                You have free time or haven't added timetable slots for this day yet.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('routine')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Class to Routine</span>
              </button>
              {routine.length === 0 && (
                <button
                  onClick={loadSampleData}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-700"
                >
                  Load PRD Sample College Routine
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {daySlots.map(slot => {
              const subject = subjects.find(s => s.id === slot.subjectId);
              if (!subject) return null;
              const subMetrics = calculateSubjectMetrics(subject);

              return (
                <div
                  key={slot.id}
                  className="rounded-xl bg-white dark:bg-zinc-900/70 p-4 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all space-y-3 group shadow-sm"
                >
                  {/* Slot Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {subject.name}
                        </span>
                        {subject.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700/60">
                            {subject.code}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-zinc-300">
                          <Clock className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="text-slate-300 dark:text-zinc-600">•</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400/90">
                          {slot.classUnits} {slot.classUnits === 1 ? 'Class' : 'Classes'} ({slot.classUnits * 50} mins)
                        </span>
                        {slot.room && (
                          <>
                            <span className="text-slate-300 dark:text-zinc-600">•</span>
                            <span className="flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                              <MapPin className="w-3 h-3" />
                              {slot.room}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Subject Attendance pill */}
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-200">
                        {subMetrics.percentage}%
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        {subject.attended}/{subject.total}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Attended, Missed, Cancelled */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                    <button
                      onClick={() =>
                        handleQuickMark(subject.id, 'present', slot.classUnits, slot.id, subject.name)
                      }
                      title={`Mark as Present (+${slot.classUnits} attendance)`}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Attended</span>
                    </button>

                    <button
                      onClick={() =>
                        handleQuickMark(subject.id, 'absent', slot.classUnits, slot.id, subject.name)
                      }
                      title={`Mark as Missed/Absent`}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Missed</span>
                    </button>

                    <button
                      onClick={() =>
                        handleQuickMark(subject.id, 'cancelled', slot.classUnits, slot.id, subject.name)
                      }
                      title="Class was cancelled by professor - does not affect attendance"
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700/60 text-xs font-medium transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <Ban className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                      <span>Cancelled</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subject Quick Overview Strip */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Subject Attendance Status</h3>
          <button
            onClick={() => setActiveTab('subjects')}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            <span>Manage All Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map(subject => {
            const metrics = calculateSubjectMetrics(subject);
            return (
              <div
                key={subject.id}
                onClick={() => setActiveTab('subjects')}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 cursor-pointer transition-all space-y-2 group shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                      {subject.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                      Target: {subject.targetPercentage}% • {subject.type.toUpperCase()}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {metrics.percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metrics.isEligible ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, metrics.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <span className="text-slate-500 dark:text-zinc-400 font-mono">
                    {subject.attended}/{subject.total} classes
                  </span>
                  {metrics.isEligible ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Bunkable: {metrics.bunkableClasses}
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">
                      Need {metrics.classesNeeded} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
