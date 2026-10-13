import type { Subject, RoutineSlot, UserProfile } from '../types';

export const DEFAULT_USER: UserProfile = {
  id: 'usr_demo_1',
  email: 'student@college.edu',
  name: 'Aman Sharma',
  college: 'National Institute of Technology',
  semesterName: 'Semester 5 (Fall 2026)',
};

export const SAMPLE_SUBJECTS: Subject[] = [
  {
    id: 'sub_1',
    name: 'Industrial Instrumentation',
    code: 'EE-501',
    type: 'theory',
    targetPercentage: 75,
    attended: 19,
    total: 24, // 79.2% (Safe, 1 bunkable)
    color: '#10b981', // emerald
  },
  {
    id: 'sub_2',
    name: 'Professional Ethics & Values',
    code: 'HS-502',
    type: 'theory',
    targetPercentage: 75,
    attended: 14,
    total: 20, // 70.0% (Shortage! Needs 4 classes)
    color: '#6366f1', // indigo
  },
  {
    id: 'sub_3',
    name: 'Control Systems Engineering',
    code: 'EE-503',
    type: 'theory',
    targetPercentage: 75,
    attended: 22,
    total: 26, // 84.6% (Safe, 3 bunkable)
    color: '#06b6d4', // cyan
  },
  {
    id: 'sub_4',
    name: 'Instrumentation & Virtual Lab',
    code: 'EE-591',
    type: 'lab',
    targetPercentage: 90, // PRD item 8: lab classes desired attendance is 90%
    attended: 11,
    total: 12, // 91.7% (Safe, 0 bunkable)
    color: '#f59e0b', // amber
  },
  {
    id: 'sub_5',
    name: 'Digital Signal Processing',
    code: 'EC-504',
    type: 'theory',
    targetPercentage: 75,
    attended: 18,
    total: 22, // 81.8%
    color: '#ec4899', // pink
  },
];

export const SAMPLE_ROUTINE: RoutineSlot[] = [
  // Monday (as in PRD example)
  {
    id: 'slot_mon_1',
    day: 'Monday',
    subjectId: 'sub_1', // Industrial Instrumentation
    startTime: '09:50',
    endTime: '10:40',
    classUnits: 1, // 1 class
    room: 'Room 304',
  },
  {
    id: 'slot_mon_2',
    day: 'Monday',
    subjectId: 'sub_2', // Ethics
    startTime: '10:40',
    endTime: '12:20',
    classUnits: 2, // 2 classes (double slot)
    room: 'Hall B',
  },
  {
    id: 'slot_mon_3',
    day: 'Monday',
    subjectId: 'sub_3', // Control Systems
    startTime: '13:30',
    endTime: '14:20',
    classUnits: 1,
    room: 'Room 304',
  },

  // Tuesday
  {
    id: 'slot_tue_1',
    day: 'Tuesday',
    subjectId: 'sub_3',
    startTime: '09:50',
    endTime: '10:40',
    classUnits: 1,
    room: 'Room 304',
  },
  {
    id: 'slot_tue_2',
    day: 'Tuesday',
    subjectId: 'sub_5',
    startTime: '10:40',
    endTime: '11:30',
    classUnits: 1,
    room: 'Room 208',
  },
  {
    id: 'slot_tue_3',
    day: 'Tuesday',
    subjectId: 'sub_4', // Lab
    startTime: '13:30',
    endTime: '15:10',
    classUnits: 2, // 2 lab units
    room: 'Systems Lab',
  },

  // Wednesday
  {
    id: 'slot_wed_1',
    day: 'Wednesday',
    subjectId: 'sub_1',
    startTime: '09:50',
    endTime: '10:40',
    classUnits: 1,
    room: 'Room 304',
  },
  {
    id: 'slot_wed_2',
    day: 'Wednesday',
    subjectId: 'sub_2',
    startTime: '10:40',
    endTime: '11:30',
    classUnits: 1,
    room: 'Hall B',
  },
  {
    id: 'slot_wed_3',
    day: 'Wednesday',
    subjectId: 'sub_5',
    startTime: '11:30',
    endTime: '12:20',
    classUnits: 1,
    room: 'Room 208',
  },

  // Thursday
  {
    id: 'slot_thu_1',
    day: 'Thursday',
    subjectId: 'sub_1',
    startTime: '09:50',
    endTime: '10:40',
    classUnits: 1,
    room: 'Room 304',
  },
  {
    id: 'slot_thu_2',
    day: 'Thursday',
    subjectId: 'sub_3',
    startTime: '10:40',
    endTime: '12:20',
    classUnits: 2,
    room: 'Room 304',
  },

  // Friday
  {
    id: 'slot_fri_1',
    day: 'Friday',
    subjectId: 'sub_5',
    startTime: '09:50',
    endTime: '11:30',
    classUnits: 2,
    room: 'Room 208',
  },
  {
    id: 'slot_fri_2',
    day: 'Friday',
    subjectId: 'sub_2',
    startTime: '11:30',
    endTime: '12:20',
    classUnits: 1,
    room: 'Hall B',
  },
];
