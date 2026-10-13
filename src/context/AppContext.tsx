import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Subject, RoutineSlot, AttendanceRecord, SemesterArchive, UserProfile, AttendanceStatus } from '../types';
import { DEFAULT_USER, SAMPLE_SUBJECTS, SAMPLE_ROUTINE } from '../utils/initialData';
import { getTodayDateString } from '../utils/calculations';
import confetti from 'canvas-confetti';

interface AppContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  theme: 'dark' | 'light';
  isOffline: boolean;
  subjects: Subject[];
  routine: RoutineSlot[];
  attendanceRecords: AttendanceRecord[];
  semesterArchives: SemesterArchive[];
  activeTab: 'dashboard' | 'routine' | 'subjects' | 'simulator' | 'history' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'routine' | 'subjects' | 'simulator' | 'history' | 'settings') => void;
  toggleTheme: () => void;
  login: (email: string, name?: string) => void;
  register: (email: string, name: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (id: string) => void;
  addRoutineSlot: (slot: Omit<RoutineSlot, 'id'>) => void;
  updateRoutineSlot: (slot: RoutineSlot) => void;
  deleteRoutineSlot: (id: string) => void;
  markAttendance: (subjectId: string, status: AttendanceStatus, units: number, slotId?: string, date?: string) => void;
  undoAttendanceRecord: (recordId: string) => void;
  loadSampleData: () => void;
  resetCurrentRoutineAndAttendance: () => void;
  archiveCurrentSemester: (semesterName: string) => void;
  deleteArchive: (id: string) => void;
  exportDataJson: () => void;
  importDataJson: (jsonData: string) => boolean;
  triggerCelebration: () => void;
}

const STORAGE_KEYS = {
  USER: 'ack_user',
  THEME: 'ack_theme',
  SUBJECTS: 'ack_subjects',
  ROUTINE: 'ack_routine',
  RECORDS: 'ack_records',
  ARCHIVES: 'ack_archives',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved === 'light' ? 'light' : 'dark';
  });

  // User state
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    // Default logged in with demo profile so the student can immediately test all features!
    return DEFAULT_USER;
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'routine' | 'subjects' | 'simulator' | 'history' | 'settings'>('dashboard');

  // Network state
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Theme application
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return SAMPLE_SUBJECTS; }
    }
    return SAMPLE_SUBJECTS;
  });

  // Routine state
  const [routine, setRoutine] = useState<RoutineSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROUTINE);
    if (saved) {
      try { return JSON.parse(saved); } catch { return SAMPLE_ROUTINE; }
    }
    return SAMPLE_ROUTINE;
  });

  // Attendance history logs
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  // Archived semesters
  const [semesterArchives, setSemesterArchives] = useState<SemesterArchive[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ARCHIVES);
    if (saved) {
      try { return JSON.parse(saved); } catch { return []; }
    }
    return [];
  });

  // Local storage synchronization
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROUTINE, JSON.stringify(routine));
  }, [routine]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(semesterArchives));
  }, [semesterArchives]);

  // Auth functions
  const login = (email: string, name?: string) => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      semesterName: 'Current Semester',
    };
    setUser(newUser);
  };

  const register = (email: string, name: string) => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      name,
      semesterName: 'Current Semester',
    };
    setUser(newUser);
  };

  const loginAsGuest = () => {
    setUser(DEFAULT_USER);
  };

  const logout = () => {
    setUser(null);
  };

  // Subject functions
  const addSubject = (subjectData: Omit<Subject, 'id'>) => {
    const newSubject: Subject = {
      ...subjectData,
      id: `sub_${Date.now()}`,
    };
    setSubjects(prev => [...prev, newSubject]);
  };

  const updateSubject = (updated: Subject) => {
    setSubjects(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    // Also remove from routine
    setRoutine(prev => prev.filter(r => r.subjectId !== id));
  };

  // Routine functions
  const addRoutineSlot = (slotData: Omit<RoutineSlot, 'id'>) => {
    const newSlot: RoutineSlot = {
      ...slotData,
      id: `slot_${Date.now()}`,
    };
    setRoutine(prev => [...prev, newSlot]);
  };

  const updateRoutineSlot = (updated: RoutineSlot) => {
    setRoutine(prev => prev.map(r => (r.id === updated.id ? updated : r)));
  };

  const deleteRoutineSlot = (id: string) => {
    setRoutine(prev => prev.filter(r => r.id !== id));
  };

  // Attendance marking
  const markAttendance = (
    subjectId: string,
    status: AttendanceStatus,
    units: number,
    slotId?: string,
    date?: string
  ) => {
    const recordDate = date || getTodayDateString();
    const newRecord: AttendanceRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: recordDate,
      slotId,
      subjectId,
      status,
      units,
      timestamp: Date.now(),
    };

    setAttendanceRecords(prev => [newRecord, ...prev]);

    // Update subject attended and total counters:
    // Present: attended += units, total += units
    // Absent: attended += 0, total += units
    // Cancelled: neither increases attended nor total! (PRD feature 6)
    setSubjects(prev =>
      prev.map(s => {
        if (s.id !== subjectId) return s;
        if (status === 'present') {
          return {
            ...s,
            attended: s.attended + units,
            total: s.total + units,
          };
        } else if (status === 'absent') {
          return {
            ...s,
            total: s.total + units,
          };
        } else {
          // Cancelled: no change to counts
          return s;
        }
      })
    );
  };

  // Undo attendance action
  const undoAttendanceRecord = (recordId: string) => {
    const target = attendanceRecords.find(r => r.id === recordId);
    if (!target) return;

    // Revert the counts on the subject
    setSubjects(prev =>
      prev.map(s => {
        if (s.id !== target.subjectId) return s;
        if (target.status === 'present') {
          return {
            ...s,
            attended: Math.max(0, s.attended - target.units),
            total: Math.max(0, s.total - target.units),
          };
        } else if (target.status === 'absent') {
          return {
            ...s,
            total: Math.max(0, s.total - target.units),
          };
        }
        return s;
      })
    );

    setAttendanceRecords(prev => prev.filter(r => r.id !== recordId));
  };

  // Sample data loader
  const loadSampleData = () => {
    setSubjects(SAMPLE_SUBJECTS);
    setRoutine(SAMPLE_ROUTINE);
    setAttendanceRecords([]);
  };

  // Reset routine and attendance (for semester start)
  const resetCurrentRoutineAndAttendance = () => {
    setSubjects(prev => prev.map(s => ({ ...s, attended: 0, total: 0 })));
    setRoutine([]);
    setAttendanceRecords([]);
  };

  // Archive semester
  const archiveCurrentSemester = (semesterName: string) => {
    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalConducted = subjects.reduce((sum, s) => sum + s.total, 0);
    const overallPercentage = totalConducted > 0 ? Math.round(((totalAttended / totalConducted) * 100) * 10) / 10 : 0;

    const archive: SemesterArchive = {
      id: `arch_${Date.now()}`,
      name: semesterName,
      archivedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      overallPercentage,
      totalAttended,
      totalConducted,
      subjects: [...subjects],
      routine: [...routine],
    };

    setSemesterArchives(prev => [archive, ...prev]);

    // Reset current semester counters and routine for fresh start (PRD feature 10)
    resetCurrentRoutineAndAttendance();
    if (user) {
      setUser({ ...user, semesterName: 'New Semester' });
    }
  };

  const deleteArchive = (id: string) => {
    setSemesterArchives(prev => prev.filter(a => a.id !== id));
  };

  // Export JSON
  const exportDataJson = () => {
    const exportPayload = {
      user,
      subjects,
      routine,
      attendanceRecords,
      semesterArchives,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-check-karo-backup-${getTodayDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const importDataJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.subjects) && Array.isArray(data.routine)) {
        setSubjects(data.subjects);
        setRoutine(data.routine);
        if (data.attendanceRecords) setAttendanceRecords(data.attendanceRecords);
        if (data.semesterArchives) setSemesterArchives(data.semesterArchives);
        if (data.user) setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#6366f1', '#3b82f6', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        theme,
        isOffline,
        subjects,
        routine,
        attendanceRecords,
        semesterArchives,
        activeTab,
        setActiveTab,
        toggleTheme,
        login,
        register,
        loginAsGuest,
        logout,
        addSubject,
        updateSubject,
        deleteSubject,
        addRoutineSlot,
        updateRoutineSlot,
        deleteRoutineSlot,
        markAttendance,
        undoAttendanceRecord,
        loadSampleData,
        resetCurrentRoutineAndAttendance,
        archiveCurrentSemester,
        deleteArchive,
        exportDataJson,
        importDataJson,
        triggerCelebration,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
