import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-api';
import { requireAuth, isAuthResponse } from '@/lib/auth';

export async function GET() {
  try {
    const { data: settings, error } = await supabase.from('SiteSetting').select('*');
    if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }
    return NextResponse.json({ settings: settingsMap });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthResponse(auth)) return auth;

  try {
    const data = await request.json();
    const entries: { key: string; value: string }[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== 'string') continue;
      entries.push({ key, value });
    }
    if (entries.length > 0) {
      const { error } = await supabase.from('SiteSetting').upsert(entries, { onConflict: 'key' });
      if (error) return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'সার্ভার ত্রুটি' }, { status: 500 });
  }
}
