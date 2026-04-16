import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;

  const { data: application, error } = await supabase
    .from('CertificateApplication')
    .select('*, exam:Exam(*), marhala:Marhala(*)')
    .eq('applicationId', applicationId)
    .single();

  if (error || !application) {
    return NextResponse.json({ error: 'আবেদন পাওয়া যায়নি' }, { status: 404 });
  }

  return NextResponse.json({ application });
}
