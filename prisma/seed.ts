import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data in reverse dependency order
  await db.attendance.deleteMany();
  await db.studentFee.deleteMany();
  await db.salary.deleteMany();
  await db.expense.deleteMany();
  await db.income.deleteMany();
  await db.resultItem.deleteMany();
  await db.result.deleteMany();
  await db.certificateApplication.deleteMany();
  await db.subject.deleteMany();
  await db.student.deleteMany();
  await db.marhala.deleteMany();
  await db.exam.deleteMany();
  await db.class.deleteMany();
  await db.academicYear.deleteMany();
  await db.contactMessage.deleteMany();
  await db.fAQ.deleteMany();
  await db.notice.deleteMany();
  await db.siteSetting.deleteMany();
  await db.admin.deleteMany();

  // 1. Create default admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.admin.create({
    data: { username: 'admin', password: hashedPassword, name: 'প্রশাসক' },
  });
  console.log('✅ Admin created');

  // 2. Create site settings
  const settings = [
    { key: 'siteName', value: 'জামিয়া ইসলামিয়া দারুল উলূম' },
    { key: 'siteNameEn', value: 'Jamia Islamia Darul Uloom' },
    { key: 'siteTagline', value: 'ইলমে দ্বীনের আলোয় আলোকিত জীবন গড়ার প্রত্যয়ে' },
    { key: 'address', value: 'গ্রাম: নমুনা, উপজেলা: সদর, জেলা: ঢাকা, বাংলাদেশ' },
    { key: 'phone', value: '০১৭১২-৩৪৫৬৭৮' },
    { key: 'email', value: 'info@jamia-darululoom.edu.bd' },
    { key: 'logo', value: '/logo.svg' },
  ];
  for (const s of settings) {
    await db.siteSetting.create({ data: s });
  }
  console.log('✅ Site settings created');

  // 3. Create academic years
  const ay2024 = await db.academicYear.create({
    data: { name: '১৪৪৫ হিজরি', nameEn: '1445 Hijri', startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31'), isActive: false },
  });
  const ay2025 = await db.academicYear.create({
    data: { name: '১৪৪৬ হিজরি', nameEn: '1446 Hijri', startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), isActive: true },
  });
  console.log('✅ Academic years created');

  // 4. Create classes (standalone, not tied to exams)
  const classesData = [
    { name: 'নাযেরা', nameEn: 'Nazera', sortOrder: 1 },
    { name: 'হিফজুল কুরআন', nameEn: 'Hifz', sortOrder: 2 },
    { name: 'প্রাথমিক (প্রথম শ্রেণি)', nameEn: 'Primary-1', sortOrder: 3 },
    { name: 'প্রাথমিক (দ্বিতীয় শ্রেণি)', nameEn: 'Primary-2', sortOrder: 4 },
    { name: 'মাতওয়া', nameEn: 'Mutawalla', sortOrder: 5 },
    { name: 'দাওরায়ে হাদীস', nameEn: 'Daura Hadith', sortOrder: 6 },
    { name: 'ইফতা', nameEn: 'Ifta', sortOrder: 7 },
  ];
  const classes = [];
  for (const c of classesData) {
    const cls = await db.class.create({ data: c });
    classes.push(cls);
  }
  console.log('✅ Classes created');

  // 5. Create exam
  const exam = await db.exam.create({
    data: {
      name: '১৪৪৬ হিজরি বার্ষিক পরীক্ষা',
      nameEn: 'Annual Examination 1446 Hijri',
      year: '২০২৫',
      isPublished: true,
      academicYearId: ay2025.id,
    },
  });

  // 6. Create marhalas for exam
  const marhalasData = [
    { name: 'প্রাথমিক স্তর', nameEn: 'Primary Level' },
    { name: 'নাযেরা স্তর', nameEn: 'Nazera Level' },
    { name: 'হিফজুল কুরআন স্তর', nameEn: 'Hifz Level' },
    { name: 'মাতওয়া স্তর', nameEn: 'Mutawalla Level' },
  ];
  const marhalas = [];
  for (const m of marhalasData) {
    const marhala = await db.marhala.create({ data: { ...m, examId: exam.id } });
    marhalas.push(marhala);
  }
  console.log('✅ Marhalas created');

  // 7. Create subjects for first marhala
  const subjectsData = [
    { name: 'কুরআন মাজীদ', totalMarks: 100, passMarks: 33 },
    { name: 'হাদীস শরীফ', totalMarks: 100, passMarks: 33 },
    { name: 'ফিকহ', totalMarks: 100, passMarks: 33 },
    { name: 'আরবী', totalMarks: 100, passMarks: 33 },
    { name: 'বাংলা', totalMarks: 100, passMarks: 33 },
  ];
  const subjects = [];
  for (const s of subjectsData) {
    const subject = await db.subject.create({ data: { ...s, marhalaId: marhalas[0].id } });
    subjects.push(subject);
  }
  console.log('✅ Subjects created');

  // 8. Create students
  const studentsData = [
    { name: 'মো. আব্দুল্লাহ', roll: '০০১', regNo: 'REG-2025-001', fatherName: 'মো. ইব্রাহীম', motherName: 'ফাতেমা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[2].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১১-১১১১১১', address: 'ঢাকা' },
    { name: 'মো. আহমাদ', roll: '০০২', regNo: 'REG-2025-002', fatherName: 'মো. আলী', motherName: 'আয়েশা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[2].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১১-২২২২২২', address: 'চট্টগ্রাম' },
    { name: 'মো. ইব্রাহীম', roll: '০০৩', regNo: 'REG-2025-003', fatherName: 'মো. ওসমান', motherName: 'জরিনা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[4].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১১-৩৩৩৩৩৩', address: 'রাজশাহী' },
    { name: 'মো. উসমান', roll: '০০৪', regNo: 'REG-2025-004', fatherName: 'মো. হাসান', motherName: 'রাবেয়া বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[1].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১১-৪৪৪৪৪৪', address: 'খুলনা' },
    { name: 'মো. আলী', roll: '০০৫', regNo: 'REG-2025-005', fatherName: 'মো. আব্দুর রহমান', motherName: 'নূরজাহান বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[0].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১১-৫৫৫৫৫৫', address: 'সিলেট' },
    { name: 'মো. হাসান', roll: '০০৬', regNo: 'REG-2025-006', fatherName: 'মো. জাকির', motherName: 'সারা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[2].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১১-৬৬৬৬৬৬', address: 'বরিশাল' },
    { name: 'মো. জাকির', roll: '০০৭', regNo: 'REG-2025-007', fatherName: 'মো. নূরুল ইসলাম', motherName: 'মরিয়ম বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[3].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১১-৭৭৭৭৭৭', address: 'রংপুর' },
    { name: 'মো. নূরুল ইসলাম', roll: '০০৮', regNo: 'REG-2025-008', fatherName: 'মো. আব্দুল করিম', motherName: 'খাদিজা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[4].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১১-৮৮৮৮৮৮', address: 'ময়মনসিংহ' },
    { name: 'মো. আব্দুল করিম', roll: '০০৯', regNo: 'REG-2025-009', fatherName: 'মো. সোলায়মান', motherName: 'আসমা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[5].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১১-৯৯৯৯৯৯', address: 'ঢাকা' },
    { name: 'মো. সোলায়মান', roll: '০১০', regNo: 'REG-2025-010', fatherName: 'মো. ইউসুফ', motherName: 'রুকাইয়া বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[5].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১২-০০০০০০', address: 'টাঙ্গাইল' },
    { name: 'মো. ইউসুফ', roll: '০১১', regNo: 'REG-2025-011', fatherName: 'মো. হারুন', motherName: 'হাফসা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[1].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১২-১১১১১১', address: 'কুমিল্লা' },
    { name: 'মো. হারুন', roll: '০১২', regNo: 'REG-2025-012', fatherName: 'মো. আব্দুল্লাহ', motherName: 'জামিলা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[6].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১২-২২২২২২', address: 'নারায়ণগঞ্জ' },
    { name: 'আব্দুর রহমান', roll: '০১৩', regNo: 'REG-2025-013', fatherName: 'মো. আতাউল্লাহ', motherName: 'সাবিনা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[0].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১২-৩৩৩৩৩৩', address: 'গাজীপুর' },
    { name: 'আবু বকর', roll: '০১৪', regNo: 'REG-2025-014', fatherName: 'মো. সাইফুল', motherName: 'নাজমা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[3].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১২-৪৪৪৪৪৪', address: 'যশোর' },
    { name: 'আবু হুরায়রা', roll: '০১৫', regNo: 'REG-2025-015', fatherName: 'মো. আনিস', motherName: 'রহিমা বেগম', madrasa: 'জামিয়া ইসলামিয়া দারুল উলূম', classId: classes[2].id, academicYearId: ay2025.id, gender: 'male', phone: '০১৭১২-৫৫৫৫৫৫', address: 'পাবনা' },
  ];
  const students = [];
  for (const s of studentsData) {
    const student = await db.student.create({ data: s });
    students.push(student);
  }
  console.log('✅ Students created');

  // 9. Create results with result items (for first 10 students in first marhala)
  for (let i = 0; i < Math.min(10, students.length); i++) {
    const student = students[i];
    const totalMarks = subjects.reduce((sum) => {
      return sum + Math.floor(Math.random() * 40) + 60;
    }, 0);
    const gpa = parseFloat((totalMarks / (subjects.length * 100) * 5).toFixed(2));
    const isPassed = gpa >= 2.0;
    await db.result.create({
      data: {
        studentId: student.id,
        examId: exam.id,
        marhalaId: marhalas[0].id,
        totalMarks,
        gpa,
        merit: i + 1,
        isPassed,
        items: {
          create: subjects.map((subj) => {
            const marks = Math.floor(Math.random() * 40) + 60;
            return { subjectId: subj.id, marks, isPassed: marks >= 33 };
          }),
        },
      },
    });
  }
  console.log('✅ Results created');

  // 10. Create notices
  const noticesData = [
    { title: 'বার্ষিক পরীক্ষার ফলাফল প্রকাশিত', content: '১৪৪৬ হিজরি বার্ষিক পরীক্ষার ফলাফল প্রকাশ করা হয়েছে। ফলাফল দেখতে "ফলাফল" পেজে যান।', date: '২০২৫-০১-১৫', isActive: true },
    { title: 'নতুন ভর্তি বিজ্ঞপ্তি', content: '১৪৪৭ হিজরি শিক্ষাবর্ষে নতুন শিক্ষার্থী ভর্তি শুরু হয়েছে। আগ্রহী শিক্ষার্থীরা অফিসে যোগাযোগ করুন।', date: '২০২৫-০২-০১', isActive: true },
    { title: 'সনদের আবেদন শুরু', content: 'বার্ষিক পরীক্ষার সনদের জন্য অনলাইনে আবেদন করুন। আবেদনের শেষ তারিখ: ৩০ মার্চ ২০২৫।', date: '২০২৫-০২-১৫', isActive: true },
    { title: 'মাসিক ফি জমার বিজ্ঞপ্তি', content: 'আগামী মাসের মাসিক ফি আগামী ৫ তারিখের মধ্যে জমা দেওয়া বাধ্যতামূলক।', date: '২০২৫-০৩-০১', isActive: true },
    { title: 'বার্ষিক মাহফিল', content: 'আগামী ১৫ই রমজান মাদরাসায় বার্ষিক মাহফিল অনুষ্ঠিত হবে। সকলকে আমন্ত্রণ জানানো হচ্ছে।', date: '২০২৫-০৩-১০', isActive: true },
  ];
  for (const n of noticesData) {
    await db.notice.create({ data: n });
  }
  console.log('✅ Notices created');

  // 11. Create FAQs
  const faqsData = [
    { question: 'ফলাফল কিভাবে দেখতে পারবো?', answer: 'ফলাফল পেজে গিয়ে আপনার পরীক্ষার নাম, মারহালা, রোল নম্বর ও রেজিস্ট্রেশন নম্বর দিয়ে সার্চ করুন।', isActive: true, sortOrder: 1 },
    { question: 'সনদের জন্য কিভাবে আবেদন করবো?', answer: 'সনদের আবেদন পেজে গিয়ে ৩টি ধাপে আবেদন সম্পন্ন করুন। প্রথমে আপনার তথ্য দিয়ে সনাক্ত হন, তারপর সনদের ধরন নির্বাচন করুন এবং অবশেষে আবেদন জমা দিন।', isActive: true, sortOrder: 2 },
    { question: 'সনদের আবেদনের স্ট্যাটাস কিভাবে দেখবো?', answer: 'সনদের স্ট্যাটাস পেজে গিয়ে আপনার আবেদন আইডি দিলে আবেদনের বর্তমান অবস্থা দেখতে পাবেন।', isActive: true, sortOrder: 3 },
    { question: 'ফলাফলে ভুল থাকলে কি করবো?', answer: 'ফলাফলে কোনো ভুল থাকলে মাদরাসার অফিসে যোগাযোগ করুন অথবা যোগাযোগ ফর্মের মাধ্যমে আমাদের জানান।', isActive: true, sortOrder: 4 },
    { question: 'ভর্তির যোগ্যতা কি?', answer: 'ভর্তির জন্য শিক্ষার্থীকে কুরআন মাজীদের কিছু পারা পড়তে হবে এবং ভর্তি পরীক্ষায় অংশগ্রহণ করতে হবে।', isActive: true, sortOrder: 5 },
    { question: 'মাসিক ফি কত?', answer: 'মাসিক ফি শ্রেণিভেদে পরিবর্তন হয়। বিস্তারিত জানতে অফিসে যোগাযোগ করুন।', isActive: true, sortOrder: 6 },
    { question: 'মাদরাসার কার্যক্রমের সময়সূচি কি?', answer: 'ফজরের পর থেকে মাগরিব পর্যন্ত মাদরাসার কার্যক্রম চলে। বিস্তারিত সময়সূচি নোটিশ বোর্ডে দেখুন।', isActive: true, sortOrder: 7 },
  ];
  for (const f of faqsData) {
    await db.fAQ.create({ data: f });
  }
  console.log('✅ FAQs created');

  // 12. Create income records
  const incomeCategories = ['ভর্তি ফি', 'মাসিক ফি', 'দান', 'যাকাত', 'অন্যান্য'];
  for (let i = 0; i < 20; i++) {
    const month = Math.floor(i / 2) + 1;
    const date = new Date(2025, month - 1, Math.floor(Math.random() * 28) + 1);
    const category = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
    const amount = Math.floor(Math.random() * 50000) + 1000;
    await db.income.create({
      data: {
        date,
        category,
        description: `${category} - ${ay2025.name}`,
        amount,
        academicYearId: ay2025.id,
        receivedBy: 'প্রশাসক',
      },
    });
  }
  console.log('✅ Income records created');

  // 13. Create expense records
  const expenseCategories = ['বেতন', 'বিদ্যুৎ', 'পানি', 'খাদ্য', 'অনুষ্ঠান', 'মেরামত', 'অন্যান্য'];
  for (let i = 0; i < 18; i++) {
    const month = Math.floor(i / 2) + 1;
    const date = new Date(2025, month - 1, Math.floor(Math.random() * 28) + 1);
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    const amount = Math.floor(Math.random() * 30000) + 500;
    await db.expense.create({
      data: {
        date,
        category,
        description: `${category} খরচ - ${ay2025.name}`,
        amount,
        academicYearId: ay2025.id,
        paidTo: category === 'বেতন' ? 'কর্মী' : undefined,
      },
    });
  }
  console.log('✅ Expense records created');

  // 14. Create salary records
  const employees = [
    { name: 'মাওলানা আব্দুল্লাহ', designation: 'শিক্ষক', basic: 15000 },
    { name: 'মাওলানা আহমাদ', designation: 'শিক্ষক', basic: 12000 },
    { name: 'মাওলানা ইব্রাহীম', designation: 'শিক্ষক', basic: 12000 },
    { name: 'হাফেজ উসমান', designation: 'শিক্ষক', basic: 10000 },
    { name: 'মো. আলী', designation: 'কর্মচারী', basic: 8000 },
    { name: 'মো. হাসান', designation: 'কর্মচারী', basic: 7000 },
    { name: 'মাওলানা জাকির', designation: 'ইমাম', basic: 12000 },
    { name: 'মো. ইউসুফ', designation: 'মুয়াজ্জিন', basic: 6000 },
  ];
  for (let month = 1; month <= 6; month++) {
    for (const emp of employees) {
      const allowance = Math.floor(Math.random() * 3000) + 1000;
      const deduction = Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : 0;
      const netSalary = emp.basic + allowance - deduction;
      const isPaid = month <= 4;
      await db.salary.create({
        data: {
          employeeName: emp.name,
          designation: emp.designation,
          month: String(month).padStart(2, '0'),
          year: '২০২৫',
          basicSalary: emp.basic,
          allowance,
          deduction,
          netSalary,
          paymentStatus: isPaid ? 'paid' : 'unpaid',
          academicYearId: ay2025.id,
        },
      });
    }
  }
  console.log('✅ Salary records created');

  // 15. Create student fee records
  for (const student of students) {
    for (let month = 1; month <= 6; month++) {
      const feeType = month === 1 ? 'admission' : 'monthly';
      const amount = feeType === 'admission' ? 2000 : 500;
      const isPaid = month <= 4;
      await db.studentFee.create({
        data: {
          studentId: student.id,
          academicYearId: ay2025.id,
          feeType,
          amount,
          paidAmount: isPaid ? amount : 0,
          dueAmount: isPaid ? 0 : amount,
          status: isPaid ? 'paid' : 'unpaid',
          month: String(month).padStart(2, '0'),
          paymentDate: isPaid ? new Date(2025, month - 1, 5) : null,
        },
      });
    }
  }
  console.log('✅ Student fee records created');

  // 16. Create attendance records
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    if (date.getDay() === 5) continue; // Skip Friday
    if (date.getDay() === 0) continue; // Skip Sunday

    for (let si = 0; si < Math.min(12, students.length); si++) {
      const statuses = ['present', 'present', 'present', 'present', 'present', 'present', 'absent', 'late'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      await db.attendance.create({
        data: {
          studentId: students[si].id,
          classId: students[si].classId || classes[0].id,
          date,
          status,
          academicYearId: ay2025.id,
        },
      });
    }
  }
  console.log('✅ Attendance records created');

  // 17. Create some contact messages
  const messagesData = [
    { name: 'আব্দুল করিম', email: 'karim@gmail.com', subject: 'ভর্তি সম্পর্কে', message: 'আমার ছেলেকে ভর্তি করতে চাই। বিস্তারিত জানতে চাই।' },
    { name: 'ফাতেমা বেগম', email: 'fatema@yahoo.com', subject: 'ফলাফল সংশোধন', message: 'আমার ছেলের ফলাফলে একটি ভুল আছে। অনুগ্রহ করে দেখবেন।' },
    { name: 'মো. রহিম', email: 'rahim@hotmail.com', subject: 'ফি সম্পর্কে', message: 'মাসিক ফি কি অনলাইনে জমা দেওয়া যায়?' },
  ];
  for (const m of messagesData) {
    await db.contactMessage.create({ data: m });
  }
  console.log('✅ Contact messages created');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
