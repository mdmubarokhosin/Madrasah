import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  let query = supabase
    .from('Student')
    .select('*, class:Class(*)', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,roll.ilike.%${search}%,regNo.ilike.%${search}%`);
  }

  const { data: students, error, count } = await query;

  if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

  return NextResponse.json({ students: students || [], total: count || 0, page, limit });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const data = await request.json();
    const { name, roll, regNo, fatherName, motherName, madrasa, gender, phone, address, dateOfBirth, classId, academicYearId } = data;

    if (!name || !roll || !regNo) {
      return NextResponse.json({ error: 'নাম, রোল এবং রেজিস্ট্রেশন নম্বর আবশ্যক' }, { status: 400 });
    }

    // Check for existing student with same roll or regNo
    const { data: existing } = await supabase
      .from('Student')
      .select('id')
      .or(`roll.eq.${roll},regNo.eq.${regNo}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'এই রোল বা রেজিস্ট্রেশন নম্বর আগে থেকেই আছে' }, { status: 400 });
    }

    const insertData: Record<string, unknown> = { name, roll, regNo, fatherName, motherName, madrasa };
    if (gender) insertData.gender = gender;
    if (phone) insertData.phone = phone;
    if (address) insertData.address = address;
    if (dateOfBirth) insertData.dateOfBirth = dateOfBirth;
    if (classId) insertData.classId = classId;
    if (academicYearId) insertData.academicYearId = academicYearId;

    const { data: student, error } = await supabase
      .from('Student')
      .insert([insertData])
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    return NextResponse.json({ student }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
