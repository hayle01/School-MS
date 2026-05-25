# 🏫 Somalia School Management System (SMS)
## Complete AI Build Plan — MERN Stack

---

## PROJECT IDENTITY

**Project Name:** Dugsiga — Somalia School Management System
**Stack:** MongoDB + Express.js + React.js + Node.js (MERN)
**Target Users:** Primary schools, secondary schools, Islamic/Quranic schools, private academies, and multi-campus school groups across Somalia
**Languages:** Somali (primary UI), Arabic (secondary), English (admin/reporting)
**Currency:** Somali Shilling (SOS) — also support USD (widely used in Somalia)
**Calendar:** Gregorian calendar (primary), Hijri/Islamic calendar display alongside for religious events
**Time Zone:** Africa/Mogadishu (EAT, UTC+3)
**RTL Support:** Required — Arabic language mode must render full RTL layout
**SMS/Notifications:** Africa's Talking API (best coverage in Somalia) + WhatsApp Business API
**Deployment:** Cloud (AWS or Hetzner) + must work on low-bandwidth connections (optimize all payloads)
**Offline Support:** Core features must work on poor/intermittent internet (service workers + local caching)

---

## CONTEXT — BUILDING FOR SOMALIA

Build with these realities in mind:

1. **Connectivity is inconsistent** — pages must load fast on 2G/3G. No heavy assets on initial load. Lazy load everything. Compress all images. Target <100KB initial bundle.
2. **Mobile-first** — most parents and teachers access via smartphone, not desktop. Every screen must be fully functional on a 360px-wide screen.
3. **Somali language first** — all student-facing and parent-facing screens default to Somali. Admin screens default to Somali with English toggle.
4. **Two-semester academic year** — Semester 1 (October–February), Semester 2 (March–July). Ramadan break and Eid holidays must be configurable in the school calendar.
5. **Islamic studies is a core subject** — Quran memorization (Xifdhka Quraanka), Islamic studies (Diinta Islaamka), and Arabic are standard subjects. The grading system must accommodate Quran memorization tracking (Surah progress, Juz completion).
6. **Fee collection reality** — many parents pay fees in installments, in cash, via EVC Plus (Hormuud mobile money), or Zaad (Telesom). Payment integration must include these.
7. **Multi-language family names** — Somali names follow a patronymic system (first name + father's name + grandfather's name). The student name structure must reflect this, not "first name / last name."
8. **Gender-separated classes** — many Somali schools separate boys and girls. The class/section system must support gender segregation at classroom level.
9. **No fixed postal codes** — addresses are district-based (e.g., Hodan, Wadajir, Dharkenley in Mogadishu). Use district dropdowns, not free-text postal codes.
10. **Displaced student population** — fields for IDP (Internally Displaced Person) status and previous school tracking are important for UNICEF/NGO reporting.

---

## TECH STACK SPECIFICATION

```
Frontend:     React.js 18+ with Vite
Styling:      Tailwind CSS (RTL plugin for Arabic mode)
State:        Zustand (global), React Query (server state)
Forms:        React Hook Form + Zod validation
Charts:       Recharts
Real-time:    Socket.IO client
i18n:         react-i18next (Somali, Arabic, English)
PWA:          Vite PWA plugin (offline support, installable on mobile)
Icons:        Lucide React

Backend:      Node.js 20+ with Express.js
Auth:         JWT (access token 15min, refresh token 30 days), bcryptjs
Real-time:    Socket.IO
Jobs:         node-cron (scheduled tasks: attendance alerts, fee reminders, reports)
File Upload:  Multer + Cloudinary (student photos, documents)
PDF:          Puppeteer (report cards, certificates, fee receipts)
Email:        Nodemailer + SendGrid
SMS:          Africa's Talking Node.js SDK
WhatsApp:     WhatsApp Business Cloud API (Meta)
Validation:   Joi or Zod (backend)
Logging:      Winston + Morgan

Database:     MongoDB Atlas
ODM:          Mongoose 7+
Cache:        Redis (sessions, OTP, rate limiting, frequent lookups)
Search:       MongoDB Atlas Search (student/staff global search)

Infrastructure:
  - Docker + docker-compose (local dev)
  - GitHub Actions CI/CD
  - Nginx reverse proxy
  - PM2 process manager
  - AWS S3 or Cloudinary for file storage
```

---

## DATABASE DESIGN PRINCIPLES

1. Every document carries `schoolId` — all queries scoped by it (multi-tenant)
2. Soft deletes only — `isDeleted: true, deletedAt, deletedBy` — never hard delete
3. Every financial transaction is append-only — no updates, only reversals
4. Student records are immutable history — use versioning for changes
5. All timestamps in UTC, display converted to EAT (Africa/Mogadishu)
6. Index on: `schoolId`, `academicYearId`, `classId`, `studentId`, `status`, `createdAt`
7. Store student full name in three separate fields: `firstName`, `fatherName`, `grandfatherName`
8. Denormalize names on transaction documents (fees, marks, attendance) — names change, historical records must preserve the name at time of record

---

## MODULE ARCHITECTURE

Build as a monorepo:

```
/
├── client/               # React frontend
│   ├── src/
│   │   ├── modules/      # One folder per module
│   │   ├── components/   # Shared UI components
│   │   ├── hooks/        # Custom hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── locales/      # so.json, ar.json, en.json
│   │   └── utils/
├── server/               # Express backend
│   ├── modules/          # One folder per module (routes, controllers, services, models)
│   ├── middleware/        # auth, rbac, validate, upload, rateLimiter
│   ├── utils/
│   └── jobs/             # cron jobs
├── shared/               # Types and constants shared between client and server
└── docker-compose.yml
```

---

## MODULE 1 — AUTHENTICATION & MULTI-TENANCY

### Data Models

```javascript
// School (Tenant)
{
  _id, name_so, name_en, name_ar,   // name in all three languages
  logo, address, district, region,
  phone, email, website,
  schoolType: enum['primary','secondary','both','islamic','private'],
  registrationNumber,               // Ministry of Education registration
  principalName,
  academicYearStart: Month,         // e.g., "October"
  semesterStructure: [{semesterNumber, startMonth, endMonth}],
  islamicSchool: Boolean,           // enables Quran tracking module
  genderPolicy: enum['mixed','boys_only','girls_only','separated_classes'],
  currency: enum['SOS','USD'],
  smsEnabled: Boolean,
  whatsappEnabled: Boolean,
  timezone: "Africa/Mogadishu",
  isActive, createdAt
}

// User
{
  _id, schoolId, name, phone, email,
  passwordHash, role, staffId,      // linked to Staff record if teacher/admin
  language: enum['so','ar','en'],   // preferred UI language
  isActive, lastLogin,
  refreshTokens: [{ token, expiresAt, deviceInfo }],
  twoFactorEnabled, twoFactorSecret,
  passwordResetOTP, passwordResetExpiry,
  createdAt, updatedAt
}
```

### Roles & Permissions

```
SUPER_ADMIN     — can manage all schools (for SaaS operator)
SCHOOL_ADMIN    — full access within their school
PRINCIPAL       — academic oversight, reports, cannot change fees
VICE_PRINCIPAL  — same as principal with delegation
HEAD_TEACHER    — manage their grade/department
CLASS_TEACHER   — manage their class, enter marks and attendance
SUBJECT_TEACHER — enter marks and attendance for their subjects only
ACCOUNTANT      — fee management, financial reports, no academic data
RECEPTIONIST    — student registration, attendance view, parent comms
LIBRARIAN       — library module only
PARENT          — view their own children's data only
STUDENT         — view their own data, timetable, results (senior students)
```

### Auth Endpoints

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password        — sends OTP via SMS
POST   /api/auth/verify-otp
POST   /api/auth/reset-password
GET    /api/auth/me
PUT    /api/auth/change-password
POST   /api/auth/setup-2fa
POST   /api/auth/verify-2fa
```

### Security Requirements

- Rate limit login: 5 attempts per 15 minutes per IP
- OTP for password reset: 6-digit, expires in 10 minutes, sent via SMS
- JWT access token: 15 minutes
- Refresh token: 30 days, stored in httpOnly cookie
- All routes behind `authenticate` middleware
- All data routes behind `authorizeRole([...roles])` middleware
- Audit log every login, logout, and failed attempt

---

## MODULE 2 — ACADEMIC YEAR & SCHOOL CALENDAR

### Data Models

```javascript
// AcademicYear
{
  _id, schoolId,
  name: "2024-2025",
  startDate, endDate,
  semesters: [{
    semesterNumber: 1 | 2,
    name_so, name_en,
    startDate, endDate,
    isActive
  }],
  isActive, isCurrent,
  createdBy, createdAt
}

// CalendarEvent
{
  _id, schoolId, academicYearId,
  title_so, title_en, title_ar,
  type: enum['holiday','exam','event','eid','ramadan','national_day','meeting','sports','other'],
  startDate, endDate,
  isFullDay: Boolean,
  description,
  affectsAttendance: Boolean,   // if true, absent on this day is not counted
  isPublic: Boolean,            // visible to parents/students
  createdBy
}
```

### Key Features

- Create academic year with two semesters
- Populate default Somali public holidays: Somali Independence Day (July 1), Eid Al-Fitr (calculated from Hijri), Eid Al-Adha, Prophet's Birthday (Mawlid), Labour Day (May 1), Foundation Day (October 21)
- Ramadan block: mark dates, auto-adjust school hours during Ramadan
- Exam periods block out on calendar
- Calendar visible to teachers, parents, and students
- Export calendar as PDF or iCal
- Hijri date shown alongside Gregorian date on all calendar views

### Endpoints

```
GET    /api/academic-years                      — list all
POST   /api/academic-years                      — create
PUT    /api/academic-years/:id                  — update
POST   /api/academic-years/:id/activate         — set as current year
GET    /api/academic-years/:id/calendar         — get full calendar
POST   /api/calendar-events                     — add event
PUT    /api/calendar-events/:id
DELETE /api/calendar-events/:id
GET    /api/calendar-events?month=&year=        — filtered view
```

---

## MODULE 3 — CLASSES, SECTIONS & SUBJECTS

### Data Models

```javascript
// Grade (e.g., Grade 1, Grade 2 ... Grade 12, KG1, KG2)
{
  _id, schoolId,
  name_so, name_en,        // e.g., "Fasalka 1aad", "Grade 1"
  level: Number,           // for sorting: KG1=0, KG2=1, G1=2 ... G12=13
  schoolSection: enum['kindergarten','primary','secondary'],
  isActive
}

// Class (a section within a grade, e.g., Grade 7A Boys)
{
  _id, schoolId, gradeId, academicYearId,
  name,                    // e.g., "7A", "7B"
  gender: enum['boys','girls','mixed'],
  classTeacherId,          // ref to Staff
  roomNumber,
  maxCapacity,
  currentEnrollment,       // computed or maintained
  isActive
}

// Subject
{
  _id, schoolId,
  name_so, name_en, name_ar,
  code,                    // e.g., "MATH-001", "QURAN-001"
  category: enum['core','islamic','language','elective','physical'],
  isIslamicSubject: Boolean,
  isQuranSubject: Boolean, // special tracking enabled
  passMark: Number,        // default 50, configurable
  totalMarks: Number,      // default 100
  isActive
}

// ClassSubject (links subjects to classes with teacher assignment)
{
  _id, schoolId, classId, subjectId, academicYearId,
  teacherId,               // ref to Staff
  periodsPerWeek: Number,
  isActive
}
```

### Key Features

- Grade hierarchy: Kindergarten → Primary (Grades 1–8) → Secondary (Grades 9–12)
- Multiple sections per grade (A, B, C...) with optional gender separation
- Class teacher assignment per class
- Subject teacher assignment per class-subject
- Subject catalog with Islamic subjects flagged separately
- Quran subjects get special marking interface (Surah tracking)
- Class capacity management with enrollment count
- Bulk subject assignment to multiple classes

### Endpoints

```
CRUD   /api/grades
CRUD   /api/classes
CRUD   /api/subjects
POST   /api/classes/:id/assign-teacher
POST   /api/classes/:id/subjects               — assign subjects to class
GET    /api/classes/:id/subjects               — get subjects with teachers
GET    /api/grades/:id/classes                 — classes in a grade
```

---

## MODULE 4 — STUDENT REGISTRATION & PROFILES

### Data Models

```javascript
// Student
{
  _id, schoolId,
  
  // Identity — Somali naming convention
  firstName,               // Magaca: e.g., "Faadumo"
  fatherName,              // Aabaha: e.g., "Maxamed"
  grandfatherName,         // Awoowe: e.g., "Axmed"
  fullName,                // computed: "Faadumo Maxamed Axmed"
  
  gender: enum['male','female'],
  dateOfBirth,
  placeOfBirth,
  nationality: default "Somali",
  religion: default "Islam",
  
  // Somalia-specific fields
  idpStatus: Boolean,                          // Internally Displaced Person
  idpOriginRegion,                             // if IDP, where from
  clan,                                        // optional — sensitive field, access restricted
  
  // Contact
  phone,                                       // student's own phone (if applicable)
  homeDistrict,                                // Hodan, Wadajir, etc.
  homeRegion,                                  // Banadir, Jubbaland, etc.
  homeAddress,                                 // free text description
  
  // Academic
  studentId,                                   // auto-generated school ID: e.g., "DGS-2024-001"
  admissionDate,
  admissionNumber,
  previousSchool,
  previousClass,
  transferCertificateNumber,
  
  // Health
  bloodGroup,
  medicalConditions,
  allergies,
  emergencyMedicalInfo,
  
  // Status
  status: enum['active','inactive','transferred','graduated','expelled','deceased'],
  statusChangeDate,
  statusChangeReason,
  
  // Photo
  photoUrl,
  
  // Metadata
  createdBy, createdAt, updatedAt,
  isDeleted, deletedAt
}

// StudentEnrollment (links student to class per academic year)
{
  _id, schoolId, studentId, classId, gradeId, academicYearId,
  enrollmentDate,
  rollNumber,              // sequential number within the class
  isRepeating: Boolean,   // held back from previous year
  status: enum['active','transferred_out','withdrawn','completed'],
  transferredToSchool,     // if transferred
  createdAt
}

// Guardian (parent/guardian linked to student)
{
  _id, schoolId, studentId,
  relationship: enum['father','mother','uncle','aunt','grandfather','grandmother','sibling','guardian','other'],
  name, phone, phone2,
  occupation,
  isEmergencyContact: Boolean,
  isPrimaryContact: Boolean,   // receives all notifications
  hasPortalAccess: Boolean,
  userId,                      // linked User account if portal access enabled
  createdAt
}
```

### Student ID Generation

Format: `[SCHOOL_CODE]-[YEAR]-[SEQUENCE]`
Example: `DGS-2024-0047`

Auto-increment sequence per school per year. Sequence resets each academic year.

### Key Features

- Three-part Somali name entry (not first/last name)
- Bulk student import via Excel template
- Student photo upload with automatic resize/compress
- Student search: by name (any part), student ID, phone, guardian phone
- IDP tracking for NGO/UNICEF reporting
- Previous school and transfer history
- Student profile timeline: all academic years, classes, marks, fees, attendance
- Transfer out workflow: generates transfer certificate PDF
- Re-enrollment: returning student finds existing record, creates new enrollment
- Sibling detection: flag when students share same father/grandfather name + guardian phone
- Student card generation (PDF with photo, name, class, school year)

### Endpoints

```
POST   /api/students                            — register new student
GET    /api/students                            — list with filters (class, grade, status, gender)
GET    /api/students/:id                        — full profile
PUT    /api/students/:id                        — update profile
POST   /api/students/:id/enroll                 — enroll in class for academic year
POST   /api/students/:id/transfer               — transfer to another school
POST   /api/students/:id/guardians              — add guardian
PUT    /api/students/:id/guardians/:gid         — update guardian
DELETE /api/students/:id/guardians/:gid         — remove guardian
GET    /api/students/:id/academic-history       — all years, classes, results
GET    /api/students/:id/fee-history
GET    /api/students/:id/attendance-summary
POST   /api/students/bulk-import                — Excel upload
GET    /api/students/:id/card                   — generate student card PDF
GET    /api/students/search?q=                  — global search
```

---

## MODULE 5 — STAFF MANAGEMENT

### Data Models

```javascript
// Staff
{
  _id, schoolId,
  
  // Identity — same Somali naming convention
  firstName, fatherName, grandfatherName, fullName,
  gender, dateOfBirth, nationality,
  
  // Contact
  phone, phone2, email,
  homeDistrict, homeRegion, homeAddress,
  
  // Employment
  staffId,                 // e.g., "STF-2024-001"
  role: enum['teacher','vice_principal','principal','accountant','receptionist','librarian','counselor','driver','cleaner','security','other'],
  department,              // e.g., "Science Department", "Islamic Studies"
  employmentType: enum['permanent','contract','part_time','volunteer'],
  joinDate,
  contractEndDate,         // for contract staff
  salary,
  salaryType: enum['monthly','daily','per_subject'],
  bankName, bankAccount,   // for salary payment
  evcPlusNumber,           // EVC Plus mobile money for salary
  
  // Qualifications
  highestQualification: enum['primary','secondary','diploma','degree','masters','phd','other'],
  qualificationField,      // e.g., "Mathematics Education"
  teachingLicense,
  teachingLicenseExpiry,
  
  // Subjects taught
  subjectSpecializations: [subjectId],
  
  // Status
  status: enum['active','on_leave','terminated','resigned','deceased'],
  
  photoUrl,
  documents: [{ type, name, url, uploadedAt }],
  
  createdBy, createdAt, updatedAt
}
```

### Key Features

- Staff registration with qualification tracking
- Teaching subject assignment (a teacher can teach multiple subjects)
- Class-teacher assignment (each class has one class teacher)
- Staff documents vault (contracts, certificates, IDs)
- Teaching license expiry alerts (60/30/7 days before)
- Staff directory with photo grid view
- Staff attendance (separate from student attendance)
- Payroll integration (salary processing)
- Staff performance notes
- Termination workflow with exit checklist

### Endpoints

```
CRUD   /api/staff
POST   /api/staff/:id/assign-class             — assign as class teacher
POST   /api/staff/:id/assign-subjects          — link subject specializations
GET    /api/staff/:id/classes                  — classes they teach
GET    /api/staff/:id/timetable                — their weekly schedule
POST   /api/staff/:id/documents                — upload document
GET    /api/staff/directory                    — photo directory view
```

---

## MODULE 6 — TIMETABLE / SCHEDULE MANAGEMENT

### Data Models

```javascript
// Period (school time slots)
{
  _id, schoolId,
  name_so, name_en,        // e.g., "Wakhtiga 1aad", "Period 1"
  startTime,               // "08:00"
  endTime,                 // "08:45"
  isBreak: Boolean,        // Jilif, Qunsul (lunch break), Prayer break
  prayerBreak: Boolean,    // Zuhr prayer break
  dayType: enum['regular','friday'],   // Friday has shorter hours in Somalia
  order: Number
}

// TimetableEntry
{
  _id, schoolId, academicYearId, classId,
  dayOfWeek: enum['sunday','monday','tuesday','wednesday','thursday'],
  // Note: Somali school week is Sunday–Thursday (Friday is Jumu'ah)
  periodId,
  subjectId,
  teacherId,
  roomNumber,
  semester: 1 | 2 | 'both',
  createdAt
}
```

### Key Features

- Somali school week: Sunday to Thursday (5 days — Friday is Jumu'ah, no school)
- Friday prayer break automatically inserted in daily schedule
- Period definitions with prayer breaks marked
- Drag-and-drop timetable builder (visual weekly grid)
- Teacher conflict detection: same teacher cannot be in two classes at same time
- Room conflict detection
- Timetable published to teachers and students
- Print timetable per class, per teacher
- Substitution management: when a teacher is absent, record substitute teacher
- Timetable visible to parents in portal

### Endpoints

```
GET    /api/timetable/periods                  — get period slots
POST   /api/timetable/periods                  — configure school periods
GET    /api/timetable/:classId                 — class weekly timetable
POST   /api/timetable/:classId                 — save timetable entries
GET    /api/timetable/teacher/:teacherId        — teacher's weekly schedule
POST   /api/timetable/check-conflicts          — validate before saving
GET    /api/timetable/:classId/print           — PDF timetable
POST   /api/timetable/substitutions            — record substitute
```

---

## MODULE 7 — ATTENDANCE MANAGEMENT

### Data Models

```javascript
// AttendanceSession
{
  _id, schoolId, classId, academicYearId,
  date,
  semesterId,
  takenBy: staffId,        // teacher who took attendance
  takenAt: DateTime,
  periodId,                // if period-level attendance (optional)
  isSaved: Boolean,
  totalPresent, totalAbsent, totalLate, totalExcused,
  notes
}

// AttendanceRecord (one per student per session)
{
  _id, schoolId, sessionId, studentId, classId,
  date,
  status: enum['present','absent','late','excused','holiday'],
  lateMinutes: Number,     // if status is 'late'
  excuseReason,            // if status is 'excused'
  excuseDocument,          // URL of uploaded excuse letter if any
  notificationSent: Boolean,
  createdAt
}

// StaffAttendance
{
  _id, schoolId, staffId, date,
  status: enum['present','absent','late','on_leave','holiday'],
  checkInTime, checkOutTime,
  leaveType,               // if on_leave
  notes
}
```

### Attendance Flow

1. Teacher opens attendance module for their class
2. System shows today's date and class roster in order of roll number
3. Teacher marks each student: Present (P) / Absent (A) / Late (L) / Excused (E)
4. One-tap "Mark All Present" then adjust exceptions — fastest workflow
5. On save: parents of absent students receive SMS/WhatsApp immediately
6. Attendance locked after 2 hours (prevent backdating) — admin can unlock
7. Holiday dates (from calendar) auto-mark as no session

### SMS Message on Absence (Somali)

```
"[Student Name] ma yimid dugsiga maanta [Date]. Haddaad
xog u leedahay fadlan la xiriir dugsiga: [School Phone]"

Translation: "[Student Name] did not come to school today [Date].
If you have information please contact the school: [School Phone]"
```

### Key Features

- Daily attendance per class (morning register)
- Optional period-by-period attendance for secondary
- Bulk attendance for the whole school (assembly)
- Automatic SMS/WhatsApp to parents when student is absent
- Consecutive absence alert: 3+ days absent triggers escalation notification
- Attendance statistics per student: present days, absent days, late days, attendance %
- Monthly attendance report per class
- Annual attendance for report card calculation
- Attendance required for exam eligibility (configurable threshold: e.g., 75%)
- Excuse letter upload and approval
- Class attendance dashboard with real-time counts

### Endpoints

```
POST   /api/attendance                          — save attendance session
GET    /api/attendance/:classId?date=           — get attendance for class on date
PUT    /api/attendance/:sessionId               — update session
GET    /api/attendance/student/:id?from=&to=    — student attendance history
GET    /api/attendance/student/:id/summary      — totals and percentage
GET    /api/attendance/class/:id/monthly        — monthly class report
GET    /api/attendance/school/daily             — school-wide daily summary
POST   /api/attendance/bulk-upload              — Excel bulk upload
GET    /api/attendance/alerts/consecutive-absent — students absent 3+ days
```

---

## MODULE 8 — MARKS & EXAMINATION MANAGEMENT

### Data Models

```javascript
// ExamType
{
  _id, schoolId,
  name_so, name_en,
  code,                    // e.g., "CA1", "MID", "FINAL"
  type: enum['continuous_assessment','midterm','final','mock','internal','external'],
  maxMark: Number,         // e.g., 30 for CA, 70 for final
  passMark: Number,
  weight: Number,          // percentage weight in overall calculation
  semesterId,
  order: Number,           // for display order
  isActive
}

// ExamSchedule
{
  _id, schoolId, academicYearId, semesterId,
  examTypeId,
  classId,
  subjectId,
  date, startTime, endTime,
  room,
  invigilatorId,
  status: enum['scheduled','in_progress','completed','cancelled']
}

// MarkEntry
{
  _id, schoolId, academicYearId, semesterId,
  studentId, classId, subjectId, examTypeId,
  marksObtained: Number,
  maxMarks: Number,
  isAbsent: Boolean,       // was absent for this exam
  enteredBy: staffId,
  verifiedBy: staffId,
  isVerified: Boolean,
  isPublished: Boolean,    // visible to parents/students after publishing
  remarks,
  createdAt, updatedAt
}

// QuranProgress (special model for Quran memorization)
{
  _id, schoolId, studentId, academicYearId, semesterId,
  teacherId,
  surahsCompleted: [{ surahNumber, surahName, completedDate, grade }],
  juzCompleted: [Number],
  totalSurahsTarget: Number,
  currentHifdhLevel,       // how much of Quran memorized overall
  tajweedMark: Number,     // pronunciation/recitation mark
  memorisationMark: Number,
  totalMark: Number,
  remarks
}
```

### Grading Scale (Somalia Standard)

```javascript
const GRADING_SCALE = [
  { min: 90, max: 100, grade: 'A+', label_so: 'Aad u wanaagsan', label_en: 'Excellent' },
  { min: 80, max: 89,  grade: 'A',  label_so: 'Wanaagsan',       label_en: 'Very Good' },
  { min: 70, max: 79,  grade: 'B',  label_so: 'Ku filan',         label_en: 'Good' },
  { min: 60, max: 69,  grade: 'C',  label_so: 'Dhexdhexaad',      label_en: 'Average' },
  { min: 50, max: 59,  grade: 'D',  label_so: 'Hooseeya',         label_en: 'Below Average' },
  { min: 0,  max: 49,  grade: 'F',  label_so: 'Ku guuldarraystay','label_en': 'Fail' },
];
```

### Marks Calculation

```
Overall Mark = (CA1 × weight%) + (CA2 × weight%) + (Midterm × weight%) + (Final × weight%)

Example:
  CA1:     15 marks  (15%)
  CA2:     15 marks  (15%)
  Midterm: 30 marks  (30%)
  Final:   40 marks  (40%)
  Total:  100 marks (100%)
```

### Key Features

- Exam type configuration with weights per school
- Exam schedule with invigilator assignment
- Teacher mark entry interface: spreadsheet-like grid for fast entry
- Marks validation: cannot exceed max marks, warn on unusually low/high
- Two-teacher verification workflow for final exams
- Marks publish/unpublish by admin (released to parents only when published)
- Automatic grade calculation from marks
- Position/rank within class per subject and overall
- Subject pass/fail tracking
- Quran memorization tracker: Surah-by-Surah, Juz-by-Juz progress
- Failed subject list for remedial class assignment
- Marks history across all exam types for a student

### Endpoints

```
CRUD   /api/exam-types
CRUD   /api/exam-schedules
POST   /api/marks/entry                        — save mark entries (bulk array)
GET    /api/marks/:classId/:examTypeId/:subjectId — get mark sheet
PUT    /api/marks/:id/verify                   — second teacher verification
POST   /api/marks/publish                      — publish marks to parents
GET    /api/marks/student/:id                  — all marks for student
GET    /api/marks/class/:id/summary            — class performance summary
GET    /api/marks/subject/:id/analytics        — subject performance analysis
POST   /api/quran-progress                     — save Quran progress
GET    /api/quran-progress/:studentId          — get Quran progress
```

---

## MODULE 9 — REPORT CARDS & CERTIFICATES

### Report Card Content (Per Student Per Semester)

```
School Header (Logo, Name, Address)
Student: [Full Name in Somali & English] | Class: [Class] | Roll No: [X]
Academic Year: [Year] | Semester: [1/2]

Subject Results Table:
┌──────────────────┬────┬────┬───────┬───────┬───────┬───────┬──────┐
│ Subject          │CA1 │CA2 │Midterm│ Final │ Total │ Grade │ Rank │
├──────────────────┼────┼────┼───────┼───────┼───────┼───────┼──────┤
│ Xisaab (Maths)   │ 14 │ 13 │  26   │  35   │  88   │   A   │  2   │
│ Carabi (Arabic)  │ 12 │ 14 │  24   │  32   │  82   │   A   │  4   │
│ Xifdhka Quraanka │  - │  - │   -   │   -   │  90   │  A+   │  1   │
└──────────────────┴────┴────┴───────┴───────┴───────┴───────┴──────┘

Overall Total: [X/100] | Overall Grade: [A] | Class Position: [X of Y]
Attendance: Present [X] days | Absent [X] days | Late [X] days | %: [X%]

Conduct: [Excellent/Good/Average/Needs Improvement]
Class Teacher Remarks: [Free text]
Principal Signature ________________  Class Teacher Signature ________________
Next Term Begins: [Date]
Fee Balance Outstanding: [Amount] (if configured to show)
```

### Certificates to Generate

1. **Report Card** (Warqadda Natiijada) — semester and annual
2. **Completion Certificate** (Shahaadada Dhamaystirka) — end of grade
3. **Transfer Certificate** (Warqadda Wareejinta) — when student transfers
4. **Enrollment Certificate** (Xaqiijinta Diiwaan-galinta) — proof of enrollment
5. **Good Conduct Certificate** (Shahaadada Dhaqanka Wanaagsan)
6. **Scholarship Letter** (Warqadda Deeqda Waxbarasho)
7. **Quran Completion Certificate** (Shahaadada Xifdhka Quraanka) — for Quran students

### Key Features

- Bulk report card generation (entire class, entire grade, entire school)
- Individual report card generation and download
- Report card templates customizable per school (logo, colors, layout)
- Watermark for official copies
- Report card publishing date (parents see in portal only after publish)
- SMS notification to parents when report card is ready
- Print optimization: A4, double-sided option
- Three languages on report card: Somali labels, English labels, subject names in Arabic

### Endpoints

```
GET    /api/report-cards/:studentId/:semesterId    — generate single report card PDF
POST   /api/report-cards/bulk/:classId             — generate all in class (ZIP)
POST   /api/report-cards/bulk/:gradeId             — generate all in grade
GET    /api/certificates/:type/:studentId          — generate specific certificate
POST   /api/report-cards/publish/:semesterId       — publish to parent portal
```

---

## MODULE 10 — FEE MANAGEMENT & BILLING

### Data Models

```javascript
// FeeStructure
{
  _id, schoolId, academicYearId,
  name_so, name_en,
  gradeId,                 // which grade this applies to (or null for all)
  feeType: enum['tuition','registration','exam','uniform','activity','library','transport','meal','other'],
  amount: Number,
  currency: enum['SOS','USD'],
  frequency: enum['once','per_semester','per_term','monthly','annual'],
  dueDate,
  lateFeeEnabled: Boolean,
  lateFeeAmount: Number,   // per month overdue
  isCompulsory: Boolean,
  description_so, description_en
}

// StudentFeeAssignment (generated from FeeStructure per student)
{
  _id, schoolId, studentId, feeStructureId, academicYearId,
  totalAmount,
  discount: { type, amount, reason, approvedBy },
  scholarship: { percentage, reason },
  netPayable,              // totalAmount - discount - scholarship
  status: enum['unpaid','partial','paid','waived','overdue']
}

// Payment
{
  _id, schoolId, studentId, academicYearId,
  receiptNumber,           // auto-generated: "DGS-2024-00457"
  payments: [{             // a payment can cover multiple fees
    feeAssignmentId,
    feeTypeName,
    amountPaid
  }],
  totalPaid,
  paymentMethod: enum['cash','evc_plus','zaad','sahal','premier_bank','dahabshiil','bank_transfer','other'],
  mobileMoneyNumber,       // if mobile money payment
  transactionReference,    // mobile money transaction ID
  receivedBy: staffId,
  notes,
  isVoid: Boolean,
  voidReason, voidedBy, voidedAt,
  receiptPrinted: Boolean,
  createdAt
}

// FeeReminder (log of reminders sent)
{
  _id, schoolId, studentId,
  message, channel: enum['sms','whatsapp'],
  sentAt, sentBy,
  response            // if parent replied
}
```

### Payment Methods (Somalia-specific)

```
Cash                 — most common, cashier records manually
EVC Plus             — Hormuud Telecom mobile money (most popular)
Zaad                 — Telesom mobile money (Somaliland)
Sahal                — Somtel mobile money
Premier Bank         — bank transfer
Dahabshiil           — money transfer / remittance
Other bank transfer
```

### Receipt Number Format

`[SCHOOL_CODE]-[YEAR]-[5-DIGIT-SEQUENCE]`
Example: `DGS-2024-00457`

Sequence auto-increments per school per year. Never resets mid-year.

### Key Features

- Fee structure setup per grade per academic year
- Automatic assignment of fees to enrolled students
- Discount and scholarship management with approval workflow
- Sibling discount (e.g., 10% off for second child, 20% off for third)
- Payment recording for all Somalia payment methods
- Mobile money verification: enter transaction ID to confirm EVC Plus payment
- Auto-generated receipt with school logo (printable and SMS-able)
- Outstanding fee report: who owes what
- Overdue fee list with last payment date
- Automatic late fee addition after due date
- Bulk fee reminder: SMS all parents with outstanding fees
- Fee collection daily summary for accountant
- Exam blocking: system warns (or blocks) student from exam sitting if fees outstanding
- Fee waiver workflow: principal approval required for full waiver
- Revenue reports: collected per fee type, per grade, per period
- Parent portal: view fee statement, outstanding balance, download receipts

### Installment Plans

```javascript
// Allow parents to pay in installments
{
  feeAssignmentId,
  installments: [
    { dueDate, amount, status: 'paid'|'pending'|'overdue', paidAmount, paidDate }
  ]
}
```

### Endpoints

```
CRUD   /api/fee-structures
POST   /api/fee-structures/:id/assign-to-grade    — assign to all enrolled students
GET    /api/fees/student/:id                      — student's fee statement
POST   /api/payments                              — record payment
GET    /api/payments/:id/receipt                  — PDF receipt
POST   /api/payments/:id/void                     — void payment (admin)
GET    /api/fees/outstanding                      — all students with outstanding fees
GET    /api/fees/overdue                          — overdue fees
POST   /api/fees/discounts                        — apply discount
POST   /api/fees/reminders/bulk                   — send SMS reminders
GET    /api/fees/collection-report?from=&to=      — daily/monthly collection
GET    /api/fees/revenue-report                   — by fee type and grade
POST   /api/fees/installment-plan                 — create installment plan
```

---

## MODULE 11 — COMMUNICATION & NOTIFICATIONS

### Data Models

```javascript
// Announcement
{
  _id, schoolId,
  title_so, title_en,
  body_so, body_en,
  targetAudience: enum['all','parents','teachers','students','class','grade'],
  targetClassIds: [classId],    // if targeted to specific classes
  targetGradeIds: [gradeId],
  channel: ['portal','sms','whatsapp'],
  priority: enum['normal','urgent','emergency'],
  scheduledAt,              // null = send immediately
  sentAt,
  sentCount,
  failedCount,
  createdBy,
  createdAt
}

// MessageLog
{
  _id, schoolId,
  recipientType: enum['parent','student','teacher'],
  recipientId,
  recipientPhone,
  channel: enum['sms','whatsapp'],
  messageType: enum['announcement','fee_reminder','attendance_alert','result','exam_reminder','custom'],
  body,
  status: enum['queued','sent','delivered','failed'],
  externalId,               // Africa's Talking message ID
  cost,                     // SMS cost tracking
  createdAt
}
```

### Notification Triggers (Automatic)

| Event | Recipients | Channel | Timing |
|---|---|---|---|
| Student absent | Parents | SMS + WhatsApp | Same day by 9 AM |
| 3+ consecutive absences | Parents | SMS + WhatsApp | Immediate |
| Fee overdue | Parents | SMS | Weekly on Monday |
| Exam schedule published | Parents + Students | SMS + Portal | On publish |
| Marks published | Parents | SMS + Portal | On publish |
| School announcement | Target audience | SMS + Portal | On demand |
| Fee receipt | Parents | SMS (receipt number) | On payment |
| Upcoming exam reminder | Parents + Students | SMS | 2 days before |
| Report card ready | Parents | SMS | On publish |
| School closure (emergency) | All parents | SMS + WhatsApp | Immediate |
| Teacher absent (substitution) | Students' parents | SMS | Morning |

### Announcement Builder

- Rich text editor for portal announcements
- Plain text for SMS (max 160 chars with continuation)
- Audience targeting: all parents, specific class, specific grade, teachers only
- Schedule for future sending
- Template library: common school announcements pre-written in Somali

### SMS Template Examples (Somali)

```
Fee Reminder:
"Waalidka [Student Name]: Khidmadda waxbarasho ee [Amount] SOS ayaa
dib loo dhigay. Fadlan bixi si carruurtu u sii wadaan barashada.
Dugsiga: [Phone]"

Exam Reminder:
"Xaafiiska Imtixaanka: [Student Name] wuxuu lahaanayaa imtixaan
[Subject] maalinta [Date] saacadda [Time]. Fadlan diyaari."

Result Published:
"Natiijada [Semester] ee [Student Name] hadda waa la daabacay.
Booqo portal-ka ama kaalay dugsiga."
```

### Endpoints

```
POST   /api/announcements                      — create announcement
GET    /api/announcements                      — list (with filters)
POST   /api/announcements/:id/send             — send to audience
POST   /api/notifications/custom-sms           — send custom SMS
GET    /api/notifications/log                  — message log with status
GET    /api/notifications/sms-balance          — Africa's Talking balance
POST   /api/notifications/test                 — test SMS configuration
```

---

## MODULE 12 — LIBRARY MANAGEMENT

### Data Models

```javascript
// Book
{
  _id, schoolId,
  isbn, title_so, title_en, title_ar,
  author, publisher, publishYear,
  category: enum['textbook','islamic','arabic','fiction','reference','quran','other'],
  language: enum['somali','arabic','english','other'],
  totalCopies, availableCopies,
  shelfLocation,           // e.g., "A-3-2" (section-shelf-position)
  coverImageUrl,
  isActive
}

// BookLoan
{
  _id, schoolId, bookId,
  borrowerType: enum['student','staff'],
  borrowerId,
  issuedDate, dueDate, returnedDate,
  status: enum['issued','returned','overdue','lost'],
  fineAmount,
  finePaid: Boolean,
  issuedBy: staffId,
  returnedTo: staffId
}
```

### Key Features

- Book catalog with category system (including Quran and Islamic books)
- Barcode-based book issue and return
- Loan period configuration (default 14 days, configurable)
- Overdue tracking with fine calculation
- Reservation system: reserve a book when all copies are out
- Popular books report
- Student borrowing history
- Overdue SMS reminder to students/parents
- Lost book fine (configurable multiplier of book cost)

---

## MODULE 13 — TRANSPORT MANAGEMENT

### Data Models

```javascript
// Vehicle
{
  _id, schoolId,
  plateNumber, make, model, year, capacity,
  driverId,                // ref to Staff
  routeId,
  insuranceExpiry, roadworthinessExpiry,
  isActive
}

// TransportRoute
{
  _id, schoolId,
  name,                    // e.g., "Hodan Route", "Wadajir Morning"
  direction: enum['morning_pickup','afternoon_dropoff'],
  stops: [{ stopName, district, estimatedTime, order }],
  vehicleId, driverId,
  feeMonthly,
  isActive
}

// StudentTransport
{
  _id, schoolId, studentId, routeId,
  stopName,                // their pickup/dropoff stop
  academicYearId,
  status: enum['active','suspended','cancelled'],
  createdAt
}
```

### Key Features

- Vehicle fleet management with insurance expiry alerts
- Route planning with multiple stops
- Student assignment to routes and stops
- Daily passenger manifest (printable for driver)
- Transport fee linked to fee module
- Driver attendance tracking
- Vehicle maintenance log

---

## MODULE 14 — BEHAVIOR & DISCIPLINE

### Data Models

```javascript
// BehaviorRecord
{
  _id, schoolId, studentId, classId,
  type: enum['positive','negative'],
  category: enum['academic','conduct','attendance','respect','prayer','quran','sports','other'],
  description,
  points: Number,          // positive or negative
  reportedBy: staffId,
  date,
  actionTaken,
  parentNotified: Boolean,
  parentNotifiedAt,
  createdAt
}

// DisciplinaryCase
{
  _id, schoolId, studentId,
  severity: enum['minor','moderate','serious','expulsion'],
  description,
  date, witnesses: [staffId],
  actionTaken: enum['verbal_warning','written_warning','suspension','expulsion','parent_meeting','other'],
  suspensionDays,
  parentMeetingDate,
  followUpRequired: Boolean,
  followUpDate,
  resolvedAt,
  status: enum['open','resolved'],
  reportedBy, investigatedBy,
  notes
}
```

### Key Features

- Positive behavior recording (praise, Islamic values, academic achievement)
- Conduct grade calculation from behavior records
- Discipline case management with severity levels
- Parent notification on discipline issues
- Discipline history on student profile
- Suspension tracking (auto-marks attendance as suspended, not absent)
- Islamic behavior tracking (prayer attendance, Quran participation)

---

## MODULE 15 — PARENT PORTAL (PWA)

### Access

- Mobile-first PWA (installable on Android/iPhone home screen)
- Login via phone number + OTP (no username/password to remember)
- Parents see only their own children's data
- Supports multiple children in one account
- UI default: Somali language, with Arabic and English toggle
- Works on slow connections (offline cache for last-loaded data)

### Features Available to Parents

```
Dashboard
  - Child selector (if multiple children)
  - Today's attendance status
  - Latest fee balance
  - Recent announcements

Attendance
  - Monthly attendance calendar (green/red per day)
  - Attendance percentage
  - Excuse letter submission (text or photo)

Academics
  - Current semester marks (when published)
  - Report card download (PDF)
  - Exam schedule
  - Timetable

Fees
  - Full fee statement
  - Outstanding balance
  - Payment history and receipts
  - Download receipt PDF

Communication
  - Announcements
  - Messages from school
  - Contact school button (calls school phone)

Profile
  - View child's profile information
  - Update guardian contact number
  - Change UI language
```

### OTP Login Flow

```
1. Parent enters phone number
2. System sends 6-digit OTP via SMS (Africa's Talking)
3. Parent enters OTP (valid 10 minutes)
4. If phone matches a guardian record: access granted
5. If phone not found: show "Contact your school to register"
6. Session stored in httpOnly cookie (30-day expiry)
```

---

## MODULE 16 — REPORTS & ANALYTICS

### Standard Reports

**Academic Reports**
- Class performance summary (all subjects, averages, pass/fail rates)
- Student academic history (all years in one view)
- Subject performance analysis (average mark, highest, lowest, distribution)
- Top performers per class / grade / school
- At-risk students (failing 2+ subjects, attendance below 75%)
- Grade promotion / retention analysis

**Attendance Reports**
- Daily attendance register (class)
- Monthly attendance summary (class)
- Annual attendance per student
- Chronic absentees (below configurable threshold)
- Attendance trend chart (monthly across the year)

**Fee Reports**
- Daily collection report
- Monthly collection by fee type
- Outstanding fees by grade and class
- Fee collection vs expected (target vs actual)
- Overdue aging report (30/60/90/120+ days)
- Waiver and discount report

**Staff Reports**
- Staff list with qualifications
- Expiring documents (licenses, contracts)
- Staff attendance monthly

**School Overview**
- Enrollment statistics (total, by grade, by gender, by class)
- IDP student statistics (for NGO/government reporting)
- Student-teacher ratio per class
- New admissions vs transfers out vs graduates

### Analytics Dashboard (Admin/Principal)

```
KPI Cards:
  Total Students Enrolled | Present Today | Fee Collection Today
  Students with Outstanding Fees | Staff Present Today

Charts:
  Enrollment Trend (monthly, this year)
  Attendance Rate (7-day moving average)
  Fee Collection vs Target (monthly bar chart)
  Grade Distribution (bell curve of all student marks)
  Gender Breakdown (donut chart)
  IDP vs Non-IDP Enrollment (for reporting)

Tables:
  Top 10 Students by Overall Performance
  Classes with Lowest Attendance Rate
  Most Overdue Fee Accounts
```

### Endpoints

```
GET    /api/reports/academic/class/:id          — class performance
GET    /api/reports/academic/student/:id        — student academic history
GET    /api/reports/attendance/class/:id        — class attendance report
GET    /api/reports/attendance/monthly          — school-wide monthly
GET    /api/reports/fees/collection             — fee collection
GET    /api/reports/fees/outstanding            — outstanding fees
GET    /api/reports/enrollment                  — enrollment statistics
GET    /api/reports/idp                         — IDP student report
GET    /api/dashboard/admin                     — admin dashboard data
GET    /api/dashboard/principal                 — principal dashboard
GET    /api/dashboard/teacher                   — teacher dashboard
GET    /api/dashboard/parent                    — parent dashboard
```

---

## MODULE 17 — SYSTEM ADMINISTRATION

### School Configuration

```javascript
// Configurable per school:
{
  gradingScale: [...],           // customize grade boundaries
  passMarkDefault: 50,
  attendanceThreshold: 75,       // % required for exam eligibility
  consecutiveAbsenceAlert: 3,    // days before escalation
  lateFeeGraceDays: 7,
  smsProvider: 'africas_talking',
  smsApiKey, smsSenderId,
  whatsappEnabled, whatsappApiKey,
  reportCardFooter_so,           // custom footer text
  examBlockOnFeeDefault: false,  // block exam if fees unpaid
  siblingDiscountEnabled: false,
  backupSchedule: 'daily',
  sessionTimeout: 60,            // minutes of inactivity
}
```

### Admin Features

- School profile management (name, logo, contacts)
- Academic year creation and management
- User account management (create, activate, deactivate)
- Role and permission management
- Audit log viewer (who did what and when)
- Data backup and restore
- Bulk data import tools (students, staff, marks, fees via Excel)
- Notification template management
- SMS balance monitoring
- System health dashboard

### Audit Log

Every data-changing action logs:
```javascript
{
  userId, userName, userRole,
  action: enum['create','update','delete','login','logout','publish','void','export'],
  module,
  recordId,
  recordDescription,
  changesBefore, changesAfter,
  ipAddress, userAgent,
  schoolId,
  createdAt
}
```

---

## FRONTEND UI SPECIFICATIONS

### Design System

```
Primary Color:    #1B4F72  (deep blue — trust, education)
Secondary Color:  #2ECC71  (green — Islam, Somalia flag reference)
Accent:           #F39C12  (amber — alerts, highlights)
Background:       #F8FAFC
Text Primary:     #1E293B
Text Secondary:   #64748B
Error:            #DC2626
Success:          #16A34A

Font:
  Latin (Somali/English): Inter or Noto Sans
  Arabic: Noto Naskh Arabic (RTL support)

Border Radius: 8px (rounded but professional)
Shadow: Subtle, minimal (mobile-friendly, fast rendering)
```

### Core UI Rules

1. **Mobile-first** — design for 360px width first, scale up
2. **Minimal data use** — no unnecessary animations, no heavy gradients
3. **One action per screen** — on mobile, avoid overcrowding
4. **Somali first** — all label text in Somali by default
5. **Number formatting** — comma separator for thousands: 1,500,000 SOS
6. **Date format** — DD/MM/YYYY for Somali/Arabic users, MM/DD/YYYY toggle for English
7. **Loading states** — skeleton loaders, not spinners (faster perceived load)
8. **Error messages** — always in Somali, actionable ("Lambarka telefoonka ee galay ma sax ahayn")
9. **Confirmation dialogs** — before any delete or irreversible action
10. **Offline indicator** — persistent banner when device is offline

### Navigation Structure

```
Sidebar (desktop) / Bottom Tab Bar (mobile):

For Admin/Principal:
  🏠 Dashboard
  👨‍🎓 Students
  👨‍🏫 Staff
  📚 Academic
      ├── Classes & Subjects
      ├── Timetable
      ├── Examinations
      └── Report Cards
  ✅ Attendance
  💰 Fees
  📢 Communication
  📊 Reports
  ⚙️  Settings

For Class Teacher:
  🏠 Dashboard
  ✅ Attendance (their class)
  📝 Marks Entry (their subjects)
  👨‍🎓 My Students
  📢 Announcements

For Parent:
  🏠 My Child
  ✅ Attendance
  📝 Results
  💰 Fees
  📢 School News
```

---

## API CONVENTIONS

```
Base URL:       /api/v1/
Auth Header:    Authorization: Bearer <access_token>
Response format:
  {
    success: Boolean,
    data: Object | Array,
    pagination: { page, limit, total, totalPages },  // for list endpoints
    message: String     // for errors and success confirmations
  }

Error format:
  {
    success: false,
    error: {
      code: String,     // e.g., "STUDENT_NOT_FOUND"
      message_so: String,  // Somali error message
      message_en: String,  // English error message
    }
  }

Pagination:     ?page=1&limit=20&sortBy=createdAt&sortOrder=desc
Filtering:      ?status=active&gender=female&gradeId=xxx
Date range:     ?from=2024-10-01&to=2025-02-28
Search:         ?q=faadumo
```

---

## SECURITY REQUIREMENTS

1. **HTTPS enforced** everywhere — HTTP redirects to HTTPS
2. **Helmet.js** — security headers on all responses
3. **CORS** — whitelist only known frontend origins
4. **Rate limiting** — 100 req/15min per IP (general), 5/15min for auth endpoints
5. **Input sanitization** — sanitize-html on all text inputs, mongoose-sanitize for DB
6. **JWT secrets** — minimum 256-bit random secret, stored in env var (never in code)
7. **Password hashing** — bcrypt with salt rounds 12
8. **File upload security** — validate MIME type server-side, max 5MB per file, store on Cloudinary (not local server)
9. **SQL/NoSQL injection** — parameterized queries, never interpolate user input into queries
10. **Audit trail** — every sensitive action logged (cannot be disabled by school admin)
11. **Role enforcement** — check role on every protected endpoint, not just on login
12. **Parent data isolation** — parents can ONLY see their own children (verify ownership on every parent request)
13. **Student data privacy** — clan field is hidden by default, requires SCHOOL_ADMIN role to view
14. **Session invalidation** — all refresh tokens invalidated on password change

---

## ENVIRONMENT VARIABLES

```bash
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://dugsiga.so

# Database
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...

# Auth
JWT_ACCESS_SECRET=<256-bit-random>
JWT_REFRESH_SECRET=<256-bit-random>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Email
SENDGRID_API_KEY=
FROM_EMAIL=noreply@dugsiga.so

# SMS — Africa's Talking
AT_API_KEY=
AT_USERNAME=
AT_SENDER_ID=Dugsiga

# WhatsApp — Meta Business
WHATSAPP_API_KEY=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=

# File Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
DEFAULT_LANGUAGE=so
DEFAULT_CURRENCY=SOS
DEFAULT_TIMEZONE=Africa/Mogadishu
```

---

## PHASE 1 — BUILD ORDER (MVP)

Build in this exact order. Each phase is deployable and usable.

```
Week 1–2:   Project setup, auth, multi-tenancy, school setup
Week 3–4:   Academic year, grades, classes, subjects
Week 5–6:   Student registration and enrollment
Week 7–8:   Staff management
Week 9–10:  Attendance module + SMS alerts
Week 11–12: Marks entry and grading
Week 13–14: Fee management and payment recording
Week 15–16: Report cards generation (PDF)
Week 17–18: Parent portal (PWA)
Week 19–20: Reports and analytics dashboard
Week 21–22: Communication module
Week 23–24: Testing, bug fixes, deployment

MVP complete at Week 24.
```

## PHASE 2 — POST-MVP

```
Timetable builder
Library management
Transport management
Behavior and discipline module
Quran memorization advanced tracking
Bulk Excel import/export for all modules
Advanced analytics and BI
Multi-school group management (school owner dashboard)
Mobile app (React Native) for teachers
WhatsApp bot for parents (automated responses)
```

---

## SOMALI TRANSLATIONS REFERENCE (Key Terms)

```
Student:          Arday / Ardayga
Teacher:          Macallin / Macallinka
Principal:        Duqa Dugsiga / Maamulaha
Class:            Fasal / Fasal
Grade:            Fasalka [number]aad
Attendance:       Jooge / Xaadirka
Absent:           Maqan
Present:          Xaadir
Late:             Daahay
Mark / Grade:     Dhibcaha / Natiijada
Exam:             Imtixaan
Report Card:      Warqadda Natiijada
Fee:              Lacagta Waxbarashada
Receipt:          Rasiid
Payment:          Bixinta
Outstanding:      La bixin waayo
Overdue:          Waqtigeeda dhaafay
Scholarship:      Deeqda Waxbarashada
Subject:          Maado
Timetable:        Jadwalka
Library:          Maktabad
Transfer:         Wareeji
Enroll:           Diiwaan-gali
Guardian/Parent:  Wali
Father:           Aabaha
Mother:           Hooyo
Semester:         Nusf Sanad
Academic Year:    Sanadka Waxbarashada
School:           Dugsi
Certificate:      Shahaado
Quran:            Quraanka
Islamic Studies:  Diinta Islaamka
Arabic:           Carabi / Luqadda Carabiga
Mathematics:      Xisaab
Science:          Sayniska
English:          Ingiriisi
```

---

## MINISTRY OF EDUCATION COMPLIANCE (SOMALIA)

Build with these compliance requirements in mind:

1. **Student census data** — exportable in format required by Ministry of Education, Culture and Higher Education of the Federal Government of Somalia
2. **IDP tracking** — required by UNICEF, UNHCR, and Education Cluster Somalia
3. **Gender parity reporting** — boy/girl enrollment ratios required by donors
4. **Grade 8 and Grade 12 national exam** — system must support national exam registration lists
5. **Teacher qualification tracking** — Ministry requires licensed teachers; the system tracks this
6. **School registration number** — displayed on all official documents

---

*End of Somalia School Management System Build Plan*
*Modules: 17 | Build Time Estimate: 24 weeks (MVP) | Stack: MERN*
*Version: 1.0 | Language: Somali-first, Arabic, English*
