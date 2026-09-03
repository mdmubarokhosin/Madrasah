import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";

/**
 * Next.js API Route — Bohudur Payment Execute
 * Finalizes a COMPLETED payment. Can only be executed ONCE (idempotent).
 * Works in development mode. In production, Cloudflare Pages Function handles this.
 *
 * Endpoint: POST /api/bohudur/execute
 *
 * Bohudur v2 Execute Response:
 *   Success: { status: "EXECUTED", full_name, email, amount, converted_amount, payment_info: {...} }
 *   Error:   { responseCode: 3108, message: "Payment already executed!", status: "failed" }
 */

const BOHUDUR_API_URL = 'https://request.bohudur.one/execute/v2/';

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

    if (data.status === 'EXECUTED') {
      return NextResponse.json({
        success: true,
        status: data.status,
        data: {
          full_name: data.full_name,
          email: data.email,
          amount: data.amount,
          converted_amount: data.converted_amount,
          total_amount: data.total_amount,
          transaction_fee: data.transaction_fee,
          default_currency: data.default_currency,
          payment_currency: data.payment_currency,
          currency_value: data.currency_value,
          created_time: data.created_time,
          payment_time: data.payment_time,
          paymentkey: data.paymentkey,
          payment_info: data.payment_info,
        },
        message: 'পেমেন্ট সফলভাবে নিষ্পাদিত হয়েছে।',
      });
    }

    // Error handling
    const responseCode = data.responseCode;
    const originalMsg = data.message || '';

    const errorMessages: Record<string, string> = {
      '3100': 'API Key পাওয়া যায়নি।',
      '3101': 'API Key অবৈধ।',
      '3102': 'Payment Key অবৈধ।',
      '3103': 'API Key মেলেনি।',
      '3104': 'আইপি অ্যাক্সেস সীমিত।',
      '3105': 'পেমেন্ট ডাটা পাওয়া যায়নি।',
      '3106': 'পেমেন্ট এখনো অপেক্ষমান। গ্রাহক এখনো পেমেন্ট সম্পন্ন করেনি।',
      '3107': 'পেমেন্ট বাতিল হয়েছে।',
      '3108': 'পেমেন্ট ইতিমধ্যে নিষ্পাদিত হয়েছে। (এটি একটি সফল স্ট্যাটাস)',
      '3109': 'পেমেন্ট নিষ্পাদন ব্যর্থ।',
    };

    const errorMsg = errorMessages[String(responseCode)] || originalMsg || 'পেমেন্ট নিষ্পাদন ব্যর্থ।';

    return NextResponse.json({
      success: false,
      status: data.status || 'failed',
      responseCode,
      message: errorMsg,
      rawResponse: data,
    }, {
      status: 200, // Return 200 even for errors so client can handle them
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
