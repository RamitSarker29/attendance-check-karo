export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type SubjectType = 'theory' | 'lab' | 'tutorial';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  type: SubjectType;
  targetPercentage: number; // default 75 for theory, 90 for lab
  attended: number; // units attended
  total: number; // total units conducted
  color?: string; // hex or tailwind color
}

export interface RoutineSlot {
  id: string;
  day: DayOfWeek;
  subjectId: string;
  startTime: string; // e.g. "09:50"
  endTime: string; // e.g. "10:40"
  classUnits: number; // e.g. 1 class, or 2 classes for double slot
  room?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'cancelled';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  slotId?: string;
  subjectId: string;
  status: AttendanceStatus;
  units: number;
  timestamp: number;
  note?: string;
}

export interface SemesterArchive {
  id: string;
  name: string;
  archivedAt: string;
  overallPercentage: number;
  totalAttended: number;
  totalConducted: number;
  subjects: Subject[];
  routine: RoutineSlot[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  college?: string;
  semesterName: string;
  isDemo?: boolean;
}

export interface UserWorkspaceData {
  user: UserProfile;
  subjects: Subject[];
  routine: RoutineSlot[];
  attendanceRecords: AttendanceRecord[];
  semesterArchives: SemesterArchive[];
}

export type ActiveSession =
  | { type: 'demo' }
  | { type: 'user'; userId: string }
  | null;

export interface AttendanceMetrics {
  percentage: number;
  attended: number;
  total: number;
  target: number;
  isEligible: boolean;
  status: 'safe' | 'warning' | 'shortage';
  classesNeeded: number; // Consecutive classes required to reach target
  bunkableClasses: number; // Safe classes can miss without dropping below target
}

export interface DaySimulationResult {
  dayName: string;
  classesScheduled: number;
  subjectsAffected: {
    subject: Subject;
    currentPct: number;
    projectedPct: number;
    classesMissed: number;
    classesNeededToRecover: number;
    statusChange: 'remains_safe' | 'safe_to_shortage' | 'shortage_worse';
  }[];
  currentOverallPct: number;
  projectedOverallPct: number;
  overallRecoveryClassesNeeded: number;
}

export interface SelectiveSimulationResult {
  dayName: DayOfWeek;
  totalClassesOnDay: number;
  classesBunked: number;
  classesAttended: number;
  currentOverallPct: number;
  projectedOverallPct: number;
  overallDelta: number;
  overallRecoveryClassesNeeded: number;
  overallBunkableClasses: number;
  overallStatus: 'safe' | 'warning' | 'shortage';
  subjectsAffected: {
    subject: Subject;
    currentPct: number;
    projectedPct: number;
    unitsBunked: number;
    unitsAttended: number;
    classesNeededToRecover: number;
    bunkableClasses: number;
    isEligible: boolean;
    statusChange: 'remains_safe' | 'safe_to_shortage' | 'shortage_worse' | 'improved';
  }[];
}

