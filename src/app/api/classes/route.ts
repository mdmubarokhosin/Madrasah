import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET() {
  try {
    const { data: items, error } = await supabase
      .from('Class')
      .select('*')
      .order('sortOrder', { ascending: true });

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

    // Fetch counts for each class
    const classesWithCounts = await Promise.all(
      (items ?? []).map(async (cls) => {
        const [
          { count: students },
          { count: subjects },
          { count: attendance },
        ] = await Promise.all([
          supabase.from('Student').select('*', { count: 'exact', head: true }).eq('classId', cls.id),
          supabase.from('Subject').select('*', { count: 'exact', head: true }).eq('classId', cls.id),
          supabase.from('Attendance').select('*', { count: 'exact', head: true }).eq('classId', cls.id),
        ]);

        return {
          ...cls,
          _count: {
            students: students ?? 0,
            subjects: subjects ?? 0,
            attendance: attendance ?? 0,
          },
        };
      })
    );

    return NextResponse.json({ classes: classesWithCounts });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'শ্রেণির নাম দিন' }, { status: 400 });
    }
    const { data: item, error } = await supabase
      .from('Class')
      .insert([
        {
          name: data.name,
          nameEn: data.nameEn || null,
          description: data.description || null,
          sortOrder: data.sortOrder ?? 0,
          isActive: data.isActive ?? true,
        },
      ])
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ class: item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
