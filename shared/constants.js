/**
 * Dugsiga SMS — Shared Constants
 * Used by both client and server
 */

// ── Roles ──────────────────────────────────────────────
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  PRINCIPAL: 'principal',
  VICE_PRINCIPAL: 'vice_principal',
  HEAD_TEACHER: 'head_teacher',
  CLASS_TEACHER: 'class_teacher',
  SUBJECT_TEACHER: 'subject_teacher',
  ACCOUNTANT: 'accountant',
  RECEPTIONIST: 'receptionist',
  LIBRARIAN: 'librarian',
  PARENT: 'parent',
  STUDENT: 'student',
};

const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: { so: 'Maamulaha Guud', en: 'Super Admin', ar: 'المشرف العام' },
  [ROLES.SCHOOL_ADMIN]: { so: 'Maamulaha Dugsiga', en: 'School Admin', ar: 'مدير المدرسة' },
  [ROLES.PRINCIPAL]: { so: 'Duqa Dugsiga', en: 'Principal', ar: 'مدير المدرسة' },
  [ROLES.VICE_PRINCIPAL]: { so: 'Ku-Xigeenka Duqa', en: 'Vice Principal', ar: 'نائب المدير' },
  [ROLES.HEAD_TEACHER]: { so: 'Madaxa Macallimiinta', en: 'Head Teacher', ar: 'رئيس المعلمين' },
  [ROLES.CLASS_TEACHER]: { so: 'Macallinka Fasalka', en: 'Class Teacher', ar: 'معلم الفصل' },
  [ROLES.SUBJECT_TEACHER]: { so: 'Macallinka Maadada', en: 'Subject Teacher', ar: 'معلم المادة' },
  [ROLES.ACCOUNTANT]: { so: 'Xisaabiye', en: 'Accountant', ar: 'محاسب' },
  [ROLES.RECEPTIONIST]: { so: 'Qaabilaad', en: 'Receptionist', ar: 'موظف الاستقبال' },
  [ROLES.LIBRARIAN]: { so: 'Maamulaha Maktabadda', en: 'Librarian', ar: 'أمين المكتبة' },
  [ROLES.PARENT]: { so: 'Waalid', en: 'Parent', ar: 'ولي الأمر' },
  [ROLES.STUDENT]: { so: 'Arday', en: 'Student', ar: 'طالب' },
};

// ── Grading Scale (Somalia Standard) ───────────────────
const GRADING_SCALE = [
  { min: 90, max: 100, grade: 'A+', label_so: 'Aad u wanaagsan', label_en: 'Excellent', label_ar: 'ممتاز' },
  { min: 80, max: 89, grade: 'A', label_so: 'Wanaagsan', label_en: 'Very Good', label_ar: 'جيد جداً' },
  { min: 70, max: 79, grade: 'B', label_so: 'Ku filan', label_en: 'Good', label_ar: 'جيد' },
  { min: 60, max: 69, grade: 'C', label_so: 'Dhexdhexaad', label_en: 'Average', label_ar: 'متوسط' },
  { min: 50, max: 59, grade: 'D', label_so: 'Hooseeya', label_en: 'Below Average', label_ar: 'أقل من المتوسط' },
  { min: 0, max: 49, grade: 'F', label_so: 'Ku guuldarraystay', label_en: 'Fail', label_ar: 'راسب' },
];

// ── Somalia Regions & Districts ────────────────────────
const REGIONS = [
  'Banadir', 'Hirshabelle', 'Galmudug', 'Puntland', 'Jubbaland',
  'South West', 'Somaliland', 'Awdal', 'Woqooyi Galbeed', 'Togdheer',
  'Sanaag', 'Sool', 'Mudug', 'Nugal', 'Bari',
  'Bay', 'Bakool', 'Gedo', 'Lower Juba', 'Middle Juba',
  'Lower Shabelle', 'Middle Shabelle', 'Hiraan',
];

const BANADIR_DISTRICTS = [
  'Abdiaziz', 'Bondhere', 'Daynile', 'Dharkenley', 'Hamar-Jajab',
  'Hamar-Weyne', 'Heliwa', 'Hodan', 'Howl-Wadag', 'Kaaraan',
  'Shangaani', 'Shibis', 'Wadajir', 'Wardhigley', 'Yaqshid',
  'Garasbaley',
];

// ── School Types ───────────────────────────────────────
const SCHOOL_TYPES = ['primary', 'secondary', 'both', 'islamic', 'private'];

const GENDER_POLICIES = ['mixed', 'boys_only', 'girls_only', 'separated_classes'];

// ── Student Status ─────────────────────────────────────
const STUDENT_STATUS = ['active', 'inactive', 'transferred', 'graduated', 'expelled', 'deceased'];

// ── Staff Roles ────────────────────────────────────────
const STAFF_ROLES = [
  'teacher', 'vice_principal', 'principal', 'accountant',
  'receptionist', 'librarian', 'counselor', 'driver',
  'cleaner', 'security', 'other',
];

const EMPLOYMENT_TYPES = ['permanent', 'contract', 'part_time', 'volunteer'];

// ── Attendance ─────────────────────────────────────────
const ATTENDANCE_STATUS = ['present', 'absent', 'late', 'excused', 'holiday'];

// ── Exam Types ─────────────────────────────────────────
const EXAM_TYPES = ['continuous_assessment', 'midterm', 'final', 'mock', 'internal', 'external'];

// ── Fee Types ──────────────────────────────────────────
const FEE_TYPES = ['tuition', 'registration', 'exam', 'uniform', 'activity', 'library', 'transport', 'meal', 'other'];

const PAYMENT_METHODS = ['cash', 'evc_plus', 'zaad', 'sahal', 'premier_bank', 'dahabshiil', 'bank_transfer', 'other'];

const FEE_FREQUENCY = ['once', 'per_semester', 'per_term', 'monthly', 'annual'];

// ── Calendar Event Types ───────────────────────────────
const CALENDAR_EVENT_TYPES = ['holiday', 'exam', 'event', 'eid', 'ramadan', 'national_day', 'meeting', 'sports', 'other'];

// ── Subject Categories ─────────────────────────────────
const SUBJECT_CATEGORIES = ['core', 'islamic', 'language', 'elective', 'physical'];

// ── School Sections ────────────────────────────────────
const SCHOOL_SECTIONS = ['kindergarten', 'primary', 'secondary'];

// ── Guardian Relationships ─────────────────────────────
const GUARDIAN_RELATIONSHIPS = ['father', 'mother', 'uncle', 'aunt', 'grandfather', 'grandmother', 'sibling', 'guardian', 'other'];

// ── Qualifications ─────────────────────────────────────
const QUALIFICATIONS = ['primary', 'secondary', 'diploma', 'degree', 'masters', 'phd', 'other'];

// ── Behavior ───────────────────────────────────────────
const BEHAVIOR_CATEGORIES = ['academic', 'conduct', 'attendance', 'respect', 'prayer', 'quran', 'sports', 'other'];

// ── Days of Week (Somali school week: Sun-Thu) ─────────
const SCHOOL_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];

const DAY_LABELS = {
  sunday: { so: 'Axad', en: 'Sunday', ar: 'الأحد' },
  monday: { so: 'Isniin', en: 'Monday', ar: 'الإثنين' },
  tuesday: { so: 'Talaado', en: 'Tuesday', ar: 'الثلاثاء' },
  wednesday: { so: 'Arbaco', en: 'Wednesday', ar: 'الأربعاء' },
  thursday: { so: 'Khamiis', en: 'Thursday', ar: 'الخميس' },
};

// ── Currencies ─────────────────────────────────────────
const CURRENCIES = ['SOS', 'USD'];

// ── Default Somali Public Holidays ─────────────────────
const DEFAULT_HOLIDAYS = [
  { title_so: 'Maalinta Xornimada Soomaaliya', title_en: 'Somali Independence Day', month: 7, day: 1 },
  { title_so: 'Maalinta Shaqaalaha', title_en: 'Labour Day', month: 5, day: 1 },
  { title_so: 'Maalinta Aasaasida', title_en: 'Foundation Day', month: 10, day: 21 },
];

module.exports = {
  ROLES,
  ROLE_LABELS,
  GRADING_SCALE,
  REGIONS,
  BANADIR_DISTRICTS,
  SCHOOL_TYPES,
  GENDER_POLICIES,
  STUDENT_STATUS,
  STAFF_ROLES,
  EMPLOYMENT_TYPES,
  ATTENDANCE_STATUS,
  EXAM_TYPES,
  FEE_TYPES,
  PAYMENT_METHODS,
  FEE_FREQUENCY,
  CALENDAR_EVENT_TYPES,
  SUBJECT_CATEGORIES,
  SCHOOL_SECTIONS,
  GUARDIAN_RELATIONSHIPS,
  QUALIFICATIONS,
  BEHAVIOR_CATEGORIES,
  SCHOOL_DAYS,
  DAY_LABELS,
  CURRENCIES,
  DEFAULT_HOLIDAYS,
};
