import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marhalaId = searchParams.get('marhalaId');

  if (!marhalaId) {
    return NextResponse.json({ error: 'মারহালা আইডি দিন' }, { status: 400 });
  }

  const { data: subjects, error } = await supabase
    .from('Subject')
    .select('*')
    .eq('marhalaId', marhalaId)
    .order('createdAt', { ascending: true });

  if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  return NextResponse.json({ subjects });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.name || !data.marhalaId || !data.totalMarks) {
      return NextResponse.json({ error: 'বিষয়ের নাম, মারহালা আইডি ও মোট নম্বর দিন' }, { status: 400 });
    }
    const insertData: Record<string, unknown> = {
      name: data.name,
      totalMarks: data.totalMarks,
      marhalaId: data.marhalaId,
    };
    if (data.passMarks !== undefined) insertData.passMarks = data.passMarks;

    const { data: subject, error } = await supabase
      .from('Subject')
      .insert([insertData])
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ subject }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
