import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { id } = await params;
  try {
    const { error } = await supabase
      .from('Expense')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'ডিলিট করা যায়নি' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'ডিলিট করা যায়নি' }, { status: 500 });
  }
}
