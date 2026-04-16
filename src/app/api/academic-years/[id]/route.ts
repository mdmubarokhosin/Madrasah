import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { id } = await params;
  try {
    const data = await request.json();
    if (data.isActive) {
      const { error: deactivateError } = await supabase
        .from('AcademicYear')
        .update({ isActive: false })
        .eq('isActive', true)
        .neq('id', id);
      if (deactivateError) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    }
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn || null;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate).toISOString() : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate).toISOString() : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const { data: item, error } = await supabase
      .from('AcademicYear')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ academicYear: item });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { id } = await params;
  try {
    const { error } = await supabase.from('AcademicYear').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'ডিলিট করা যায়নি' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'ডিলিট করা যায়নি' }, { status: 500 });
  }
}
