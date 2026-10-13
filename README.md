# Attendance Check karo 🎓

> **check your attendance efficiently**

A modern, offline-first web application designed specifically for college students to track attendance, timetable routines, real-time bunk safety limits, and simulate future leaves with actionable recovery plans.

---

## ✨ Features & PRD Alignment

1. **Student Registration & Login**:
   - Register and login with email and password.
   - Demo student instant 1-click mode.
   - Local-first offline persistence — works 100% without internet.
2. **Subject & Timetable Routine Setup**:
   - Add subjects with type (Theory: default 75% goal, Lab: default 90% goal, or custom goal).
   - Custom timetable slots: Day, start/end time, subject, and **class units count** (e.g. 50 min = 1 class unit, double lectures like 10:40–12:20 = 2 class units).
3. **1-Tap Daily Attendance Marking**:
   - Today's routine automatically highlights today's classes.
   - Mark **Attended (Present)** (+N attended, +N total).
   - Mark **Missed (Absent)** (+0 attended, +N total).
   - Mark **Cancelled** (neutral: neither increases nor decreases attendance).
   - Instant undo support if marked accidentally.
4. **Real-time Target & Bunk Intelligence Engine**:
   - **Safe Bunk Cushion**: Tells you how many classes you can afford to bunk without dipping below your 75% or 90% goal:
     $$\text{Bunkable} = \left\lfloor \frac{100 \cdot \text{Attended}}{\text{Target}} - \text{Total} \right\rfloor$$
   - **Consecutive Classes Required**: If below target, calculates the exact number of consecutive classes you must attend:
     $$\text{Needed} = \left\lceil \frac{\text{Target} \cdot \text{Total} - 100 \cdot \text{Attended}}{100 - \text{Target}} \right\rceil$$
5. **Predictive Bunk & Leave Simulator (Feature 9)**:
   - **Tomorrow's Leave**: Simulates missing tomorrow's scheduled classes in 1 tap.
   - Calculates projected overall % and subject drops.
   - **Leave Management Plan**: Generates exact recovery instructions (e.g. *"To recover, you must attend the next 4 consecutive classes"*).
   - **Single Subject Slider**: Explore the exact curve of missing $1 \dots 15$ classes.
6. **Semester Transition (Feature 10)**:
   - Archive finished semesters into history with final scores.
   - Clear and reset routine for your upcoming semester.
7. **Offline Backup & Export**:
   - Export and import full backup JSON files anytime.
8. **Linear / Vercel Minimal Dark Aesthetic**:
   - Dark mode primary with seamless light mode switch.
   - Mobile responsive layout with bottom tab bar.

---

## 🚀 Getting Started

The project is located at:
`C:\Users\sunan\.gemini\antigravity\scratch\attendance-check-karo`

### Run Locally:
```bash
cd C:\Users\sunan\.gemini\antigravity\scratch\attendance-check-karo
npm install
npm run dev
```

Open **`http://localhost:5173/`** in your browser.
