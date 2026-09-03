// Cloudflare Pages Function — Bohudur Payment Create Proxy
// Endpoint: POST /api/bohudur/create
//
// Bohudur v2 API: https://request.bohudur.one/create/v2/
// Response format (flat):
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
        JSON.stringify({ success: false, message: 'Bohudur API Key is not configured.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!body.amount || body.amount < 10) {
      return new Response(
        JSON.stringify({ success: false, message: 'পরিমাণ সঠিকভাবে পূরণ করুন (সর্বনিম্ন ৳১০)।' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build Bohudur v2 request body (flat format)
    const bohudurBody: Record<string, unknown> = {
      amount: Number(body.amount),
      return_type: body.return_type || 'GET',
      redirect_url: body.redirect_url || 'default',
      cancel_url: body.cancel_url || 'default',
    };

    if (body.full_name || body.name) bohudurBody.full_name = body.full_name || body.name;
    if (body.email) bohudurBody.email = body.email;
    if (body.phone) bohudurBody.phone = body.phone;
    if (body.purpose) bohudurBody.purpose = body.purpose;
    if (body.metadata) bohudurBody.metadata = body.metadata;

    // Add webhook URLs if configured
    if (body.webhookSuccessUrl || body.webhookCancelUrl) {
      const webhook: Record<string, string> = {};
      if (body.webhookSuccessUrl) webhook.success = body.webhookSuccessUrl;
      if (body.webhookCancelUrl) webhook.cancel = body.webhookCancelUrl;
      bohudurBody.webhook = webhook;
    }

    let bohudurResponse: Response;
    try {
      bohudurResponse = await fetch('https://request.bohudur.one/create/v2/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AH-BOHUDUR-API-KEY': apiKey,
        },
        body: JSON.stringify(bohudurBody),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Unknown network error';
      return new Response(
        JSON.stringify({ success: false, message: `Bohudur API তে পৌঁছাতে সমস্যা: ${msg}` }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    let data: any;
    try {
      data = await bohudurResponse.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, message: `Bohudur API থেকে সঠিক রেসপন্স আসেনি। HTTP ${bohudurResponse.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log('[Bohudur Create] API response:', JSON.stringify(data));

    // Bohudur v2 flat format
    const isSuccess = data.status === 'success' && (data.responseCode === 200 || data.payment_url);
    const paymentUrl = data.payment_url || data.data?.payment_url || '';
    const paymentKey = data.paymentkey || data.data?.paymentkey || '';

    if (isSuccess && paymentUrl) {
      return new Response(JSON.stringify({
        success: true,
        responseCode: data.responseCode,
        status: data.status,
        payment_url: paymentUrl,
        paymentkey: paymentKey,
        message: data.message || 'পেমেন্ট সফলভাবে তৈরি হয়েছে।',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Error handling
    const responseCode = data.responseCode || data.data?.responseCode;
    const originalMsg = data.message || data.data?.message || '';

    const errorMessages: Record<string, string> = {
      '3000': 'API Key পাওয়া যায়নি। এডমিন প্যানেল থেকে সঠিক API Key দিন।',
      '3001': 'প্রয়োজনীয় তথ্য পাওয়া যায়নি।',
      '3014': 'API Key অবৈধ বা নিষ্ক্রিয়। সঠিক API Key দিন।',
      '3015': 'Bohudur সার্ভারে অভ্যন্তরীণ সমস্যা।',
      '3016': 'পরিমাণ গ্রহণযোগ্য নয়।',
      '3017': 'আইপি অ্যাক্সেস সীমিত।',
      '3018': 'সার্ভার ত্রুটি। পরে আবার চেষ্টা করুন।',
      '3019': 'পেমেন্ট তৈরি করা যায়নি।',
    };

    const errorMsg = errorMessages[String(responseCode)] || originalMsg || 'পেমেন্ট তৈরি করতে সমস্যা হয়েছে।';

    return new Response(JSON.stringify({
      success: false,
      responseCode,
      status: data.status || 'failed',
      message: errorMsg,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'পেমেন্ট তৈরি করতে সমস্যা হয়েছে।';
    return new Response(
      JSON.stringify({ success: false, message }),
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
