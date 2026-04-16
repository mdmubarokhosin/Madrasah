import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    let query = supabase
      .from('Marhala')
      .select('*')
      .order('createdAt', { ascending: true });

    if (examId) {
      query = query.eq('examId', examId);
    }

    const { data: marhalas, error } = await query;
    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

    // Fetch counts for each marhala
    const marhalasWithCounts = await Promise.all(
      (marhalas ?? []).map(async (marhala) => {
        const [
          { count: results },
          { count: subjects },
        ] = await Promise.all([
          supabase.from('Result').select('*', { count: 'exact', head: true }).eq('marhalaId', marhala.id),
          supabase.from('Subject').select('*', { count: 'exact', head: true }).eq('marhalaId', marhala.id),
        ]);

        return {
          ...marhala,
          _count: {
            results: results ?? 0,
            subjects: subjects ?? 0,
          },
        };
      })
    );

    return NextResponse.json({ marhalas: marhalasWithCounts });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.name || !data.examId) {
      return NextResponse.json({ error: 'মারহালার নাম ও পরীক্ষা আইডি দিন' }, { status: 400 });
    }
    const { data: marhala, error } = await supabase
      .from('Marhala')
      .insert([
        { name: data.name, nameEn: data.nameEn || null, examId: data.examId },
      ])
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ marhala }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
