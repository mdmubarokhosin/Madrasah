import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase-api';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'ইউজারনেম এবং পাসওয়ার্ড দিন' }, { status: 400 });
    }
    const { data: admin, error } = await supabase
      .from('Admin')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: 'ভুল ইউজারনেম বা পাসওয়ার্ড' }, { status: 401 });
    }
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: 'ভুল ইউজারনেম বা পাসওয়ার্ড' }, { status: 401 });
    }
    const token = await generateToken({ adminId: admin.id, username: admin.username, name: admin.name });
    return NextResponse.json({
      token,
      admin: { id: admin.id, username: admin.username, name: admin.name },
    });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
