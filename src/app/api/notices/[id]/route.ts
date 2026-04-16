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
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const { data: notice, error } = await supabase
      .from('Notice')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
    return NextResponse.json({ notice });
  } catch {
    return NextResponse.json({ error: 'আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  const { id } = await params;

  try {
    const { error } = await supabase.from('Notice').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
