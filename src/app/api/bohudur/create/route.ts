import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";

/**
 * Next.js API Route — Bohudur Payment Creation Proxy
 * Works in development mode. In production, Cloudflare Pages Function handles this.
 *
 * Endpoint: POST /api/bohudur/create
 *
 * Bohudur v2 API: https://request.bohudur.one/create/v2/
 * Response format (flat):
 *   Success: { responseCode: 200, status: "success", payment_url: "...", paymentkey: "..." }
 *   Error:   { responseCode: 3014, message: "Invalid API key", status: "failed" }
 */

const BOHUDUR_API_URL = 'https://request.bohudur.one/create/v2/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get API key: header > body > env variable
    const apiKey =
      request.headers.get('x-bohudur-api-key') ||
      request.headers.get('ah-bohudur-api-key') ||
      body.apiKey ||
      process.env.BOHUDUR_API_KEY ||
      '';

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bohudur API Key is not configured. Set it in admin settings or BOHUDUR_API_KEY env variable.',
        },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!body.amount || body.amount < 10) {
      return NextResponse.json(
        { success: false, message: 'পরিমাণ সঠিকভাবে পূরণ করুন (সর্বনিম্ন ৳১০)।' },
        { status: 400 }
      );
    }

    // Build the Bohudur v2 request body (flat format)
    const bohudurBody: Record<string, unknown> = {
      amount: Number(body.amount),
      return_type: body.return_type || 'GET',
      redirect_url: body.redirect_url || 'default',
      cancel_url: body.cancel_url || 'default',
    };

    // Add required fields
    if (body.full_name || body.name) bohudurBody.full_name = body.full_name || body.name;
    if (body.email) bohudurBody.email = body.email;
    if (body.phone) bohudurBody.phone = body.phone;
    if (body.purpose) bohudurBody.purpose = body.purpose;

    // Add optional metadata
    if (body.metadata) bohudurBody.metadata = body.metadata;

    // Add webhook URLs if configured
    if (body.webhookSuccessUrl || body.webhookCancelUrl) {
      const webhook: Record<string, string> = {};
      if (body.webhookSuccessUrl) webhook.success = body.webhookSuccessUrl;
      if (body.webhookCancelUrl) webhook.cancel = body.webhookCancelUrl;
      bohudurBody.webhook = webhook;
    }


    const bohudurResponse = await fetch(BOHUDUR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'AH-BOHUDUR-API-KEY': apiKey,
      },
      body: JSON.stringify(bohudurBody),
    });

    const data = await bohudurResponse.json();

    // Bohudur v2 returns flat format:
    // Success: { responseCode: 200, status: "success", payment_url: "...", paymentkey: "..." }
    // Error:   { responseCode: 3014, message: "...", status: "failed" }

    const isSuccess = data.status === 'success' && (data.responseCode === 200 || data.payment_url);
    const paymentUrl = data.payment_url || data.data?.payment_url || '';
    const paymentKey = data.paymentkey || data.data?.paymentkey || '';

    if (isSuccess && paymentUrl) {
      return NextResponse.json({
        success: true,
        responseCode: data.responseCode,
        status: data.status,
        payment_url: paymentUrl,
        paymentkey: paymentKey,
        message: data.message || 'পেমেন্ট সফলভাবে তৈরি হয়েছে।',
      });
    }

    // Error handling — map Bohudur error codes to Bengali messages
    const responseCode = data.responseCode || data.data?.responseCode;
    const originalMsg = data.message || data.data?.message || '';

    const errorMessages: Record<string, string> = {
      '3000': 'API Key পাওয়া যায়নি। এডমিন প্যানেল থেকে সঠিক API Key দিন।',
      '3001': 'প্রয়োজনীয় তথ্য পাওয়া যায়নি। সকল ফিল্ড সঠিকভাবে পূরণ করুন।',
      '3002': 'নামের ফরম্যাট সঠিক নয়।',
      '3003': 'ইমেইলের ফরম্যাট সঠিক নয়।',
      '3004': 'পরিমাণের ফরম্যাট সঠিক নয়।',
      '3005': 'return_type শুধুমাত্র GET বা POST হতে পারে।',
      '3006': 'redirect URL সঠিক নয়।',
      '3009': 'cancel URL সঠিক নয়।',
      '3014': 'API Key অবৈধ বা নিষ্ক্রিয়। এডমিন প্যানেল থেকে সঠিক API Key দিন।',
      '3015': 'Bohudur সার্ভারে অভ্যন্তরীণ সমস্যা। কিছুক্ষণ পর আবার চেষ্টা করুন।',
      '3016': 'পরিমাণ গ্রহণযোগ্য নয়। অন্য পরিমাণ দিয়ে চেষ্টা করুন।',
      '3017': 'আপনার আইপি অ্যাক্সেস সীমিত। Bohudur কনসোল থেকে আইপি অনুমোদন করুন।',
      '3018': 'Bohudur সার্ভারে ত্রুটি। পরে আবার চেষ্টা করুন।',
      '3019': 'পেমেন্ট তৈরি করা যায়নি। পরে আবার চেষ্টা করুন।',
    };

    const errorMsg = errorMessages[String(responseCode)] || originalMsg || 'পেমেন্ট তৈরি করতে সমস্যা হয়েছে।';

    return NextResponse.json({
      success: false,
      responseCode,
      status: data.status || 'failed',
      message: errorMsg,
    }, {
      status: data.responseCode === 200 ? 200 : (bohudurResponse.status >= 500 ? 500 : 400),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'পেমেন্ট তৈরি করতে সমস্যা হয়েছে।';
    return NextResponse.json(
      { success: false, message },
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
