// Cloudflare Pages Function — Bohudur API Key Verification
// Endpoint: POST /api/bohudur/check
//
// Tests by creating a minimal payment via Bohudur v2.
// Bohudur v2 Response (flat):
//   Success: { responseCode: 200, status: "success", payment_url: "...", paymentkey: "..." }
//   Error:   { responseCode: 3014, message: "Invalid API key", status: "failed" }

interface Env {
  BOHUDUR_API_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();

    const apiKey =
      context.request.headers.get('x-bohudur-api-key') ||
      context.request.headers.get('ah-bohudur-api-key') ||
      body.apiKey ||
      context.env.BOHUDUR_API_KEY ||
      '';

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, valid: false, message: 'API Key প্রদান করা হয়নি।' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const testBody = {
      amount: 10,
      full_name: 'API Test',
      email: 'test@test.com',
      return_type: 'GET',
      redirect_url: 'default',
      cancel_url: 'default',
    };

    let bohudurResponse: Response;
    try {
      bohudurResponse = await fetch('https://request.bohudur.one/create/v2/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AH-BOHUDUR-API-KEY': apiKey,
        },
        body: JSON.stringify(testBody),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Unknown network error';
      return new Response(
        JSON.stringify({ success: false, valid: false, message: `Bohudur API তে পৌঁছাতে সমস্যা: ${msg}` }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    let data: any;
    try {
      data = await bohudurResponse.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, valid: false, message: `Bohudur API থেকে সঠিক রেসপন্স আসেনি। HTTP ${bohudurResponse.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log('[Bohudur Check] API response:', JSON.stringify(data));

    // Bohudur v2 flat format
    const isSuccess = data.status === 'success' && (data.responseCode === 200 || data.payment_url);
    const paymentUrl = data.payment_url || data.data?.payment_url || '';
    const paymentKey = data.paymentkey || data.data?.paymentkey || '';

    if (isSuccess && paymentUrl) {
      return new Response(
        JSON.stringify({
          success: true,
          valid: true,
          message: 'API Key বৈধ। পেমেন্ট গেটওয়ে সঠিকভাবে কাজ করছে।',
          testPaymentUrl: paymentUrl,
          testPaymentKey: paymentKey,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const responseCode = data.responseCode || data.data?.responseCode;
    const originalMsg = data.message || data.data?.message || '';

    const errorMessages: Record<string, string> = {
      '3000': 'API Key পাওয়া যায়নি। সঠিক API Key দিন।',
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

    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        message: errorMsg,
        responseCode,
        rawResponse: data,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'সার্ভার ত্রুটি।';
    return new Response(
      JSON.stringify({ success: false, valid: false, message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-bohudur-api-key, ah-bohudur-api-key',
    },
  });
};
