import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { id } = await params;
  try {
    const data = await request.json();

    // Fetch existing fee
    const { data: fee, error: fetchError } = await supabase
      .from('StudentFee')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !fee) {
      return NextResponse.json({ error: 'ফি পাওয়া যায়নি' }, { status: 404 });
    }

    const paidAmount = parseFloat(data.paidAmount) ?? fee.paidAmount;
    const status = paidAmount >= fee.amount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
    const dueAmount = fee.amount - paidAmount;
    const paymentDate = paidAmount > 0 && paidAmount > fee.paidAmount
      ? new Date().toISOString()
      : fee.paymentDate;

    const { data: item, error } = await supabase
      .from('StudentFee')
      .update({
        paidAmount,
        dueAmount,
        status,
        paymentDate,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    }

    return NextResponse.json({ fee: item });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
