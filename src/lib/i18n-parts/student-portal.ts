// i18n part: Student Portal (src/components/student/StudentPortal.tsx)
// Keys are merged into the main translations at module load time.
// Existing student.* / common.* keys from i18n.ts are reused where meanings match.

export const part: Record<'bn' | 'en' | 'ar', Record<string, string>> = {
  bn: {
    // ===== Document titles & view toggles =====
    'studentPortal.marksheet': 'নম্বরপত্র',
    'studentPortal.marksheetBanner': 'MARKSHEET / নম্বরপত্র',
    'studentPortal.transcript': 'ট্রান্সক্রিপ্ট',
    'studentPortal.academicTranscript': 'একাডেমিক ট্রান্সক্রিপ্ট',
    'studentPortal.transcriptBanner': 'ACADEMIC TRANSCRIPT / একাডেমিক ট্রান্সক্রিপ্ট',

    // ===== WhatsApp share =====
    'studentPortal.student': 'ছাত্র',
    'studentPortal.exam': 'পরীক্ষা',
    'studentPortal.marks': 'নম্বর',
    'studentPortal.result': 'ফলাফল',

    // ===== Pass / fail =====
    'studentPortal.passed': 'উত্তীর্ণ',
    'studentPortal.failed': 'অনুত্তীর্ণ',
    'studentPortal.passBanner': 'পাস — উত্তীর্ণ',
    'studentPortal.failBanner': 'ফেল — অনুত্তীর্ণ',

    // ===== Student info labels =====
    'studentPortal.studentName': 'ছাত্রের নাম',
    'studentPortal.regNo': 'রেজি. নম্বর',
    'studentPortal.department': 'বিভাগ',
    'studentPortal.position': 'অবস্থান',
    'studentPortal.examName': 'পরীক্ষার নাম',
    'studentPortal.totalExams': 'মোট পরীক্ষা',
    'studentPortal.examCount': '{count} টি',
    'studentPortal.overallGpa': 'সামগ্রিক জিপিএ',
    'studentPortal.outOf': 'মধ্যে',
    'studentPortal.outOf5': '৫.০০ এর মধ্যে',
    'studentPortal.meritOutOf': '{total} এর মধ্যে {position}',
    'studentPortal.examResultsCount': '{count} টি পরীক্ষার ফলাফল',

    // ===== Marks table =====
    'studentPortal.subject': 'বিষয়',
    'studentPortal.fullMarks': 'মোট',
    'studentPortal.obtained': 'প্রাপ্ত',
    'studentPortal.obtainedFull': 'প্রাপ্ত/মোট',
    'studentPortal.obtainedMarks': 'প্রাপ্ত নম্বর',
    'studentPortal.grade': 'গ্রেড',
    'studentPortal.gpa': 'জিপিএ',
    'studentPortal.percentage': 'শতকরা',
    'studentPortal.progress': 'প্রগতি',
    'studentPortal.subjectMarks': 'বিষয়ভিত্তিক নম্বর',

    // ===== Grade labels =====
    'studentPortal.gradeExcellent': 'অত্যন্ত ভালো',
    'studentPortal.gradeGood': 'ভালো',
    'studentPortal.gradeFair': 'মোটামুটি',
    'studentPortal.gradeAverage': 'গড়',
    'studentPortal.gradeSatisfactory': 'সন্তোষজনক',

    // ===== Print / PDF footers =====
    'studentPortal.cgMarksheet': 'কম্পিউটারে তৈরি নম্বরপত্র',
    'studentPortal.cgTranscript': 'কম্পিউটারে তৈরি ট্রান্সক্রিপ্ট',

    // ===== Transcript view =====
    'studentPortal.studentInfo': 'শিক্ষার্থীর তথ্য',
    'studentPortal.qrVerify': 'QR যাচাই',
    'studentPortal.allExamResults': 'সকল পরীক্ষার ফলাফল (কালানুক্রমিক)',
    'studentPortal.noExamResults': 'এই শিক্ষার্থীর কোনো পরীক্ষার ফলাফল পাওয়া যায়নি',
    'studentPortal.gpaTrend': 'জিপিএ ট্রেন্ড (GPA Trend)',
    'studentPortal.performanceAnalysis': 'পারফরম্যান্স বিশ্লেষণ',
    'studentPortal.bestSubject': 'শ্রেষ্ঠ বিষয়',
    'studentPortal.worstSubject': 'দুর্বল বিষয়',
    'studentPortal.remarks': 'মন্তব্য',
    'studentPortal.remarkOutstanding': 'অসাধারণ ফলাফল',
    'studentPortal.remarkExcellent': 'চমৎকার ফলাফল',
    'studentPortal.remarkGood': 'ভালো ফলাফল',
    'studentPortal.remarkSatisfactory': 'সন্তোষজনক ফলাফল',
    'studentPortal.remarkNeedsImprovement': 'উন্নতি প্রয়োজন',
    'studentPortal.remarkNeedsAttention': 'বিশেষ মনোযোগ প্রয়োজন',

    // ===== Result status messages =====
    'studentPortal.mashaAllah': 'মাশাআল্লাহ! আলহামদুলিল্লাহ!',
    'studentPortal.passedMessage': 'আপনার সন্তান সফলভাবে উত্তীর্ণ হয়েছে। আল্লাহ তাকে আরও সাফল্য দান করুন। আমীন।',
    'studentPortal.failedMessage': 'আল্লাহ তাকে পরবর্তীতে সাফল্য দান করুন। আমীন।',

    // ===== Signatures =====
    'studentPortal.guardian': 'অভিভাবক',
    'studentPortal.principal': 'অধ্যক্ষ',
    'studentPortal.signatureDate': 'স্বাক্ষর ও তারিখ',
    'studentPortal.signatureSeal': 'স্বাক্ষর ও সীলমোহর',

    // ===== Search form =====
    'studentPortal.rollShort': 'রোল',
    'studentPortal.regPlaceholder': 'রেজিস্ট্রেশন নম্বর লিখুন...',
    'studentPortal.rollPlaceholder': 'রোল নম্বর লিখুন...',
    'studentPortal.orDivider': 'অথবা বিভাগ, শ্রেণি ও রোল দিয়ে খুঁজুন',
    'studentPortal.selectDept': 'বিভাগ নির্বাচন করুন',
    'studentPortal.selectDeptFirst': 'প্রথমে বিভাগ নির্বাচন করুন',
    'studentPortal.selectClass': 'শ্রেণি নির্বাচন করুন',
    'studentPortal.noClasses': 'এই বিভাগে কোনো শ্রেণি পাওয়া যায়নি',
    'studentPortal.tryAgainHint': 'সঠিক তথ্য দিয়ে আবার চেষ্টা করুন',
  },

  en: {
    // ===== Document titles & view toggles =====
    'studentPortal.marksheet': 'Marksheet',
    'studentPortal.marksheetBanner': 'MARKSHEET',
    'studentPortal.transcript': 'Transcript',
    'studentPortal.academicTranscript': 'Academic Transcript',
    'studentPortal.transcriptBanner': 'ACADEMIC TRANSCRIPT',

    // ===== WhatsApp share =====
    'studentPortal.student': 'Student',
    'studentPortal.exam': 'Exam',
    'studentPortal.marks': 'Marks',
    'studentPortal.result': 'Result',

    // ===== Pass / fail =====
    'studentPortal.passed': 'Passed',
    'studentPortal.failed': 'Failed',
    'studentPortal.passBanner': 'Passed',
    'studentPortal.failBanner': 'Failed',

    // ===== Student info labels =====
    'studentPortal.studentName': 'Student Name',
    'studentPortal.regNo': 'Reg. No.',
    'studentPortal.department': 'Department',
    'studentPortal.position': 'Position',
    'studentPortal.examName': 'Exam Name',
    'studentPortal.totalExams': 'Total Exams',
    'studentPortal.examCount': '{count}',
    'studentPortal.overallGpa': 'Overall GPA',
    'studentPortal.outOf': 'out of',
    'studentPortal.outOf5': 'out of 5.00',
    'studentPortal.meritOutOf': '{position} out of {total}',
    'studentPortal.examResultsCount': '{count} exam results',

    // ===== Marks table =====
    'studentPortal.subject': 'Subject',
    'studentPortal.fullMarks': 'Full Marks',
    'studentPortal.obtained': 'Obtained',
    'studentPortal.obtainedFull': 'Obtained/Total',
    'studentPortal.obtainedMarks': 'Obtained Marks',
    'studentPortal.grade': 'Grade',
    'studentPortal.gpa': 'GPA',
    'studentPortal.percentage': 'Percentage',
    'studentPortal.progress': 'Progress',
    'studentPortal.subjectMarks': 'Subject-wise Marks',

    // ===== Grade labels =====
    'studentPortal.gradeExcellent': 'Excellent',
    'studentPortal.gradeGood': 'Good',
    'studentPortal.gradeFair': 'Fair',
    'studentPortal.gradeAverage': 'Average',
    'studentPortal.gradeSatisfactory': 'Satisfactory',

    // ===== Print / PDF footers =====
    'studentPortal.cgMarksheet': 'Computer Generated Marksheet',
    'studentPortal.cgTranscript': 'Computer Generated Transcript',

    // ===== Transcript view =====
    'studentPortal.studentInfo': 'Student Information',
    'studentPortal.qrVerify': 'QR Verify',
    'studentPortal.allExamResults': 'All Exam Results (Chronological)',
    'studentPortal.noExamResults': 'No exam results found for this student',
    'studentPortal.gpaTrend': 'GPA Trend',
    'studentPortal.performanceAnalysis': 'Performance Analysis',
    'studentPortal.bestSubject': 'Best Subject',
    'studentPortal.worstSubject': 'Weakest Subject',
    'studentPortal.remarks': 'Remarks',
    'studentPortal.remarkOutstanding': 'Outstanding Result',
    'studentPortal.remarkExcellent': 'Excellent Result',
    'studentPortal.remarkGood': 'Good Result',
    'studentPortal.remarkSatisfactory': 'Satisfactory Result',
    'studentPortal.remarkNeedsImprovement': 'Needs Improvement',
    'studentPortal.remarkNeedsAttention': 'Needs Special Attention',

    // ===== Result status messages =====
    'studentPortal.mashaAllah': 'MashaAllah! Alhamdulillah!',
    'studentPortal.passedMessage': 'Your child has passed successfully. May Allah grant him even greater success. Ameen.',
    'studentPortal.failedMessage': 'May Allah grant him success next time. Ameen.',

    // ===== Signatures =====
    'studentPortal.guardian': 'Guardian',
    'studentPortal.principal': 'Principal',
    'studentPortal.signatureDate': 'Signature & Date',
    'studentPortal.signatureSeal': 'Signature & Seal',

    // ===== Search form =====
    'studentPortal.rollShort': 'Roll',
    'studentPortal.regPlaceholder': 'Enter registration number...',
    'studentPortal.rollPlaceholder': 'Enter roll number...',
    'studentPortal.orDivider': 'OR search by department, class and roll',
    'studentPortal.selectDept': 'Select department',
    'studentPortal.selectDeptFirst': 'Select a department first',
    'studentPortal.selectClass': 'Select class',
    'studentPortal.noClasses': 'No classes found in this department',
    'studentPortal.tryAgainHint': 'Please try again with correct information',
  },

  ar: {
    // ===== Document titles & view toggles =====
    'studentPortal.marksheet': 'كشف الدرجات',
    'studentPortal.marksheetBanner': 'كشف الدرجات',
    'studentPortal.transcript': 'السجل الأكاديمي',
    'studentPortal.academicTranscript': 'السجل الأكاديمي',
    'studentPortal.transcriptBanner': 'السجل الأكاديمي',

    // ===== WhatsApp share =====
    'studentPortal.student': 'الطالب',
    'studentPortal.exam': 'الامتحان',
    'studentPortal.marks': 'الدرجات',
    'studentPortal.result': 'النتيجة',

    // ===== Pass / fail =====
    'studentPortal.passed': 'ناجح',
    'studentPortal.failed': 'راسب',
    'studentPortal.passBanner': 'ناجح',
    'studentPortal.failBanner': 'راسب',

    // ===== Student info labels =====
    'studentPortal.studentName': 'اسم الطالب',
    'studentPortal.regNo': 'رقم التسجيل',
    'studentPortal.department': 'القسم',
    'studentPortal.position': 'المركز',
    'studentPortal.examName': 'اسم الامتحان',
    'studentPortal.totalExams': 'إجمالي الامتحانات',
    'studentPortal.examCount': '{count}',
    'studentPortal.overallGpa': 'المعدل التراكمي',
    'studentPortal.outOf': 'من',
    'studentPortal.outOf5': 'من 5.00',
    'studentPortal.meritOutOf': '{position} من {total}',
    'studentPortal.examResultsCount': '{count} نتائج امتحانات',

    // ===== Marks table =====
    'studentPortal.subject': 'المادة',
    'studentPortal.fullMarks': 'الدرجة الكاملة',
    'studentPortal.obtained': 'المحصلة',
    'studentPortal.obtainedFull': 'المحصلة/المجموع',
    'studentPortal.obtainedMarks': 'الدرجات المحصلة',
    'studentPortal.grade': 'التقدير',
    'studentPortal.gpa': 'المعدل',
    'studentPortal.percentage': 'النسبة المئوية',
    'studentPortal.progress': 'التقدم',
    'studentPortal.subjectMarks': 'الدرجات حسب المادة',

    // ===== Grade labels =====
    'studentPortal.gradeExcellent': 'ممتاز',
    'studentPortal.gradeGood': 'جيد',
    'studentPortal.gradeFair': 'مقبول',
    'studentPortal.gradeAverage': 'متوسط',
    'studentPortal.gradeSatisfactory': 'مُرضٍ',

    // ===== Print / PDF footers =====
    'studentPortal.cgMarksheet': 'كشف درجات صادر عن الحاسوب',
    'studentPortal.cgTranscript': 'سجل أكاديمي صادر عن الحاسوب',

    // ===== Transcript view =====
    'studentPortal.studentInfo': 'بيانات الطالب',
    'studentPortal.qrVerify': 'تحقق برمز QR',
    'studentPortal.allExamResults': 'جميع نتائج الامتحانات (ترتيب زمني)',
    'studentPortal.noExamResults': 'لم يتم العثور على نتائج امتحانات لهذا الطالب',
    'studentPortal.gpaTrend': 'اتجاه المعدل',
    'studentPortal.performanceAnalysis': 'تحليل الأداء',
    'studentPortal.bestSubject': 'أفضل مادة',
    'studentPortal.worstSubject': 'أضعف مادة',
    'studentPortal.remarks': 'ملاحظات',
    'studentPortal.remarkOutstanding': 'نتيجة متميزة',
    'studentPortal.remarkExcellent': 'نتيجة ممتازة',
    'studentPortal.remarkGood': 'نتيجة جيدة',
    'studentPortal.remarkSatisfactory': 'نتيجة مرضية',
    'studentPortal.remarkNeedsImprovement': 'يحتاج إلى تحسين',
    'studentPortal.remarkNeedsAttention': 'يحتاج إلى اهتمام خاص',

    // ===== Result status messages =====
    'studentPortal.mashaAllah': 'ما شاء الله! الحمد لله!',
    'studentPortal.passedMessage': 'لقد نجح ابنكم بنجاح. نسأل الله أن يمنحه مزيدًا من التوفيق. آمين.',
    'studentPortal.failedMessage': 'نسأل الله أن يوفقه في المرة القادمة. آمين.',

    // ===== Signatures =====
    'studentPortal.guardian': 'ولي الأمر',
    'studentPortal.principal': 'المدير',
    'studentPortal.signatureDate': 'التوقيع والتاريخ',
    'studentPortal.signatureSeal': 'التوقيع والختم',

    // ===== Search form =====
    'studentPortal.rollShort': 'القيد',
    'studentPortal.regPlaceholder': 'أدخل رقم التسجيل...',
    'studentPortal.rollPlaceholder': 'أدخل رقم القيد...',
    'studentPortal.orDivider': 'أو ابحث بالقسم والصف ورقم القيد',
    'studentPortal.selectDept': 'اختر القسم',
    'studentPortal.selectDeptFirst': 'اختر القسم أولاً',
    'studentPortal.selectClass': 'اختر الصف',
    'studentPortal.noClasses': 'لا توجد صفوف في هذا القسم',
    'studentPortal.tryAgainHint': 'يرجى المحاولة مرة أخرى بالمعلومات الصحيحة',
  },
};
