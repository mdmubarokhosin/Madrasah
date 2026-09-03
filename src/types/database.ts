// ============ Database Types ============

export interface SiteInfo {
  name: string;
  nameEn: string;
  nameAr: string;
  slogan: string;
  sloganEn: string;
  sloganAr: string;
  address: string;
  phone: string;
  email: string;
  established: string;
  totalStudents: string;
  totalTeachers: string;
  totalDepts: string;
  aboutText: string;
  aboutText2: string;
  aboutText3: string;
  vision: string;
  mission: string;
  officeHours: string;
  facebook: string;
  youtube: string;
  whatsapp: string;
  mapEmbedUrl: string;
  // Trilingual content (optional companions)
  aboutTextEn?: string;
  aboutTextAr?: string;
  aboutText2En?: string;
  aboutText2Ar?: string;
  aboutText3En?: string;
  aboutText3Ar?: string;
  visionEn?: string;
  visionAr?: string;
  missionEn?: string;
  missionAr?: string;
}

export interface AdminAuth {
  password: string;
}

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  important: boolean;
  createdAt: number;
  titleEn?: string;
  titleAr?: string;
  contentEn?: string;
  contentAr?: string;
}

export interface Department {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: string;
  imageUrl: string;
  order: number;
  classes: string[];
  nameEn?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface Teacher {
  id: string;
  name: string;
  nameAr: string;
  designation: string;
  qualification: string;
  department: string;
  imageUrl: string;
  order: number;
  nameEn?: string;
  designationEn?: string;
  designationAr?: string;
  qualificationEn?: string;
  qualificationAr?: string;
}

export interface Student {
  id: string;
  name: string;
  roll: string;
  registrationNumber: string;
  department: string;
  class: string;
  fatherName: string;
  admissionYear: string;
  imageUrl: string;
  createdAt: number;
}

export interface Exam {
  id: string;
  name: string;
  year: string;
  department: string;
  class: string;
  date: string;
  createdAt: number;
  nameEn?: string;
  nameAr?: string;
}

export interface SubjectMark {
  name: string;
  fullMarks: number;
  obtainedMarks: number;
}

export interface ExamResult {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  registrationNumber: string;
  examId: string;
  examName: string;
  department: string;
  class: string;
  subjects: SubjectMark[];
  totalMarks: number;
  obtainedTotal: number;
  grade: string;
  createdAt: number;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  imageUrl: string;
  createdAt: number;
  titleEn?: string;
  titleAr?: string;
  contentEn?: string;
  contentAr?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  createdAt: number;
  titleEn?: string;
  titleAr?: string;
}

export interface AdmissionInfo {
  id: string;
  year: string;
  requirements: string[];
  documents: string[];
  schedule: { item: string; date: string }[];
  requirementsEn?: string[];
  requirementsAr?: string[];
  documentsEn?: string[];
  documentsAr?: string[];
  scheduleEn?: { item: string; date: string }[];
  scheduleAr?: { item: string; date: string }[];
}

export interface DonationFund {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  collected: number;
  target: number;
  type: string;
  titleEn?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface PaymentMethod {
  name: string;
  number: string;
  type: string;
  iconUrl?: string;
}

export interface ClassRoutineItem {
  time: string;
  subject: string;
  teacher: string;
  duration: string;
}

export interface SyllabusItem {
  name: string;
  year: string;
}

export interface PaymentRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  amount: number;
  paymentkey: string;
  status: 'pending' | 'success' | 'cancel' | 'failed';
  createdAt: number;
  updatedAt?: number;
  fund_title?: string;
  default_currency?: string;
  payment_time?: string;
  created_time?: string;
  converted_amount?: number;
  total_amount?: number;
  [key: string]: unknown;
}

// ============ New Feature Types ===========

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'academic' | 'religious' | 'cultural' | 'sports' | 'other';
  important: boolean;
  createdAt: number;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  locationEn?: string;
  locationAr?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  date: string;
  isRead: boolean;
  createdAt: number;
}

export interface AdmissionApplication {
  id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  previousEducation: string;
  desiredDepartment: string;
  desiredClass: string;
  bloodGroup: string;
  guardianPhone: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface HifzRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  department: string;
  currentJuz: string;
  currentSurah: string;
  surahName?: string;
  currentAyah: string;
  totalMemorized: string;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  lastUpdated: number;
  testedBy?: string;
  testDate?: string;
  grade?: string;
  createdAt: number;
  [key: string]: unknown;
}

export interface OnlineExam {
  id: string;
  title: string;
  subject: string;
  department: string;
  class: string;
  duration: number;
  totalMarks: number;
  passMarks: number;
  questions: { question: string; options: string[]; correctAnswer: number; marks?: number }[];
  status: 'active' | 'inactive' | 'published';
  createdAt: number;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentRoll: string;
  studentName: string;
  answers: number[];
  obtainedMarks: number;
  totalMarks: number;
  submittedAt: number;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  status: 'available' | 'unavailable';
  addedBy: string;
  createdAt: number;
}

export interface PrayerConfig {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  type: 'academic' | 'religious' | 'holiday' | 'exam' | 'event' | 'deadline' | 'other';
  color?: string;
  isHoliday: boolean;
  createdAt: number;
}

export interface Alumni {
  id: string;
  name: string;
  studentRoll: string;
  passingYear: string;
  department: string;
  currentOccupation: string;
  phone: string;
  email: string;
  address: string;
  imageUrl: string;
  bio?: string;
  status: 'approved' | 'pending';
  createdAt: number;
}

export interface BohudurConfig {
  enabled: boolean;
  apiKey: string;
  currency: string;
  redirectUrl: string;
  cancelUrl: string;
  webhookSuccessUrl: string;
  webhookCancelUrl: string;
  storeId?: string;
  successUrl?: string;
}

export interface FeeConfig {
  id: string;
  class: string;
  department: string;
  amount: number;
  type: string;
  description: string;
  createdAt: number;
}

export interface FeePayment {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  feeConfigId: string;
  amount: number;
  month: string;
  year: string;
  status: 'paid' | 'unpaid' | 'partial' | 'pending';
  paidAmount: number;
  paymentMethod: string;
  paymentDate: string;
  description?: string;
  createdAt: number;
  [key: string]: unknown;
}

// ============ App View Types ============

// ============ Expense Management ============

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  createdBy: string;
  approvedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  budget: number;
  createdAt: number;
}

// ============ Salary Management ============

export interface SalaryRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  designation: string;
  department: string;
  basicSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  month: string;
  year: string;
  status: 'paid' | 'unpaid' | 'partial';
  paidAmount: number;
  paidDate: string;
  paymentMethod: string;
  notes: string;
  createdAt: number;
}

// ============ Donation Subscription ============

export interface DonationSubscription {
  id: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  fundId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'paused' | 'cancelled';
  lastPaidDate: string;
  nextDueDate: string;
  totalPaid: number;
  createdAt: number;
}

// ============ Voucher / Bill ============

export interface Voucher {
  id: string;
  voucherNumber: string;
  type: 'receipt' | 'payment' | 'journal';
  title: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  relatedTo: string;
  createdBy: string;
  createdAt: number;
}

// ============ Hostel Management ============

export interface HostelRoom {
  id: string;
  roomNumber: string;
  floor: string;
  capacity: number;
  currentOccupants: number;
  type: string;
  status: 'available' | 'full' | 'maintenance';
  createdAt: number;
}

export interface HostelAllocation {
  id: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  roomId: string;
  roomNumber: string;
  bedNumber: string;
  allocationDate: string;
  status: 'active' | 'released';
  releasedDate: string;
  createdAt: number;
}

export interface HostelMeal {
  id: string;
  day: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  createdAt: number;
}

// ============ Dawah & Tabligh ============

export interface DawahProgram {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  coordinatorName: string;
  coordinatorPhone: string;
  participantCount: number;
  type: 'jamat' | 'bayan' | 'tajweed' | 'dars' | 'other';
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: number;
}

export interface DawahJamat {
  id: string;
  name: string;
  leaderName: string;
  memberCount: number;
  currentLocation: string;
  departureDate: string;
  returnDate: string;
  status: 'active' | 'returned';
  report: string;
  createdAt: number;
}

// ============ Study Materials ============

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  class: string;
  fileUrl: string;
  fileType: 'pdf' | 'video' | 'audio' | 'image' | 'document' | 'link';
  downloadCount: number;
  addedBy: string;
  createdAt: number;
  hasVolumes?: boolean;
  volumes?: MaterialVolume[];
}

export interface MaterialVolume {
  volumeTitle: string;
  fileUrl: string;
  fileType: string;
}

// ============ Role-Based Access ============

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: number;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  name: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  lastLogin: number;
  createdAt: number;
}

// ============ QR Code Payment ============

export interface QRPaymentConfig {
  enabled: boolean;
  bkashNumber: string;
  bkashQR: string;
  bkashIcon: string;
  nagadNumber: string;
  nagadQR: string;
  nagadIcon: string;
  rocketNumber: string;
  rocketQR: string;
  rocketIcon: string;
  bankName: string;
  bankAccount: string;
  bankQR: string;
  bankIcon: string;
}

// ============ App View Types ============

export type AppView = 'public' | 'admin' | 'student';
export type PublicPage = 'home' | 'about' | 'departments' | 'teachers' | 'admission' | 'notices' | 'events' | 'gallery' | 'donation' | 'blog' | 'contact' | 'results' | 'syllabus' | 'classRoutine' | 'hifz' | 'exam' | 'calendar' | 'alumni' | 'prayer' | 'hadith' | 'quran' | 'feePayment' | 'admissionTrack' | 'library' | 'attendance' | 'hostel' | 'dawah' | 'materials';
export type AdminPage = 'dashboard' | 'notices' | 'teachers' | 'departments' | 'students' | 'exams' | 'results' | 'blogs' | 'gallery' | 'admission' | 'donation' | 'settings' | 'messages' | 'events' | 'applications' | 'activity-log' | 'payment-history' | 'hifz' | 'exams-mcq' | 'attendance' | 'library' | 'calendar' | 'fee' | 'alumni' | 'prayer' | 'hadith' | 'sms' | 'backup' | 'expenses' | 'salary' | 'financial-reports' | 'vouchers' | 'subscriptions' | 'hostel' | 'dawah' | 'materials' | 'roles' | 'qr-payment' | 'report-builder';
