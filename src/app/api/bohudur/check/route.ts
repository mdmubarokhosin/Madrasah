import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";

/**
 * Next.js API Route — Bohudur API Key Verification
 * Works in development mode. In production, Cloudflare Pages Function handles this.
 *
 * Endpoint: POST /api/bohudur/check
 *
 * Tests API key by creating a minimal test payment via Bohudur v2.
 * Bohudur v2 Create Response (flat format):
 *   Success: { responseCode: 200, status: "success", payment_url: "...", paymentkey: "..." }
 *   Error:   { responseCode: 3014, message: "Invalid API key", status: "failed" }
 */

const BOHUDUR_API_URL = 'https://request.bohudur.one/create/v2/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey =
      request.headers.get('x-bohudur-api-key') ||
      request.headers.get('ah-bohudur-api-key') ||
      body.apiKey ||
      '';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, valid: false, message: 'API Key প্রদান করা হয়নি।' },
        { status: 400 }
      );
    }

    // Test by calling Bohudur create API with a minimal payment (৳10)
    const testBody = {
      amount: 10,
      full_name: 'API Test',
      email: 'test@test.com',
      return_type: 'GET',
      redirect_url: 'default',
      cancel_url: 'default',
    };


    const bohudurResponse = await fetch(BOHUDUR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AH-BOHUDUR-API-KEY': apiKey,
      },
      body: JSON.stringify(testBody),
    });

    const data = await bohudurResponse.json();

    // Bohudur v2 flat format: { responseCode, status, payment_url, paymentkey }
    const isSuccess = data.status === 'success' && (data.responseCode === 200 || data.payment_url);
    const paymentUrl = data.payment_url || data.data?.payment_url || '';
    const paymentKey = data.paymentkey || data.data?.paymentkey || '';

    if (isSuccess && paymentUrl) {
      return NextResponse.json({
        success: true,
        valid: true,
        message: 'API Key বৈধ। পেমেন্ট গেটওয়ে সঠিকভাবে কাজ করছে।',
        testPaymentUrl: paymentUrl,
        testPaymentKey: paymentKey,
      });
    }

    // Map error codes
    const responseCode = data.responseCode || data.data?.responseCode;
    const originalMsg = data.message || data.data?.message || '';

    const errorMessages: Record<string, string> = {
      '3000': 'API Key পাওয়া যায়নি। এডমিন প্যানেল থেকে সঠিক API Key দিন।',
      '3001': 'প্রয়োজনীয় তথ্য পাওয়া যায়নি।',
      '3002': 'নামের ফরম্যাট সঠিক নয়।',
      '3003': 'ইমেইলের ফরম্যাট সঠিক নয়।',
      '3004': 'পরিমাণের ফরম্যাট সঠিক নয়।',
      '3014': 'API Key অবৈধ। সঠিক API Key দিন।',
      '3015': 'Bohudur সার্ভারে অভ্যন্তরীণ সমস্যা।',
      '3016': 'পরিমাণ গ্রহণযোগ্য নয়।',
      '3017': 'আইপি অ্যাক্সেস সীমিত।',
      '3018': 'সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।',
      '3019': 'পেমেন্ট তৈরি করা যায়নি।',
    };

    const errorMsg = errorMessages[String(responseCode)] || originalMsg || `Unknown response (code: ${responseCode || 'N/A'})`;

    return NextResponse.json({
      success: false,
      valid: false,
      message: errorMsg,
      responseCode,
      rawResponse: data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'সার্ভার ত্রুটি।';
    return NextResponse.json(
      { success: false, valid: false, message },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
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
