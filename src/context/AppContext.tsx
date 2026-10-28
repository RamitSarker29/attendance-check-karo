import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  Subject,
  RoutineSlot,
  AttendanceRecord,
  SemesterArchive,
  UserProfile,
  AttendanceStatus,
  UserWorkspaceData,
  ActiveSession,
  SyncStatus,
} from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { DEFAULT_USER, SAMPLE_SUBJECTS, SAMPLE_ROUTINE } from '../utils/initialData';
import { getTodayDateString } from '../utils/calculations';
import { normalizeEmail, validateEmail, validateName } from '../utils/validation';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '../lib/supabase';
import confetti from 'canvas-confetti';

interface AppContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isSupabaseConfigured: boolean;
  syncStatus: SyncStatus;
  theme: 'dark' | 'light';
  isOffline: boolean;
  subjects: Subject[];
  routine: RoutineSlot[];
  attendanceRecords: AttendanceRecord[];
  semesterArchives: SemesterArchive[];
  registeredUsers: UserProfile[];
  migrationCandidate: UserWorkspaceData | null;
  activeTab: 'dashboard' | 'routine' | 'subjects' | 'simulator' | 'history' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'routine' | 'subjects' | 'simulator' | 'history' | 'settings') => void;
  toggleTheme: () => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password?: string,
    name?: string,
    college?: string
  ) => Promise<{ success: boolean; error?: string; emailConfirmationRequired?: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  loginAsGuest: () => void; // alias for enterDemoMode
  logout: () => Promise<void>;
  switchUser: (userId: string) => void;
  retrySync: () => Promise<void>;
  importLocalMigration: () => Promise<void>;
  dismissMigration: () => void;
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
    if (!legacyUserStr) return;

    const legacyUser = safeJsonParse<UserProfile | null>(legacyUserStr, null);
    if (!legacyUser) return;

    const legacySubjects = safeJsonParse<Subject[]>(localStorage.getItem(LEGACY_KEYS.SUBJECTS), []);
    const legacyRoutine = safeJsonParse<RoutineSlot[]>(localStorage.getItem(LEGACY_KEYS.ROUTINE), []);
    const legacyRecords = safeJsonParse<AttendanceRecord[]>(localStorage.getItem(LEGACY_KEYS.RECORDS), []);
    const legacyArchives = safeJsonParse<SemesterArchive[]>(localStorage.getItem(LEGACY_KEYS.ARCHIVES), []);

    const isUntouchedDemo = legacyUser.id === 'usr_demo_1' && legacyUser.name === 'Aman Sharma';

    if (isUntouchedDemo) {
      const demoData: UserWorkspaceData = {
        user: DEFAULT_USER,
        subjects: legacySubjects.length > 0 ? legacySubjects : SAMPLE_SUBJECTS,
        routine: legacyRoutine.length > 0 ? legacyRoutine : SAMPLE_ROUTINE,
        attendanceRecords: legacyRecords,
        semesterArchives: legacyArchives,
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_WORKSPACE, JSON.stringify(demoData));
    } else {
      const userData: UserWorkspaceData = {
        user: { ...legacyUser, isDemo: false },
        subjects: legacySubjects,
        routine: legacyRoutine,
        attendanceRecords: legacyRecords,
        semesterArchives: legacyArchives,
      };

      const existingUsers = safeJsonParse<UserProfile[]>(localStorage.getItem(STORAGE_KEYS.USERS_INDEX), []);
      if (!existingUsers.some(u => u.id === legacyUser.id)) {
        existingUsers.push(userData.user);
        localStorage.setItem(STORAGE_KEYS.USERS_INDEX, JSON.stringify(existingUsers));
      }

      localStorage.setItem(
        `${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${legacyUser.id}`,
        JSON.stringify(userData)
      );

      const userSession: ActiveSession = { type: 'user', userId: legacyUser.id };
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(userSession));
    }

    localStorage.removeItem(LEGACY_KEYS.USER);
    localStorage.removeItem(LEGACY_KEYS.SUBJECTS);
    localStorage.removeItem(LEGACY_KEYS.ROUTINE);
    localStorage.removeItem(LEGACY_KEYS.RECORDS);
    localStorage.removeItem(LEGACY_KEYS.ARCHIVES);
  } catch (err) {
    console.warn('Migration warning:', err);
  }
}

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

  // Active session
  const [activeSession, setActiveSession] = useState<ActiveSession>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
    return safeJsonParse<ActiveSession>(saved, null);
  });

  // Cloud sync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  // Flag indicating cloud workspace has been fetched (prevents overwriting cloud data with empty defaults)
  const [isCloudLoaded, setIsCloudLoaded] = useState<boolean>(false);
  // Candidate local data for migration to cloud
  const [migrationCandidate, setMigrationCandidate] = useState<UserWorkspaceData | null>(null);

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
    return null;
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

  // Cloud sync debounce ref
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (syncStatus === 'offline' && isSupabaseConfigured) {
        setSyncStatus('idle');
      }
    };
    const handleOffline = () => {
      setIsOffline(true);
      if (syncStatus === 'syncing') {
        setSyncStatus('offline');
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus]);

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

  // Check for candidate local personal data to offer migration to cloud
  const checkForLocalMigrationCandidate = useCallback((currentUserId: string) => {
    try {
      const alreadyMigrated = localStorage.getItem(`ack_migrated_${currentUserId}`);
      if (alreadyMigrated) return;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.USER_WORKSPACE_PREFIX)) {
          const workspaceUserId = key.replace(STORAGE_KEYS.USER_WORKSPACE_PREFIX, '');
          if (workspaceUserId !== currentUserId) {
            const raw = localStorage.getItem(key);
            const ws = safeJsonParse<UserWorkspaceData | null>(raw, null);
            if (ws && ws.user && !ws.user.isDemo && Array.isArray(ws.subjects) && ws.subjects.length > 0) {
              setMigrationCandidate(ws);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Migration candidate detection error:', err);
    }
  }, []);

  // Supabase User Login Handler: Fetches cloud data and restores state
  const handleSupabaseUserLogin = useCallback(async (authUser: SupabaseUser) => {
    if (!supabase) return;

    setSyncStatus('loading');

    const profile: UserProfile = {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Student',
      college: authUser.user_metadata?.college || undefined,
      semesterName: 'Current Semester',
      isDemo: false,
    };

    const session: ActiveSession = { type: 'user', userId: authUser.id };
    setActiveSession(session);
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

    try {
      const { data, error } = await supabase
        .from('user_workspaces')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error) {
        console.warn('Cloud fetch warning:', error);
        // Fall back to local storage cache if available
        const localWs = safeJsonParse<UserWorkspaceData | null>(
          localStorage.getItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${authUser.id}`),
          null
        );
        if (localWs) {
          setUser(localWs.user);
          setSubjects(localWs.subjects);
          setRoutine(localWs.routine);
          setAttendanceRecords(localWs.attendanceRecords);
          setSemesterArchives(localWs.semesterArchives);
        } else {
          setUser(profile);
        }
        setSyncStatus(!navigator.onLine ? 'offline' : 'error');
        setIsCloudLoaded(true);
        return;
      }

      if (data) {
        // Successfully loaded from Supabase Cloud
        const cloudUser: UserProfile = {
          id: authUser.id,
          email: data.email || profile.email,
          name: data.name || profile.name,
          college: data.college || profile.college,
          semesterName: data.semester_name || 'Current Semester',
          isDemo: false,
        };

        const cloudSubjects: Subject[] = Array.isArray(data.subjects) ? data.subjects : [];
        const cloudRoutine: RoutineSlot[] = Array.isArray(data.routine) ? data.routine : [];
        const cloudRecords: AttendanceRecord[] = Array.isArray(data.attendance_records) ? data.attendance_records : [];
        const cloudArchives: SemesterArchive[] = Array.isArray(data.semester_archives) ? data.semester_archives : [];

        setUser(cloudUser);
        setSubjects(cloudSubjects);
        setRoutine(cloudRoutine);
        setAttendanceRecords(cloudRecords);
        setSemesterArchives(cloudArchives);

        // Update local cache
        const cache: UserWorkspaceData = {
          user: cloudUser,
          subjects: cloudSubjects,
          routine: cloudRoutine,
          attendanceRecords: cloudRecords,
          semesterArchives: cloudArchives,
        };
        localStorage.setItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${authUser.id}`, JSON.stringify(cache));

        setIsCloudLoaded(true);
        setSyncStatus('saved');

        // If cloud workspace is genuinely empty, check if device has local data to migrate
        if (cloudSubjects.length === 0) {
          checkForLocalMigrationCandidate(authUser.id);
        }
      } else {
        // First-time user: row doesn't exist yet, initialize clean workspace
        setUser(profile);
        setSubjects([]);
        setRoutine([]);
        setAttendanceRecords([]);
        setSemesterArchives([]);

        const initialWorkspace: UserWorkspaceData = {
          user: profile,
          subjects: [],
          routine: [],
          attendanceRecords: [],
          semesterArchives: [],
        };
        localStorage.setItem(`${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${authUser.id}`, JSON.stringify(initialWorkspace));

        // Create the empty cloud workspace record
        await supabase.from('user_workspaces').upsert({
          user_id: authUser.id,
          email: profile.email,
          name: profile.name,
          college: profile.college,
          semester_name: profile.semesterName,
          subjects: [],
          routine: [],
          attendance_records: [],
          semester_archives: [],
        });

        setIsCloudLoaded(true);
        setSyncStatus('saved');

        // Check for local unmigrated records
        checkForLocalMigrationCandidate(authUser.id);
      }
    } catch (err) {
      console.error('handleSupabaseUserLogin error:', err);
      setSyncStatus(!navigator.onLine ? 'offline' : 'error');
      setIsCloudLoaded(true);
    }
  }, [checkForLocalMigrationCandidate]);

  // Handle Supabase Auth state changes and initial session recovery
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // Recover initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Supabase getSession error:', error);
        return;
      }
      if (session?.user && activeSession?.type !== 'demo') {
        handleSupabaseUserLogin(session.user);
      }
    });

    // Listen for auth state transitions (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleSupabaseUserLogin(session.user);
      } else if (event === 'SIGNED_OUT') {
        setActiveSession(null);
        setUser(null);
        setSubjects([]);
        setRoutine([]);
        setAttendanceRecords([]);
        setSemesterArchives([]);
        setSyncStatus('idle');
        setIsCloudLoaded(false);
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSupabaseUserLogin, activeSession?.type]);

  // Sync to local storage & Supabase Cloud
  useEffect(() => {
    if (activeSession?.type === 'demo') {
      // Demo sandbox stays 100% strictly local in localStorage
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

      // Always save to device local cache immediately
      localStorage.setItem(
        `${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${user.id}`,
        JSON.stringify(userData)
      );
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(activeSession));

      // Synchronize to Supabase Cloud if configured and cloud data was already loaded
      // (Anti-wipe safeguard: Never save before initial load completes!)
      if (isSupabaseConfigured && supabase && isCloudLoaded) {
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(async () => {
          if (!navigator.onLine) {
            setSyncStatus('offline');
            return;
          }

          setSyncStatus('syncing');

          try {
            const { error } = await supabase!
              .from('user_workspaces')
              .upsert({
                user_id: user.id,
                email: user.email,
                name: user.name,
                college: user.college,
                semester_name: user.semesterName,
                subjects,
                routine,
                attendance_records: attendanceRecords,
                semester_archives: semesterArchives,
              });

            if (error) {
              console.error('Supabase save error:', error);
              setSyncStatus(!navigator.onLine ? 'offline' : 'error');
            } else {
              setSyncStatus('saved');
            }
          } catch (err) {
            console.error('Cloud save failed:', err);
            setSyncStatus(!navigator.onLine ? 'offline' : 'error');
          }
        }, 500);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [activeSession, user, subjects, routine, attendanceRecords, semesterArchives, isCloudLoaded]);

  // Sync registered users index
  useEffect(() => {
    if (registeredUsers.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS_INDEX, JSON.stringify(registeredUsers));
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
    setSyncStatus('idle');
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  }, []);

  const exitDemoMode = useCallback(() => {
    const demoData: UserWorkspaceData = {
      user: DEFAULT_USER,
      subjects,
      routine,
      attendanceRecords,
      semesterArchives,
    };
    localStorage.setItem(STORAGE_KEYS.DEMO_WORKSPACE, JSON.stringify(demoData));

    setActiveSession(null);
    setUser(null);
    setSubjects([]);
    setRoutine([]);
    setAttendanceRecords([]);
    setSemesterArchives([]);
    setSyncStatus('idle');
    setIsCloudLoaded(false);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }, [subjects, routine, attendanceRecords, semesterArchives]);

  const loginAsGuest = enterDemoMode;

  // Sign up for a personal user account
  const register = useCallback(
    async (email: string, password?: string, name?: string, college?: string) => {
      const cleanEmail = normalizeEmail(email);
      const cleanName = (name || '').trim();

      const emailValidation = validateEmail(cleanEmail);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      const nameValidation = validateName(cleanName);
      if (!nameValidation.valid) {
        return { success: false, error: nameValidation.error };
      }

      // If Supabase is configured, use Supabase Authentication
      if (isSupabaseConfigured && supabase) {
        if (!password || password.length < 6) {
          return { success: false, error: 'Password must be at least 6 characters long.' };
        }

        try {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                name: cleanName,
                college: college?.trim() || undefined,
              },
            },
          });

          if (error) {
            return { success: false, error: formatSupabaseError(error) };
          }

          // If email confirmation is required by project settings
          if (data.user && !data.session) {
            return { success: true, emailConfirmationRequired: true };
          }

          if (data.user && data.session) {
            await handleSupabaseUserLogin(data.user);
          }

          return { success: true };
        } catch (err) {
          return { success: false, error: formatSupabaseError(err) };
        }
      }

      // Fallback: Local device registration if Supabase is unconfigured
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

      const emptyWorkspace: UserWorkspaceData = {
        user: newUser,
        subjects: [],
        routine: [],
        attendanceRecords: [],
        semesterArchives: [],
      };

      localStorage.setItem(
        `${STORAGE_KEYS.USER_WORKSPACE_PREFIX}${newUser.id}`,
        JSON.stringify(emptyWorkspace)
      );

      const updatedUsers = [...allKnownUsers, newUser];
      setRegisteredUsers(updatedUsers);
      localStorage.setItem(STORAGE_KEYS.USERS_INDEX, JSON.stringify(updatedUsers));

      const newSession: ActiveSession = { type: 'user', userId: newUser.id };
      setActiveSession(newSession);
      setUser(newUser);
      setSubjects([]);
      setRoutine([]);
      setAttendanceRecords([]);
      setSemesterArchives([]);
      setActiveTab('dashboard');
      setIsCloudLoaded(true);
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newSession));

      return { success: true };
    },
    [registeredUsers, handleSupabaseUserLogin]
  );

  // Sign in to an existing account
  const login = useCallback(
    async (email: string, password?: string) => {
      const cleanEmail = normalizeEmail(email);

      const emailValidation = validateEmail(cleanEmail);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      // If Supabase is configured, use Supabase Authentication
      if (isSupabaseConfigured && supabase) {
        if (!password) {
          return { success: false, error: 'Please enter your password.' };
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (error) {
            return { success: false, error: formatSupabaseError(error) };
          }

          if (data.user) {
            await handleSupabaseUserLogin(data.user);
          }

          return { success: true };
        } catch (err) {
          return { success: false, error: formatSupabaseError(err) };
        }
      }

      // Fallback: Local device sign-in if Supabase is unconfigured
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

      if (!foundUser) {
        const workspaceUsers = scanLocalWorkspaces();
        foundUser = workspaceUsers.find(u => normalizeEmail(u.email) === cleanEmail);
        if (foundUser) {
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
      setIsCloudLoaded(true);
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

      return { success: true };
    },
    [registeredUsers, handleSupabaseUserLogin]
  );

  // Password reset via Supabase email
  const resetPassword = useCallback(
    async (email: string) => {
      const cleanEmail = normalizeEmail(email);
      const emailValidation = validateEmail(cleanEmail);
      if (!emailValidation.valid) {
        return { success: false, error: emailValidation.error };
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: window.location.origin,
          });
          if (error) {
            return { success: false, error: formatSupabaseError(error) };
          }
          return { success: true };
        } catch (err) {
          return { success: false, error: formatSupabaseError(err) };
        }
      }

      return {
        success: false,
        error: 'Password reset requires Supabase. Please configure your .env file.',
      };
    },
    []
  );

  const logout = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out warning:', err);
      }
    }
    setActiveSession(null);
    setUser(null);
    setSubjects([]);
    setRoutine([]);
    setAttendanceRecords([]);
    setSemesterArchives([]);
    setSyncStatus('idle');
    setIsCloudLoaded(false);
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

  // Retry cloud sync manually
  const retrySync = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !user) return;
    setSyncStatus('syncing');
    try {
      const { error } = await supabase
        .from('user_workspaces')
        .upsert({
          user_id: user.id,
          email: user.email,
          name: user.name,
          college: user.college,
          semester_name: user.semesterName,
          subjects,
          routine,
          attendance_records: attendanceRecords,
          semester_archives: semesterArchives,
        });

      if (error) {
        setSyncStatus(!navigator.onLine ? 'offline' : 'error');
      } else {
        setSyncStatus('saved');
      }
    } catch {
      setSyncStatus(!navigator.onLine ? 'offline' : 'error');
    }
  }, [user, subjects, routine, attendanceRecords, semesterArchives]);

  // Import candidate local data into the authenticated cloud workspace
  const importLocalMigration = useCallback(async () => {
    if (!migrationCandidate || !user) return;

    const importedSubjects = migrationCandidate.subjects;
    const importedRoutine = migrationCandidate.routine;
    const importedRecords = migrationCandidate.attendanceRecords;
    const importedArchives = migrationCandidate.semesterArchives;

    setSubjects(importedSubjects);
    setRoutine(importedRoutine);
    setAttendanceRecords(importedRecords);
    setSemesterArchives(importedArchives);

    localStorage.setItem(`ack_migrated_${user.id}`, 'true');
    setMigrationCandidate(null);

    if (isSupabaseConfigured && supabase) {
      setSyncStatus('syncing');
      try {
        await supabase
          .from('user_workspaces')
          .upsert({
            user_id: user.id,
            email: user.email,
            name: user.name,
            college: user.college,
            semester_name: user.semesterName,
            subjects: importedSubjects,
            routine: importedRoutine,
            attendance_records: importedRecords,
            semester_archives: importedArchives,
          });
        setSyncStatus('saved');
      } catch (err) {
        console.warn('Migration cloud save failed:', err);
        setSyncStatus('error');
      }
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#3b82f6', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  }, [migrationCandidate, user]);

  const dismissMigration = useCallback(() => {
    if (user) {
      localStorage.setItem(`ack_migrated_${user.id}`, 'dismissed');
    }
    setMigrationCandidate(null);
  }, [user]);

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

  // Sample data loader
  const loadSampleData = () => {
    setSubjects(SAMPLE_SUBJECTS);
    setRoutine(SAMPLE_ROUTINE);
    setAttendanceRecords([]);
  };

  // Reset routine and attendance
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
        isSupabaseConfigured,
        syncStatus,
        theme,
        isOffline,
        subjects,
        routine,
        attendanceRecords,
        semesterArchives,
        registeredUsers,
        migrationCandidate,
        activeTab,
        setActiveTab,
        toggleTheme,
        login,
        register,
        resetPassword,
        enterDemoMode,
        exitDemoMode,
        loginAsGuest,
        logout,
        switchUser,
        retrySync,
        importLocalMigration,
        dismissMigration,
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
