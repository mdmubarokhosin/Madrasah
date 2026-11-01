// i18n part file — admin password recovery (v2.3).
// Components: AdminLogin (forgot-password wizard + registration recovery
// fields), AdminSettings (Recovery tab), RecoveryKeyDialog.
// Keys here are merged into the main translations at module load.

export const part: Record<'bn' | 'en' | 'ar', Record<string, string>> = {
  bn: {
    // ===== Preset security questions =====
    'adminRecovery.q1': 'আপনার প্রথম পড়া স্কুল/মাদরাসার নাম কী?',
    'adminRecovery.q2': 'আপনার শৈশবের ডাকনাম কী ছিল?',
    'adminRecovery.q3': 'আপনার পিতার জন্ম জেলার নাম কী?',
    'adminRecovery.q4': 'আপনার প্রিয় বইয়ের নাম কী?',
    'adminRecovery.q5': 'আপনার প্রথম মোবাইল নম্বরের শেষ চার ডিজিট কী ছিল?',
    'adminRecovery.qCustom': 'নিজের প্রশ্ন লিখুন...',

    // ===== RecoveryKeyDialog =====
    'adminRecovery.keyDialogTitle': 'আপনার রিকভারি কী',
    'adminRecovery.keyDialogWarning':
      'এই কী এখনই নিরাপদে সংরক্ষণ করুন! পাসওয়ার্ড ভুলে গেলে এই কী দিয়েই এডমিন প্যানেলে প্রবেশ পুনরুদ্ধার করা যাবে। নিরাপত্তার জন্য কী-টি আর কখনো দেখানো হবে না।',
    'adminRecovery.keyCopy': 'কপি করুন',
    'adminRecovery.keyCopied': 'কপি হয়েছে!',
    'adminRecovery.keySavedCheckbox': 'আমি কী-টি নিরাপদে সংরক্ষণ করেছি (যেমন: খাতায় লিখে, পাসওয়ার্ড ম্যানেজারে)',
    'adminRecovery.keyDone': 'সংরক্ষণ সম্পন্ন',

    // ===== Login page — forgot password wizard =====
    'adminLogin.forgotLink': 'পাসওয়ার্ড ভুলে গেছেন?',
    'adminLogin.forgotTitle': 'পাসওয়ার্ড রিকভারি',
    'adminLogin.forgotSubtitle': 'অ্যাকাউন্ট যাচাই করে নতুন পাসওয়ার্ড সেট করুন',
    'adminLogin.forgotIdentifyNote': 'আপনার এডমিন অ্যাকাউন্টের ইউজারনেম বা ইমেইল লিখুন — আমরা অ্যাকাউন্টটি খুঁজে যাচাই পদ্ধতি দেখাব।',
    'adminLogin.forgotIdentifierLabel': 'ইউজারনেম বা ইমেইল',
    'adminLogin.forgotIdentifierPh': 'যেমন: admin অথবা admin@example.com',
    'adminLogin.forgotIdentifierRequired': 'ইউজারনেম বা ইমেইল লিখুন',
    'adminLogin.forgotChecking': 'খোঁজা হচ্ছে...',
    'adminLogin.forgotNext': 'পরবর্তী',
    'adminLogin.forgotNotFound': 'এই ইউজারনেম/ইমেইলে কোনো এডমিন অ্যাকাউন্ট পাওয়া যায়নি',
    'adminLogin.forgotLookupDenied':
      'অ্যাকাউন্ট খোঁজা যায়নি — নিরাপত্তা-নিয়ম আপডেট করা হয়নি। ইমেইল দিয়ে চেষ্টা করুন, অথবা সম্পূর্ণ রিকভারির জন্য README-এর নির্দেশনায় নতুন database.rules.json ডিপ্লয় করুন।',
    'adminLogin.forgotResetDenied':
      'সরাসরি রিসেট লেখা যায়নি (নিরাপত্তা-নিয়ম)। ইমেইল পদ্ধতি ব্যবহার করুন, অথবা Firebase Console → Realtime Database → /adminUsers থেকে পাসওয়ার্ড রিসেট করুন (README দেখুন)।',
    'adminLogin.forgotChooseMethod': 'যাচাই পদ্ধতি নির্বাচন করুন',
    'adminLogin.forgotMethodQuestion': 'নিরাপত্তা প্রশ্ন',
    'adminLogin.forgotMethodQuestionDesc': 'রেজিস্ট্রেশন/সেটিংসে সেট করা প্রশ্নের উত্তর দিন',
    'adminLogin.forgotMethodKey': 'রিকভারি কী',
    'adminLogin.forgotMethodKeyDesc': 'সংরক্ষিত ১৬ অক্ষরের রিকভারি কী লিখুন',
    'adminLogin.forgotMethodEmail': 'ইমেইলে রিসেট লিংক',
    'adminLogin.forgotMethodEmailDesc': 'রেজিস্টার্ড ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হবে',
    'adminLogin.forgotQuestionLabel': 'আপনার নিরাপত্তা প্রশ্ন:',
    'adminLogin.forgotAnswerLabel': 'প্রশ্নের উত্তর',
    'adminLogin.forgotAnswerPh': 'উত্তর লিখুন...',
    'adminLogin.forgotKeyLabel': 'রিকভারি কী',
    'adminLogin.forgotKeyPh': 'XXXX-XXXX-XXXX-XXXX',
    'adminLogin.forgotVerify': 'যাচাই করুন',
    'adminLogin.forgotVerifying': 'যাচাই হচ্ছে...',
    'adminLogin.forgotWrongAnswer': 'উত্তর সঠিক নয় — আবার চেষ্টা করুন',
    'adminLogin.forgotWrongKey': 'রিকভারি কী সঠিক নয় — আবার চেষ্টা করুন',
    'adminLogin.forgotTooManyAttempts': 'অনেকবার ভুল হয়েছে। {minutes} মিনিট পর আবার চেষ্টা করুন',
    'adminLogin.forgotLocked': 'নিরাপত্তার জন্য সাময়িকভাবে বন্ধ — আরও {minutes} মিনিট অপেক্ষা করুন',
    'adminLogin.forgotSending': 'ইমেইল পাঠানো হচ্ছে...',
    'adminLogin.forgotNewPasswordTitle': 'নতুন পাসওয়ার্ড সেট করুন',
    'adminLogin.forgotNewPassword': 'নতুন পাসওয়ার্ড',
    'adminLogin.forgotConfirmPassword': 'নতুন পাসওয়ার্ড নিশ্চিত করুন',
    'adminLogin.forgotResetBtn': 'পাসওয়ার্ড রিসেট করুন',
    'adminLogin.forgotResetting': 'রিসেট হচ্ছে...',
    'adminLogin.forgotResetFailed': 'পাসওয়ার্ড রিসেট ব্যর্থ — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন',
    'adminLogin.forgotEmailSendFailed': 'ইমেইল পাঠানো ব্যর্থ হয়েছে — নিরাপত্তা প্রশ্ন বা রিকভারি কী ব্যবহার করুন',
    'adminLogin.forgotEmailSendFailedNote':
      'ইমেইল পাঠানো যায়নি (Firebase Auth অনুপলব্ধ)। আপনার পরিচয় যাচাই হয়ে গেছে, তাই সরাসরি নতুন পাসওয়ার্ড সেট করতে পারেন।',
    'adminLogin.forgotEmailSentTitle': 'ইমেইল পাঠানো হয়েছে!',
    'adminLogin.forgotEmailSentDesc':
      '{email} ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স ও স্প্যাম ফোল্ডার দেখুন। লিংক থেকে নতুন পাসওয়ার্ড সেট করে এখানে ফিরে এসে লগইন করুন।',
    'adminLogin.forgotDoneTitle': 'পাসওয়ার্ড পরিবর্তন সফল!',
    'adminLogin.forgotDoneDesc': 'আপনার পাসওয়ার্ড পরিবর্তন হয়ে গেছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।',
    'adminLogin.forgotBackToLogin': 'লগইনে ফিরে যান',
    'adminLogin.forgotNoMethodsTitle': 'রিকভারি ব্যবস্থা সেট করা নেই',
    'adminLogin.forgotNoMethodsDesc':
      'এই অ্যাকাউন্টে নিরাপত্তা প্রশ্ন, রিকভারি কী বা ইমেইল — কোনো রিকভারি ব্যবস্থাই সেট করা নেই। Firebase Console → Realtime Database → /adminUsers থেকে এডমিন প্রোফাইলটি মুছে পুনরায় রেজিস্ট্রেশন করুন (বিস্তারিত: README)। লগইন করতে পারলে Settings → রিকভারি থেকে এই ব্যবস্থাগুলো সেট করে নিন।',

    // ===== Registration — recovery fields =====
    'adminRegister.recoveryNote':
      'পাসওয়ার্ড ভুলে গেলে এই প্রশ্ন-উত্তর দিয়েই নিজে রিসেট করতে পারবেন। রেজিস্ট্রেশন শেষে একটি রিকভারি কী-ও দেখানো হবে — সেটিও সংরক্ষণ করুন।',
    'adminRegister.recoveryRequired': 'নিরাপত্তা প্রশ্ন নির্বাচন করে অন্তত ২ অক্ষরের উত্তর লিখুন',
    'adminRegister.securityQuestion': 'নিরাপত্তা প্রশ্ন',
    'adminRegister.securityQuestionSelect': '— একটি প্রশ্ন নির্বাচন করুন —',
    'adminRegister.securityQuestionCustom': 'আপনার প্রশ্ন',
    'adminRegister.securityAnswer': 'নিরাপত্তা উত্তর',
    'adminRegister.securityAnswerPh': 'মনে রাখা সহজ এমন উত্তর লিখুন...',

    // ===== Admin Settings — Recovery tab =====
    'adminSettings.recoveryTab': 'রিকভারি',
    'adminSettings.recoveryTitle': 'পাসওয়ার্ড রিকভারি সেটআপ',
    'adminSettings.recoveryDesc': 'পাসওয়ার্ড ভুলে গেলে লগইন পেজ থেকেই নিজে রিসেট করার ব্যবস্থা',
    'adminSettings.questionCardTitle': 'নিরাপত্তা প্রশ্ন',
    'adminSettings.questionSet': 'নিরাপত্তা প্রশ্ন সেট করা আছে',
    'adminSettings.questionNotSet': 'নিরাপত্তা প্রশ্ন সেট করা নেই',
    'adminSettings.currentQuestion': 'বর্তমান প্রশ্ন',
    'adminSettings.changeQuestion': 'প্রশ্ন পরিবর্তন করুন',
    'adminSettings.setQuestion': 'প্রশ্ন সেট করুন',
    'adminSettings.cancelEdit': 'বাতিল',
    'adminSettings.keyCardTitle': 'রিকভারি কী',
    'adminSettings.keySet': 'রিকভারি কী তৈরি করা আছে',
    'adminSettings.keySetAt': 'সর্বশেষ তৈরি',
    'adminSettings.keyNotSet': 'রিকভারি কী তৈরি করা নেই',
    'adminSettings.keyNotSetHint': 'কী তৈরি করলে পাসওয়ার্ড ভুলে গেলে সেটি দিয়েই প্রবেশ পুনরুদ্ধার করা যাবে',
    'adminSettings.generateKey': 'নতুন রিকভারি কী তৈরি করুন',
    'adminSettings.generateKeyConfirmTitle': 'নতুন রিকভারি কী?',
    'adminSettings.generateKeyConfirmDesc':
      'নতুন কী তৈরি করলে আগের কী স্থায়ীভাবে বাতিল হয়ে যাবে। নতুন কী একবার মাত্র দেখানো হবে — সাথে সাথে সংরক্ষণ করুন। চালিয়ে যাবেন?',
    'adminSettings.confirmGenerate': 'হ্যাঁ, তৈরি করুন',
    'adminSettings.recoverySaved': 'রিকভারি সেটআপ সংরক্ষিত হয়েছে',
    'adminSettings.recoverySaveFailed': 'সংরক্ষণ ব্যর্থ — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন',
    'adminSettings.recoverySetupHint':
      'এই ব্যবস্থাগুলো লগইন পেজের "পাসওয়ার্ড ভুলে গেছেন?" লিংকে কাজ করে। অন্তত একটি পদ্ধতি সেট করে রাখুন।',

    // ===== Settings — password change fix (Auth sync) =====
    'adminSettings.passwordAuthSynced': 'পাসওয়ার্ড পরিবর্তন হয়েছে (Firebase Auth সহ)',
    'adminSettings.passwordRTDBOnly': 'পাসওয়ার্ড পরিবর্তন হয়েছে',
  },

  en: {
    // ===== Preset security questions =====
    'adminRecovery.q1': 'What is the name of the first school/madrasah you studied at?',
    'adminRecovery.q2': 'What was your childhood nickname?',
    'adminRecovery.q3': 'In which district was your father born?',
    'adminRecovery.q4': 'What is your favourite book?',
    'adminRecovery.q5': 'What were the last four digits of your first mobile number?',
    'adminRecovery.qCustom': 'Write your own question...',

    // ===== RecoveryKeyDialog =====
    'adminRecovery.keyDialogTitle': 'Your recovery key',
    'adminRecovery.keyDialogWarning':
      'Save this key somewhere safe right now! If you ever forget your password, this key is the way back into the admin panel. For security it will never be shown again.',
    'adminRecovery.keyCopy': 'Copy',
    'adminRecovery.keyCopied': 'Copied!',
    'adminRecovery.keySavedCheckbox': 'I have saved this key securely (e.g. on paper, in a password manager)',
    'adminRecovery.keyDone': 'Done — saved',

    // ===== Login page — forgot password wizard =====
    'adminLogin.forgotLink': 'Forgot password?',
    'adminLogin.forgotTitle': 'Password recovery',
    'adminLogin.forgotSubtitle': 'Verify your account and set a new password',
    'adminLogin.forgotIdentifyNote': 'Enter your admin username or email — we will find the account and show the verification options.',
    'adminLogin.forgotIdentifierLabel': 'Username or email',
    'adminLogin.forgotIdentifierPh': 'e.g. admin or admin@example.com',
    'adminLogin.forgotIdentifierRequired': 'Enter your username or email',
    'adminLogin.forgotChecking': 'Searching...',
    'adminLogin.forgotNext': 'Next',
    'adminLogin.forgotNotFound': 'No admin account found for this username/email',
    'adminLogin.forgotLookupDenied':
      'Could not look up the account — the security rules have not been updated. Try with your email, or deploy the updated database.rules.json for full recovery (see README).',
    'adminLogin.forgotResetDenied':
      'Could not write the reset (security rules). Use the email method, or reset via Firebase Console → Realtime Database → /adminUsers (see README).',
    'adminLogin.forgotChooseMethod': 'Choose a verification method',
    'adminLogin.forgotMethodQuestion': 'Security question',
    'adminLogin.forgotMethodQuestionDesc': 'Answer the question you set during registration or in Settings',
    'adminLogin.forgotMethodKey': 'Recovery key',
    'adminLogin.forgotMethodKeyDesc': 'Enter your saved 16-character recovery key',
    'adminLogin.forgotMethodEmail': 'Email reset link',
    'adminLogin.forgotMethodEmailDesc': 'A password reset link will be sent to the registered email',
    'adminLogin.forgotQuestionLabel': 'Your security question:',
    'adminLogin.forgotAnswerLabel': 'Answer',
    'adminLogin.forgotAnswerPh': 'Type your answer...',
    'adminLogin.forgotKeyLabel': 'Recovery key',
    'adminLogin.forgotKeyPh': 'XXXX-XXXX-XXXX-XXXX',
    'adminLogin.forgotVerify': 'Verify',
    'adminLogin.forgotVerifying': 'Verifying...',
    'adminLogin.forgotWrongAnswer': 'Incorrect answer — please try again',
    'adminLogin.forgotWrongKey': 'Incorrect recovery key — please try again',
    'adminLogin.forgotTooManyAttempts': 'Too many failed attempts. Try again in {minutes} minutes',
    'adminLogin.forgotLocked': 'Temporarily locked for security — wait {minutes} more minute(s)',
    'adminLogin.forgotSending': 'Sending email...',
    'adminLogin.forgotNewPasswordTitle': 'Set a new password',
    'adminLogin.forgotNewPassword': 'New password',
    'adminLogin.forgotConfirmPassword': 'Confirm new password',
    'adminLogin.forgotResetBtn': 'Reset password',
    'adminLogin.forgotResetting': 'Resetting...',
    'adminLogin.forgotResetFailed': 'Password reset failed — check your connection and try again',
    'adminLogin.forgotEmailSendFailed': 'Could not send the email — use the security question or recovery key instead',
    'adminLogin.forgotEmailSendFailedNote':
      'The email could not be sent (Firebase Auth unavailable). Your identity has been verified, so you may set a new password directly.',
    'adminLogin.forgotEmailSentTitle': 'Email sent!',
    'adminLogin.forgotEmailSentDesc':
      'A password reset link has been sent to {email}. Check your inbox and spam folder. Set a new password from the link, then come back here to log in.',
    'adminLogin.forgotDoneTitle': 'Password changed successfully!',
    'adminLogin.forgotDoneDesc': 'Your password has been changed. Now log in with the new password.',
    'adminLogin.forgotBackToLogin': 'Back to login',
    'adminLogin.forgotNoMethodsTitle': 'No recovery method configured',
    'adminLogin.forgotNoMethodsDesc':
      'This account has no security question, recovery key or email configured. Remove the admin profile via Firebase Console → Realtime Database → /adminUsers and register again (see README). Once you can log in, configure recovery under Settings → Recovery.',

    // ===== Registration — recovery fields =====
    'adminRegister.recoveryNote':
      'If you ever forget your password you can reset it with this question and answer. After registration a recovery key will also be shown — save that too.',
    'adminRegister.recoveryRequired': 'Select a security question and write an answer of at least 2 characters',
    'adminRegister.securityQuestion': 'Security question',
    'adminRegister.securityQuestionSelect': '— Select a question —',
    'adminRegister.securityQuestionCustom': 'Your question',
    'adminRegister.securityAnswer': 'Security answer',
    'adminRegister.securityAnswerPh': 'Write an answer you will remember...',

    // ===== Admin Settings — Recovery tab =====
    'adminSettings.recoveryTab': 'Recovery',
    'adminSettings.recoveryTitle': 'Password recovery setup',
    'adminSettings.recoveryDesc': 'Reset your password yourself from the login page if you ever forget it',
    'adminSettings.questionCardTitle': 'Security question',
    'adminSettings.questionSet': 'Security question is set',
    'adminSettings.questionNotSet': 'Security question is not set',
    'adminSettings.currentQuestion': 'Current question',
    'adminSettings.changeQuestion': 'Change question',
    'adminSettings.setQuestion': 'Set question',
    'adminSettings.cancelEdit': 'Cancel',
    'adminSettings.keyCardTitle': 'Recovery key',
    'adminSettings.keySet': 'Recovery key generated',
    'adminSettings.keySetAt': 'Last generated',
    'adminSettings.keyNotSet': 'Recovery key not generated',
    'adminSettings.keyNotSetHint': 'A key lets you regain access if you ever forget your password',
    'adminSettings.generateKey': 'Generate new recovery key',
    'adminSettings.generateKeyConfirmTitle': 'Generate a new recovery key?',
    'adminSettings.generateKeyConfirmDesc':
      'Generating a new key permanently invalidates the previous one. The new key is shown only once — save it immediately. Continue?',
    'adminSettings.confirmGenerate': 'Yes, generate',
    'adminSettings.recoverySaved': 'Recovery setup saved',
    'adminSettings.recoverySaveFailed': 'Save failed — check your connection and try again',
    'adminSettings.recoverySetupHint':
      'These methods power the "Forgot password?" link on the login page. Configure at least one method.',

    // ===== Settings — password change fix (Auth sync) =====
    'adminSettings.passwordAuthSynced': 'Password changed (including Firebase Auth)',
    'adminSettings.passwordRTDBOnly': 'Password changed',
  },

  ar: {
    // ===== Preset security questions =====
    'adminRecovery.q1': 'ما اسم أول مدرسة/معهد درست فيه؟',
    'adminRecovery.q2': 'ما هو لقبك في طفولتك؟',
    'adminRecovery.q3': 'في أي مقاطعة وُلد والدك؟',
    'adminRecovery.q4': 'ما هو كتابك المفضل؟',
    'adminRecovery.q5': 'ما هي آخر أرقام أول رقم هاتف محمول لك؟',
    'adminRecovery.qCustom': 'اكتب سؤالك الخاص...',

    // ===== RecoveryKeyDialog =====
    'adminRecovery.keyDialogTitle': 'مفتاح الاستعادة الخاص بك',
    'adminRecovery.keyDialogWarning':
      'احفظ هذا المفتاح في مكان آمن الآن! إذا نسيت كلمة المرور يومًا فهذه هي الطريقة للعودة إلى لوحة الإدارة. ولأمانة الحفظ لن يُعرض المفتاح مرة أخرى أبدًا.',
    'adminRecovery.keyCopy': 'نسخ',
    'adminRecovery.keyCopied': 'تم النسخ!',
    'adminRecovery.keySavedCheckbox': 'لقد حفظت هذا المفتاح بأمان (مثلًا: على الورق أو في مدير كلمات المرور)',
    'adminRecovery.keyDone': 'تم الحفظ',

    // ===== Login page — forgot password wizard =====
    'adminLogin.forgotLink': 'نسيت كلمة المرور؟',
    'adminLogin.forgotTitle': 'استعادة كلمة المرور',
    'adminLogin.forgotSubtitle': 'تحقق من حسابك واضبط كلمة مرور جديدة',
    'adminLogin.forgotIdentifyNote': 'أدخل اسم المستخدم أو البريد الإلكتروني للحساب — سنجد الحساب ونعرض خيارات التحقق.',
    'adminLogin.forgotIdentifierLabel': 'اسم المستخدم أو البريد الإلكتروني',
    'adminLogin.forgotIdentifierPh': 'مثل: admin أو admin@example.com',
    'adminLogin.forgotIdentifierRequired': 'أدخل اسم المستخدم أو البريد الإلكتروني',
    'adminLogin.forgotChecking': 'جارٍ البحث...',
    'adminLogin.forgotNext': 'التالي',
    'adminLogin.forgotNotFound': 'لا يوجد حساب إداري بهذا الاسم/البريد الإلكتروني',
    'adminLogin.forgotLookupDenied':
      'تعذّر العثور على الحساب — قواعد الأمان لم تُحدَّث. جرّب بالبريد الإلكتروني، أو انشر ملف database.rules.json المحدَّث للاستعادة الكاملة (انظر README).',
    'adminLogin.forgotResetDenied':
      'تعذّرت كتابة إعادة التعيين (قواعد الأمان). استخدم طريقة البريد، أو أعد التعيين عبر Firebase Console → Realtime Database → /adminUsers (انظر README).',
    'adminLogin.forgotChooseMethod': 'اختر طريقة التحقق',
    'adminLogin.forgotMethodQuestion': 'سؤال الأمان',
    'adminLogin.forgotMethodQuestionDesc': 'أجب عن السؤال الذي ضبطته أثناء التسجيل أو في الإعدادات',
    'adminLogin.forgotMethodKey': 'مفتاح الاستعادة',
    'adminLogin.forgotMethodKeyDesc': 'أدخل مفتاح الاستعادة المكوَّن من ١٦ حرفًا الذي حفظته',
    'adminLogin.forgotMethodEmail': 'رابط إعادة التعيين بالبريد',
    'adminLogin.forgotMethodEmailDesc': 'سيُرسل رابط إعادة تعيين كلمة المرور إلى البريد المسجل',
    'adminLogin.forgotQuestionLabel': 'سؤال الأمان الخاص بك:',
    'adminLogin.forgotAnswerLabel': 'الإجابة',
    'adminLogin.forgotAnswerPh': 'اكتب إجابتك...',
    'adminLogin.forgotKeyLabel': 'مفتاح الاستعادة',
    'adminLogin.forgotKeyPh': 'XXXX-XXXX-XXXX-XXXX',
    'adminLogin.forgotVerify': 'تحقق',
    'adminLogin.forgotVerifying': 'جارٍ التحقق...',
    'adminLogin.forgotWrongAnswer': 'الإجابة غير صحيحة — حاول مرة أخرى',
    'adminLogin.forgotWrongKey': 'مفتاح الاستعادة غير صحيح — حاول مرة أخرى',
    'adminLogin.forgotTooManyAttempts': 'محاولات فاشلة كثيرة. حاول مرة أخرى بعد {minutes} دقيقة',
    'adminLogin.forgotLocked': 'مقفل مؤقتًا للأمان — انتظر {minutes} دقيقة إضافية',
    'adminLogin.forgotSending': 'جارٍ إرسال البريد...',
    'adminLogin.forgotNewPasswordTitle': 'اضبط كلمة مرور جديدة',
    'adminLogin.forgotNewPassword': 'كلمة المرور الجديدة',
    'adminLogin.forgotConfirmPassword': 'تأكيد كلمة المرور الجديدة',
    'adminLogin.forgotResetBtn': 'إعادة تعيين كلمة المرور',
    'adminLogin.forgotResetting': 'جارٍ إعادة التعيين...',
    'adminLogin.forgotResetFailed': 'فشلت إعادة التعيين — تحقق من الاتصال وحاول مرة أخرى',
    'adminLogin.forgotEmailSendFailed': 'تعذّر إرسال البريد — استخدم سؤال الأمان أو مفتاح الاستعادة',
    'adminLogin.forgotEmailSendFailedNote':
      'تعذّر إرسال البريد (خدمة المصادقة غير متاحة). تم التحقق من هويتك، لذا يمكنك ضبط كلمة مرور جديدة مباشرة.',
    'adminLogin.forgotEmailSentTitle': 'تم إرسال البريد!',
    'adminLogin.forgotEmailSentDesc':
      'أُرسل رابط إعادة تعيين كلمة المرور إلى {email}. تحقق من صندوق الوارد ومجلد الرسائل غير المرغوبة. اضبط كلمة المرور الجديدة من الرابط ثم عُد هنا لتسجيل الدخول.',
    'adminLogin.forgotDoneTitle': 'تم تغيير كلمة المرور بنجاح!',
    'adminLogin.forgotDoneDesc': 'تم تغيير كلمة المرور. سجّل الدخول الآن بكلمة المرور الجديدة.',
    'adminLogin.forgotBackToLogin': 'العودة إلى تسجيل الدخول',
    'adminLogin.forgotNoMethodsTitle': 'لم يتم ضبط أي وسيلة استعادة',
    'adminLogin.forgotNoMethodsDesc':
      'لا يحتوي هذا الحساب على سؤال أمان أو مفتاح استعادة أو بريد إلكتروني. احذف ملف المدير عبر Firebase Console → Realtime Database → /adminUsers ثم سجّل مرة أخرى (انظر README). وبعد تسجيل الدخول اضبط الاستعادة من الإعدادات → الاستعادة.',

    // ===== Registration — recovery fields =====
    'adminRegister.recoveryNote':
      'إذا نسيت كلمة المرور يمكنك إعادة تعيينها بهذا السؤال والإجابة. وبعد التسجيل سيُعرض مفتاح استعادة أيضًا — احفظه كذلك.',
    'adminRegister.recoveryRequired': 'اختر سؤال أمان واكتب إجابة من حرفين على الأقل',
    'adminRegister.securityQuestion': 'سؤال الأمان',
    'adminRegister.securityQuestionSelect': '— اختر سؤالًا —',
    'adminRegister.securityQuestionCustom': 'سؤالك',
    'adminRegister.securityAnswer': 'إجابة الأمان',
    'adminRegister.securityAnswerPh': 'اكتب إجابة تتذكرها...',

    // ===== Admin Settings — Recovery tab =====
    'adminSettings.recoveryTab': 'الاستعادة',
    'adminSettings.recoveryTitle': 'إعداد استعادة كلمة المرور',
    'adminSettings.recoveryDesc': 'أعد تعيين كلمة مرورك بنفسك من صفحة الدخول إذا نسيتها',
    'adminSettings.questionCardTitle': 'سؤال الأمان',
    'adminSettings.questionSet': 'سؤال الأمان مضبوط',
    'adminSettings.questionNotSet': 'سؤال الأمان غير مضبوط',
    'adminSettings.currentQuestion': 'السؤال الحالي',
    'adminSettings.changeQuestion': 'تغيير السؤال',
    'adminSettings.setQuestion': 'ضبط السؤال',
    'adminSettings.cancelEdit': 'إلغاء',
    'adminSettings.keyCardTitle': 'مفتاح الاستعادة',
    'adminSettings.keySet': 'تم إنشاء مفتاح الاستعادة',
    'adminSettings.keySetAt': 'آخر إنشاء',
    'adminSettings.keyNotSet': 'مفتاح الاستعادة لم يُنشأ',
    'adminSettings.keyNotSetHint': 'يتيح لك المفتاح استعادة الوصول إذا نسيت كلمة المرور',
    'adminSettings.generateKey': 'إنشاء مفتاح استعادة جديد',
    'adminSettings.generateKeyConfirmTitle': 'إنشاء مفتاح استعادة جديد؟',
    'adminSettings.generateKeyConfirmDesc':
      'إنشاء مفتاح جديد يُبطل المفتاح السابق نهائيًا. سيُعرض المفتاح الجديد مرة واحدة فقط — احفظه فورًا. هل تريد المتابعة؟',
    'adminSettings.confirmGenerate': 'نعم، أنشئ',
    'adminSettings.recoverySaved': 'تم حفظ إعداد الاستعادة',
    'adminSettings.recoverySaveFailed': 'فشل الحفظ — تحقق من الاتصال وحاول مرة أخرى',
    'adminSettings.recoverySetupHint':
      'تعمل هذه الوسائل عبر رابط "نسيت كلمة المرور؟" في صفحة الدخول. اضبط طريقة واحدة على الأقل.',

    // ===== Settings — password change fix (Auth sync) =====
    'adminSettings.passwordAuthSynced': 'تم تغيير كلمة المرور (بما في ذلك Firebase Auth)',
    'adminSettings.passwordRTDBOnly': 'تم تغيير كلمة المرور',
  },
};
