import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  simulateSelectiveClasses,
  calculateOverallMetrics,
  calculateSubjectMetrics,
  getDayName,
} from '../utils/calculations';
import type { DayOfWeek } from '../types';
import {
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Clock,
  MapPin,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export const LeaveSimulator: React.FC = () => {
  const { subjects, routine } = useApp();

  const tomorrowDayName = getDayName(1);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(tomorrowDayName);
  const [simulationMode, setSimulationMode] = useState<'day_classes' | 'single_subject'>('day_classes');

  // Class-level decisions state: { [slotId]: 'bunk' | 'attend' }
  const [slotDecisions, setSlotDecisions] = useState<Record<string, 'bunk' | 'attend'>>({});

  // Single subject simulation state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [simulateMissCount, setSimulateMissCount] = useState<number>(2);

  const daysList: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Current baseline
  const currentOverall = calculateOverallMetrics(subjects);

  // Slots for the currently chosen day
  const daySlots = routine
    .filter(slot => slot.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Build resolved decisions for current slots (defaulting to 'bunk' if not yet toggled)
  const resolvedDecisions: Record<string, 'bunk' | 'attend'> = {};
  daySlots.forEach(slot => {
    resolvedDecisions[slot.id] = slotDecisions[slot.id] || 'bunk';
  });

  const setSlotDecision = (slotId: string, decision: 'bunk' | 'attend') => {
    setSlotDecisions(prev => ({
      ...prev,
      [slotId]: decision,
    }));
  };

  // Preset shortcuts
  const applyPresetBunkAll = () => {
    const updated: Record<string, 'bunk' | 'attend'> = {};
    daySlots.forEach(s => (updated[s.id] = 'bunk'));
    setSlotDecisions(prev => ({ ...prev, ...updated }));
  };

  const applyPresetAttendAll = () => {
    const updated: Record<string, 'bunk' | 'attend'> = {};
    daySlots.forEach(s => (updated[s.id] = 'attend'));
    setSlotDecisions(prev => ({ ...prev, ...updated }));
  };

  const applyPresetBunkFirstTwo = () => {
    const updated: Record<string, 'bunk' | 'attend'> = {};
    daySlots.forEach((s, idx) => {
      updated[s.id] = idx < 2 ? 'bunk' : 'attend';
    });
    setSlotDecisions(prev => ({ ...prev, ...updated }));
  };

  // Selective simulation result
  const selectiveSimResult = simulateSelectiveClasses(
    selectedDay,
    subjects,
    routine,
    resolvedDecisions
  );

  // Single subject simulation calculation
  const targetSubject = subjects.find(s => s.id === selectedSubjectId);
  let singleSubjectSimulation = null;
  if (targetSubject) {
    const curMetrics = calculateSubjectMetrics(targetSubject);
    const newTotal = targetSubject.total + simulateMissCount;
    const newAttended = targetSubject.attended;
    const newPct = newTotal > 0 ? Math.round(((newAttended / newTotal) * 100) * 10) / 10 : 100;
    const isStillEligible = newPct >= targetSubject.targetPercentage;

    let recoveryNeeded = 0;
    if (newPct < targetSubject.targetPercentage) {
      const num = targetSubject.targetPercentage * newTotal - 100 * newAttended;
      const den = 100 - targetSubject.targetPercentage;
      recoveryNeeded = den > 0 ? Math.ceil(num / den) : 0;
    }

    const overallNewTotal = currentOverall.total + simulateMissCount;
    const overallNewPct = overallNewTotal > 0
      ? Math.round(((currentOverall.attended / overallNewTotal) * 100) * 10) / 10
      : 100;

    singleSubjectSimulation = {
      subject: targetSubject,
      currentPct: curMetrics.percentage,
      projectedPct: newPct,
      drop: Math.round((curMetrics.percentage - newPct) * 10) / 10,
      isStillEligible,
      recoveryNeeded,
      overallNewPct,
      overallDrop: Math.round((currentOverall.percentage - overallNewPct) * 10) / 10,
    };
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Predictive Bunk & Leave Simulator
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Class-Level Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Select which classes you plan to miss and attend (e.g. miss first 2, attend 3rd) to see real-time impact and recovery.
          </p>
        </div>

        {/* Mode selector pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200 dark:border-zinc-800">
          <button
            onClick={() => setSimulationMode('day_classes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              simulationMode === 'day_classes'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Day & Class Selector
          </button>
          <button
            onClick={() => setSimulationMode('single_subject')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              simulationMode === 'single_subject'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Single Subject Slider
          </button>
        </div>
      </div>

      {/* Mode 1: Day & Individual Class Selection Simulator */}
      {simulationMode === 'day_classes' && (
        <div className="space-y-6">
          {/* Day selection pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mr-1 shrink-0">
                Choose Day:
              </span>
              {daysList.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    selectedDay === day
                      ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  {day}
                  {day === tomorrowDayName && <span className="ml-1 text-[9px] font-bold opacity-80">(Tomorrow)</span>}
                </button>
              ))}
            </div>

            {/* Quick Presets for Current Day */}
            {daySlots.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={applyPresetBunkFirstTwo}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-[11px] font-medium border border-slate-200 dark:border-zinc-700/60 transition-colors flex items-center gap-1"
                  title="Plan to miss first 2 classes and attend remaining"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Miss First 2 Classes</span>
                </button>
                <button
                  onClick={applyPresetBunkAll}
                  className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-medium border border-rose-500/20 transition-colors"
                >
                  Miss All
                </button>
                <button
                  onClick={applyPresetAttendAll}
                  className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20 transition-colors"
                >
                  Attend All
                </button>
              </div>
            )}
          </div>

          {/* Interactive Classes on Chosen Day */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Schedule for {selectedDay}</span>
                  {selectedDay === tomorrowDayName && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Tomorrow
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Tap to decide for each lecture: Are you missing or attending?
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold">
                  Missing: {selectiveSimResult.classesBunked} units
                </span>
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                  Attending: {selectiveSimResult.classesAttended} units
                </span>
              </div>
            </div>

            {daySlots.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                No classes scheduled in your routine for {selectedDay}.
              </div>
            ) : (
              <div className="space-y-3">
                {daySlots.map((slot, index) => {
                  const subject = subjects.find(s => s.id === slot.subjectId);
                  const isBunking = (slotDecisions[slot.id] || 'bunk') === 'bunk';

                  return (
                    <div
                      key={slot.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 ${
                        isBunking
                          ? 'bg-rose-500/5 dark:bg-rose-500/5 border-rose-500/30'
                          : 'bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                            isBunking
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          #{index + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
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
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {subject?.type || 'theory'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-zinc-400 font-mono mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                              <Clock className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                              {slot.startTime} – {slot.endTime}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 dark:text-zinc-300">
                              {slot.classUnits} {slot.classUnits === 1 ? 'Class Unit' : 'Class Units'} ({slot.classUnits * 50}m)
                            </span>
                            {slot.room && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {slot.room}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Class Decision Toggle: Bunk vs Attend */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setSlotDecision(slot.id, 'bunk')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isBunking
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Plan to Miss</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSlotDecision(slot.id, 'attend')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            !isBunking
                              ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Plan to Attend</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SIMULATED OUTCOME HERO CARDS */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-6 space-y-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Projected Attendance Outcome
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Overall Impact for {selectedDay}
                </h3>
              </div>

              {/* Overall Delta Projection Card */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold">Current</div>
                  <div className="text-lg font-mono font-bold text-slate-800 dark:text-zinc-300">
                    {selectiveSimResult.currentOverallPct}%
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-zinc-600 shrink-0" />

                <div className="text-center">
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold">After Scenario</div>
                  <div
                    className={`text-lg font-mono font-bold ${
                      selectiveSimResult.projectedOverallPct >= 75
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {selectiveSimResult.projectedOverallPct}%
                  </div>
                </div>

                <div className="text-center pl-2 border-l border-slate-200 dark:border-zinc-800">
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-semibold">Net Delta</div>
                  <div
                    className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                      selectiveSimResult.overallDelta >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {selectiveSimResult.overallDelta >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {selectiveSimResult.overallDelta >= 0 ? `+${selectiveSimResult.overallDelta}` : selectiveSimResult.overallDelta}%
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIONABLE STRATEGY & PRESCRIPTION BANNER */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                selectiveSimResult.overallStatus === 'safe'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {selectiveSimResult.overallStatus === 'safe' ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      Overall Verdict: Safe to take this plan
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                    <span className="text-sm font-bold text-rose-800 dark:text-rose-300">
                      Overall Verdict: Debarment / Shortage Risk!
                    </span>
                  </>
                )}
              </div>

              <div className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed pl-7">
                {selectiveSimResult.overallStatus === 'safe' ? (
                  <p>
                    By missing <strong className="font-mono text-slate-900 dark:text-white">{selectiveSimResult.classesBunked}</strong> classes and attending{' '}
                    <strong className="font-mono text-slate-900 dark:text-white">{selectiveSimResult.classesAttended}</strong> classes on {selectedDay}, your overall attendance will be{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{selectiveSimResult.projectedOverallPct}%</strong>. You still have{' '}
                    <strong className="font-mono text-slate-900 dark:text-white">{selectiveSimResult.overallBunkableClasses}</strong> buffer classes remaining before hitting the 75% barrier.
                  </p>
                ) : (
                  <p>
                    This scenario drops your overall attendance to{' '}
                    <strong className="text-rose-600 dark:text-rose-300 font-mono">{selectiveSimResult.projectedOverallPct}%</strong> (under the mandatory 75% threshold).
                    <br />
                    <strong className="text-slate-900 dark:text-white underline">How to manage:</strong> You must attend your next{' '}
                    <strong className="text-rose-600 dark:text-rose-400 font-mono text-sm">{selectiveSimResult.overallRecoveryClassesNeeded}</strong> consecutive classes without missing any to restore eligibility.
                  </p>
                )}
              </div>
            </div>

            {/* Course-by-Course Impact Breakdown */}
            {selectiveSimResult.subjectsAffected.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                  Course-by-Course Impact for {selectedDay}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {selectiveSimResult.subjectsAffected.map(item => (
                    <div
                      key={item.subject.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{item.subject.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                            Plan: {item.unitsBunked} Missed • {item.unitsAttended} Attended (Goal: {item.subject.targetPercentage}%)
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.isEligible
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.isEligible ? 'Stays Eligible' : 'Shortage Alert!'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800/80">
                        <div>
                          <span className="text-slate-400 dark:text-zinc-500 text-[10px] block">Current</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-zinc-300">{item.currentPct}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-zinc-500 text-[10px] block">Projected</span>
                          <span
                            className={`font-mono font-bold ${item.isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                          >
                            {item.projectedPct}%
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px]">
                        {item.isEligible ? (
                          <span className="text-emerald-600 dark:text-emerald-400/90 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            Remaining safe cushion: {item.bunkableClasses} classes.
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400/90 flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            Recovery needed: Attend next{' '}
                            <strong className="text-slate-900 dark:text-white font-mono">{item.classesNeededToRecover}</strong> classes.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Single Subject Slider Simulator */}
      {simulationMode === 'single_subject' && singleSubjectSimulation && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 p-6 space-y-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Select Subject to Test
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.attended}/{s.total} • Current: {calculateSubjectMetrics(s).percentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Hypothetical Classes to Miss
                  </label>
                  <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {simulateMissCount} {simulateMissCount === 1 ? 'Class' : 'Classes'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={simulateMissCount}
                  onChange={e => setSimulateMissCount(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-1">
                  <span>1 Class</span>
                  <span>5 Classes</span>
                  <span>10 Classes</span>
                  <span>15 Classes</span>
                </div>
              </div>
            </div>

            {/* Projected Impact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">Subject Projected %</span>
                <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                  {singleSubjectSimulation.projectedPct}%
                </div>
                <span className="text-[10px] text-rose-500 dark:text-rose-400 font-mono block">
                  Drops by {singleSubjectSimulation.drop}%
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">Overall Attendance</span>
                <div className="text-2xl font-mono font-bold text-slate-800 dark:text-zinc-200">
                  {singleSubjectSimulation.overallNewPct}%
                </div>
                <span className="text-[10px] text-rose-500 dark:text-rose-400 font-mono block">
                  Overall drops by {singleSubjectSimulation.overallDrop}%
                </span>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-1 ${
                  singleSubjectSimulation.isStillEligible
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-rose-500/10 border-rose-500/20'
                }`}
              >
                <span className="text-[11px] text-slate-600 dark:text-zinc-400">Recovery Classes Needed</span>
                <div
                  className={`text-2xl font-mono font-bold ${
                    singleSubjectSimulation.isStillEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {singleSubjectSimulation.recoveryNeeded}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">
                  {singleSubjectSimulation.isStillEligible
                    ? 'Still safe above target!'
                    : 'Consecutive classes required'}
                </span>
              </div>
            </div>

            {/* Strategic Advice */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 space-y-1">
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Recommendation & Leave Strategy:</span>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-zinc-400">
                If you miss {simulateMissCount} classes of{' '}
                <strong className="text-slate-900 dark:text-white">{singleSubjectSimulation.subject.name}</strong>, you will need to attend{' '}
                <strong className="text-slate-900 dark:text-white font-mono">{singleSubjectSimulation.recoveryNeeded}</strong> classes
                in a row to restore your required {singleSubjectSimulation.subject.targetPercentage}% attendance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
