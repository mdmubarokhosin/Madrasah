import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { data: exams, error } = await supabase
    .from('Exam')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

  // Fetch counts for each exam
  const examsWithCounts = await Promise.all(
    (exams ?? []).map(async (exam) => {
      const [
        { count: results },
        { count: marhalas },
      ] = await Promise.all([
        supabase.from('Result').select('*', { count: 'exact', head: true }).eq('examId', exam.id),
        supabase.from('Marhala').select('*', { count: 'exact', head: true }).eq('examId', exam.id),
      ]);

      return {
        ...exam,
        _count: {
          results: results ?? 0,
          marhalas: marhalas ?? 0,
        },
      };
    })
  );

  return NextResponse.json({ exams: examsWithCounts });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const data = await request.json();
    if (!data.name || !data.year) {
      return NextResponse.json({ error: 'পরীক্ষার নাম ও সাল দিন' }, { status: 400 });
    }
    const { data: exam, error } = await supabase
      .from('Exam')
      .insert([
        { name: data.name, nameEn: data.nameEn || null, year: data.year, isPublished: data.isPublished || false },
      ])
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ exam }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
