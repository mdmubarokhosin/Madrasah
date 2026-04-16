export interface Admin {
  id: string;
  username: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  roll: string;
  regNo: string;
  fatherName?: string;
  motherName?: string;
  madrasa?: string;
  gender?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  classId?: string;
  class?: Class;
  academicYearId?: string;
  academicYear?: AcademicYear;
  admissionDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  nameEn?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { students: number; exams: number; incomes: number; expenses: number; salaries: number; fees: number };
}

export interface Class {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { students: number; subjects: number; attendance: number };
}

export interface Exam {
  id: string;
  name: string;
  nameEn?: string;
  year: string;
  isPublished: boolean;
  academicYearId?: string;
  academicYear?: AcademicYear;
  createdAt: string;
  updatedAt: string;
  marhalas?: Marhala[];
  _count?: { results: number; marhalas: number };
}

export interface Marhala {
  id: string;
  name: string;
  nameEn?: string;
  examId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { results: number; subjects: number };
}

export interface Subject {
  id: string;
  name: string;
  totalMarks: number;
  passMarks?: number;
  marhalaId: string;
  classId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResultItem {
  id: string;
  resultId: string;
  subjectId: string;
  subject?: Subject;
  marks: number;
  isPassed: boolean;
}

export interface Result {
  id: string;
  studentId: string;
  student?: Student;
  examId: string;
  exam?: Exam;
  marhalaId: string;
  marhala?: Marhala;
  totalMarks: number;
  gpa: number;
  merit?: number;
  isPassed: boolean;
  createdAt: string;
  updatedAt: string;
  items?: ResultItem[];
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateApplication {
  id: string;
  applicationId: string;
  studentId?: string;
  student?: Student;
  examId: string;
  exam?: Exam;
  marhalaId: string;
  marhala?: Marhala;
  roll: string;
  regNo: string;
  studentName: string;
  certificateType: string;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  date: string;
  category: string;
  description?: string;
  amount: number;
  academicYearId?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description?: string;
  amount: number;
  academicYearId?: string;
  paidTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Salary {
  id: string;
  employeeName: string;
  designation?: string;
  month: string;
  year: string;
  basicSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  academicYearId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentFee {
  id: string;
  studentId: string;
  student?: Student;
  academicYearId?: string;
  academicYear?: AcademicYear;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'unpaid' | 'partial';
  month?: string;
  paymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  student?: Student;
  classId: string;
  class?: Class;
  date: string;
  status: 'present' | 'absent' | 'late';
  academicYearId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  siteName?: string;
  siteNameEn?: string;
  siteTagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  [key: string]: string | undefined;
}

export interface Stats {
  totalStudents: number;
  totalExams: number;
  totalResults: number;
  totalNotices: number;
  totalMessages: number;
  unreadMessages: number;
  passRate: number;
  totalClasses: number;
  totalIncome: number;
  totalExpenses: number;
  unpaidFees: number;
  attendanceRate: number;
}

export interface FinanceReport {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthly: { month: string; income: number; expense: number }[];
  incomeByCategory: { category: string; amount: number }[];
  expenseByCategory: { category: string; amount: number }[];
}

export type PageName = 'home' | 'result' | 'certificate-apply' | 'certificate-status' |
  'admin-login' | 'admin-dashboard' | 'admin-students' | 'admin-exams' | 'admin-results' |
  'admin-notices' | 'admin-faqs' | 'admin-certificates' | 'admin-messages' | 'admin-settings' |
  'admin-academic-years' | 'admin-classes' | 'admin-attendance' | 'admin-finance' |
  'admin-income' | 'admin-expenses' | 'admin-salaries' | 'admin-fees' | 'admin-marhalas' |
  'admin-subjects' | 'admin-print-center';
