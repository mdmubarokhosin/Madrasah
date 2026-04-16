import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: student, error } = await supabase
    .from('Student')
    .select('*, class:Class(*)')
    .eq('id', id)
    .single();

  if (error || !student) return NextResponse.json({ error: 'শিক্ষার্থী পাওয়া যায়নি' }, { status: 404 });
  return NextResponse.json({ student });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  const { id } = await params;

  try {
    const data = await request.json();
    const updateData: Record<string, unknown> = {
      name: data.name,
      roll: data.roll,
      regNo: data.regNo,
      fatherName: data.fatherName,
      motherName: data.motherName,
      madrasa: data.madrasa,
      gender: data.gender,
      phone: data.phone,
      address: data.address,
      dateOfBirth: data.dateOfBirth,
      classId: data.classId,
      academicYearId: data.academicYearId,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const { data: student, error } = await supabase
      .from('Student')
      .update(updateData)
      .eq('id', id)
      .select('*, class:Class(*)')
      .single();

    if (error) return NextResponse.json({ error: 'আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
    return NextResponse.json({ student });
  } catch {
    return NextResponse.json({ error: 'আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;
  const { id } = await params;

  try {
    const { error } = await supabase.from('Student').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
