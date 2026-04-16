import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  const { id } = await params;

  try {
    const data = await request.json();
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.totalMarks !== undefined) updateData.totalMarks = data.totalMarks;
    if (data.passMarks !== undefined) updateData.passMarks = data.passMarks;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'আপডেটের জন্য কোনো তথ্য দেওয়া হয়নি' }, { status: 400 });
    }

    const { data: subject, error } = await supabase
      .from('Subject')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
    return NextResponse.json({ subject });
  } catch {
    return NextResponse.json({ error: 'আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  const { id } = await params;

  try {
    // Delete result items linked to this subject first
    await supabase.from('ResultItem').delete().eq('subjectId', id);
    // Then delete the subject
    const { error } = await supabase.from('Subject').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
