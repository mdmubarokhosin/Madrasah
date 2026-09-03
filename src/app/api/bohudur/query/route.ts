import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";

/**
 * Next.js API Route — Bohudur Payment Query (Status Check)
 * Checks the status of a payment at any time.
 * Works in development mode. In production, Cloudflare Pages Function handles this.
 *
 * Endpoint: POST /api/bohudur/query
 *
 * Bohudur v2 Query Response statuses:
 *   PENDING   → Created but not yet paid
 *   COMPLETED → Paid, ready to execute
 *   EXECUTED  → Finalized
 *   CANCELLED → Cancelled
 */

const BOHUDUR_API_URL = 'https://request.bohudur.one/query/v2/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiKey =
      request.headers.get('x-bohudur-api-key') ||
      request.headers.get('ah-bohudur-api-key') ||
      body.apiKey ||
      process.env.BOHUDUR_API_KEY ||
      '';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Bohudur API Key is not configured.' },
        { status: 500 }
      );
    }

    if (!body.paymentkey) {
      return NextResponse.json(
        { success: false, message: 'paymentkey প্রদান করা হয়নি।' },
        { status: 400 }
      );
    }


    const bohudurResponse = await fetch(BOHUDUR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AH-BOHUDUR-API-KEY': apiKey,
      },
      body: JSON.stringify({ paymentkey: body.paymentkey }),
    });

    const data = await bohudurResponse.json();

    // Map Bohudur statuses to our internal statuses
    const statusMap: Record<string, string> = {
      'PENDING': 'pending',
      'COMPLETED': 'completed',
      'EXECUTED': 'success',
      'CANCELLED': 'cancel',
    };

    const mappedStatus = statusMap[data.status] || data.status || 'unknown';

    return NextResponse.json({
      success: true,
      bohudurStatus: data.status,
      status: mappedStatus,
      paymentkey: data.paymentkey || body.paymentkey,
      full_name: data.full_name || null,
      email: data.email || null,
      amount: data.amount || 0,
      converted_amount: data.converted_amount || null,
      payment_currency: data.payment_currency || null,
      created_time: data.created_time || null,
      payment_time: data.payment_time || null,
      payment_info: data.payment_info || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'সার্ভার ত্রুটি।';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-bohudur-api-key, ah-bohudur-api-key',
    },
  });
}
