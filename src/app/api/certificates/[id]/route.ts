import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  const { id } = await params;

  const { data: application, error } = await supabase
    .from('CertificateApplication')
    .select('*, exam:Exam(*), marhala:Marhala(*), student:Student!studentId(*)')
    .eq('id', id)
    .single();

  if (error || !application) {
    return NextResponse.json({ error: 'আবেদন পাওয়া যায়নি' }, { status: 404 });
  }

  // Fetch result items if available
  let resultData = null;
  if (application.studentId && application.examId && application.marhalaId) {
    const { data: results } = await supabase
      .from('Result')
      .select('*, items:ResultItem(*, subject:Subject(*))')
      .eq('studentId', application.studentId)
      .eq('examId', application.examId)
      .eq('marhalaId', application.marhalaId)
      .limit(1);
    if (results && results.length > 0) {
      resultData = results[0];
    }
  }

  return NextResponse.json({ application, result: resultData });
}
