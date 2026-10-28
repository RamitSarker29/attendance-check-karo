import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Subject,
  RoutineSlot,
  AttendanceRecord,
  SemesterArchive,
  UserProfile,
  AttendanceStatus,
  UserWorkspaceData,
  ActiveSession,
} from '../types';
import { DEFAULT_USER, SAMPLE_SUBJECTS, SAMPLE_ROUTINE } from '../utils/initialData';
import { getTodayDateString } from '../utils/calculations';
import { normalizeEmail, validateEmail, validateName } from '../utils/validation';
import confetti from 'canvas-confetti';

interface AppContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  theme: 'dark' | 'light';
  isOffline: boolean;
  subjects: Subject[];
  routine: RoutineSlot[];
  attendanceRecords: AttendanceRecord[];
  semesterArchives: SemesterArchive[];
  registeredUsers: UserProfile[];
  activeTab: 'dashboard' | 'routine' | 'subjects' | 'simulator' | 'history' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'routine' | 'subjects' | 'simulator' | 'history' | 'settings') => void;
  toggleTheme: () => void;
  login: (email: string) => { success: boolean; error?: string };
  register: (email: string, name: string, college?: string) => { success: boolean; error?: string };
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  loginAsGuest: () => void; // alias for enterDemoMode
  logout: () => void;
  switchUser: (userId: string) => void;
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
  THEME: 'ack_theme',
  SESSION: 'ack_session',
  DEMO_WORKSPACE: 'ack_demo_workspace',
  USERS_INDEX: 'ack_registered_users',
  USER_WORKSPACE_PREFIX: 'ack_user_workspace_',
};

const LEGACY_KEYS = {
  USER: 'ack_user',
  SUBJECTS: 'ack_subjects',
  ROUTINE: 'ack_routine',
  RECORDS: 'ack_records',
  ARCHIVES: 'ack_archives',
};

// Safe JSON parser helper
function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Perform one-time legacy migration to preserve any existing data
function runLegacyMigration() {
  try {
    const legacyUserStr = localStorage.getItem(LEGACY_KEYS.USER);
    if (!legacyUserStr) return; // No legacy data

    const legacyUser = safeJsonParse<UserProfile | null>(legacyUserStr, null);
    if (!legacyUser) return;

    const legacySubjects = safeJsonParse<Subject[]>(localStorage.getItem(LEGACY_KEYS.SUBJECTS), []);
    const legacyRoutine = safeJsonParse<RoutineSlot[]>(localStorage.getItem(LEGACY_KEYS.ROUTINE), []);
    const legacyRecords = safeJsonParse<AttendanceRecord[]>(localStorage.getItem(LEGACY_KEYS.RECORDS), []);
    const legacyArchives = safeJsonParse<SemesterArchive[]>(localStorage.getItem(LEGACY_KEYS.ARCHIVES), []);

    const isUntouchedDemo = legacyUser.id === 'usr_demo_1' && legacyUser.name === 'Aman Sharma';

    if (isUntouchedDemo) {
      // Migrate to isolated Demo Workspace
      const demoData: UserWorkspaceData = {
        user: DEFAULT_USER,
        subjects: legacySubjects.length > 0 ? legacySubjects : SAMPLE_SUBJECTS,
        routine: legacyRoutine.length > 0 ? legacyRoutine : SAMPLE_ROUTINE,
        attendanceRecords: legacyRecords,
        semesterArchives: legacyArchives,
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_WORKSPACE, JSON.stringify(demoData));
    } else {
      // It's a customized user account! Migrate into User Partition
      const userData: UserWorkspaceData = {
        user: { ...legacyUser, isDemo: false },
        subjects: legacySubjects,
        routine: legacyRoutine,
        attendanceRecords: legacyRecords,
        semesterArchives: legacyArchives,
      };

      // Add to registered users
      const existingUsers = safeJsonParse<UserProfile[]>(localStorage.getItem(STORAGE_KEYS.USERS_INDEX), []);
      if (!existingUsers.some(u => u.id === legacyUser.id)) {
        existingUsers.push(userData.user);
        localStorage.setItem(STORAGE_KEYS.USERS_INDEX, JSON.stringify(existingUsers));
      }

      // Save user workspace
      localStorage.setItem(
        `${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${legacyUser.id}`,
        JSON.stringify(userData)
      );

      // Restore active session for this user
      const userSession: ActiveSession = { type: 'user', userId: legacyUser.id };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(userSession));
    }

    // Clean up legacy keys safely
    localStorage.removeItem(LEGACY_KEYS.USER);
    localStorage.removeItem(LEGACY_KEYS.SUBJECTS);
    localStorage.removeItem(LEGACY_KEYS.ROUTINE);
    localStorage.removeItem(LEGACY_KEYS.RECORDS);
    localStorage.removeItem(LEGACY_KEYS.ARCHIVES);
  } catch (err) {
    console.warn('Migration warning:', err);
  }
}

// Run migration once before component mounts
runLegacyMigration();

// Helper to get or create demo workspace
function getInitialDemoWorkspace(): UserWorkspaceData {
  const saved = localStorage.getItem(STORAGE_KEYS.DEMO_WORKSPACE);
  if (saved) {
    const parsed = safeJsonParse<UserWorkspaceData | null>(saved, null);
    if (parsed && parsed.user && parsed.subjects) {
      return parsed;
    }
  }
  const defaultDemo: UserWorkspaceData = {
    user: DEFAULT_USER,
    subjects: SAMPLE_SUBJECTS,
    routine: SAMPLE_ROUTINE,
    attendanceRecords: [],
    semesterArchives: [],
  };
  localStorage.setItem(STORAGE_KEYS.DEMO_WORKSPACE, JSON.stringify(defaultDemo));
  return defaultDemo;
}

// Helper to safely scan stored user workspaces without modifying or deleting them
function scanLocalWorkspaces(): UserProfile[] {
  const recoveredUsers: UserProfile[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.USER_WORKSPACE_PREFIX)) {
        const raw = localStorage.getItem(key);
        const ws = safeJsonParse<UserWorkspaceData | null>(raw, null);
        if (ws && ws.user && ws.user.id && ws.user.email) {
          // Verify this user isn't already added in our scan
          if (!recoveredUsers.some(u => u.id === ws.user.id)) {
            recoveredUsers.push(ws.user);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Workspace scan error:', err);
  }
  return recoveredUsers;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved === 'light' ? 'light' : 'dark';
  });

  // Active session: null by default for new visitors!
  const [activeSession, setActiveSession] = useState<ActiveSession>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
    return safeJsonParse<ActiveSession>(saved, null);
  });

  // Registered local users list with self-healing recovery from stored workspaces
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    const saved = safeJsonParse<UserProfile[]>(localStorage.getItem(STORAGE_KEYS.USERS_INDEX), []);
    if (Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    const recovered = scanLocalWorkspaces();
    if (recovered.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS_INDEX, JSON.stringify(recovered));
      return recovered;
    }
    return [];
  });

  // Active workspace state
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (activeSession?.type === 'demo') {
      return DEFAULT_USER;
    }
    if (activeSession?.type === 'user') {
      const workspace = safeJsonParse<UserWorkspaceData | null>(
        localStorage.getItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${activeSession.userId}`),
        null
      );
      return workspace ? workspace.user : null;
    }
    return null; // Visitors start logged out!
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    if (activeSession?.type === 'demo') {
      return getInitialDemoWorkspace().subjects;
    }
    if (activeSession?.type === 'user') {
      const workspace = safeJsonParse<UserWorkspaceData | null>(
        localStorage.getItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${activeSession.userId}`),
        null
      );
      return workspace ? workspace.subjects : [];
    }
    return [];
  });

  const [routine, setRoutine] = useState<RoutineSlot[]>(() => {
    if (activeSession?.type === 'demo') {
      return getInitialDemoWorkspace().routine;
    }
    if (activeSession?.type === 'user') {
      const workspace = safeJsonParse<UserWorkspaceData | null>(
        localStorage.getItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${activeSession.userId}`),
        null
      );
      return workspace ? workspace.routine : [];
    }
    return [];
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    if (activeSession?.type === 'demo') {
      return getInitialDemoWorkspace().attendanceRecords;
    }
    if (activeSession?.type === 'user') {
      const workspace = safeJsonParse<UserWorkspaceData | null>(
        localStorage.getItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${activeSession.userId}`),
        null
      );
      return workspace ? workspace.attendanceRecords : [];
    }
    return [];
  });

  const [semesterArchives, setSemesterArchives] = useState<SemesterArchive[]>(() => {
    if (activeSession?.type === 'demo') {
      return getInitialDemoWorkspace().semesterArchives;
    }
    if (activeSession?.type === 'user') {
      const workspace = safeJsonParse<UserWorkspaceData | null>(
        localStorage.getItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${activeSession.userId}`),
        null
      );
      return workspace ? workspace.semesterArchives : [];
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'routine' | 'subjects' | 'simulator' | 'history' | 'settings'>('dashboard');
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

  const isDemoMode = activeSession?.type === 'demo';

  // Persistence: sync active workspace whenever data changes
  useEffect(() => {
    if (activeSession?.type === 'demo') {
      const demoData: UserWorkspaceData = {
        user: user || DEFAULT_USER,
        subjects,
        routine,
        attendanceRecords,
        semesterArchives,
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_WORKSPACE, JSON.stringify(demoData));
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(activeSession));
    } else if (activeSession?.type === 'user' && user) {
      const userData: UserWorkspaceData = {
        user,
        subjects,
        routine,
        attendanceRecords,
        semesterArchives,
      };
      localStorage.setItem(
        `${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${user.id}`,
        JSON.stringify(userData)
      );
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(activeSession));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, [activeSession, user, subjects, routine, attendanceRecords, semesterArchives]);

  // Sync registered users list safely: NEVER overwrite valid stored accounts with an empty list!
  useEffect(() => {
    if (registeredUsers.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS_INDEX, JSON.stringify(registeredUsers));
    } else {
      const existingInStorage = safeJsonParse<UserProfile[]>(
        localStorage.getItem(STORAGE_KEYS.USERS_INDEX),
        []
      );
      const existingWorkspaces = scanLocalWorkspaces();
      if (existingInStorage.length === 0 && existingWorkspaces.length === 0) {
        localStorage.setItem(STORAGE_KEYS.USERS_INDEX, JSON.stringify([]));
      }
    }
  }, [registeredUsers]);

  // Demo Sandbox Entry & Exit
  const enterDemoMode = useCallback(() => {
    const demo = getInitialDemoWorkspace();
    const session: ActiveSession = { type: 'demo' };
    setActiveSession(session);
    setUser(demo.user);
    setSubjects(demo.subjects);
    setRoutine(demo.routine);
    setAttendanceRecords(demo.attendanceRecords);
    setSemesterArchives(demo.semesterArchives);
    setActiveTab('dashboard');
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }, []);

  const exitDemoMode = useCallback(() => {
    // Flush current demo changes to demo storage
    const demoData: UserWorkspaceData = {
      user: DEFAULT_USER,
      subjects,
      routine,
      attendanceRecords,
      semesterArchives,
    };
    localStorage.setItem(STORAGE_KEYS.DEMO_WORKSPACE, JSON.stringify(demoData));

    // Clear active session and reset in-memory state cleanly
    setActiveSession(null);
    setUser(null);
    setSubjects([]);
    setRoutine([]);
    setAttendanceRecords([]);
    setSemesterArchives([]);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }, [subjects, routine, attendanceRecords, semesterArchives]);

  // Alias for backward compatibility
  const loginAsGuest = enterDemoMode;

  // Sign up for a personal user account - strictly empty workspace!
  const register = useCallback(
    (email: string, name: string, college?: string) => {
      const cleanEmail = normalizeEmail(email);
      const cleanName = (name || '').trim();

      // Email format validation
      const emailValidation = validateEmail(cleanEmail);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      // Name validation
      const nameValidation = validateName(cleanName);
      if (!nameValidation.valid) {
        return { success: false, error: nameValidation.error };
      }

      // Check across disk storage, in-memory state, and stored workspaces to prevent duplicates
      const currentDiskUsers = safeJsonParse<UserProfile[]>(
        localStorage.getItem(STORAGE_KEYS.USERS_INDEX),
        []
      );
      const allKnownUsersMap = new Map<string, UserProfile>();
      currentDiskUsers.forEach(u => allKnownUsersMap.set(u.id, u));
      registeredUsers.forEach(u => allKnownUsersMap.set(u.id, u));
      scanLocalWorkspaces().forEach(u => allKnownUsersMap.set(u.id, u));
      const allKnownUsers = Array.from(allKnownUsersMap.values());

      const exists = allKnownUsers.some(u => normalizeEmail(u.email) === cleanEmail);
      if (exists) {
        return {
          success: false,
          error: 'An account with this email already exists on this device. Please sign in.',
        };
      }

      const newUser: UserProfile = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: cleanEmail,
        name: cleanName,
        college: college?.trim() || undefined,
        semesterName: 'Current Semester',
        isDemo: false,
      };

      // Strict requirement: New personal workspaces start completely empty!
      const emptyWorkspace: UserWorkspaceData = {
        user: newUser,
        subjects: [],
        routine: [],
        attendanceRecords: [],
        semesterArchives: [],
      };

      // Save user workspace and update index atomically
      localStorage.setItem(
        `${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${newUser.id}`,
        JSON.stringify(emptyWorkspace)
      );

      const updatedUsers = [...allKnownUsers, newUser];
      setRegisteredUsers(updatedUsers);
      localStorage.setItem(STORAGE_KEYS.USERS_INDEX, JSON.stringify(updatedUsers));

      // Switch active session to the new user
      const newSession: ActiveSession = { type: 'user', userId: newUser.id };
      setActiveSession(newSession);
      setUser(newUser);
      setSubjects([]);
      setRoutine([]);
      setAttendanceRecords([]);
      setSemesterArchives([]);
      setActiveTab('dashboard');
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newSession));

      return { success: true };
    },
    [registeredUsers]
  );

  // Sign in to an existing personal account on this device
  const login = useCallback(
    (email: string) => {
      const cleanEmail = normalizeEmail(email);

      // Email format validation
      const emailValidation = validateEmail(cleanEmail);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      // Read fresh users from disk first, then merge with in-memory state
      const currentDiskUsers = safeJsonParse<UserProfile[]>(
        localStorage.getItem(STORAGE_KEYS.USERS_INDEX),
        []
      );
      const allKnownUsersMap = new Map<string, UserProfile>();
      currentDiskUsers.forEach(u => allKnownUsersMap.set(u.id, u));
      registeredUsers.forEach(u => allKnownUsersMap.set(u.id, u));

      let foundUser = Array.from(allKnownUsersMap.values()).find(
        u => normalizeEmail(u.email) === cleanEmail
      );

      // Self-healing: if not found in index, check stored workspaces (without modifying existing workspace data)
      if (!foundUser) {
        const workspaceUsers = scanLocalWorkspaces();
        foundUser = workspaceUsers.find(u => normalizeEmail(u.email) === cleanEmail);
        if (foundUser) {
          // Re-index the recovered user metadata safely without touching workspace contents
          const restoredUsers = [
            ...Array.from(allKnownUsersMap.values()).filter(u => u.id !== foundUser!.id),
            foundUser,
          ];
          localStorage.setItem(STORAGE_KEYS.USERS_INDEX, JSON.stringify(restoredUsers));
          setRegisteredUsers(restoredUsers);
        }
      }

      if (!foundUser) {
        return {
          success: false,
          error: 'No local account found with this email. Please create a personal workspace.',
        };
      }

      // Load this user's isolated workspace
      const rawWorkspace = localStorage.getItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${foundUser.id}`);
      const workspace = safeJsonParse<UserWorkspaceData | null>(rawWorkspace, null);

      const session: ActiveSession = { type: 'user', userId: foundUser.id };
      setActiveSession(session);
      setUser(foundUser);
      setSubjects(workspace ? workspace.subjects : []);
      setRoutine(workspace ? workspace.routine : []);
      setAttendanceRecords(workspace ? workspace.attendanceRecords : []);
      setSemesterArchives(workspace ? workspace.semesterArchives : []);
      setActiveTab('dashboard');
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

      return { success: true };
    },
    [registeredUsers]
  );

  const logout = useCallback(() => {
    setActiveSession(null);
    setUser(null);
    setSubjects([]);
    setRoutine([]);
    setAttendanceRecords([]);
    setSemesterArchives([]);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }, []);

  const switchUser = useCallback(
    (userId: string) => {
      const currentDiskUsers = safeJsonParse<UserProfile[]>(
        localStorage.getItem(STORAGE_KEYS.USERS_INDEX),
        []
      );
      const allKnownUsersMap = new Map<string, UserProfile>();
      currentDiskUsers.forEach(u => allKnownUsersMap.set(u.id, u));
      registeredUsers.forEach(u => allKnownUsersMap.set(u.id, u));
      scanLocalWorkspaces().forEach(u => allKnownUsersMap.set(u.id, u));

      const foundUser = allKnownUsersMap.get(userId);
      if (!foundUser) return;

      const rawWorkspace = localStorage.getItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${foundUser.id}`);
      const workspace = safeJsonParse<UserWorkspaceData | null>(rawWorkspace, null);

      const session: ActiveSession = { type: 'user', userId: foundUser.id };
      setActiveSession(session);
      setUser(foundUser);
      setSubjects(workspace ? workspace.subjects : []);
      setRoutine(workspace ? workspace.routine : []);
      setAttendanceRecords(workspace ? workspace.attendanceRecords : []);
      setSemesterArchives(workspace ? workspace.semesterArchives : []);
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    },
    [registeredUsers]
  );

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
          return s;
        }
      })
    );
  };

  // Undo attendance action
  const undoAttendanceRecord = (recordId: string) => {
    const target = attendanceRecords.find(r => r.id === recordId);
    if (!target) return;

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

  // Sample data loader (for testing routine in demo or user workspace)
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

    resetCurrentRoutineAndAttendance();
    if (user) {
      setUser({ ...user, semesterName: 'New Semester' });
    }
  };

  const deleteArchive = (id: string) => {
    setSemesterArchives(prev => prev.filter(a => a.id !== id));
  };

  // Export JSON backup
  const exportDataJson = () => {
    const exportPayload = {
      user,
      isDemoMode,
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
    link.download = `attendance-check-karo-${user?.name ? user.name.toLowerCase().replace(/\s+/g, '-') : 'workspace'}-${getTodayDateString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
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
        isDemoMode,
        theme,
        isOffline,
        subjects,
        routine,
        attendanceRecords,
        semesterArchives,
        registeredUsers,
        activeTab,
        setActiveTab,
        toggleTheme,
        login,
        register,
        enterDemoMode,
        exitDemoMode,
        loginAsGuest,
        logout,
        switchUser,
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
