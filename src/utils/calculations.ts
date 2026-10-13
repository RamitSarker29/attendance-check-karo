import type {
  Subject,
  AttendanceMetrics,
  RoutineSlot,
  DaySimulationResult,
  SelectiveSimulationResult,
  DayOfWeek,
} from '../types';

/**
 * Calculates attendance metrics for a single subject.
 */
export function calculateSubjectMetrics(subject: Subject): AttendanceMetrics {
  const { attended, total, targetPercentage } = subject;

  if (total === 0) {
    return {
      percentage: 100,
      attended: 0,
      total: 0,
      target: targetPercentage,
      isEligible: true,
      status: 'safe',
      classesNeeded: 0,
      bunkableClasses: 0,
    };
  }

  const rawPercentage = (attended / total) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;
  const isEligible = percentage >= targetPercentage;

  let classesNeeded = 0;
  let bunkableClasses = 0;

  if (rawPercentage < targetPercentage) {
    // Under desired target: calculate consecutive attendances required
    // (A + x) / (T + x) >= target/100
    // x >= (target * T - 100 * A) / (100 - target)
    const numerator = targetPercentage * total - 100 * attended;
    const denominator = 100 - targetPercentage;
    classesNeeded = denominator > 0 ? Math.ceil(numerator / denominator) : 0;
    if (classesNeeded < 0) classesNeeded = 0;
  } else {
    // Above or equal to desired target: calculate classes can safely bunk
    // A / (T + y) >= target/100
    // y <= (100 * A / target) - T
    const maxTotalAllowed = (100 * attended) / targetPercentage;
    bunkableClasses = Math.floor(maxTotalAllowed - total);
    if (bunkableClasses < 0) bunkableClasses = 0;
  }

  let status: 'safe' | 'warning' | 'shortage' = 'safe';
  if (!isEligible) {
    status = 'shortage';
  } else if (bunkableClasses === 0) {
    status = 'warning'; // On the border! 1 bunk will put in shortage
  } else {
    status = 'safe';
  }

  return {
    percentage,
    attended,
    total,
    target: targetPercentage,
    isEligible,
    status,
    classesNeeded,
    bunkableClasses,
  };
}

/**
 * Calculates aggregate overall attendance across all subjects.
 */
export function calculateOverallMetrics(subjects: Subject[], defaultTarget: number = 75): AttendanceMetrics {
  if (subjects.length === 0) {
    return {
      percentage: 100,
      attended: 0,
      total: 0,
      target: defaultTarget,
      isEligible: true,
      status: 'safe',
      classesNeeded: 0,
      bunkableClasses: 0,
    };
  }

  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
  const totalConducted = subjects.reduce((sum, s) => sum + s.total, 0);

  const effectiveTarget = defaultTarget;

  if (totalConducted === 0) {
    return {
      percentage: 100,
      attended: 0,
      total: 0,
      target: effectiveTarget,
      isEligible: true,
      status: 'safe',
      classesNeeded: 0,
      bunkableClasses: 0,
    };
  }

  const rawPercentage = (totalAttended / totalConducted) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;
  const isEligible = percentage >= effectiveTarget;

  let classesNeeded = 0;
  let bunkableClasses = 0;

  if (rawPercentage < effectiveTarget) {
    const numerator = effectiveTarget * totalConducted - 100 * totalAttended;
    const denominator = 100 - effectiveTarget;
    classesNeeded = denominator > 0 ? Math.ceil(numerator / denominator) : 0;
    if (classesNeeded < 0) classesNeeded = 0;
  } else {
    const maxTotalAllowed = (100 * totalAttended) / effectiveTarget;
    bunkableClasses = Math.floor(maxTotalAllowed - totalConducted);
    if (bunkableClasses < 0) bunkableClasses = 0;
  }

  let status: 'safe' | 'warning' | 'shortage' = 'safe';
  if (!isEligible) {
    status = 'shortage';
  } else if (bunkableClasses === 0) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  return {
    percentage,
    attended: totalAttended,
    total: totalConducted,
    target: effectiveTarget,
    isEligible,
    status,
    classesNeeded,
    bunkableClasses,
  };
}

/**
 * Predicts the impact if the user misses all classes scheduled on a specific day.
 */
export function simulateDayAbsence(
  day: DayOfWeek,
  subjects: Subject[],
  routine: RoutineSlot[]
): DaySimulationResult {
  const currentOverall = calculateOverallMetrics(subjects);

  const slotsOnDay = routine.filter(slot => slot.day === day);
  const totalClassesOnDay = slotsOnDay.reduce((acc, slot) => acc + slot.classUnits, 0);

  const subjectMissMap = new Map<string, number>();
  slotsOnDay.forEach(slot => {
    const current = subjectMissMap.get(slot.subjectId) || 0;
    subjectMissMap.set(slot.subjectId, current + slot.classUnits);
  });

  const subjectsAffected: DaySimulationResult['subjectsAffected'] = [];

  subjects.forEach(subject => {
    const missedUnits = subjectMissMap.get(subject.id) || 0;
    if (missedUnits > 0) {
      const currentMetrics = calculateSubjectMetrics(subject);
      
      const simulatedSubject: Subject = {
        ...subject,
        attended: subject.attended,
        total: subject.total + missedUnits,
      };
      const projectedMetrics = calculateSubjectMetrics(simulatedSubject);

      let statusChange: 'remains_safe' | 'safe_to_shortage' | 'shortage_worse' = 'remains_safe';
      if (currentMetrics.isEligible && !projectedMetrics.isEligible) {
        statusChange = 'safe_to_shortage';
      } else if (!currentMetrics.isEligible) {
        statusChange = 'shortage_worse';
      }

      subjectsAffected.push({
        subject,
        currentPct: currentMetrics.percentage,
        projectedPct: projectedMetrics.percentage,
        classesMissed: missedUnits,
        classesNeededToRecover: projectedMetrics.classesNeeded,
        statusChange,
      });
    }
  });

  const projectedAttended = currentOverall.attended;
  const projectedTotal = currentOverall.total + totalClassesOnDay;
  const projectedOverallPct = projectedTotal > 0
    ? Math.round(((projectedAttended / projectedTotal) * 100) * 10) / 10
    : 100;

  let overallRecoveryClassesNeeded = 0;
  if (projectedOverallPct < currentOverall.target) {
    const num = currentOverall.target * projectedTotal - 100 * projectedAttended;
    const den = 100 - currentOverall.target;
    overallRecoveryClassesNeeded = den > 0 ? Math.ceil(num / den) : 0;
  }

  return {
    dayName: day,
    classesScheduled: totalClassesOnDay,
    subjectsAffected,
    currentOverallPct: currentOverall.percentage,
    projectedOverallPct,
    overallRecoveryClassesNeeded,
  };
}

/**
 * Predicts the impact of selective class bunking / attending on a specific day.
 * Allows user to choose: "I want to miss tomorrow's first 2 classes, but attend the 3rd one".
 */
export function simulateSelectiveClasses(
  day: DayOfWeek,
  subjects: Subject[],
  routine: RoutineSlot[],
  slotDecisions: Record<string, 'bunk' | 'attend'>
): SelectiveSimulationResult {
  const currentOverall = calculateOverallMetrics(subjects);

  const slotsOnDay = routine
    .filter(slot => slot.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalClassesOnDay = slotsOnDay.reduce((acc, slot) => acc + slot.classUnits, 0);

  let classesBunked = 0;
  let classesAttended = 0;

  // Track per subject: { bunked: number, attended: number }
  const subjectChangeMap = new Map<string, { bunked: number; attended: number }>();

  slotsOnDay.forEach(slot => {
    const decision = slotDecisions[slot.id] || 'bunk';
    const existing = subjectChangeMap.get(slot.subjectId) || { bunked: 0, attended: 0 };
    if (decision === 'bunk') {
      classesBunked += slot.classUnits;
      existing.bunked += slot.classUnits;
    } else {
      classesAttended += slot.classUnits;
      existing.attended += slot.classUnits;
    }
    subjectChangeMap.set(slot.subjectId, existing);
  });

  const subjectsAffected: SelectiveSimulationResult['subjectsAffected'] = [];

  subjects.forEach(subject => {
    const changes = subjectChangeMap.get(subject.id);
    if (changes && (changes.bunked > 0 || changes.attended > 0)) {
      const currentMetrics = calculateSubjectMetrics(subject);
      const simulatedSubject: Subject = {
        ...subject,
        attended: subject.attended + changes.attended,
        total: subject.total + changes.bunked + changes.attended,
      };
      const projectedMetrics = calculateSubjectMetrics(simulatedSubject);

      let statusChange: 'remains_safe' | 'safe_to_shortage' | 'shortage_worse' | 'improved' = 'remains_safe';
      if (currentMetrics.isEligible && !projectedMetrics.isEligible) {
        statusChange = 'safe_to_shortage';
      } else if (!currentMetrics.isEligible && !projectedMetrics.isEligible) {
        statusChange = 'shortage_worse';
      } else if (!currentMetrics.isEligible && projectedMetrics.isEligible) {
        statusChange = 'improved';
      }

      subjectsAffected.push({
        subject,
        currentPct: currentMetrics.percentage,
        projectedPct: projectedMetrics.percentage,
        unitsBunked: changes.bunked,
        unitsAttended: changes.attended,
        classesNeededToRecover: projectedMetrics.classesNeeded,
        bunkableClasses: projectedMetrics.bunkableClasses,
        isEligible: projectedMetrics.isEligible,
        statusChange,
      });
    }
  });

  // Calculate projected overall
  const projectedAttended = currentOverall.attended + classesAttended;
  const projectedTotal = currentOverall.total + classesBunked + classesAttended;
  const projectedOverallPct = projectedTotal > 0
    ? Math.round(((projectedAttended / projectedTotal) * 100) * 10) / 10
    : 100;

  const overallDelta = Math.round((projectedOverallPct - currentOverall.percentage) * 10) / 10;

  let overallRecoveryClassesNeeded = 0;
  let overallBunkableClasses = 0;
  let overallStatus: 'safe' | 'warning' | 'shortage' = 'safe';

  if (projectedOverallPct < currentOverall.target) {
    const num = currentOverall.target * projectedTotal - 100 * projectedAttended;
    const den = 100 - currentOverall.target;
    overallRecoveryClassesNeeded = den > 0 ? Math.ceil(num / den) : 0;
    overallStatus = 'shortage';
  } else {
    const maxTotalAllowed = (100 * projectedAttended) / currentOverall.target;
    overallBunkableClasses = Math.floor(maxTotalAllowed - projectedTotal);
    if (overallBunkableClasses < 0) overallBunkableClasses = 0;
    overallStatus = overallBunkableClasses === 0 ? 'warning' : 'safe';
  }

  return {
    dayName: day,
    totalClassesOnDay,
    classesBunked,
    classesAttended,
    currentOverallPct: currentOverall.percentage,
    projectedOverallPct,
    overallDelta,
    overallRecoveryClassesNeeded,
    overallBunkableClasses,
    overallStatus,
    subjectsAffected,
  };
}

/**
 * Helper to get day name string for today or tomorrow.
 */
export function getDayName(offsetDays: number = 0): DayOfWeek {
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  const targetIndex = (todayIndex + offsetDays + 7) % 7;
  return days[targetIndex];
}

/**
 * Format date in YYYY-MM-DD
 */
export function getTodayDateString(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}
