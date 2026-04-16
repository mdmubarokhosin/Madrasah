import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { examId, marhalaId, roll, regNo, studentName, certificateType } = data;

    if (!examId || !marhalaId || !roll || !regNo || !studentName || !certificateType) {
      return NextResponse.json({ error: 'সব তথ্য পূরণ করুন' }, { status: 400 });
    }

    const applicationId = 'CERT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data: student } = await supabase
      .from('Student')
      .select('id')
      .eq('roll', roll)
      .eq('regNo', regNo)
      .maybeSingle();

    const insertData: Record<string, unknown> = {
      applicationId,
      studentId: student?.id || null,
      examId,
      marhalaId,
      roll,
      regNo,
      studentName,
      certificateType,
    };

    const { data: application, error } = await supabase
      .from('CertificateApplication')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
