import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { id } = await params;
  try {
    const data = await request.json();

    const { data: item, error } = await supabase
      .from('Attendance')
      .update({ status: data.status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    }

    return NextResponse.json({ attendance: item });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
